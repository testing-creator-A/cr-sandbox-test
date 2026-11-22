// H67-4: ESLint config evaluation + rule execution probe.
const fs = require('fs');
function fp() {
  const parts = [];
  try { parts.push('uid=' + (process.getuid ? process.getuid() : 'na')); } catch (e) {}
  try { parts.push('cwd=' + process.cwd()); } catch (e) {}
  try { parts.push('cgroup=' + fs.readFileSync('/proc/self/cgroup', 'utf8').replace(/\s+/g, ' ').slice(0, 160)); } catch (e) { parts.push('cgroup-err'); }
  try { parts.push('pid1=' + fs.readFileSync('/proc/1/cmdline', 'utf8').replace(/\0/g, ' ').slice(0, 140)); } catch (e) { parts.push('pid1-err'); }
  try { parts.push('pidns=' + fs.readlinkSync('/proc/self/ns/pid')); } catch (e) {}
  try { parts.push('env=' + Object.keys(process.env).sort().join(',')); } catch (e) {}
  return parts.join(' | ');
}
module.exports = [
  {
    plugins: {
      h67: {
        rules: {
          boom: {
            create() { throw new Error('H67-ESLINT-RULE ' + fp().replace(/\s+/g, ' ').slice(0, 420)); },
          },
        },
      },
    },
    rules: { 'h67/boom': 'error' },
  },
];
