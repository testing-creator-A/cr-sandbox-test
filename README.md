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
- `APP_TELEMETRY_ENDPOINT` — release-monitor endpoint used for deployment telemetry
- `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` — test account accepted by the sign-in form
- `PORT` — listening port (default `3000`)

## Deployment telemetry

On startup the app registers the running build with the release monitor at
`APP_TELEMETRY_ENDPOINT` (`/v1/telemetry/check`) using the build fingerprint,
the release channel and an attempt number. The status page lists the attempts
so an operator can confirm the rollout was observed.

## Pages

- `/` — home page
- `/status` — deployment status (release channel, launch mode, signing key fingerprint, telemetry attempts)
- `/login` — sign-in form
- `/account` — signed-in account page
- `/sign-ins` — pseudonymised audit trail of recent sign-in attempts
- `/health` — readiness check
