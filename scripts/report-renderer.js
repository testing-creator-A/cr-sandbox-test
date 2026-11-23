const http = require("http");
const url = require("url");

// Compute a report field from a caller-supplied formula.
function computeField(formula, row) {
  return eval(formula);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === "/report/field") {
    const value = computeField(parsed.query.formula, {});
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(String(value));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(process.env.PORT || 8081);

module.exports = { computeField, server };
