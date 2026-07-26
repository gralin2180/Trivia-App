"""
3-step deck pipeline:
  1) Gather web/wiki context (Crawl4AI / ScrapeGraphAI / Wikipedia)
  2) Generate cards with difficulty + ELO params
  3) Judge quality; retry with critique; stamp difficulty

Inspired by adaptive learning curves (ELO) + LLM-judge quality gates.
Lumina (Bino5150/lumina) is a local agent memory harness — we borrow the
"remember learner strength and adapt" idea, not the full agent runtime.
"""

from __future__ import annotations

import logging
import os

from .context import gather_topic_context
from .elo import params_for, update_elo, question_elo_for_level, rolling_accuracy
from .generate import enforce_level, generate_cards
from .judge import judge_cards
from .models import GenerationRequest, GenerationResult, PlayerProfile
from .prompts import retry_prompt, user_prompt

logger = logging.getLogger(__name__)


async def run_deck_pipeline(req: GenerationRequest) -> GenerationResult:
    topic = req.topic.strip()[:120]
    if len(topic) < 2:
        raise ValueError("Please provide a valid topic.")

    params = params_for(req.difficulty, req.mode, req.player_elo)

    # --- Step 1: context ---
    ctx = await gather_topic_context(
        topic,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        tinyfish_api_key=os.getenv("TINYFISH_API_KEY"),
        prefer_rich=req.use_web_context,
    )

    # --- Step 2 + 3: generate → judge → maybe retry ---
    retries = 0
    cards = await generate_cards(
        topic=topic,
        context_text=ctx.text,
        params=params,
        mode=req.mode,
        custom_prompt=req.custom_prompt,
        card_count=req.card_count,
    )

    judgment = await judge_cards(topic, req.difficulty, cards)

    if not judgment.passed:
        retries = 1
        critique = judgment.critique or "Too easy / low quality."
        override = retry_prompt(topic, req.difficulty, critique)
        # Also re-attach context so retry stays grounded
        override = (
            user_prompt(topic, params, ctx.text, req.mode, req.custom_prompt)
            + "\n\n"
            + override
        )
        try:
            cards = await generate_cards(
                topic=topic,
                context_text=ctx.text,
                params=params,
                mode=req.mode,
                custom_prompt=req.custom_prompt,
                card_count=req.card_count,
                override_user_prompt=override,
            )
            judgment = await judge_cards(topic, req.difficulty, cards)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Retry generation failed: %s", exc)

    if len(cards) < 4:
        raise ValueError("AI did not generate enough cards. Try again.")

    if not judgment.passed and req.difficulty == "hard":
        raise ValueError(
            "AI kept generating beginner-level cards. "
            'Try a custom prompt like "medical school level" or try again.'
        )

    cards = enforce_level(cards, params.target_level)

    return GenerationResult(
        cards=cards,
        difficulty=req.difficulty,
        context_chars=ctx.char_count,
        context_source=ctx.source,
        retries=retries,
        judge_passed=judgment.passed,
        params={
            "target_level": params.target_level,
            "temperature": params.temperature,
            "bloom_focus": params.bloom_focus,
            "elo_band": params.elo_band,
            "judge_avg_quality": judgment.avg_quality,
            "judge_critique": judgment.critique,
            "player_elo": req.player_elo,
        },
    )


def apply_answer_feedback(
    profile: PlayerProfile,
    card_difficulty: int,
    correct: bool,
) -> PlayerProfile:
    """Update learner ELO after a study/quiz answer (call from your API)."""
    q_elo = question_elo_for_level(card_difficulty)
    profile.elo = update_elo(profile.elo, q_elo, correct)
    profile.games_played += 1
    profile.recent_accuracy = rolling_accuracy(profile.recent_accuracy, correct)
    return profile
