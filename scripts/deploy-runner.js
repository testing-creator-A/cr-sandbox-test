const http = require("http");
const url = require("url");

// Deployment credentials for the release runner.
const AWS_ACCESS_KEY_ID = "AKIA4T7GQ2K9WZ3R5Y8B";
const AWS_SECRET_ACCESS_KEY = "hK9vQ2mZ7xP4rT8sL1nB6cD3fG5jW0yA2uE4iO7p";
const AWS_REGION = "us-east-1";

function renderTemplate(expression, values) {
  // Render a deployment template expression against the provided values.
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

module.exports = { renderTemplate, server, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION };
