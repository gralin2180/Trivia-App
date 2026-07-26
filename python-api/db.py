"""Save generated decks/cards into Supabase."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from deck_pipeline.models import Card


class DbError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _admin_client():
    from supabase import create_client

    url = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise DbError(
            "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in python-api/.env"
        )
    return create_client(url, key)


@lru_cache(maxsize=1)
def _anon_client():
    from supabase import create_client

    url = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
    anon = os.getenv("SUPABASE_ANON_KEY") or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not anon:
        raise DbError("Missing Supabase URL / anon key for auth verification.")
    return create_client(url, anon)


def verify_user_jwt(authorization: str | None) -> dict[str, Any]:
    """Return Supabase user dict from Bearer JWT."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise DbError("You must be signed in to generate a deck.")

    token = authorization.split(" ", 1)[1].strip()

    try:
        result = _anon_client().auth.get_user(token)
    except Exception as exc:  # noqa: BLE001 - any auth failure means "not signed in"
        raise DbError("Invalid session. Please sign in again.") from exc

    user = result.user
    if not user:
        raise DbError("Invalid session. Please sign in again.")
    return {"id": user.id, "email": user.email}


def save_deck(
    *,
    user_id: str,
    topic: str,
    difficulty: str,
    cards: list[Card],
    context_source: str = "python-pipeline",
) -> str:
    admin = _admin_client()
    trimmed = topic.strip()[:120]

    deck_res = (
        admin.table("decks")
        .insert(
            {
                "title": trimmed,
                "description": f"AI-generated {difficulty} deck for {trimmed} ({context_source}).",
                "category": "AI Topics",
                "topic": trimmed,
                "source": "ai",
                "created_by": user_id,
            }
        )
        .execute()
    )

    inserted = deck_res.data or []
    deck_id = inserted[0].get("id") if inserted else None
    if not deck_id:
        raise DbError("Could not save deck.")

    rows = [
        {
            "deck_id": deck_id,
            "front": card.front,
            "back": card.back,
            "order_index": card.order_index or (i + 1),
            "difficulty": card.difficulty,
        }
        for i, card in enumerate(cards)
    ]

    def discard_deck() -> None:
        try:
            admin.table("decks").delete().eq("id", deck_id).execute()
        except Exception:  # noqa: BLE001 - best effort cleanup
            pass

    try:
        cards_res = admin.table("cards").insert(rows).execute()
    except Exception as exc:  # noqa: BLE001
        discard_deck()
        raise DbError(f"Could not save cards: {exc}") from exc

    # An empty deck is worse than no deck, so roll back rather than return it.
    if not cards_res.data:
        discard_deck()
        raise DbError("Could not save cards.")

    return str(deck_id)
