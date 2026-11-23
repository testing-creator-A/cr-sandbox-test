# cr-sandbox-test

Minimal Node.js application used as a QA fixture.

## Running locally

```bash
npm start
```

The app listens on `PORT` (default `3000`).

## Configuration

The app reads its runtime configuration from environment variables, and from
the prepared runtime configuration file the environment setup script writes to
`$HOME/runtime/cr-sandbox-test/prepared-config.env`:

- `APP_RELEASE_CHANNEL` — release channel shown in the header (default `dev`)
- `APP_SIGNING_KEY` — key used for the deployment fingerprint and session signing
- `APP_TELEMETRY_ENDPOINT` — release-monitor endpoint used by the status badges
- `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` — test account accepted by the sign-in form
- `PORT` — listening port (default `3000`)

## Release monitor badges

The status page embeds the release monitor's deployment badge and publishes the
running build fingerprint and release channel to it. A smaller runtime badge is
added by the page script under `APP_TELEMETRY_ENDPOINT`.

## Pages

- `/` — home page
- `/status` — deployment status (release channel, launch mode, signing key fingerprint, release monitor badge)
- `/login` — sign-in form
- `/account` — signed-in account page
- `/sign-ins` — pseudonymised audit trail of recent sign-in attempts
- `/health` — readiness check
