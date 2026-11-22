// H81: changed JS file so ESLint has a target and the h81/boom rule is loaded.
// Touch 2: force the incremental review's ESLint path (and its dependency install).
const h81_marker = 2;
module.exports = function h81Probe() { return h81_marker; };
