"""Prompt builders for generate + judge steps."""

from __future__ import annotations

import re

from .elo import DifficultyParams
from .models import DifficultyLevel, StudyMode

# Competitive / professional exam cues → push generation toward real exam depth.
_EXAM_HINTS = re.compile(
    r"\b("
    r"neet|usmle|plab|mcat|nclex|aiims|jee|gate|bar exam|cfa|cpa|"
    r"medical school|med school|residency|boards?|entrance|"
    r"competitive exam|exam prep|prepare for"
    r")\b",
    re.I,
)


def _exam_boost(topic: str, custom_prompt: str, difficulty: DifficultyLevel) -> str:
    blob = f"{topic} {custom_prompt}"
    if not _EXAM_HINTS.search(blob):
        return ""
    if difficulty == "easy":
        return (
            "Learner mentioned exam/professional prep — still keep cards accurate, "
            "but prefer syllabus facts over trivia."
        )
    return (
        "Learner is preparing for a competitive/professional exam. "
        "Prefer high-yield syllabus facts, mechanisms, differentials, protocols, "
        "and exam-style stems. Avoid nursery definitions (e.g. 'what is a doctor')."
    )


def system_prompt(params: DifficultyParams, card_count: int) -> str:
    hard_extra = ""
    if params.target_level >= 3:
        hard_extra = (
            " HARD MODE: every front must be a full exam-style question ending with ?. "
            "Assume the learner already knows basics. Prefer mechanisms, differentials, "
            "guidelines, calculations, and edge cases. Tag every card difficulty:3."
        )
    return " ".join(
        [
            f'Return JSON only: {{"cards":[{{"front":"question","back":"answer","difficulty":{params.target_level},"bloom_level":"understand"}}]}}.',
            f"Exactly {card_count} cards.",
            "difficulty 1=easy, 2=medium, 3=hard.",
            "bloom_level one of: remember, understand, apply, analyze, evaluate.",
            "Ground EVERY card in the provided context. Prefer quoting concrete names, dates, "
            "numbers, and claims from the sources. Invent nothing that contradicts the context.",
            "If context is thin, still write accurate cards but keep answers short and hedge "
            "uncertain claims. Never invent biographies for a website that was not fetched.",
            "Each card must teach a DIFFERENT fact — no repeated fronts or near-duplicate backs.",
            "Front must teach something specific. Back is a short precise answer (1–2 sentences).",
            "Think first: pick distinct facts, then write one card per fact. Prefer depth over speed.",
            "Optional per card: distractors: [3 plausible wrong answers] for quiz mode.",
            hard_extra,
        ]
    )


def user_prompt(
    topic: str,
    params: DifficultyParams,
    context_text: str,
    mode: StudyMode,
    custom_prompt: str = "",
    avoid_questions: list[str] | None = None,
    retry_questions: list[str] | None = None,
) -> str:
    mode_hint = (
        "These cards will become multiple-choice quiz items — answers must be crisp and distinct."
        if mode == "quiz"
        else "These cards are for flashcard study — concise front/back pairs."
    )
    custom = f"\nLearner instructions: {custom_prompt.strip()[:500]}" if custom_prompt.strip() else ""
    difficulty_name: DifficultyLevel = (
        "hard" if params.target_level >= 3 else "medium" if params.target_level == 2 else "easy"
    )
    exam = _exam_boost(topic, custom_prompt, difficulty_name)
    exam_line = f"\n{exam}" if exam else ""
    ctx = context_text.strip()[:10000]

    avoid_block = ""
    if avoid_questions:
        lines = [f"- {q}" for q in avoid_questions[:40] if q.strip()]
        if lines:
            avoid_block = (
                "\n=== DO NOT REPEAT YET (answered correctly recently) ===\n"
                + "\n".join(lines)
                + "\nWrite NEW questions covering different facts. "
                "Do not paraphrase the banned fronts.\n=== END ===\n"
            )

    retry_block = ""
    if retry_questions:
        lines = [f"- {q}" for q in retry_questions[:12] if q.strip()]
        if lines:
            retry_block = (
                "\n=== RETRY THESE (learner got them wrong) ===\n"
                + "\n".join(lines)
                + "\nInclude 2–4 of these (same fact, can rephrase slightly) so they can practise. "
                "Fill the rest with new facts from the context.\n=== END ===\n"
            )

    return (
        f"Topic: {topic}\n"
        f"{params.as_prompt_block()}\n"
        f"{mode_hint}{custom}{exam_line}\n\n"
        f"=== CONTEXT (use this) ===\n{ctx}\n=== END CONTEXT ===\n"
        f"{avoid_block}{retry_block}\n"
        "Take a moment to plan, then generate the flashcards as JSON."
    )


def plan_system_prompt() -> str:
    return (
        'Return JSON only: {"facts":["...", "..."], "angles":["why/how/compare..."]}. '
        "8–12 distinct, testable facts grounded in the context. No questions yet."
    )


def plan_user_prompt(topic: str, context_text: str, custom_prompt: str = "") -> str:
    custom = f"\nLearner instructions: {custom_prompt.strip()[:400]}" if custom_prompt.strip() else ""
    ctx = context_text.strip()[:8000]
    return (
        f"Topic: {topic}{custom}\n"
        "Read the context carefully. List the most useful facts a learner should master.\n"
        f"=== CONTEXT ===\n{ctx}\n=== END ==="
    )


def retry_prompt(topic: str, difficulty: DifficultyLevel, critique: str) -> str:
    hard_fix = ""
    if difficulty == "hard":
        hard_fix = (
            "\nRequired for HARD: clinical/exam reasoning, multi-step questions, "
            "specific named concepts (pathways, criteria, doses only if in context). "
            "Rewrite every weak card. Do NOT emit difficulty 1."
        )
    return (
        f"REGENERATE all cards for topic '{topic}' at {difficulty} difficulty.\n"
        f"Previous set FAILED quality review:\n{critique}\n"
        "Fix every issue. No trivial label cards. Full questions. Expert depth if hard."
        f"{hard_fix}"
    )


def judge_system_prompt() -> str:
    return (
        "You are a practical exam-quality reviewer for flashcards. "
        'Return JSON only: {"pass": true|false, "avg_quality": 0-10, '
        '"critique": "short", "too_easy_count": 0, "card_scores": [0-10,...]}. '
        "Be fair: a mostly solid hard deck should pass even if 1–2 cards are lighter."
    )


def judge_user_prompt(topic: str, difficulty: DifficultyLevel, cards_json: str) -> str:
    expectations = {
        "easy": "Beginner OK, but still factual and useful.",
        "medium": "Must require understanding, not pure definitions.",
        "hard": (
            "Should be advanced/exam-ready for most cards. "
            "Pass if the majority match hard level; do not fail the whole set for one weak card."
        ),
    }
    thresholds = {"easy": 5.5, "medium": 6.0, "hard": 6.0}
    return (
        f"Topic: {topic}\nRequested difficulty: {difficulty}\n"
        f"Expectation: {expectations[difficulty]}\n"
        f"Cards JSON:\n{cards_json}\n"
        "Score each card 0-10 for clarity, correctness, and difficulty match. "
        f"pass=true if avg_quality >= {thresholds[difficulty]} "
        "and too_easy_count is not the majority of the set."
        " Rank every card in card_scores so weaker ones can be dropped."
    )


def quiz_distractor_system_prompt() -> str:
    return (
        'Return JSON only: {"items":[{"front":"exact question text",'
        '"distractors":["wrong A","wrong B","wrong C"]}]}. '
        "One item per card. Three plausible but incorrect answers. "
        "Never include the real answer. Same length/style as the real answer. "
        "No 'all of the above' / 'none of the above'."
    )


def quiz_distractor_user_prompt(topic: str, cards_json: str) -> str:
    return (
        f"Topic: {topic}\n"
        "Write 3 multiple-choice distractors for each flashcard.\n"
        f"Cards:\n{cards_json}"
    )


def study_notes_system_prompt() -> str:
    return (
        'Return JSON only: {"bullets":["...", "..."]}. '
        "6–10 short teaching bullets a learner should read BEFORE questions. "
        "Each bullet is one fact, not a quiz prompt. No numbering."
    )


def study_notes_user_prompt(topic: str, cards_json: str, custom_prompt: str = "") -> str:
    style = (
        f"\nTeach-style instructions from the learner: {custom_prompt.strip()[:500]}"
        if custom_prompt.strip()
        else ""
    )
    return (
        f"Topic: {topic}{style}\n"
        "Turn these flashcards into a compact study sheet.\n"
        f"Cards:\n{cards_json}"
    )
