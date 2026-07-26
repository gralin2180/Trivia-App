# ACUMEN (Trivia App)

AI-powered learning app built with **Expo (React Native)**, **Supabase**, and a
FastAPI generation service. Search any topic, generate a deck, study or quiz,
complete quests, grow a streak, and track mastery.

Works on **web**, **iOS**, and **Android** from one codebase.

Mascot: **Auri** — a session coach with a full-screen motivational check-in,
progress summary, draggable in-app companion, contextual chat, and guided tour.

## Current product experience

1. New users see a three-step Auri onboarding.
2. The final onboarding step offers:
   - **Create free account** → Google, Apple, or email signup
   - **Try ACUMEN as guest** → immediate local guest session
   - **I already have an account** → login
3. Every app launch opens a clean, full-screen Auri greeting before Learn:
   - rotating motivational copy
   - relevant streak, level, XP, daily goal, quiz, and continue-deck context
   - **Got it** → stats; **Let's learn** → main Learn screen
4. Inside the app Auri floats freely, can be dragged, looks toward screen
   center, blinks/grooms/waves, answers common questions, changes themes, and
   can replay the UI spotlight tour.

The current shared demo is:
<https://unexpired-estimator-clutter.ngrok-free.dev>

The demo requires the host PC and tunnel supervisor to remain online.

---

## Quick start (for testers / other devs)

```bash
git clone https://github.com/gralin2180/Trivia-App.git
cd Trivia-App
npm install
cp .env.example .env
```

### 1. Fill `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-legacy-anon-key-starting-with-eyJ
```

Use the **legacy anon JWT** (starts with `eyJ…`) from Supabase → Project Settings → API → Legacy keys.
Short `sb_publishable_` keys often break auth.

Optional AI API (local FastAPI):

```env
EXPO_PUBLIC_AI_API_URL=http://localhost:8000
```

The installed app normally resolves the API URL dynamically from Supabase
`app_config.ai_api_url`; the baked-in environment value is only a fallback.
This allows the tunnel endpoint to change without rebuilding the APK.

### 2. Database (once per Supabase project)

In Supabase **SQL Editor**, run in order:

1. `supabase/schema.sql`
2. `supabase/migrations/003_ai_decks.sql`
3. `supabase/migrations/004_profiles_leaderboard.sql`
4. `supabase/migrations/005_app_config.sql`

### 3. Run the app

```bash
npm run web        # browser (recommended for quick review)
npm start          # Expo dev menu (scan with Expo Go)
npm run android    # Android emulator / device
npm run ios        # macOS only
```

Open **http://localhost:8081** after `npm run web`.

On Windows PowerShell, if `npm` is blocked, use `npm.cmd` / `npx.cmd`.

---

## What to test

### Auth & guest

1. Open the app → **Onboarding** → Continue through slides.
2. Choose **Try ACUMEN as guest** for a no-account smoke test.
3. Choose **Create free account** for Google, Apple, or email signup.
4. Existing users choose **I already have an account**.

Apple Sign In is shown only where the platform and configuration support it.
Google/Apple OAuth providers and redirect URLs must be configured in Supabase.

### Auri (mascot)

- Every app process launch starts with a centered, full-screen motivational
  greeting and a personalized progress snapshot.
- She floats **without a box** on the main app screens.
- **Drag** her anywhere on the screen.
- **Tap** her → she grows and opens an RPG-style dialogue box.
- Her opening messages and suggested actions rotate so chat does not feel static.
- In dark mode she suggests trying the light theme (and vice versa).
- Her gaze uses dedicated head-and-eye sprites; the whole character is not tilted.
- Replay tour anytime: **Profile → Settings gear → Replay Auri’s tour**.

### Core loops

| Flow | Steps |
|------|--------|
| Generate deck | Learn → type a topic → Build my deck |
| Study | Open a deck → Study |
| Quiz | Open a deck → Quiz |
| Quests | Bottom tab **Quests** |
| Ranks | Bottom tab **Ranks** |
| Themes | Ask Auri “light” / “dark” / “minimal”, or Settings → Appearance |
| Guest paywall | As guest, generate 2 decks → soft subscribe prompt |

### Reset Auri’s tour (dev)

In browser DevTools console (web), or by clearing AsyncStorage keys:

- `mascot_intro_seen_v1`
- `mascot_position_v1` (optional — resets her saved spot)

Or use **Replay Auri’s tour** in Settings.

---

## Stack

- Expo SDK 56, React Native 0.85, React 19, Expo Router, TypeScript
- Supabase Auth + Postgres + Row Level Security
- FastAPI AI service with Groq as the active provider and optional fallbacks
- Supabase Edge Function fallback for deck generation
- Expo Notifications for streak reminders
- AsyncStorage for local guest state, settings, mascot position, and intro flags

## Runtime architecture

```text
Expo app
├─ Auth / data ───────────────→ Supabase Auth + Postgres
├─ Resolve AI URL ────────────→ app_config.ai_api_url
├─ Generate deck ─────────────→ FastAPI /generate-deck (Bearer user JWT)
│                                ├─ Groq / other configured provider
│                                └─ Supabase service-role persistence
└─ Generation fallback ───────→ Supabase Edge Function

Browser
└─ ngrok HTTPS URL ───────────→ FastAPI
                                 ├─ /health, /generate-deck, /feedback
                                 └─ Expo web export from dist/
```

Important request paths:

| Concern | Main implementation |
|---------|---------------------|
| App boot and routing | `app/_layout.tsx`, `app/index.tsx` |
| Learn screen | `app/(tabs)/index.tsx` |
| Auth and guest state | `contexts/AuthContext.tsx` |
| Progress aggregation | `hooks/useProgress.ts`, `lib/progress.ts` |
| Auri state | `contexts/MascotContext.tsx` |
| Auri full-screen greeting | `components/mascot/AuriWelcomeScreen.tsx` |
| Auri floating/chat UI | `components/mascot/AuriFloating.tsx`, `AuriDialogue.tsx` |
| Auri copy and stat selection | `lib/mascotCoach.ts` |
| AI request and fallback | `lib/ai/generateDeck.ts` |
| Runtime API URL | `lib/remoteConfig.ts` |
| FastAPI application | `python-api/main.py` |
| AI pipeline | `python-api/deck_pipeline/` |
| Tunnel supervisor | `scripts/start-server.ps1` |

---

## AI generation (Edge Function)

Deploy and set secrets in Supabase → Edge Functions → `generate-deck`:

| Secret | Required |
|--------|----------|
| `GROQ_API_KEY` | Recommended (free tier) |
| `GEMINI_API_KEY` | Optional fallback |
| `OPENAI_API_KEY` | Optional fallback |

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy generate-deck
```

### FastAPI service (preferred demo path)

Create `python-api/.env` without committing it:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key
GROQ_API_KEY=your-provider-key
NGROK_DOMAIN=your-reserved-domain.ngrok-free.dev
TUNNEL_PROVIDER=ngrok
```

Start locally:

```powershell
cd python-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\start-server.ps1
```

Health checks:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod https://YOUR_DOMAIN.ngrok-free.dev/health
```

---

## Project structure

```
app/                 # Expo Router screens
components/
  mascot/            # Auri welcome, sprites, floating UI, chat, spotlight
  home/ decks/ ui/   # Feature UI
contexts/            # Auth, theme, settings, mascot
hooks/                # Data/progress/deck hooks
lib/                  # Supabase, AI, quests, progress, coach logic
python-api/           # FastAPI generation service + provider pipeline
scripts/              # Hosting, autostart, and mascot build utilities
supabase/            # SQL + Edge Functions
context/              # Durable architecture, hosting, and runbook notes
```

---

## Build and release workflows

### Web / ngrok

```powershell
npm run build:web
powershell -ExecutionPolicy Bypass -File .\scripts\start-server.ps1 -Provider ngrok
```

FastAPI reads `dist/` directly; no separate file upload is required while the
server is running. Re-export after every client change. Verify the exact public
site and API:

```powershell
Invoke-WebRequest https://YOUR_DOMAIN.ngrok-free.dev/ `
  -Headers @{"ngrok-skip-browser-warning"="true"}
Invoke-RestMethod https://YOUR_DOMAIN.ngrok-free.dev/health
```

### Android APK

Cloud preview APK:

```bash
npm run build:android
# equivalent: eas build --platform android --profile preview
```

Local Windows release APK (Android SDK/JDK required):

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
cd android
.\gradlew.bat assembleRelease --no-daemon
```

Local output: `android/app/build/outputs/apk/release/app-release.apk`.

The checked-in native release configuration currently uses the debug keystore,
which is appropriate for internal testing only. Use a protected production
keystore before Play Store distribution. APKs dynamically read the live API URL
from Supabase, so normal tunnel restarts do not require an APK rebuild.

### iOS

Use EAS Build and TestFlight/ad hoc distribution:

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

A paid Apple Developer account is required for a packaged iOS install.

---

## Serving the AI API from your own PC (MVP demos)

The Python AI pipeline (`python-api/`) can run on your machine and still be reachable
from an installed APK anywhere in the world. One command handles it:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-server.ps1
```

That script starts `uvicorn` on `127.0.0.1:8000`, opens an internet tunnel, and writes
the live public URL into the Supabase `app_config` table. The app reads that row at
startup, so **the URL can change without rebuilding the APK**. It also supervises both
processes and restarts them if they die.

### Tunnel providers

| Provider | URL stability | Setup |
|----------|---------------|-------|
| `cloudflare` | New random URL each start | None — works immediately |
| `ngrok` | Permanent, if `NGROK_DOMAIN` is set | Free account + authtoken |

The script defaults to ngrok and silently falls back to cloudflare until an ngrok
authtoken exists, so unattended starts always come up.

To get a permanent URL:

```powershell
ngrok config add-authtoken <token>     # https://dashboard.ngrok.com/get-started/your-authtoken
```

Then reserve a free domain at <https://dashboard.ngrok.com/domains> and set it in
`python-api/.env`:

```env
NGROK_DOMAIN=your-name.ngrok-free.app
```

### Start automatically at logon

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-autostart.ps1
```

Adds a hidden Startup-folder shortcut (no admin needed). Add `-UseScheduledTask` from an
elevated prompt to get crash auto-restart as well, `-PreventSleep` to stop the PC
sleeping on AC power, and `-Uninstall` to remove either.

### Serving the web app from the same URL

FastAPI also serves the Expo web export, so the browser app and the API share one
origin and one tunnel:

```bash
npm run build:web     # writes dist/
```

Then restart the API. `/health`, `/generate-deck` and `/feedback` keep working, and
every other path falls back to `index.html` for Expo Router's SPA routing.

Rebuild `dist/` after app code changes, or the website keeps serving the old bundle.
On a free ngrok plan, browser visitors see the ngrok interstitial once (7-day cookie);
the APK never does because it sends `ngrok-skip-browser-warning`.

### Requirements and caveats

- `python-api/.env` needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` so the script
  can publish the URL, plus at least one AI key (`GROQ_API_KEY` is the free option).
- Run `supabase/migrations/005_app_config.sql` once per project.
- The PC must be **awake and online**. This is fine for demos; move the API to a real
  host before shipping to real users.
- `/generate-deck` requires a valid Supabase user JWT, so exposing it publicly does not
  let strangers burn your AI quota.
- Logs land in `.logs/` (`api.log`, `api.err.log`, `tunnel.log`).

## Verification before handing off a build

```bash
npx tsc --noEmit
npm run build:web
```

Then test on a real device:

1. Fresh install → onboarding → create account / guest choices.
2. Relaunch → full-screen Auri motivation → stats → Learn.
3. Email signup/login and configured Google/Apple OAuth.
4. Generate a deck from a signed-in account.
5. Open deck → study → quiz → confirm XP/streak/progress changes.
6. Quests, ranks, badges, settings, themes, sound, and reminders.
7. Drag and tap Auri; ask for light/dark/minimal and replay the tour.
8. Disable/re-enable network and confirm cached/error UI is understandable.

Guest mode intentionally has reduced persistence/sync. AI generation requires a
valid Supabase user JWT; if guest generation is restricted, sign in for the full
end-to-end test.

## Troubleshooting

| Symptom | What to check |
|---------|---------------|
| Website shows old UI | Run `npm run build:web`, then hard-refresh |
| APK cannot generate | Public `/health`, `app_config.ai_api_url`, host PC awake |
| Browser shows ngrok warning | Visit once or send `ngrok-skip-browser-warning` |
| Auth returns invalid key | Use the legacy anon JWT expected by this project |
| OAuth returns to wrong page | Supabase redirect allow-list and provider callback |
| Auri tour repeats | `mascot_intro_seen_v1` storage / Settings replay action |
| Auri position is odd | Clear `mascot_position_v1` |
| Metro has stale assets | Restart with `npx expo start --clear` |
| Android build fails | `ANDROID_HOME`, JDK, SDK licenses, Gradle output |

---

## Security

- **Never commit** `.env`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or AI provider keys in Expo public env
- Client-side Supabase anon/publishable keys are not secrets; RLS is the boundary
- Service role and AI keys stay in `python-api/.env` or hosted secret storage
- Keep `/generate-deck` JWT-protected and preserve the ngrok bypass header
- Do not commit APK signing keys, tunnel auth tokens, logs, or generated builds
- Rotate keys if they were ever pasted into chat

---

## License

Private project — add a license if you open-source it later.
