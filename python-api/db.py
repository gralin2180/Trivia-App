"""Save generated decks/cards into Supabase + public deck reuse."""

from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any

from deck_pipeline.models import Card


class DbError(RuntimeError):
    pass


# Correct answers stay off the regenerate list this long, then may return.
QUESTION_COOLDOWN_DAYS = 10
# Same physical deck is not auto-reused for this caller until this long.
DECK_REUSE_COOLDOWN_DAYS = 45
# Unanswered cards (generated but never reviewed) stay banned this long.
UNREVIEWED_COOLDOWN_DAYS = 14


def topic_key(topic: str) -> str:
    """Normalise a topic for reuse lookup (samuelsalin.com == SamuelSalin.com)."""
    raw = topic.strip().lower()
    raw = re.sub(r"^https?://", "", raw)
    raw = re.sub(r"^www\.", "", raw)
    raw = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    return raw[:120] or "topic"


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


def _norm_question(text: str) -> str:
    """Collapse punctuation/case so near-identical fronts count as repeats."""
    raw = (text or "").lower().strip()
    raw = re.sub(r"[^a-z0-9\s]+", " ", raw)
    return re.sub(r"\s+", " ", raw).strip()


def _parse_ts(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        text = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(text)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _user_deck_activity(admin: Any, user_id: str) -> dict[str, datetime]:
    """deck_id → most recent time the user touched it (create / study / quiz)."""
    activity: dict[str, datetime] = {}

    def bump(deck_id: str, when: datetime | None) -> None:
        if not deck_id or not when:
            return
        prev = activity.get(deck_id)
        if prev is None or when > prev:
            activity[deck_id] = when

    try:
        owned = (
            admin.table("decks")
            .select("id, created_at")
            .eq("created_by", user_id)
            .execute()
        )
        for row in owned.data or []:
            bump(str(row.get("id") or ""), _parse_ts(row.get("created_at")))
    except Exception:  # noqa: BLE001
        pass

    for table, ts_col in (
        ("study_sessions", "started_at"),
        ("quiz_attempts", "completed_at"),
    ):
        try:
            rows = (
                admin.table(table)
                .select(f"deck_id, {ts_col}")
                .eq("user_id", user_id)
                .execute()
            )
            for row in rows.data or []:
                bump(str(row.get("deck_id") or ""), _parse_ts(row.get(ts_col)))
        except Exception:  # noqa: BLE001
            continue
    return activity


def _topic_deck_ids(admin: Any, user_id: str, key: str) -> list[str]:
    activity = _user_deck_activity(admin, user_id)
    if not activity:
        return []
    ids = list(activity.keys())[:120]
    try:
        res = (
            admin.table("decks")
            .select("id")
            .in_("id", ids)
            .eq("topic_key", key)
            .execute()
        )
        return [str(r["id"]) for r in (res.data or []) if r.get("id")]
    except Exception:  # noqa: BLE001
        return []


def _cards_for_decks(admin: Any, deck_ids: list[str]) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    for i in range(0, len(deck_ids), 40):
        chunk = deck_ids[i : i + 40]
        try:
            res = (
                admin.table("cards")
                .select("id, front, created_at, deck_id")
                .in_("deck_id", chunk)
                .execute()
            )
            cards.extend(res.data or [])
        except Exception:  # noqa: BLE001
            continue
    return cards


def _latest_reviews_by_card(
    admin: Any, user_id: str, card_ids: list[str]
) -> dict[str, dict[str, Any]]:
    """card_id → latest review row for this user."""
    latest: dict[str, dict[str, Any]] = {}
    for i in range(0, len(card_ids), 40):
        chunk = card_ids[i : i + 40]
        try:
            res = (
                admin.table("card_reviews")
                .select("card_id, was_correct, reviewed_at")
                .eq("user_id", user_id)
                .in_("card_id", chunk)
                .order("reviewed_at", desc=True)
                .execute()
            )
        except Exception:  # noqa: BLE001
            continue
        for row in res.data or []:
            cid = str(row.get("card_id") or "")
            if cid and cid not in latest:
                latest[cid] = row
    return latest


def question_memory_for_caller(
    *,
    user_id: str | None,
    topic: str,
) -> dict[str, list[str]]:
    """
    Spaced memory for regenerate:

    - avoid: correctly answered recently, or freshly generated & never reviewed
    - retry: latest answer was wrong → prefer bringing these back
    - Cool correct answers older than QUESTION_COOLDOWN_DAYS are free to repeat
    """
    empty: dict[str, list[str]] = {"avoid": [], "retry": []}
    if not user_id:
        return empty

    admin = _admin_client()
    key = topic_key(topic)
    deck_ids = _topic_deck_ids(admin, user_id, key)
    if not deck_ids:
        return empty

    cards = _cards_for_decks(admin, deck_ids)
    if not cards:
        return empty

    card_ids = [str(c["id"]) for c in cards if c.get("id")]
    reviews = _latest_reviews_by_card(admin, user_id, card_ids)
    now = datetime.now(timezone.utc)
    correct_cutoff = now - timedelta(days=QUESTION_COOLDOWN_DAYS)
    unreviewed_cutoff = now - timedelta(days=UNREVIEWED_COOLDOWN_DAYS)

    avoid: set[str] = set()
    retry: set[str] = set()

    for card in cards:
        front = _norm_question(str(card.get("front") or ""))
        if not front:
            continue
        cid = str(card.get("id") or "")
        review = reviews.get(cid)

        if review:
            was_correct = bool(review.get("was_correct"))
            reviewed_at = _parse_ts(review.get("reviewed_at")) or now
            if not was_correct:
                # Missed it — bring it back for practice (not banned).
                retry.add(front)
                continue
            # Got it right: ban only while still inside the long cooldown.
            if reviewed_at >= correct_cutoff:
                avoid.add(front)
            continue

        created = _parse_ts(card.get("created_at")) or now
        if created >= unreviewed_cutoff:
            avoid.add(front)

    return {
        "avoid": sorted(avoid)[:40],
        "retry": sorted(retry)[:12],
    }


def known_questions_for_caller(
    *,
    user_id: str | None,
    topic: str,
) -> list[str]:
    """Back-compat: fronts currently banned from regenerate."""
    return question_memory_for_caller(user_id=user_id, topic=topic)["avoid"]


def _deck_card_fronts(admin: Any, deck_id: str) -> list[str]:
    try:
        res = (
            admin.table("cards")
            .select("front")
            .eq("deck_id", deck_id)
            .execute()
        )
    except Exception:  # noqa: BLE001
        return []
    return [_norm_question(str(r.get("front") or "")) for r in (res.data or []) if r.get("front")]


def _overlap_ratio(candidate_fronts: list[str], known: set[str]) -> float:
    usable = [f for f in candidate_fronts if f]
    if not usable:
        return 1.0
    hits = sum(1 for f in usable if f in known)
    return hits / len(usable)


# Guests: deck ids handed out recently (in-process), with timestamps for cooldown.
_GUEST_SEEN_DECKS: dict[str, dict[str, datetime]] = {}


def find_reusable_deck(
    topic: str,
    difficulty: str,
    *,
    user_id: str | None = None,
    guest_id: str | None = None,
    max_question_overlap: float = 0.30,
) -> dict[str, Any] | None:
    """
    Reuse a public deck only when:
    - this caller hasn't received that deck within DECK_REUSE_COOLDOWN_DAYS, and
    - its questions don't mostly overlap currently-banned fronts
      (wrong answers and long-cooled correct answers are free to overlap).
    """
    admin = _admin_client()
    key = topic_key(topic)
    now = datetime.now(timezone.utc)
    deck_cutoff = now - timedelta(days=DECK_REUSE_COOLDOWN_DAYS)

    excluded: set[str] = set()
    banned_fronts: set[str] = set()

    if user_id:
        activity = _user_deck_activity(admin, user_id)
        excluded = {
            deck_id
            for deck_id, when in activity.items()
            if when >= deck_cutoff
        }
        banned_fronts = set(
            question_memory_for_caller(user_id=user_id, topic=topic)["avoid"]
        )
    elif guest_id:
        seen = _GUEST_SEEN_DECKS.get(guest_id, {})
        excluded = {
            deck_id for deck_id, when in seen.items() if when >= deck_cutoff
        }

    try:
        res = (
            admin.table("decks")
            .select(
                "id, title, topic, difficulty, reuse_count, context_source, "
                "created_at, created_by"
            )
            .eq("is_public", True)
            .eq("source", "ai")
            .eq("topic_key", key)
            .eq("difficulty", difficulty)
            .order("reuse_count", desc=True)
            .order("created_at", desc=True)
            .limit(12)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise DbError(f"Reuse lookup failed: {exc}") from exc

    for row in res.data or []:
        deck_id = str(row.get("id") or "")
        if not deck_id or deck_id in excluded:
            continue
        # Don't auto-reuse own brand-new deck; after cooldown it's fine.
        if user_id and row.get("created_by") and str(row["created_by"]) == user_id:
            created = _parse_ts(row.get("created_at"))
            if created and created >= deck_cutoff:
                continue

        fronts = _deck_card_fronts(admin, deck_id)
        if len(fronts) < 4:
            continue
        if banned_fronts and _overlap_ratio(fronts, banned_fronts) > max_question_overlap:
            continue

        return row

    return None


def mark_deck_seen(*, user_id: str | None, guest_id: str | None, deck_id: str) -> None:
    """Record that this caller received a reused deck (guests are in-memory)."""
    if guest_id:
        _GUEST_SEEN_DECKS.setdefault(guest_id, {})[deck_id] = datetime.now(timezone.utc)


def bump_reuse(deck_id: str) -> None:
    admin = _admin_client()
    try:
        row = (
            admin.table("decks")
            .select("reuse_count")
            .eq("id", deck_id)
            .limit(1)
            .execute()
        )
        current = 0
        if row.data:
            current = int(row.data[0].get("reuse_count") or 0)
        admin.table("decks").update({"reuse_count": current + 1}).eq("id", deck_id).execute()
    except Exception:  # noqa: BLE001 - reuse count is best-effort
        pass


def list_public_decks(limit: int = 24) -> list[dict[str, Any]]:
    admin = _admin_client()
    try:
        res = (
            admin.table("decks")
            .select(
                "id, title, topic, description, difficulty, reuse_count, "
                "context_source, created_at, cards(count)"
            )
            .eq("is_public", True)
            .eq("source", "ai")
            .order("created_at", desc=True)
            .limit(max(1, min(limit, 50)))
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        raise DbError(f"Could not list public decks: {exc}") from exc

    out: list[dict[str, Any]] = []
    for row in res.data or []:
        count_raw = row.get("cards") or [{"count": 0}]
        card_count = 0
        if isinstance(count_raw, list) and count_raw:
            card_count = int(count_raw[0].get("count") or 0)
        out.append(
            {
                "id": row["id"],
                "title": row.get("title") or row.get("topic") or "Untitled",
                "topic": row.get("topic"),
                "description": row.get("description"),
                "difficulty": row.get("difficulty") or "medium",
                "reuseCount": int(row.get("reuse_count") or 0),
                "contextSource": row.get("context_source"),
                "createdAt": row.get("created_at"),
                "cardCount": card_count,
            }
        )
    return out


def save_deck(
    *,
    user_id: str | None,
    topic: str,
    difficulty: str,
    cards: list[Card],
    context_source: str = "python-pipeline",
    is_public: bool = True,
    study_notes: list[str] | None = None,
) -> str:
    from deck_pipeline.enrich import encode_back, format_study_notes_block

    admin = _admin_client()
    trimmed = topic.strip()[:120]
    key = topic_key(trimmed)

    description = f"AI-generated {difficulty} deck for {trimmed} ({context_source})."
    notes_block = format_study_notes_block(study_notes or [])
    if notes_block:
        description = f"{description}\n\n{notes_block}"

    row: dict[str, Any] = {
        "title": trimmed,
        "description": description,
        "category": "AI Topics",
        "topic": trimmed,
        "topic_key": key,
        "source": "ai",
        "difficulty": difficulty,
        "is_public": is_public,
        "context_source": context_source,
        "reuse_count": 0,
    }
    if user_id:
        row["created_by"] = user_id

    deck_res = admin.table("decks").insert(row).execute()

    inserted = deck_res.data or []
    deck_id = inserted[0].get("id") if inserted else None
    if not deck_id:
        raise DbError("Could not save deck.")

    rows = [
        {
            "deck_id": deck_id,
            "front": card.front,
            "back": encode_back(card.back, card.distractors),
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

    if not cards_res.data:
        discard_deck()
        raise DbError("Could not save cards.")

    return str(deck_id)
