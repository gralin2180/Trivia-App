from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal

DifficultyLevel = Literal["easy", "medium", "hard"]
StudyMode = Literal["study", "quiz"]


@dataclass
class Card:
    front: str
    back: str
    difficulty: int
    order_index: int = 0
    quality_score: float = 0.0
    bloom_level: str = "remember"  # remember | understand | apply | analyze | evaluate
    source_hint: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class PlayerProfile:
    """Tracks learner strength per topic (ELO-style)."""

    user_id: str
    topic: str
    elo: float = 1000.0
    games_played: int = 0
    recent_accuracy: float = 0.5  # 0..1 rolling

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class GenerationRequest:
    topic: str
    difficulty: DifficultyLevel = "easy"
    mode: StudyMode = "study"
    custom_prompt: str = ""
    card_count: int = 10
    player_elo: float | None = None
    use_web_context: bool = True


@dataclass
class GenerationResult:
    cards: list[Card]
    difficulty: DifficultyLevel
    context_chars: int = 0
    context_source: str = "none"
    retries: int = 0
    judge_passed: bool = False
    params: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "cards": [c.to_dict() for c in self.cards],
            "difficulty": self.difficulty,
            "context_chars": self.context_chars,
            "context_source": self.context_source,
            "retries": self.retries,
            "judge_passed": self.judge_passed,
            "params": self.params,
            "card_count": len(self.cards),
        }
