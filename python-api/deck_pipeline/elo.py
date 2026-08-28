"""ELO-style learner rating → generation parameters (temperature, Bloom target, etc.)."""

from __future__ import annotations

from dataclasses import dataclass

from .models import DifficultyLevel


# Standard chess-like ELO update constants
K_FACTOR = 32
DEFAULT_ELO = 1000.0


@dataclass(frozen=True)
class DifficultyParams:
    """Tunable knobs passed into the LLM generation step."""

    target_level: int  # 1 easy, 2 medium, 3 hard
    temperature: float
    bloom_focus: str
    complexity: str
    ban_trivial: bool
    require_full_questions: bool
    distractor_plausibility: str  # for quiz mode
    elo_band: str

    def as_prompt_block(self) -> str:
        return "\n".join(
            [
                f"Target card difficulty number: {self.target_level} (1=easy, 2=medium, 3=hard).",
                f"Bloom taxonomy focus: {self.bloom_focus}.",
                f"Complexity: {self.complexity}.",
                f"Learner ELO band: {self.elo_band}.",
                f"Distractors: {self.distractor_plausibility}.",
                "Ban trivial 1–3 word fronts." if self.ban_trivial else "Short fronts OK for beginners.",
                "Front must be a full question ending with ?"
                if self.require_full_questions
                else "Front may be a term or short prompt.",
            ]
        )


def expected_score(player_elo: float, question_elo: float) -> float:
    return 1.0 / (1.0 + 10 ** ((question_elo - player_elo) / 400.0))


def update_elo(player_elo: float, question_elo: float, correct: bool) -> float:
    """Return new player ELO after one card/quiz answer."""
    actual = 1.0 if correct else 0.0
    change = K_FACTOR * (actual - expected_score(player_elo, question_elo))
    return round(player_elo + change, 2)


def question_elo_for_level(level: int) -> float:
    return {1: 800.0, 2: 1100.0, 3: 1400.0}.get(level, 1100.0)


def difficulty_from_elo(elo: float) -> DifficultyLevel:
    if elo < 950:
        return "easy"
    if elo < 1250:
        return "medium"
    return "hard"


def blend_difficulty(
    selected: DifficultyLevel,
    player_elo: float | None,
) -> DifficultyLevel:
    """
    If player_elo is provided, nudge selected difficulty toward their skill band
    (natural learning curve) without ignoring their explicit choice completely.
    """
    if player_elo is None:
        return selected

    from_elo = difficulty_from_elo(player_elo)
    order = {"easy": 0, "medium": 1, "hard": 2}
    # Pull at most one step toward ELO band
    delta = order[from_elo] - order[selected]
    if abs(delta) <= 1:
        return from_elo if abs(delta) == 1 and abs(player_elo - DEFAULT_ELO) > 150 else selected
    # Far apart: meet in the middle
    mid = (order[selected] + order[from_elo]) // 2
    return ("easy", "medium", "hard")[mid]


def params_for(
    difficulty: DifficultyLevel,
    mode: str = "study",
    player_elo: float | None = None,
) -> DifficultyParams:
    effective = blend_difficulty(difficulty, player_elo)
    elo = player_elo if player_elo is not None else DEFAULT_ELO

    if effective == "easy":
        return DifficultyParams(
            target_level=1,
            temperature=0.55,
            bloom_focus="remember + understand (definitions, basic facts)",
            complexity="beginner vocabulary, one clear idea per card",
            ban_trivial=False,
            require_full_questions=False,
            distractor_plausibility="obviously wrong options OK for beginners"
            if mode == "quiz"
            else "n/a",
            elo_band=f"~{elo:.0f} (novice)",
        )

    if effective == "medium":
        return DifficultyParams(
            target_level=2,
            temperature=0.7,
            bloom_focus="understand + apply (why/how, scenarios)",
            complexity="moderate depth; no pure dictionary definitions",
            ban_trivial=True,
            require_full_questions=True,
            distractor_plausibility="plausible near-misses"
            if mode == "quiz"
            else "n/a",
            elo_band=f"~{elo:.0f} (intermediate)",
        )

    return DifficultyParams(
        target_level=3,
        temperature=0.65,
        bloom_focus="apply + analyze + evaluate (edge cases, protocols, mechanisms)",
        complexity="expert terminology; assume basics are known",
        ban_trivial=True,
        require_full_questions=True,
        distractor_plausibility="expert-plausible distractors only"
        if mode == "quiz"
        else "n/a",
        elo_band=f"~{elo:.0f} (advanced)",
    )


def rolling_accuracy(previous: float, correct: bool, weight: float = 0.2) -> float:
    sample = 1.0 if correct else 0.0
    return round((1 - weight) * previous + weight * sample, 4)
