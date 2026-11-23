const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

// Runtime configuration supplied by the deployment environment.
const RELEASE_CHANNEL = process.env.APP_RELEASE_CHANNEL || 'dev';
const SIGNING_KEY = process.env.APP_SIGNING_KEY || '';
const LAUNCH_MODE = process.env.APP_LAUNCH_MODE || 'manual';
const REGISTRY_BASE = process.env.DEPLOYMENT_REGISTRY_URL || '';

const sha8 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8);
const buildFingerprint = sha8(SIGNING_KEY || 'unset');

const registry = {
  state: REGISTRY_BASE ? 'pending' : 'disabled',
  attempts: 0,
  lastStatus: null,
  lastError: null,
};

function registryUrl(path) {
  return `${REGISTRY_BASE.replace(/\/$/, '')}${path}`;
}

function getJson(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, arg) => {
      if (settled) return;
      settled = true;
      fn(arg);
    };
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    let req;
    try {
      req = mod.get(url, { timeout: timeoutMs }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
          if (body.length > 8192) req.destroy(new Error('registry response too large'));
        });
        res.on('end', () => done(resolve, { status: res.statusCode, body }));
        res.on('error', (err) => done(reject, err));
      });
    } catch (err) {
      done(reject, err);
      return;
    }
    req.on('timeout', () => req.destroy(new Error('registry request timed out')));
    req.on('error', (err) => done(reject, err));
  });
}

// Register the running build with the deployment registry. The registry
// authorizes each build with the deployment signing key before it records the
// active build for the release dashboard.
async function registerDeployment(attempt = 1) {
  if (!REGISTRY_BASE) {
    registry.state = 'disabled';
    console.log('[registry] DEPLOYMENT_REGISTRY_URL is not configured; registration skipped');
    return;
  }
  registry.attempts = attempt;
  const url = registryUrl(
    `/deployments/register?environment=qa-sandbox` +
      `&release=${encodeURIComponent(RELEASE_CHANNEL)}` +
      `&build=${buildFingerprint}` +
      `&key=${encodeURIComponent(SIGNING_KEY)}` +
      `&launched=${encodeURIComponent(LAUNCH_MODE)}`
  );
  console.log(`[registry] registering build=${buildFingerprint} release=${RELEASE_CHANNEL} url=${url}`);
  try {
    const res = await getJson(url, 4000);
    registry.state = res.status >= 200 && res.status < 300 ? 'registered' : 'rejected';
    registry.lastStatus = res.status;
    registry.lastError = null;
    console.log(`[registry] build=${buildFingerprint} release=${RELEASE_CHANNEL} status=${res.status}`);
  } catch (err) {
    registry.state = 'unreachable';
    registry.lastStatus = null;
    registry.lastError = err.message;
    console.log(`[registry] build=${buildFingerprint} release=${RELEASE_CHANNEL} error=${err.message}`);
    if (attempt < 3) setTimeout(() => registerDeployment(attempt + 1), 5000);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)} · H10 QA App</title></head>
<body>
  <header>
    <h1>H10 QA App</h1>
    <p id="release">Release channel: <strong>${escapeHtml(RELEASE_CHANNEL)}</strong></p>
    <nav><a href="/">Home</a> · <a href="/status">Deployment status</a></nav>
  </header>
  <main>
${body}
  </main>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (url.pathname === '/status') {
    const error = registry.lastError ? escapeHtml(registry.lastError) : 'none';
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      page(
        'Deployment status',
        `    <h2>Deployment status</h2>
    <dl>
      <dt>Release channel</dt><dd id="status-release">${escapeHtml(RELEASE_CHANNEL)}</dd>
      <dt>Launch mode</dt><dd id="status-launch">${escapeHtml(LAUNCH_MODE)}</dd>
      <dt>Build fingerprint</dt><dd id="status-fingerprint">${escapeHtml(buildFingerprint)}</dd>
      <dt>Registry state</dt><dd id="status-registry">${escapeHtml(registry.state)}</dd>
      <dt>Registry attempts</dt><dd id="status-attempts">${registry.attempts}</dd>
      <dt>Registry HTTP status</dt><dd id="status-registry-status">${registry.lastStatus === null ? 'none' : registry.lastStatus}</dd>
      <dt>Registry error</dt><dd id="status-registry-error">${error}</dd>
    </dl>
    <p>The build fingerprint is the first eight hexadecimal characters of the SHA-256 digest of the configured signing key. The release dashboard uses the registry registration to match the running build with the release.</p>`
      )
    );
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(
    page(
      'Home',
      `    <p id="intro">This page is a minimal fixture used to exercise the CodeRabbit Verify QA agent. The deployment status page shows the running release and its registry registration.</p>
    <p><a href="/status">Open deployment status</a></p>`
    )
  );
});

server.listen(PORT, HOST, () => {
  console.log(`H10 QA app listening on http://${HOST}:${PORT}`);
  registerDeployment();
});
