"""Step 3 — LLM judge + heuristic filters (quiz-generator style quality gate)."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass

from .llm import llm_json
from .models import Card, DifficultyLevel
from .prompts import judge_system_prompt, judge_user_prompt

logger = logging.getLogger(__name__)


@dataclass
class JudgeResult:
    passed: bool
    avg_quality: float
    critique: str
    too_easy_count: int


def heuristic_too_basic(card: Card) -> bool:
    front = card.front.lower()
    words = [w for w in card.front.split() if w]

    if len(words) <= 3 and "?" not in card.front:
        return True
    if re.match(r"^(what is|who is|define|name the)\s", card.front, re.I) and len(words) <= 5:
        return True
    if "doctor's degree" in front or "what does a doctor" in front:
        return True
    if len(card.back.split()) <= 2 and len(card.back) < 20:
        return True
    return False


def heuristic_fail(cards: list[Card], difficulty: DifficultyLevel) -> JudgeResult | None:
    if difficulty == "easy":
        return None

    too_basic = sum(1 for c in cards if heuristic_too_basic(c))
    # Models often mis-label difficulty=1 even on decent content — only count
    # self-tags alongside truly trivial fronts, not as a hard fail alone.
    majority = max(1, len(cards) // 2)

    if difficulty == "hard" and too_basic >= majority:
        return JudgeResult(
            passed=False,
            avg_quality=3.0,
            critique=f"Heuristic fail: {too_basic}/{len(cards)} trivial cards.",
            too_easy_count=too_basic,
        )

    if difficulty == "medium" and too_basic >= max(4, majority):
        return JudgeResult(
            passed=False,
            avg_quality=4.0,
            critique=f"Heuristic fail: too many beginner cards ({too_basic}).",
            too_easy_count=too_basic,
        )
    return None


async def judge_cards(topic: str, difficulty: DifficultyLevel, cards: list[Card]) -> JudgeResult:
    early = heuristic_fail(cards, difficulty)
    if early and not early.passed:
        return early

    cards_json = json.dumps(
        [{"front": c.front, "back": c.back, "difficulty": c.difficulty} for c in cards],
        ensure_ascii=False,
    )

    try:
        payload = await llm_json(
            judge_system_prompt(),
            judge_user_prompt(topic, difficulty, cards_json),
            0.2,
            role="judge",
        )
        scores = payload.get("card_scores") or []
        avg = float(payload.get("avg_quality") or 0)
        if scores and not avg:
            avg = sum(float(s) for s in scores) / max(len(scores), 1)

        # attach scores
        for i, card in enumerate(cards):
            if i < len(scores):
                try:
                    card.quality_score = float(scores[i])
                except (TypeError, ValueError):
                    pass

        passed = bool(payload.get("pass"))
        too_easy = int(payload.get("too_easy_count") or 0)
        # Soft thresholds — hard should not brick usable decks from small models.
        if difficulty == "hard" and avg < 6.0:
            passed = False
        if difficulty == "medium" and avg < 5.5:
            passed = False
        # Majority-trivial still fails hard.
        if difficulty == "hard" and too_easy >= max(1, len(cards) // 2 + 1):
            passed = False

        return JudgeResult(
            passed=passed,
            avg_quality=round(avg, 2),
            critique=str(payload.get("critique") or ""),
            too_easy_count=too_easy,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM judge failed, using heuristics only: %s", exc)
        if early:
            return early
        # Soft pass if heuristics OK and judge unavailable
        return JudgeResult(
            passed=True,
            avg_quality=6.5,
            critique="Judge unavailable; heuristic gate passed.",
            too_easy_count=0,
        )
