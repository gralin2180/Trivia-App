# Architecture snapshot

## Client

- Expo SDK 56 / React Native / Expo Router
- Supabase Auth + Postgres (profiles, decks, cards, quests, etc.)
- Brand: ACUMEN; mascot: Auri

## AI deck generation (preferred path)

```
App → getAiApiUrl() [Supabase app_config → cache → EXPO_PUBLIC_AI_API_URL]
   → POST {aiApiUrl}/generate-deck (Bearer JWT)
   → python-api FastAPI → deck_pipeline (Groq/etc) → save_deck via service role
```

Fallback if Python is down: Supabase Edge Function `generate-deck`.

## Key paths

| Area | Path |
|------|------|
| FastAPI entry | `python-api/main.py` |
| DB save / JWT verify | `python-api/db.py` |
| Pipeline | `python-api/deck_pipeline/` |
| Client generate | `lib/ai/generateDeck.ts` |
| Remote URL | `lib/remoteConfig.ts` |
| Config | `constants/config.ts` |
| Host supervisor | `scripts/start-server.ps1` |
| Boot install | `scripts/install-autostart.ps1` |

## Env

- Root `.env`: Expo public Supabase (+ optional `EXPO_PUBLIC_AI_API_URL`)
- `python-api/.env`: AI keys, Supabase URL + anon + **service role**, `NGROK_DOMAIN`
