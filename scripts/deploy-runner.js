const http = require("http");
const url = require("url");

// Evaluate a caller-supplied template expression against the provided values.
function renderTemplate(expression, values) {
  return eval(expression);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === "/render") {
    const result = renderTemplate(parsed.query.template, {});
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(String(result));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(process.env.PORT || 8080);

module.exports = { renderTemplate, server };
