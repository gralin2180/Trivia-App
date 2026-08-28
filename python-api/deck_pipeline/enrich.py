"""Extra LLM passes that use spare free-model capacity.

Quiz: plausible wrong answers per card (not recycled backs).
Study: teaching bullets that become the pre-question notes.
"""

from __future__ import annotations

import json
import logging
import re

from .llm import llm_json
from .models import Card, StudyMode
from .prompts import study_notes_system_prompt, study_notes_user_prompt
from .prompts import quiz_distractor_system_prompt, quiz_distractor_user_prompt

logger = logging.getLogger(__name__)

DISTRACTOR_MARK = "\n\n⟦ACUMEN_D⟧"
NOTES_HEADING = "What you'll learn:"


def encode_back(answer: str, distractors: list[str] | None) -> str:
    clean = (answer or "").strip()
    opts = [d.strip() for d in (distractors or []) if d.strip() and d.strip() != clean]
    if len(opts) < 2:
        return clean
    return clean + DISTRACTOR_MARK + json.dumps(opts[:3], ensure_ascii=False)


def decode_back(stored: str) -> tuple[str, list[str]]:
    raw = stored or ""
    if DISTRACTOR_MARK not in raw:
        return raw.strip(), []
    answer, blob = raw.split(DISTRACTOR_MARK, 1)
    try:
        parsed = json.loads(blob)
        if isinstance(parsed, list):
            opts = [str(x).strip() for x in parsed if str(x).strip()]
            return answer.strip(), opts[:3]
    except Exception:  # noqa: BLE001
        pass
    return answer.strip(), []


def format_study_notes_block(notes: list[str]) -> str:
    lines = [n.strip().lstrip("•- ") for n in notes if n and n.strip()]
    if not lines:
        return ""
    body = "\n".join(f"• {line}" for line in lines[:10])
    return f"{NOTES_HEADING}\n{body}"


def parse_study_notes_block(description: str | None) -> list[str]:
    text = (description or "").strip()
    if NOTES_HEADING not in text:
        return []
    tail = text.split(NOTES_HEADING, 1)[1]
    notes: list[str] = []
    for line in tail.splitlines():
        cleaned = re.sub(r"^[•\-\*]\s*", "", line).strip()
        if cleaned:
            notes.append(cleaned)
    return notes


async def enrich_quiz_distractors(topic: str, cards: list[Card]) -> list[Card]:
    if not cards:
        return cards
    payload_cards = [{"front": c.front, "back": c.back} for c in cards]
    try:
        data = await llm_json(
            quiz_distractor_system_prompt(),
            quiz_distractor_user_prompt(topic, json.dumps(payload_cards, ensure_ascii=False)),
            temperature=0.55,
            role="enrich",
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Quiz distractor enrich failed: %s", exc)
        return cards

    by_front: dict[str, list[str]] = {}
    for item in data.get("items") or data.get("cards") or []:
        front = str(item.get("front") or "").strip().lower()
        opts = [str(x).strip() for x in (item.get("distractors") or []) if str(x).strip()]
        if front and opts:
            by_front[front] = opts[:3]

    for card in cards:
        opts = by_front.get(card.front.strip().lower())
        if opts:
            answer_key = card.back.strip().lower()
            card.distractors = [o for o in opts if o.strip().lower() != answer_key][:3]
    return cards


async def enrich_study_notes(
    topic: str,
    cards: list[Card],
    custom_prompt: str = "",
    mode: StudyMode = "study",
) -> list[str]:
    if mode != "study" or not cards:
        return []
    payload_cards = [{"front": c.front, "back": c.back} for c in cards[:14]]
    try:
        data = await llm_json(
            study_notes_system_prompt(),
            study_notes_user_prompt(
                topic,
                json.dumps(payload_cards, ensure_ascii=False),
                custom_prompt,
            ),
            temperature=0.4,
            role="enrich",
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Study-note enrich failed: %s", exc)
        return []

    bullets = [str(x).strip() for x in (data.get("bullets") or data.get("notes") or []) if str(x).strip()]
    return bullets[:10]
