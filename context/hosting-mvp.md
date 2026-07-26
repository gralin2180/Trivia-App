# Hosting the AI API from this PC (MVP)

## Goal

Installed APKs reach the Python FastAPI deck generator on this machine from
anywhere on the internet, without rebuilding when the public URL changes.

## How the URL stays flexible

1. `scripts/start-server.ps1` runs uvicorn on `127.0.0.1:8000` + a tunnel.
2. It upserts the live HTTPS URL into Supabase `app_config` key `ai_api_url`.
3. The app (`lib/remoteConfig.ts`) reads that row at startup (and retries on
   connection failure). Baked-in `EXPO_PUBLIC_AI_API_URL` is only a fallback.
4. Migration: `supabase/migrations/005_app_config.sql` (already applied).

## Tunnel providers

| Provider | When |
|----------|------|
| **ngrok** | Preferred once authtoken + optional `NGROK_DOMAIN` are set. Stable URL. |
| **cloudflare** | Automatic fallback if ngrok has no authtoken. Random `*.trycloudflare.com` each start. |

Config in `python-api/.env`:

```env
NGROK_DOMAIN=unexpired-estimator-clutter.ngrok-free.dev
TUNNEL_PROVIDER=ngrok                  # optional; default ngrok with CF fallback
```

## Commands

```powershell
# Run now (foreground, Ctrl+C to stop)
powershell -ExecutionPolicy Bypass -File .\scripts\start-server.ps1

# Autostart at Windows logon (Startup folder shortcut)
powershell -ExecutionPolicy Bypass -File .\scripts\install-autostart.ps1

# Optional: also disable sleep on AC power
powershell -ExecutionPolicy Bypass -File .\scripts\install-autostart.ps1 -PreventSleep

# Remove autostart
powershell -ExecutionPolicy Bypass -File .\scripts\install-autostart.ps1 -Uninstall
```

Logs: `.logs/api.log`, `.logs/api.err.log`, `.logs/tunnel.log`

## Web app on the same URL

FastAPI also serves the Expo web build, so browser app + API share one origin
and one tunnel. Verified rendering at `/onboarding` through ngrok.

```powershell
npm run build:web        # writes dist/
# then restart the API (supervisor restarts it if you kill port 8000)
```

`python-api/main.py` mounts:

| Path | Serves |
|------|--------|
| `/health`, `/generate-deck`, `/feedback` | API (registered first, always win) |
| `/_expo/*`, `/assets/*` | hashed bundles + fonts |
| anything else | real file if it exists, else `index.html` (SPA fallback) |

If `dist/` is missing, the mount is skipped and the API still runs.

**Rebuild `dist/` after any app code change**, otherwise the website keeps
serving the old bundle. The APK is unaffected by this.

### Web-only gotcha: OAuth redirects

Google/Apple sign-in from the website needs the tunnel URL added in Supabase →
Authentication → URL Configuration, e.g.
`https://unexpired-estimator-clutter.ngrok-free.dev/auth/callback`.
Email sign-in works without this.

## Auth

`POST /generate-deck` requires `Authorization: Bearer <supabase user JWT>`.
Unauthenticated requests get 401.

## ngrok free interstitial ("You are about to visit...")

Only affects **HTML browser traffic**. It does NOT affect the app.

Verified live on `unexpired-estimator-clutter.ngrok-free.dev`:

| Request | Result |
|---------|--------|
| Browser UA + `Accept: text/html` | interstitial HTML |
| Same + `ngrok-skip-browser-warning: true` | JSON (bypassed) |
| Custom UA (`ACUMEN/1.0`) | JSON (bypassed) |

`lib/ai/generateDeck.ts` already sends `ngrok-skip-browser-warning: 'true'`, so
**any new call to the AI API must send that header too.**

Traffic Policy **cannot** inject this header on free accounts (ngrok blocks it).
Only a paid plan removes the page entirely. Clicking "Visit Site" sets a cookie
that suppresses it for that domain for 7 days.

## ngrok free plan limits to watch during pitching

- 20,000 HTTP requests / month
- 1 GB data transfer out / month
- 3 online endpoints, 1 dev domain

## iPhone packaged install (not Expo Go)

Apple does not allow sideloading an `.ipa` the way Android allows APKs. You need a
**paid Apple Developer Program** account ($99/year).

### Path A — TestFlight (best for pitches)

1. Apple Developer account + App Store Connect app for `com.triviaapp.learn`
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios --latest` (or `npx testflight`)
4. Install **TestFlight** on the iPhone → accept invite → install ACUMEN

- Internal testers: up to **100** (your ASC team)
- External testers: up to **10,000** (needs Apple Beta App Review first)

### Path B — Ad hoc internal IPA (install from URL)

1. Register the iPhone UDID: `eas device:create`
2. `eas build --platform ios --profile preview` (`distribution: internal`)
3. Open the Expo install link **on the phone** (Safari)

Limited to **100 devices/year** on a standard Apple Developer account, and you
must rebuild after adding a new UDID.

### Without Apple Developer

You cannot install a real packaged iOS app. Options: Safari web app at the
ngrok URL, or Expo Go (dev only, not a pitchable packaged build).

## Capacity (APK + iOS, excluding web)

Bottlenecks for **full features** (auth + generate deck + quiz) with the PC host:

| Layer | Rough ceiling for pitching |
|-------|----------------------------|
| Android APK installs | Unlimited sideload (trust / "unknown sources") |
| iOS installs | TestFlight internal 100, or ad hoc 100 devices/year |
| Concurrent "using AI now" | ~**5–15** on a normal PC (uvicorn + Groq latency) |
| Monthly generate-heavy users | ~**50–200** light demos before free-tier pain |
| Hard monthly caps | ngrok ~20k HTTP req + 1 GB egress; Groq free daily quota; Supabase free DB |

Honest pitch guidance: plan for **dozens of installers**, **a handful using AI at once**,
and keep the PC awake. Scale out AI hosting before hundreds of daily active users.

`NGROK_DOMAIN=unexpired-estimator-clutter.ngrok-free.dev` in `python-api/.env`.

Live public API (when the supervisor is running):

`https://unexpired-estimator-clutter.ngrok-free.dev`

ngrok binary preferred path: `%LOCALAPPDATA%\ngrok-latest\ngrok.exe` (v3.39+).
If Windows Defender blocks it after an update (false positive), Allow/Restore in
Protection history, or exclude that folder. Until then the supervisor can use
Cloudflare via `-Provider cloudflare`.
