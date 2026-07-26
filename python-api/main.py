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

from db import DbError, save_deck, verify_user_jwt
from deck_pipeline import (
    DEFAULT_ELO,
    GenerationRequest,
    PlayerProfile,
    apply_answer_feedback,
    run_deck_pipeline,
)

app = FastAPI(title="Trivia Deck AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "tinyfish": bool(os.getenv("TINYFISH_API_KEY")),
        },
        "supabase": bool(
            (os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL"))
            and os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        ),
    }


@app.post("/generate-deck")
async def generate_deck(
    body: GenerateBody,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    """Generate cards, save to Supabase, return deckId for the Expo app."""
    try:
        user = verify_user_jwt(authorization)
    except DbError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    custom = (body.customPrompt or body.custom_prompt or "").strip()
    elo = body.playerElo if body.playerElo is not None else body.player_elo
    use_web = body.useWebContext if body.useWebContext is not None else body.use_web_context

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
            )
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)[:400]) from exc

    try:
        deck_id = save_deck(
            user_id=user["id"],
            topic=body.topic,
            difficulty=body.difficulty,
            cards=result.cards,
            context_source=result.context_source,
        )
    except DbError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    payload = result.to_dict()
    payload["deckId"] = deck_id
    payload["cardCount"] = len(result.cards)
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
