pub fn widget_status() -> &'static str {
    "ok"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn widget_status_is_ok() {
        assert_eq!(widget_status(), "ok");
    }
}
