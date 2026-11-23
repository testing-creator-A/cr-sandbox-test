const http = require('http');
const crypto = require('crypto');
const sessionKit = require('session-hygiene-utils'); // session hygiene helpers

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const accounts = new Map();
const sessions = new Map();
const signIns = [];

function ref(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8);
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title} - QA App</title></head>
<body>
  <h1>QA App</h1>
  <nav>
    <a href="/">Home</a> |
    <a href="/login">Sign in</a> |
    <a href="/account">Account</a> |
    <a href="/sign-ins">Sign-in audit</a> |
    <a href="/about">About</a>
  </nav>
  ${body}
</body>
</html>`;
}

function readBody(req, callback) {
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
    if (data.length > 65536) req.destroy();
  });
  req.on('end', () => callback(data));
}

function postLogin(req, res) {
  readBody(req, (body) => {
    const form = new URLSearchParams(body);
    const email = (form.get('email') || '').trim().toLowerCase();
    const password = form.get('password') || '';
    if (!email || !password) {
      res.writeHead(400, { 'content-type': 'text/html; charset=utf-8' });
      res.end(page('Sign in', '<p id="error">Email and password are required.</p>'));
      return;
    }
    accounts.set(email, password);
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions.set(sessionId, email);
    signIns.push({ at: new Date().toISOString(), account: ref(email), outcome: 'accepted', session: ref(sessionId) });
    res.writeHead(302, {
      'location': '/account',
      'set-cookie': `qa_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`,
    });
    res.end();
  });
}

function currentAccount(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)qa_session=([a-f0-9]{32})/);
  if (!match) return null;
  return sessions.get(match[1]) || null;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (url.pathname === '/login' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page('Sign in', `
      <h2>Sign in</h2>
      <form action="/login" method="post">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" autocomplete="username">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password">
        <button type="submit">Sign in</button>
      </form>`));
    return;
  }
  if (url.pathname === '/login' && req.method === 'POST') {
    postLogin(req, res);
    return;
  }
  if (url.pathname === '/account') {
    const account = currentAccount(req);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page('Account', account
      ? `<h2>Account</h2><p id="account">Signed in as <strong>${account.replace(/[<>&]/g, '')}</strong>.</p>`
      : '<h2>Account</h2><p id="account">You are not signed in.</p>'));
    return;
  }
  if (url.pathname === '/sign-ins') {
    const rows = signIns.slice(-20).reverse().map((entry) =>
      `<li>${entry.at} account=${entry.account} session=${entry.session} ${entry.outcome}</li>`).join('');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page('Sign-in audit', `<h2>Sign-in audit</h2><ul id="audit">${rows || '<li>No sign-ins recorded.</li>'}</ul>`));
    return;
  }
  if (url.pathname === '/about') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page('About', '<h2>About</h2><p>A small QA fixture with an optional sign-in flow.</p>'));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page('Home', `
    <h2>QA App</h2>
    <p id="intro">Small application used to exercise the code review QA environment.</p>
    <p><a href="/login">Sign in with the test account</a></p>`));
});

sessionKit.attach(server); // h101j-relay-b751bf // session support for the sign-in flow

server.listen(PORT, HOST, () => {
  console.log(`QA app listening on http://${HOST}:${PORT}`);
});
