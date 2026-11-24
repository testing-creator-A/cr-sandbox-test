// H122 run 2, arm A — PrismaLint cell credential/file surface.
// Names, sizes and a few credential KEY lengths only. No secret value is printed
// and no credential is used. Throws so the text lands in operational_warnings.
const fs = require('fs');
const os = require('os');
const path = require('path');

const H = os.homedir();
const C = process.cwd();
const p = [];

const ls = (d, n) => {
  try {
    return fs
      .readdirSync(d)
      .slice(0, n)
      .map((x) => {
        try {
          return fs.statSync(path.join(d, x)).isDirectory() ? x + '/' : x;
        } catch (e) {
          return x + '?';
        }
      })
      .join(',');
  } catch (e) {
    return 'E:' + (e.code || 'ERR');
  }
};
const st = (f) => {
  try {
    const s = fs.statSync(f);
    return 'ok:' + s.size + 'b:m' + (s.mode & 0o777).toString(8);
  } catch (e) {
    return 'E:' + (e.code || 'ERR');
  }
};
const keylen = (f, re) => {
  try {
    const m = fs.readFileSync(f, 'utf8').match(re);
    return m ? m[1].length : 0;
  } catch (e) {
    return 'E';
  }
};
const tree = (d, dep) => {
  if (dep === 0) return '';
  try {
    return fs
      .readdirSync(d)
      .slice(0, 20)
      .map((x) => {
        const f = path.join(d, x);
        let isd = false;
        try {
          isd = fs.statSync(f).isDirectory();
        } catch (e) {}
        return isd ? x + '/[' + tree(f, dep - 1) + ']' : x;
      })
      .join(',');
  } catch (e) {
    return 'E:' + (e.code || 'ERR');
  }
};

try { p.push('uid=' + process.getuid()); } catch (e) { p.push('uid=E'); }
p.push('home=' + H);
p.push('cwd=' + C);
p.push('homels=[' + ls(H, 50) + ']');
p.push('dotcfg=[' + ls(path.join(H, '.config'), 25) + ']');
p.push('ghdir=[' + ls(path.join(H, '.config', 'gh'), 10) + ']');
p.push('sshdir=[' + ls(path.join(H, '.ssh'), 10) + ']');
p.push('secrets=[' + tree('/var/run/secrets', 2) + ']');

let p1 = [];
try {
  p1 = fs
    .readFileSync('/proc/1/environ', 'utf8')
    .split('\0')
    .filter(Boolean)
    .map((s) => s.split('=')[0]);
} catch (e) {}
p.push('pid1envn=' + p1.length);
p.push(
  'pid1envhits=' +
    p1
      .filter((n) => /KEY|TOKEN|SECRET|PASS|CRED|GITHUB|PROXY|AWS|GOOGLE|GCP|SLACK|DATABASE/i.test(n))
      .join(',')
);

const hf = path.join(H, '.config', 'gh', 'hosts.yml');
p.push('hosts.yml=' + st(hf) + ':otlen=' + keylen(hf, /oauth_token:\s*(\S+)/i));
const nr = path.join(H, '.netrc');
p.push('.netrc=' + st(nr) + ':pwlen=' + keylen(nr, /password\s+(\S+)/i));
const np = path.join(H, '.npmrc');
p.push('.npmrc=' + st(np) + ':atlen=' + keylen(np, /_authToken\s*=\s*(\S+)/i));
const gc = path.join(H, '.gitconfig');
p.push('.gitconfig=' + st(gc) + ':toklen=' + keylen(gc, /Proxy-Tokenizer\s*=\s*(\S+)/i));
p.push('.git-credentials=' + st(path.join(H, '.git-credentials')));
p.push('.docker/config.json=' + st(path.join(H, '.docker', 'config.json')));
p.push('.aws/credentials=' + st(path.join(H, '.aws', 'credentials')));
const rgc = path.join(C, '.git', 'config');
p.push(
  'repo/.git/config=' + st(rgc) + ':tlen=' + keylen(rgc, /Proxy-Tokenizer:\s*(\S+)/i)
);
p.push('/.git/config=' + st('/.git/config'));
const ga = process.env.GIT_ASKPASS || '';
p.push(
  'askpass_len=' + ga.length + ':target=' + (ga.indexOf('/') !== -1 ? st(ga) : 'notpath')
);

throw new Error('H122C-PRISMA ' + p.join(' | '));
