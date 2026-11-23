const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

const marker = process.env.H101_ENV_MARKER || '';
const secret = process.env.H101_SECRET || '';
const markerState = marker ? `present(len=${marker.length})` : 'absent';
const sha8 = secret ? crypto.createHash('sha256').update(secret).digest('hex').slice(0, 8) : 'none';
const secretState = secret ? `present(len=${secret.length},sha8=${sha8})` : 'absent';
const probeLine = `H101-PROBE marker=${markerState} secret=${secretState}`;

// Startup diagnostic: records whether the deployment environment is configured.
console.log(probeLine);

function page(body, status = 200) {
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
