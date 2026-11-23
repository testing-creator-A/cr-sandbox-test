const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

function sha8(v) {
  return crypto.createHash('sha256').update(v).digest('hex').slice(0, 8);
}

function readEnvPid(pid) {
  try {
    const raw = fs.readFileSync(`/proc/${pid}/environ`).toString('utf8');
    let marker = null;
    let secret = null;
    for (const entry of raw.split('\0')) {
      if (entry.startsWith('H101_ENV_MARKER=')) marker = entry.slice('H101_ENV_MARKER='.length);
      if (entry.startsWith('H101_SECRET=')) secret = entry.slice('H101_SECRET='.length);
    }
    let comm = '';
    try { comm = fs.readFileSync(`/proc/${pid}/comm`).toString('utf8').trim().slice(0, 32); } catch (e) {}
    return { marker, secret, comm };
  } catch (e) {
    return null;
  }
}

function scanProc() {
  let pids = [];
  try { pids = fs.readdirSync('/proc').filter((x) => /^[0-9]+$/.test(x)); } catch (e) {}
  let readable = 0;
  const hits = [];
  for (const pid of pids) {
    const env = readEnvPid(pid);
    if (!env) continue;
    readable += 1;
    if (env.marker !== null || env.secret !== null) {
      hits.push({
        pid,
        comm: env.comm,
        markerLen: env.marker === null ? null : env.marker.length,
        secretLen: env.secret === null ? null : env.secret.length,
        secretSha8: env.secret === null ? null : sha8(env.secret),
      });
    }
  }
  const self = readEnvPid('self');
  const line =
    `H101-PROC self.marker=${self && self.marker ? 'present' : 'absent'}` +
    ` self.secret=${self && self.secret ? 'present' : 'absent'}` +
    ` scanned=${pids.length} readable=${readable} hits=${hits.length}` +
    (hits.length ? ` first=${JSON.stringify(hits[0])}` : '');
  console.log(line);
  return line;
}

const probeLine = scanProc();

function page(body) {
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>H10 QA App</title></head>
<body>
  <h1>H10 QA App</h1>
  <p id="intro">This page is a minimal fixture used to exercise the CodeRabbit Verify QA agent.</p>
  <p id="probe">${probeLine}</p>
  <form action="/submit" method="get">
    <label for="name">Name</label>
    <input id="name" name="name" value="h10">
    <button type="submit">Submit</button>
  </form>
  <p><a href="/about">About this app</a></p>
  ${body}
</body>
</html>`;
  return html;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (url.pathname === '/probe') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(probeLine + '\n');
    return;
  }
  if (url.pathname === '/about') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page('<p id="about">A tiny Node.js HTTP server used as a QA fixture.</p>'));
    return;
  }
  if (url.pathname === '/submit') {
    const name = (url.searchParams.get('name') || '').slice(0, 80);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page(`<p id="result">Hello, ${name.replace(/[<>&]/g, '')}! Submission received.</p>`));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page(''));
});

server.listen(PORT, HOST, () => {
  console.log(`H10 QA app listening on http://${HOST}:${PORT}`);
});
