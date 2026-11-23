const http = require("http");
const url = require("url");

// Render a caller-supplied template expression.
function renderTemplate(expression) {
  return eval(expression);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === "/render") {
    try {
      const result = renderTemplate(parsed.query.template);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(String(result));
      return;
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(String(error));
      return;
    }
  }
  res.writeHead(404);
  res.end();
});

server.listen(3000);
