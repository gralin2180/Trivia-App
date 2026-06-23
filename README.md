# Trivia App

AI-powered flashcard and quiz app built with **Expo (React Native)** and **Supabase**. Users sign in, search any topic, choose study/quiz mode and difficulty, then AI generates a deck.

Works on **web**, **iOS**, and **Android** from one codebase.

## Stack

- Expo Router + React Native + TypeScript
- Supabase (Auth, Postgres, Edge Functions)
- AI deck generation via Groq / Gemini / OpenAI (configured in Supabase secrets)

## Local development

### Prerequisites

- Node.js LTS
- npm
- A Supabase project (free tier is fine)

### Setup

```bash
git clone <your-repo-url>
cd trivia-app
npm install
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-legacy-anon-key-starting-with-eyJ
```

Use the **legacy anon JWT** from Supabase → Project Settings → API → Legacy keys. The short `sb_publishable_` key often fails with auth.

### Database

In Supabase **SQL Editor**, run in order:

1. `supabase/schema.sql`
2. `supabase/migrations/003_ai_decks.sql`

### AI generation (Edge Function)

Deploy the function and set secrets in Supabase → Edge Functions → `generate-deck` → Secrets:

| Secret | Required |
|--------|----------|
| `GROQ_API_KEY` | Recommended (free tier) |
| `GEMINI_API_KEY` | Optional fallback |
| `OPENAI_API_KEY` | Optional fallback |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are usually injected automatically when deployed via Supabase CLI.

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy generate-deck
```

### Run

```bash
npm run web      # browser
npm run android  # Android emulator / device
npm run ios      # macOS only
npm start        # Expo dev menu
```

On Windows PowerShell, if `npm` is blocked, use `npm.cmd`.

---

## Hosting for production

### Option A — Share one Supabase backend (simplest)

Keep the existing Supabase project. Your friend only deploys the **frontend**:

- Web build reads `EXPO_PUBLIC_*` env vars at **build time**
- All users share the same database and auth

### Option B — New Supabase per environment

Friend creates a fresh Supabase project, runs the SQL files, deploys the Edge Function, and uses their own `.env` / CI secrets.

---

## Web deployment (global domain)

Build static web output:

```bash
npm run build:web
```

Output is in `dist/`. Deploy that folder to any static host:

| Platform | Notes |
|----------|--------|
| [Vercel](https://vercel.com) | Connect GitHub repo; set env vars; build command `npm run build:web`; output `dist` |
| [Netlify](https://netlify.com) | Same pattern |
| [Cloudflare Pages](https://pages.cloudflare.com) | Same pattern |

**Required build environment variables:**

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Point your custom domain in the host’s DNS settings (e.g. `app.yourdomain.com`).

---

## Mobile deployment (App Store / Play Store)

Use [Expo Application Services (EAS)](https://docs.expo.dev/eas/):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

Submit builds with `eas submit`. You’ll need:

- Apple Developer account (iOS)
- Google Play Console account (Android)
- Same `EXPO_PUBLIC_*` env vars in EAS project settings

For **internal testing only**, share an APK via `eas build --profile preview` or use Expo Go during development (not suitable for public production).

---

## Project structure

```
app/           # Expo Router screens
components/    # UI components
lib/           # Supabase, AI, study/quiz logic
hooks/         # Data hooks
supabase/      # SQL schema + Edge Functions
types/         # TypeScript types
```

## Security notes

- **Never commit** `.env` — it is gitignored
- **Never commit** `SUPABASE_SERVICE_ROLE_KEY` or AI API keys to the repo
- Service role key stays in Supabase Edge Function secrets only
- Rotate keys if they were ever shared in chat or screenshots

## License

Private project — add a license if you open-source it later.
