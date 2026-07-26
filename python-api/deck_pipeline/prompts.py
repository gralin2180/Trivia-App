"""Prompt builders for generate + judge steps."""

from __future__ import annotations

from .elo import DifficultyParams
from .models import DifficultyLevel, StudyMode


def system_prompt(params: DifficultyParams, card_count: int) -> str:
    return " ".join(
        [
            f'Return JSON only: {{"cards":[{{"front":"question","back":"answer","difficulty":{params.target_level},"bloom_level":"understand"}}]}}.',
            f"Exactly {card_count} cards.",
            "difficulty 1=easy, 2=medium, 3=hard.",
            "bloom_level one of: remember, understand, apply, analyze, evaluate.",
            "Use ONLY the provided context when possible; invent nothing that contradicts it.",
            "Front must teach something specific. Back is a short precise answer.",
        ]
    )


def user_prompt(
    topic: str,
    params: DifficultyParams,
    context_text: str,
    mode: StudyMode,
    custom_prompt: str = "",
) -> str:
    mode_hint = (
        "These cards will become multiple-choice quiz items — answers must be crisp and distinct."
        if mode == "quiz"
        else "These cards are for flashcard study — concise front/back pairs."
    )
    custom = f"\nLearner instructions: {custom_prompt.strip()[:500]}" if custom_prompt.strip() else ""
    ctx = context_text.strip()[:10000]

    return (
        f"Topic: {topic}\n"
        f"{params.as_prompt_block()}\n"
        f"{mode_hint}{custom}\n\n"
        f"=== CONTEXT (use this) ===\n{ctx}\n=== END CONTEXT ===\n\n"
        "Generate the flashcards now as JSON."
    )


def retry_prompt(topic: str, difficulty: DifficultyLevel, critique: str) -> str:
    return (
        f"REGENERATE all cards for topic '{topic}' at {difficulty} difficulty.\n"
        f"Previous set FAILED quality review:\n{critique}\n"
        "Fix every issue. No trivial label cards. Full questions. Expert depth if hard."
    )


def judge_system_prompt() -> str:
    return (
        "You are a strict exam-quality reviewer. "
        'Return JSON only: {"pass": true|false, "avg_quality": 0-10, '
        '"critique": "short", "too_easy_count": 0, "card_scores": [0-10,...]}.'
    )


def judge_user_prompt(topic: str, difficulty: DifficultyLevel, cards_json: str) -> str:
    expectations = {
        "easy": "Beginner OK, but still factual and useful.",
        "medium": "Must require understanding, not pure definitions.",
        "hard": "Must be expert-level. Fail if any card is trivial trivia.",
    }
    return (
        f"Topic: {topic}\nRequested difficulty: {difficulty}\n"
        f"Expectation: {expectations[difficulty]}\n"
        f"Cards JSON:\n{cards_json}\n"
        "Score each card 0-10 for clarity, correctness, and difficulty match. "
        "pass=true only if avg_quality >= 6.5 and too_easy_count is low enough for the level."
    )
