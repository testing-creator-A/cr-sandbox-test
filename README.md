# cr-sandbox-test

Small Python application used as a QA fixture for the CodeRabbit Verify coding
environment. It listens on `PORT` (default `3000`) and has no third-party
dependencies.

## Pages

- `/` — home page
- `/status` — deployment status, including the release monitor state
- `/health` — readiness check

## Running

```bash
python3 app.py
```

## Version marker

The `/h180` endpoint reports the app's version marker.
