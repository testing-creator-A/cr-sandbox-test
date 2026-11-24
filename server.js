const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const H180_MARKER = 'VAL005-V4-47fe205c4b11';

function page(body, status = 200) {
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>H10 QA App</title></head>
<body>
  <h1>H10 QA App</h1>
  <p id="intro">This page is a minimal fixture used to exercise the CodeRabbit Verify QA agent.</p>
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
  if (url.pathname === '/h180') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ marker: H180_MARKER, commit: 'V4' }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page(''));
});

server.listen(PORT, HOST, () => {
  console.log(`H10 QA app listening on http://${HOST}:${PORT}`);
});
