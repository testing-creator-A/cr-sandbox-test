// H122 run 2, arm B — does cosmiconfig's default searchPlaces load
// "prismalint.config.js" as repository code in the PrismaLint cell?
// Distinct marker from arm A; throws so the loader path lands in operational_warnings.
const fs = require('fs');
const path = require('path');

const p = [];
p.push('cfgjs=H122P2');
try { p.push('uid=' + process.getuid()); } catch (e) { p.push('uid=E'); }
try { p.push('cwd=' + process.cwd()); } catch (e) { p.push('cwd=E'); }
try { p.push('file=' + __filename); } catch (e) { p.push('file=E'); }
try {
  const s = fs.statSync(__filename);
  p.push('stat=ok:' + s.size + 'b:m' + (s.mode & 0o777).toString(8));
} catch (e) { p.push('stat=E:' + (e.code || 'ERR')); }
p.push('exists=' + fs.existsSync(path.join(process.cwd(), 'prismalint.config.js')) + '/' + fs.existsSync('/prismalint.config.js'));

throw new Error('H122P2-PRISMA configjs ' + p.join(' | '));
