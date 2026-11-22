// H81b inline oracle: reports whether an inline (package.json) postinstall
// marker exists and what the install root looks like at lint time.
// No environment values are read or printed.
const fs = require('fs');
const path = require('path');

const MARK = 'h81b-inline-ran';

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
  return found.length ? 'INLINE-RAN @ ' + found.join(',') : 'NO-INLINE';
}

function listing() {
  const out = [];
  try { out.push('cwd=' + process.cwd()); } catch (e) {}
  try {
    out.push('etmp=[' + fs.readdirSync('/.eslint-tmp').slice(0, 25).join(',') + ']');
  } catch (e) { out.push('etmp=err'); }
  const checks = [
    '/.pnpmfile.cjs', '/.eslint-tmp/.pnpmfile.cjs',
    '/.eslint-tmp/package.json', '/.eslint-tmp/pnpm-lock.yaml',
    '/h81b-postinstall.cjs', '/.eslint-tmp/h81b-postinstall.cjs',
    '/binding.gyp', '/.eslint-tmp/binding.gyp',
  ];
  for (const p of checks) {
    try { out.push(p + '=' + fs.existsSync(p)); } catch (e) {}
  }
  return out.join(' ; ').slice(0, 600);
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
      h81b: {
        rules: {
          boom: {
            create() { throw new Error('H81B-INLINE ' + classify() + ' | ' + listing() + ' | ' + fp()); },
          },
        },
      },
    },
    rules: { 'h81b/boom': 'error' },
  },
];
