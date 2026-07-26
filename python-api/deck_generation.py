"""
Back-compat helpers around deck_pipeline.

Prefer:
  from deck_pipeline import run_deck_pipeline, GenerationRequest
"""

from __future__ import annotations

from deck_pipeline.elo import params_for
from deck_pipeline.judge import heuristic_too_basic
from deck_pipeline.models import DifficultyLevel, StudyMode
from deck_pipeline.prompts import retry_prompt, system_prompt, user_prompt


def temperature_for(difficulty: DifficultyLevel) -> float:
    return params_for(difficulty).temperature


def build_system_prompt(difficulty: DifficultyLevel) -> str:
    return system_prompt(params_for(difficulty), 10)


def build_user_prompt(
    topic: str,
    difficulty: DifficultyLevel,
    custom_prompt: str = "",
    mode: StudyMode = "study",
) -> str:
    return user_prompt(topic, params_for(difficulty, mode), "", mode, custom_prompt)


def build_retry_prompt(topic: str, difficulty: DifficultyLevel) -> str:
    return retry_prompt(topic, difficulty, "Previous set was too easy.")


def prepare_generation(
    topic: str,
    difficulty: DifficultyLevel = "easy",
    custom_prompt: str = "",
    mode: StudyMode = "study",
) -> dict:
    params = params_for(difficulty, mode)
    return {
        "system_prompt": system_prompt(params, 10),
        "user_prompt": user_prompt(topic.strip()[:120], params, "", mode, custom_prompt),
        "retry_prompt": retry_prompt(topic.strip()[:120], difficulty, "Too easy."),
        "temperature": params.temperature,
        "difficulty": difficulty,
        "mode": mode,
        "params_block": params.as_prompt_block(),
    }


looks_too_basic_for_hard = heuristic_too_basic
