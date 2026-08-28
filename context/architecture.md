# Architecture snapshot

## Client

- Expo SDK 56 / React Native / Expo Router
- Supabase Auth + Postgres (profiles, decks, cards, quests, etc.)
- Brand: ACUMEN; default mascot: Auri (cat). Users can pick assistant style
  (cat / dog / icon / robot) — see `context/learning-ux.md`.

## AI deck generation (preferred path)

```
App → getAiApiUrl()
   → POST {aiApiUrl}/generate-deck
   → python-api FastAPI → deck_pipeline:
        context scrape
        → PLAN facts, then dual generate (OpenRouter / Groq gpt-oss / Gemini / Ollama / Pollinations)
        → judge on a different model
        → keep best N cards
        → enrich (study notes or quiz distractors)
        → save_deck
```

Fallback if Python is down: Supabase Edge Function `generate-deck` (same OpenRouter → Groq → Gemini → OpenAI order).

### Topic context scraping (`deck_pipeline/context.py`)

Order: TinyFish (needs `TINYFISH_API_KEY`, currently unset) → ScrapeGraphAI /
Crawl4AI (not installed) → **Wikipedia REST summary** → `model_knowledge`
fallback (no scraping at all, pure LLM). The scraper never visits arbitrary
domains from the topic string — a topic like `somesite.com` only gets a
Wikipedia lookup, which usually 404s, so those decks are pure model knowledge.

**Gotcha (fixed 2026-07-26):** Wikimedia 403s vague User-Agents. The UA must
follow their policy (app name/version, purpose, reachable link). A placeholder
like `contact@localhost` silently broke ALL Wikipedia context for weeks.

## Deck privacy (client-side, no RLS yet)

- `decks.created_by` is set for signed-in users (python-api + edge function);
  guest decks have `created_by = null`.
- `lib/decks.ts#fetchDecks` filters: signed-in → `.eq('created_by', userId)`;
  guests → `.in('id', <local registry>)` from `lib/ownDecks.ts` (deck ids
  registered at generation time in AsyncStorage).
- Deck-list cache is keyed per owner (`trivia:decks:list:<userId|guest>`) in
  `lib/cache/deckCache.ts` so account switches don't leak lists.
- Supabase RLS is NOT enabled on `decks`/`cards`; a crafted anon query could
  still read all rows. Add owner-based RLS before real launch.

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
| Study UX / assistant | `context/learning-ux.md` |
| Assistant picker | `constants/assistants.ts`, `contexts/AssistantContext.tsx` |
| Weak points / revision | `lib/weakPoints.ts` |

## Env

- Root `.env`: Expo public Supabase (+ optional `EXPO_PUBLIC_AI_API_URL`)
- `python-api/.env`: AI keys (`OPENROUTER_API_KEY` preferred for free-model pool),
  Groq/Gemini/OpenAI fallbacks, Supabase URL + anon + **service role**, `NGROK_DOMAIN`,
  `TINYFISH_API_KEY`

See `context/deck-generation.md` for scraper providers, reuse library, and the
issue/fix log for generation quality.
