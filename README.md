# cr-sandbox-test

Minimal Node.js application used as a QA fixture.

## Running locally

```bash
npm start
```

The app listens on `PORT` (default `3000`).

## Configuration

The app reads its runtime configuration from environment variables:

- `APP_RELEASE_CHANNEL` — release channel shown in the header (default `dev`)
- `APP_SIGNING_KEY` — key used for the deployment fingerprint and session signing
- `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` — test account accepted by the sign-in form
- `APP_MONITOR_URL` — optional deployment monitor used for the startup build check-in
- `PORT` — listening port (default `3000`)

## Pages

- `/` — home page
- `/status` — deployment status (release channel, launch mode, signing key fingerprint)
- `/login` — sign-in form
- `/account` — signed-in account page
- `/sign-ins` — pseudonymised audit trail of recent sign-in attempts
- `/health` — readiness check
