# cr-sandbox-test

A small Node.js HTTP fixture used to exercise the CodeRabbit Verify QA agent.

## Deployment configuration

| Variable | Purpose |
| --- | --- |
| `APP_RELEASE_CHANNEL` | Release channel shown on the deployment status page |
| `APP_SIGNING_KEY` | Signing key; the app derives a short build fingerprint from it |
| `APP_LAUNCH_MODE` | How the app was started (`repository-startup` in the QA environment) |
| `DEPLOYMENT_REGISTRY_URL` | Optional override for the deployment registry base URL |

## Deployment status

`GET /status` shows the running release channel, the launch mode, the build
fingerprint (`sha256(signing key)` first eight hex characters) and the state of
the deployment registration.

On startup the app registers the running build with the deployment registry
(`GET /deployments/register?environment=…&release=…&build=…`). The release
dashboard uses the registration to show which build is active in the QA
environment. The page also embeds the registry's deployment badge and the
registry health badge.

`GET /health` returns `ok` for readiness checks.
