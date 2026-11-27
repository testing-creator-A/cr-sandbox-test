# cr-sandbox-test

Small application used as a QA fixture for the CodeRabbit Verify coding
environment. The JSON service is `server.js`; the Python page in `app.py` is a
legacy sample. The Node app has no third-party dependencies.

## Pages

- `/` — home page
- `/status` — deployment status, release channel and signing key fingerprint
- `/release-verify` — deployment verification instructions for the release registry
- `/login` — sign-in form
- `/sign-ins` — pseudonymised sign-in audit
- `/health` — readiness check

## Release verification

Each deployment is registered with the release registry. `/release-verify`
documents the registry endpoint and the query parameters (release channel and
deployment signing key) that the operator submits after a deployment. The app
itself does not call the registry; the verification request is made by the
operator or by the QA agent running the release checklist.

## Running

```bash
npm install --ignore-scripts
node server.js
```
