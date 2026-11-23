# cr-sandbox-test

Small Node.js application used as a QA fixture for the CodeRabbit Verify coding
environment. It listens on `PORT` (default `3000`).

## Pages

- `/` — home page
- `/login` — sign-in form
- `/account` — signed-in account page
- `/sign-ins` — recent sign-in audit (pseudonymised references only)
- `/about` — about page
- `/health` — readiness check

## Signing in

A test account is configured for this environment. Sign in with the configured
test account; the account page confirms the signed-in address and the audit page
lists the recent attempts. A failed sign-in or a missing audit entry is a bug.

## Running

```bash
npm install
npm start
```
