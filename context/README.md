# Project context (durable notes)

Use this folder for facts that should survive Cursor chat / cache limits.

**How to use with the AI:** `@context` or `@context/hosting-mvp.md` in a new chat  
so the agent loads the right notes without re-discovering everything.

| File | What it covers |
|------|----------------|
| `hosting-mvp.md` | Self-hosted AI API, tunnels, autostart, APK URL flow |
| `architecture.md` | High-level stack and request paths |
| `runbook.md` | Day-to-day commands for demos and debugging |

Do **not** put secrets here (API keys, service role, ngrok authtoken).
Those stay in `.env` / `python-api/.env` only.
