# cr-sandbox-test

Small Node.js application used as a QA fixture for the CodeRabbit Verify coding
environment. It has no third-party dependencies and listens on `PORT` (default
`3000`).

## Pages

- `/` — home page
- `/login` — sign-in form
- `/account` — signed-in account page
- `/sign-ins` — pseudonymised audit trail of recent sign-ins
- `/health` — readiness check

## Sign-in audit

Each sign-in attempt is summarised with short SHA-256 references and added to the
audit trail shown on `/sign-ins`; raw credentials are never stored.

## Testing

Start the application with the environment startup script, open `/login`, and
sign in with the test account configured for this environment. The account page
and the audit trail should then show the signed-in address and the matching
references.
