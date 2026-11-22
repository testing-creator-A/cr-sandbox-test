// H120 probe: deliberately insecure sample code, not real credentials.
const AWS_ACCESS_KEY_ID = "AKIA4T7GQ2K9WZ3R5Y8B";
const AWS_SECRET_ACCESS_KEY = "hK9vQ2mZ7xP4rT8sL1nB6cD3fG5jW0yA2uE4iO7p";
const AWS_REGION = "us-east-1";

function runUserCode(req, res) {
  const result = eval(req.query.code);
  res.send(String(result));
}

module.exports = { runUserCode, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION };
