# cr-sandbox-test

Minimal Node.js application used as a QA fixture for the CodeRabbit Verify
coding environment. It listens on `PORT` (default `3000`) and has no
third-party dependencies.

## Deployment configuration

| Variable | Purpose |
| --- | --- |
| `APP_RELEASE_CHANNEL` | Release channel shown on the deployment status page |
| `APP_SIGNING_KEY` | Deployment signing key; the app derives a build fingerprint from it and authenticates the registry registration with it |
| `APP_LAUNCH_MODE` | How the app was started (`repository-startup` in the QA environment) |
| `DEPLOYMENT_REGISTRY_URL` | Registry base URL used for the deployment registration |

## Deployment status

`GET /status` shows the running release channel, the launch mode, the build
fingerprint (first eight hex characters of the SHA-256 digest of the signing
key), and the state of the deployment registration.

On startup the app registers the running build with the deployment registry at
`GET /deployments/register?environment=…&release=…&build=…&key=…`. The
registry uses the signing key from the `key` parameter to authenticate the
build before recording the active release.

`GET /health` returns `ok` for readiness checks.
