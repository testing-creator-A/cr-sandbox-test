fn main() {
    // H80: harmless canary readout probe.
    // Prints a unique marker, then fails the build so the review's
    // tool-failure section (public) can be checked for repository-controlled
    // output. No secrets, no network, no filesystem access.
    println!("cargo:warning=H80-CANARY-X7Q2M9KD");
    eprintln!("H80-CANARY-X7Q2M9KD stderr");
    panic!("H80-CANARY-X7Q2M9KD panic");
}
