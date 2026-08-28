# Runbook (demos / debugging)

## Is the public API up?

```powershell
# Local health
Invoke-RestMethod http://127.0.0.1:8000/health

# URL the app will use (anon read)
# Or open Supabase → Table Editor → app_config → ai_api_url
```

Then: `Invoke-WebRequest <published-https-url>/health`

## Restart host stack

1. Stop any running `start-server.ps1` (Ctrl+C in its window, or end that PowerShell).
2. Ensure port 8000 is free.
3. Run `scripts\start-server.ps1` again.

## Switch to permanent ngrok URL

1. `ngrok config add-authtoken <token>` (once)
2. Reserve domain at https://dashboard.ngrok.com/domains
3. Set `NGROK_DOMAIN=...` in `python-api/.env`
4. Restart `start-server.ps1` — it publishes the new URL to Supabase automatically.

## Rebuild web (demo site)

After client UX changes (study flow, assistant picker, etc.):

```bash
npm run build:web
```

Supervisor serves `dist/` over the public tunnel. Hard-refresh the browser if
you still see the old bundle.

Study / assistant / revision behavior is documented in `context/learning-ux.md`.

## Rebuild APK after client changes

Remote URL fetch is already in the app; rebuild only when you ship new app code:

```bash
eas build --platform android --profile preview
```

## Known fixes already landed (Jul 2026)

- `db.py` insert no longer uses invalid `.single()` after insert
- App reads AI URL from `app_config`
- `useQuiz` exports `currentIndex` (hearts/combo reset)
- RN 0.85: use `StyleSheet.absoluteFill` not `absoluteFillObject`
