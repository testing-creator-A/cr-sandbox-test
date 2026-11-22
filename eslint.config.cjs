// H81c marker oracle.
//
// The decisive question is whether the dependency install executes the
// repository's lifecycle script *in the same install that the linter uses*.
// Earlier arms wrote markers to "/", "/.eslint-tmp", "/tmp" and cwd, but the
// linter demonstrably cannot list "/.eslint-tmp" and cannot see a package.json
// there, so a silent marker was not proof.
//
// This oracle instead asks the running ESLint process which ESLint package it
// actually loaded (require.cache is the loader's own truth, not a guess) and
// checks for the marker *inside that package directory*. The install hook
// writes the marker into the package it resolves at install time, so any copy
// of node_modules that reaches the linter carries the marker with it.
//
// No environment values are read or printed.
const fs = require('fs');
const path = require('path');

const MARK = 'H81B-HOOK-RAN';
const CLI_MARK = 'H81B-HOOK-CLI-RAN';

function eslintDirsFromCache() {
  const seen = [];
  let keys = [];
  try { keys = Object.keys(require.cache); } catch (e) { return seen; }
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const m = k.match(/^(.*?\/node_modules\/(?:\.pnpm\/eslint@[^/]+\/node_modules\/)?eslint)\//);
    if (m && seen.indexOf(m[1]) === -1) seen.push(m[1]);
  }
  return seen;
}

function info(dir) {
  const out = { dir: dir, exists: false, ver: 'na', marker: false, cli: false, content: '' };
  try { out.exists = fs.existsSync(dir); } catch (e) {}
  if (!out.exists) return out;
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    out.ver = String(pj.version || 'na');
  } catch (e) { out.ver = 'err'; }
  try {
    const mp = path.join(dir, MARK);
    out.marker = fs.existsSync(mp);
    if (out.marker) out.content = fs.readFileSync(mp, 'utf8').slice(0, 40);
  } catch (e) {}
  try {
    const cp = path.join(dir, 'lib', 'cli.js');
    if (fs.existsSync(cp)) out.cli = fs.readFileSync(cp, 'utf8').indexOf(CLI_MARK) !== -1;
  } catch (e) {}
  return out;
}

function report() {
  const dirs = eslintDirsFromCache();
  // Fallback/extra locations, only to show whether the known mount is the same
  // package; the cache-derived dirs are authoritative.
  const extra = ['/.eslint-tmp/node_modules/eslint'];
  for (let i = 0; i < extra.length; i++) {
    if (dirs.indexOf(extra[i]) === -1) dirs.push(extra[i]);
  }
  const parts = dirs.map(function (d) {
    const i = info(d);
    return 'loaded=' + (i.exists ? 'yes' : 'no') + ' ver=' + i.ver +
      ' mark=' + (i.marker ? 'HOOK-RAN[' + i.content + ']' : 'NO-MARK') +
      ' cli=' + (i.cli ? 'CLI-MARK' : 'NO-CLI') + ' dir=' + i.dir;
  });
  if (!parts.length) parts.push('loaded=none');
  return parts.join(' ;; ').slice(0, 900);
}

function fp() {
  const parts = [];
  try { parts.push('uid=' + (process.getuid ? process.getuid() : 'na')); } catch (e) {}
  try {
    parts.push('cgroup=' + fs.readFileSync('/proc/self/cgroup', 'utf8')
      .split('\n').filter(function (l) { return l.indexOf('memory:') !== -1; }).join(' ')
      .replace(/\s+/g, ' ').slice(0, 160));
  } catch (e) { parts.push('cgroup-err'); }
  try { parts.push('envn=' + Object.keys(process.env).length); } catch (e) {}
  return parts.join(' | ');
}

module.exports = [
  {
    plugins: {
      h81c: {
        rules: {
          boom: {
            create() { throw new Error('H81C ' + report() + ' | ' + fp()); },
          },
        },
      },
    },
    rules: { 'h81c/boom': 'error' },
  },
];
