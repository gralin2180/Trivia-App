"""
FastAPI entry for Python AI deck generation.

Run:
  cd python-api
  py -m venv .venv
  .\\.venv\\Scripts\\activate
  pip install -r requirements.txt
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Load python-api/.env then project root .env (override so local API secrets win)
_API_DIR = Path(__file__).resolve().parent
load_dotenv(_API_DIR / ".env", override=True)
load_dotenv(_API_DIR.parent / ".env", override=False)

from db import (
    DbError,
    bump_reuse,
    find_reusable_deck,
    list_public_decks,
    mark_deck_seen,
    question_memory_for_caller,
    save_deck,
    verify_user_jwt,
)
from deck_pipeline import (
    DEFAULT_ELO,
    GenerationRequest,
    PlayerProfile,
    apply_answer_feedback,
    reset_access_mode,
    reset_preferred_model,
    reset_request_keys,
    run_deck_pipeline,
    set_access_mode,
    set_preferred_model,
    set_request_keys,
)
from deck_pipeline.llm import builtin_model_catalog, fallback_chain_summary

app = FastAPI(title="Trivia Deck AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Soft in-memory guest generation caps (per process). Client also enforces 3.
_GUEST_GENS: dict[str, int] = {}
_GUEST_SERVER_CAP = 3


def _guest_allowed(guest_id: str) -> bool:
    return _GUEST_GENS.get(guest_id, 0) < _GUEST_SERVER_CAP


def _guest_bump(guest_id: str) -> int:
    _GUEST_GENS[guest_id] = _GUEST_GENS.get(guest_id, 0) + 1
    return _GUEST_GENS[guest_id]


class GenerateBody(BaseModel):
    topic: str = Field(min_length=2, max_length=120)
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    mode: Literal["study", "quiz"] = "study"
    custom_prompt: str = ""
    customPrompt: str | None = None  # camelCase from Expo
    card_count: int = Field(default=10, ge=4, le=20)
    player_elo: float | None = None
    playerElo: float | None = None
    use_web_context: bool = True
    useWebContext: bool | None = None
    # Prefer an existing public deck for the same topic+difficulty when available.
    reuse_existing: bool = True
    reuseExisting: bool | None = None
    # New decks join the global library by default so others can reuse them.
    make_public: bool = True
    makePublic: bool | None = None


class FeedbackBody(BaseModel):
    user_id: str
    topic: str
    elo: float = DEFAULT_ELO
    games_played: int = 0
    recent_accuracy: float = 0.5
    card_difficulty: int = Field(ge=1, le=3)
    correct: bool


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "providers": {
            "openrouter": bool(os.getenv("OPENROUTER_API_KEY")),
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "pollinations": True,
            "ollama": bool(os.getenv("OLLAMA_HOST")),
        },
        "accessModes": ["builtin", "device_key", "local_ollama"],
        "builtinModels": builtin_model_catalog(),
        "fallbackChains": fallback_chain_summary(),
        "scrapers": {
            "tinyfish": bool(os.getenv("TINYFISH_API_KEY")),
            "duckduckgo": True,
            "wikipedia": True,
            "http_direct": True,
        },
        "supabase": bool(
            (os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL"))
            and os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        ),
    }


@app.get("/public-decks")
async def public_decks(limit: int = 24) -> dict[str, Any]:
    """Recent AI decks shared in the global library (no LLM cost to open)."""
    try:
        decks = list_public_decks(limit=limit)
    except DbError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"decks": decks, "count": len(decks)}


@app.post("/generate-deck")
async def generate_deck(
    body: GenerateBody,
    authorization: str | None = Header(default=None),
    x_acumen_guest_id: str | None = Header(default=None, alias="X-Acumen-Guest-Id"),
    x_acumen_groq_key: str | None = Header(default=None, alias="X-Acumen-Groq-Key"),
    x_acumen_openai_key: str | None = Header(default=None, alias="X-Acumen-Openai-Key"),
    x_acumen_gemini_key: str | None = Header(default=None, alias="X-Acumen-Gemini-Key"),
    x_acumen_openrouter_key: str | None = Header(default=None, alias="X-Acumen-Openrouter-Key"),
    x_acumen_preferred_model: str | None = Header(default=None, alias="X-Acumen-Preferred-Model"),
    x_acumen_access_mode: str | None = Header(default=None, alias="X-Acumen-Access-Mode"),
) -> dict[str, Any]:
    """Generate cards, save to Supabase, return deckId for the Expo app.

    Guests may call this with X-Acumen-Guest-Id when they have no session yet
    (up to a soft server cap). Signed-in users use Authorization: Bearer.

    Callers may also send their own provider keys (X-Acumen-*-Key). Those are
    used for this request only and never persisted.

    When reuse_existing is true (default), we may return a *different* public
    deck for the same topic only if this user/guest has never received it and
    its questions do not substantially overlap ones they already have.
    """
    user_id: str | None = None
    guest_id: str | None = None
    try:
        user = verify_user_jwt(authorization)
        user_id = str(user["id"])
    except DbError:
        guest = (x_acumen_guest_id or "").strip()
        if len(guest) < 8 or len(guest) > 80:
            raise HTTPException(
                status_code=401,
                detail="Sign in or continue as guest to generate a deck.",
            ) from None
        if not _guest_allowed(guest):
            raise HTTPException(
                status_code=403,
                detail="Free guest generations used up. Create a free account to continue.",
            )
        user_id = None
        guest_id = guest

    custom = (body.customPrompt or body.custom_prompt or "").strip()
    elo = body.playerElo if body.playerElo is not None else body.player_elo
    use_web = body.useWebContext if body.useWebContext is not None else body.use_web_context
    reuse = body.reuseExisting if body.reuseExisting is not None else body.reuse_existing
    make_public = body.makePublic if body.makePublic is not None else body.make_public

    # Custom prompts change what the deck should teach — never reuse a generic one.
    # Same user never gets the same deck; questions must be mostly new.
    if reuse and not custom:
        existing = find_reusable_deck(
            body.topic,
            body.difficulty,
            user_id=user_id,
            guest_id=guest_id,
        )
        if existing:
            deck_id = str(existing["id"])
            bump_reuse(deck_id)
            mark_deck_seen(user_id=user_id, guest_id=guest_id, deck_id=deck_id)
            return {
                "deckId": deck_id,
                "cardCount": 0,
                "reused": True,
                "difficulty": body.difficulty,
                "contextSource": existing.get("context_source") or "library",
                "contextChars": 0,
                "retries": 0,
                "judgePassed": True,
                "params": {
                    "reusedFrom": deck_id,
                    "reuseCount": existing.get("reuse_count"),
                },
            }

    keys_token = set_request_keys(
        {
            "openrouter": x_acumen_openrouter_key or "",
            "groq": x_acumen_groq_key or "",
            "openai": x_acumen_openai_key or "",
            "gemini": x_acumen_gemini_key or "",
        }
    )
    model_token = set_preferred_model(x_acumen_preferred_model or "")
    mode_token = set_access_mode(x_acumen_access_mode or "builtin")

    memory = question_memory_for_caller(user_id=user_id, topic=body.topic)

    try:
        result = await run_deck_pipeline(
            GenerationRequest(
                topic=body.topic,
                difficulty=body.difficulty,
                mode=body.mode,
                custom_prompt=custom,
                card_count=body.card_count,
                player_elo=elo,
                use_web_context=use_web,
                avoid_questions=memory["avoid"],
                retry_questions=memory["retry"],
            )
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)[:400]) from exc
    finally:
        reset_request_keys(keys_token)
        reset_preferred_model(model_token)
        reset_access_mode(mode_token)

    try:
        deck_id = save_deck(
            user_id=user_id,
            topic=body.topic,
            difficulty=body.difficulty,
            cards=result.cards,
            context_source=result.context_source,
            is_public=make_public,
            study_notes=result.study_notes,
        )
    except DbError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    mark_deck_seen(user_id=user_id, guest_id=guest_id, deck_id=deck_id)

    if user_id is None and guest_id:
        _guest_bump(guest_id)

    payload = result.to_dict()
    payload["deckId"] = deck_id
    payload["cardCount"] = len(result.cards)
    payload["reused"] = False
    return payload


@app.post("/feedback")
async def feedback(body: FeedbackBody) -> dict[str, Any]:
    profile = PlayerProfile(
        user_id=body.user_id,
        topic=body.topic,
        elo=body.elo,
        games_played=body.games_played,
        recent_accuracy=body.recent_accuracy,
    )
    updated = apply_answer_feedback(profile, body.card_difficulty, body.correct)
    return updated.to_dict()


# --- Expo web app -----------------------------------------------------------
# Serving `dist/` here means the browser app and the API share one origin (and
# one tunnel). Build it with: npx expo export --platform web
# Registered last so the catch-all never shadows the API routes above.

_WEB_DIR = _API_DIR.parent / "dist"
_WEB_INDEX = _WEB_DIR / "index.html"

if _WEB_INDEX.is_file():
    # Hashed filenames, so they can be cached hard.
    app.mount(
        "/_expo",
        StaticFiles(directory=_WEB_DIR / "_expo"),
        name="expo-bundles",
    )
    app.mount(
        "/assets",
        StaticFiles(directory=_WEB_DIR / "assets"),
        name="expo-assets",
    )

    @app.get("/{requested_path:path}", include_in_schema=False)
    async def serve_web_app(requested_path: str) -> FileResponse:
        """Serve a real file when it exists, else index.html for SPA routes."""
        candidate = (_WEB_DIR / requested_path).resolve()
        if candidate.is_file() and candidate.is_relative_to(_WEB_DIR.resolve()):
            return FileResponse(candidate)
        return FileResponse(_WEB_INDEX)
