"""Step 2 — card generation (ensemble + oversample, then pick the best)."""

from __future__ import annotations

import asyncio
import logging
import re

from .elo import DifficultyParams
from .llm import (
    LLMError,
    llm_json,
    reset_access_mode,
    reset_preferred_model,
    reset_request_keys,
    set_access_mode,
    set_preferred_model,
    set_request_keys,
)
from .models import Card, StudyMode
from .prompts import system_prompt, user_prompt

logger = logging.getLogger(__name__)

__all__ = [
    "LLMError",
    "set_request_keys",
    "reset_request_keys",
    "set_preferred_model",
    "reset_preferred_model",
    "set_access_mode",
    "reset_access_mode",
    "parse_cards",
    "enforce_level",
    "merge_unique_cards",
    "pick_best_cards",
    "generate_cards",
    "generate_card_pool",
]


def _norm_front(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]+", " ", (text or "").lower())).strip()


def parse_cards(payload: dict, target_level: int, limit: int = 20) -> list[Card]:
    cards: list[Card] = []
    for i, item in enumerate((payload.get("cards") or [])[:limit]):
        front = str(item.get("front") or "").strip()
        back = str(item.get("back") or "").strip()
        if not front or not back:
            continue
        try:
            level = int(item.get("difficulty") or target_level)
        except (TypeError, ValueError):
            level = target_level
        bloom = str(item.get("bloom_level") or "understand").lower()
        raw_opts = item.get("distractors") or item.get("wrong_answers") or []
        distractors = [str(x).strip() for x in raw_opts if str(x).strip()][:3]
        cards.append(
            Card(
                front=front,
                back=back,
                difficulty=max(1, min(3, level)),
                order_index=i + 1,
                bloom_level=bloom,
                distractors=distractors,
            )
        )
    return cards


def enforce_level(cards: list[Card], target_level: int) -> list[Card]:
    out: list[Card] = []
    for i, card in enumerate(cards):
        out.append(
            Card(
                front=card.front,
                back=card.back,
                difficulty=target_level,
                order_index=i + 1,
                quality_score=card.quality_score,
                bloom_level=card.bloom_level,
                source_hint=card.source_hint,
                distractors=list(card.distractors),
            )
        )
    return out


def merge_unique_cards(*groups: list[Card]) -> list[Card]:
    seen: set[str] = set()
    out: list[Card] = []
    for group in groups:
        for card in group:
            key = _norm_front(card.front)
            if not key or key in seen:
                continue
            seen.add(key)
            out.append(card)
    return out


def pick_best_cards(cards: list[Card], count: int, target_level: int) -> list[Card]:
    ranked = sorted(
        cards,
        key=lambda c: (c.quality_score, -abs(c.difficulty - target_level), -len(c.back)),
        reverse=True,
    )
    return enforce_level(ranked[:count], target_level)


def _drop_banned(
    cards: list[Card],
    avoid_questions: list[str] | None,
    retry_questions: list[str] | None,
) -> list[Card]:
    if not avoid_questions:
        return cards
    retry_ok = {_norm_front(q) for q in (retry_questions or []) if q} - {""}
    banned = {_norm_front(q) for q in avoid_questions if q} - retry_ok - {""}
    return [c for c in cards if _norm_front(c.front) not in banned]


async def generate_cards(
    topic: str,
    context_text: str,
    params: DifficultyParams,
    mode: StudyMode,
    custom_prompt: str = "",
    card_count: int = 10,
    override_user_prompt: str | None = None,
    avoid_questions: list[str] | None = None,
    retry_questions: list[str] | None = None,
    force_provider: str | None = None,
    min_cards: int = 4,
) -> list[Card]:
    sys = system_prompt(params, card_count)
    usr = override_user_prompt or user_prompt(
        topic,
        params,
        context_text,
        mode,
        custom_prompt,
        avoid_questions=avoid_questions,
        retry_questions=retry_questions,
    )
    payload = await llm_json(
        sys,
        usr,
        params.temperature,
        role="generate",
        force_provider=force_provider,
    )
    cards = parse_cards(payload, params.target_level, limit=max(12, card_count + 4))
    cards = _drop_banned(cards, avoid_questions, retry_questions)
    if len(cards) < min_cards:
        raise LLMError("AI did not generate enough cards")
    return cards


async def generate_card_pool(
    topic: str,
    context_text: str,
    params: DifficultyParams,
    mode: StudyMode,
    custom_prompt: str = "",
    card_count: int = 10,
    override_user_prompt: str | None = None,
    avoid_questions: list[str] | None = None,
    retry_questions: list[str] | None = None,
) -> list[Card]:
    """Run two generators in parallel (oversample), merge unique facts."""
    oversample = min(18, max(card_count + 4, int(card_count * 1.5)))
    alt_params = DifficultyParams(
        target_level=params.target_level,
        temperature=min(0.95, params.temperature + 0.12),
        bloom_focus=params.bloom_focus,
        complexity=params.complexity,
        ban_trivial=params.ban_trivial,
        require_full_questions=params.require_full_questions,
        distractor_plausibility=params.distractor_plausibility,
        elo_band=params.elo_band,
    )

    primary = generate_cards(
        topic=topic,
        context_text=context_text,
        params=params,
        mode=mode,
        custom_prompt=custom_prompt,
        card_count=oversample,
        override_user_prompt=override_user_prompt,
        avoid_questions=avoid_questions,
        retry_questions=retry_questions,
        min_cards=4,
    )

    # Second lane starts after we know who served the first... except gather is
    # parallel. Kick both: default router + a forced alternate if two keys exist.
    from .llm import available_providers

    present = [name for name, ok in available_providers().items() if ok]
    force_b = present[1] if len(present) > 1 else None

    if force_b is None:
        try:
            return await primary
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"AI did not generate enough cards ({exc})") from exc

    alt_prompt = override_user_prompt
    if alt_prompt is None:
        alt_prompt = (
            user_prompt(
                topic,
                alt_params,
                context_text,
                mode,
                custom_prompt,
                avoid_questions=avoid_questions,
                retry_questions=retry_questions,
            )
            + "\nCover DIFFERENT facts than a typical intro set. No duplicate angles."
        )

    secondary = generate_cards(
        topic=topic,
        context_text=context_text,
        params=alt_params,
        mode=mode,
        custom_prompt=custom_prompt,
        card_count=max(6, oversample // 2),
        override_user_prompt=alt_prompt,
        avoid_questions=avoid_questions,
        retry_questions=retry_questions,
        force_provider=force_b,
        min_cards=2,
    )

    results = await asyncio.gather(primary, secondary, return_exceptions=True)
    groups: list[list[Card]] = []
    errors: list[str] = []
    for result in results:
        if isinstance(result, Exception):
            errors.append(str(result))
            logger.warning("Ensemble lane failed: %s", result)
            continue
        groups.append(result)

    merged = merge_unique_cards(*groups)
    if len(merged) < 4:
        raise LLMError(
            "AI did not generate enough cards"
            + (f" ({' | '.join(errors)})" if errors else "")
        )
    logger.info("Ensemble merged %s unique cards from %s lanes", len(merged), len(groups))
    return merged
