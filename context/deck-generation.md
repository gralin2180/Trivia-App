# Deck generation — issues, solutions, APIs

Living notes for the AI deck pipeline. Update this whenever we hit a gen/scraper
bug or add a provider. **Never put secrets here.**

## Pipeline (happy path)

```
topic
  → reuse lookup
  → gather_topic_context
  → PLAN facts (slower thinking pass)
  → dual LLM generate (OSS models in parallel)
  → judge on a different model
  → keep best N + enrich
  → save_deck
```

Key files:

| Area | Path |
|------|------|
| LLM router | `python-api/deck_pipeline/llm.py` |
| Ensemble generate | `python-api/deck_pipeline/generate.py` |
| Enrich (notes / MCQ) | `python-api/deck_pipeline/enrich.py` |
| Context / scraper | `python-api/deck_pipeline/context.py` |
| Judge | `python-api/deck_pipeline/judge.py` |
| Prompts | `python-api/deck_pipeline/prompts.py` |
| Orchestration | `python-api/deck_pipeline/pipeline.py` |
| Save / reuse | `python-api/db.py` |
| HTTP API | `python-api/main.py` |
| Client call | `lib/ai/generateDeck.ts` |
| Global library UI | `components/decks/GlobalDecks.tsx` |

## Configured server keys (`python-api/.env`)

| Env var | Role | Status |
|---------|------|--------|
| `OPENROUTER_API_KEY` | Free-model pool (Nemotron Lightning/Ultra, `openrouter/free`) | **Add this** — https://openrouter.ai/keys |
| `GROQ_API_KEY` | OSS models: `openai/gpt-oss-120b`, `gpt-oss-20b`, Qwen 3.6 | In use |
| `GEMINI_API_KEY` | Parallel generate lane + judge fallback | In use |
| `OPENAI_API_KEY` | Paid quality fallback | Optional |
| *(none)* | **Ollama** at `127.0.0.1:11434` if installed | Keyless |
| *(none)* | **Pollinations** public OSS gateway | Keyless, may 402 |
| `TINYFISH_API_KEY` | Free web Search + Fetch | In use |

User BYOK (Settings → AI API keys) overrides server keys per request via
`X-Acumen-*-Key` headers, including `X-Acumen-Openrouter-Key`.

## Why this is much stronger than the old 8B single call

Old path: one `llama-3.1-8b-instant` JSON call.

New path:
1. Two generators in parallel (different providers / temperatures), merge unique facts.
2. Judge scores every card; we drop the weak ones and keep ~10.
3. Extra enrich pass: real MCQ distractors, or teaching bullets for study.
4. OpenRouter `:free` models (Nemotron-class) when `OPENROUTER_API_KEY` is set.

## Recommended APIs

| Provider | Why | Where |
|----------|-----|-------|
| OpenRouter `:free` | Nemotron 3.5 Lightning, Ultra, auto `openrouter/free` | Primary |
| Groq 70B | Fast parallel lane | Have it |
| Gemini Flash | Parallel lane / judge | Have it |
| TinyFish Search + Fetch | Real page markdown | Have it |
| OpenAI mini | Paid polish | Optional |

**Nice upgrades (optional)**

| Provider | Why | Notes |
|----------|-----|-------|
| Tavily Search | Clean research snippets for agents | Free tier; env `TAVILY_API_KEY` (not wired yet) |
| Brave Search | Independent web index | Free tier; env `BRAVE_API_KEY` (not wired yet) |
| Serper / SerpAPI | Google-quality SERP | Paid; only if TinyFish gaps |
| Firecrawl / Jina Reader | Alt URL→markdown | Backup if TinyFish Fetch fails |
| Anthropic Claude | Excellent judge / hard cards | Paid; optional 4th LLM |

While the Python API thinks, the Generate screen shows **Hop** (tap-to-jump runner)
so waiting is playable. See `components/generate/WaitGame.tsx`.

## Global library (reuse)

- Columns on `decks`: `is_public`, `topic_key`, `difficulty`, `reuse_count`, `context_source`
  (migration `006_global_decks.sql`).
- New AI decks default to `is_public=true` so others can browse them in **Global library**.
- Auto-reuse on `POST /generate-deck` is **strict but spaced**:
  1. Same deck is not re-handed within **45 days** (created / studied / quizzed).
  2. Candidate public decks are scanned; reuse only if overlap vs *currently banned*
     fronts is ≤ 30%.
  3. If nothing qualifies → full LLM generate.
  4. Question memory (`card_reviews`):
     - **Wrong** → not banned; new decks are asked to include 2–4 of them again.
     - **Correct** → banned for **10 days**, then free to repeat.
     - **Never reviewed** → banned for **14 days** so regen doesn't instantly clone.

### 2026-07-26 — Blind topic reuse gave same deck to same user

- **Symptom:** Regenerating the same topic+difficulty returned the identical deck.
- **Fix:** Per-caller exclusions + question-overlap gate; ban list on new generation.

### 2026-07-26 — Allow long-term + wrong-answer repeats

- **Request:** Questions may repeat after a long time; wrong answers should come back.
- **Fix:** Spaced memory in `db.question_memory_for_caller` + `retry_questions` in prompts.

### 2026-08-20 — OpenRouter free-model pool + parallel generate/judge/enrich

- **Request:** Use OpenRouter-style free models (Nemotron etc.) so study/quiz
  generation can use much more model capacity.
- **Fix:** `llm.py` router (OpenRouter `:free` → Groq 70B → Gemini → OpenAI);
  dual generate; cross-model judge; study-note / quiz-distractor enrich.
  Add `OPENROUTER_API_KEY` in `python-api/.env` (free at openrouter.ai/keys).

### 2026-08-26 — OpenCode-style model picker + wide fallback chain

- Settings → **AI models**: pick Nemotron / Gemma / Auto free pool; access mode
  (builtin pool, your API key, local Ollama).
- Python `llm.py` walks 14+ OpenRouter `:free` models before Groq / Ollama /
  Pollinations. `X-Acumen-Preferred-Model` + `X-Acumen-Access-Mode` headers.
- **Not** OpenCode: no ChatGPT Plus browser login; Hy3/Big Pickle are OpenCode-only.

- Groq Llama 3.1/3.3 IDs deprecated (2026-08-16). Generate uses `openai/gpt-oss-120b`,
  `openai/gpt-oss-20b`, and `qwen/qwen3.6-27b`, with Llama IDs only as last resort.
- Keyless fallbacks: local **Ollama** (any pulled OSS model) and **Pollinations** aliases.
- Extra **plan facts** pass before writing cards (intentionally slower).
- Generate UI: **Hop** tap-to-jump game while waiting (`WaitGame.tsx`).

### 2026-07-26 — Wikipedia 403 for every topic

- **Symptom:** Context source always `model_knowledge`; decks invented facts.
- **Cause:** Wikimedia blocked vague UA (`TriviaApp/1.0 … contact@localhost`).
- **Fix:** Compliant UA in `context.py` (`AcumenFlashcards/1.0` + purpose + project link).

### 2026-07-26 — `samuelsalin.com` had zero scraped content

- **Symptom:** Topic treated as model-only; TinyFish/Crawl not configured.
- **Cause:** No TinyFish key on disk; scraper never visited the domain (wiki 404).
- **Fix:** Save `TINYFISH_API_KEY`; add **direct URL fetch** when topic looks like a
  domain; merge TinyFish + DuckDuckGo + wiki; probe script `scraper_probe.py`.

### 2026-07-26 — TinyFish/Gemini keys "added" but not loaded

- **Symptom:** Health showed `tinyfish: false`, `gemini: false`.
- **Cause:** Keys lived in unsaved editor buffer / empty values on disk; `.env` had UTF-8 BOM.
- **Fix:** Rewrite `python-api/.env` without BOM; verify with probe + `/health`.

### 2026-07-26 — Gemini model 1.5-flash stale / AQ. keys

- **Symptom:** Gemini path unused or failing on older model IDs.
- **Fix:** Try `gemini-2.5-flash` → `2.0-flash` → `1.5-flash`; send `x-goog-api-key`
  header (works with new `AQ.` auth keys). Client soft-validates `AIza` or `AQ.`.

### 2026-07-26 — Quiz answer options repeating

- **Cause:** Distractors sampled from other card backs without dedupe.
- **Fix:** `lib/quiz.ts` normalises + dedupes answers before building options.

### 2026-07-26 — Decks leaked across Gmail accounts

- **Cause:** Client fetched all decks; RLS was `SELECT true` for authenticated.
- **Fix:** Client filters by `created_by`; RLS now `is_public OR created_by = auth.uid()`;
  per-owner deck list cache keys.

### 2026-07-26 — Hard decks failed judge too often

- **Fix:** Softer judge thresholds + accept imperfect hard after one retry
  (see `judge.py` / `pipeline.py`).

## How to test (web only)

```powershell
# After scraper/API changes, restart so .env reloads:
# (kill port 8000 — supervisor restart, or scripts/start-server.ps1)

.\python-api\.venv\Scripts\python.exe python-api\scraper_probe.py "samuelsalin.com"
curl.exe -s -H "ngrok-skip-browser-warning: true" https://unexpired-estimator-clutter.ngrok-free.dev/health
npm run build:web   # then restart API so dist/ remounts
```

Do **not** build APKs unless explicitly asked — iterate on the ngrok web app.
