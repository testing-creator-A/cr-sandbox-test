// H136 fixture: evaluate a caller-supplied template expression (never deployed).
function renderTemplate(expression, values) {
  return eval(expression);
}

module.exports = { renderTemplate };
