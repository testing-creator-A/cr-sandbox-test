// H81 hooks: changed JS file so ESLint has a target and h81/boom is loaded.
const h81_marker = 4;
module.exports = function h81Probe() { return h81_marker; };
