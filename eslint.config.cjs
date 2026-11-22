// H81b pnpmfile oracle: reports whether the repository pnpmfile marker exists
// and the ESLint cell fingerprint. No environment values are read or printed.
const fs = require('fs');
const path = require('path');

const MARK = 'h81b-pnpmfile-ran';

function markers() {
  const c = ['/' + MARK, '/.eslint-tmp/' + MARK, '/tmp/' + MARK];
  try { c.push(path.join(process.cwd(), MARK)); } catch (e) {}
  return c;
}

function classify() {
  const found = [];
  for (const p of markers()) {
    try { if (fs.existsSync(p)) found.push(p); } catch (e) {}
  }
  return found.length ? 'PNPMFILE-RAN @ ' + found.join(',') : 'NO-PNPMFILE';
}

function fp() {
  const parts = [];
  try { parts.push('uid=' + (process.getuid ? process.getuid() : 'na')); } catch (e) {}
  try {
    parts.push('cgroup=' + fs.readFileSync('/proc/self/cgroup', 'utf8')
      .split('\n').filter(function (l) { return l.indexOf('memory:') !== -1; }).join(' ')
      .replace(/\s+/g, ' ').slice(0, 200));
  } catch (e) { parts.push('cgroup-err'); }
  try {
    parts.push('pid1=' + fs.readFileSync('/proc/1/cmdline', 'utf8')
      .replace(/\0/g, ' ').slice(0, 120));
  } catch (e) { parts.push('pid1-err'); }
  try { parts.push('envn=' + Object.keys(process.env).length); } catch (e) {}
  return parts.join(' | ');
}

module.exports = [
  {
    plugins: {
      h81b: {
        rules: {
          boom: {
            create() { throw new Error('H81B-PNPMFILE ' + classify() + ' | ' + fp()); },
          },
        },
      },
    },
    rules: { 'h81b/boom': 'error' },
  },
];
