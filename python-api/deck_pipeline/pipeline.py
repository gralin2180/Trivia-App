"""
Deck pipeline:
  1) Gather web/wiki context
  2) Dual-generate in parallel (OpenRouter free models + fallbacks), merge unique cards
  3) Judge on a different model; retry with critique
  4) Keep the best N cards, then enrich (study notes / quiz distractors)
"""

from __future__ import annotations

import logging
import os

from .context import gather_topic_context
from .elo import params_for, update_elo, question_elo_for_level, rolling_accuracy
from .enrich import enrich_quiz_distractors, enrich_study_notes
from .generate import enforce_level, generate_card_pool, generate_cards, pick_best_cards
from .judge import judge_cards
from .llm import last_provider, llm_json
from .models import GenerationRequest, GenerationResult, PlayerProfile
from .prompts import plan_system_prompt, plan_user_prompt, retry_prompt, user_prompt

logger = logging.getLogger(__name__)


async def run_deck_pipeline(req: GenerationRequest) -> GenerationResult:
    topic = req.topic.strip()[:120]
    if len(topic) < 2:
        raise ValueError("Please provide a valid topic.")

    params = params_for(req.difficulty, req.mode, req.player_elo)

    ctx = await gather_topic_context(
        topic,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        tinyfish_api_key=os.getenv("TINYFISH_API_KEY"),
        prefer_rich=req.use_web_context,
    )

    retries = 0
    providers_used: list[str] = []

    outline = ""
    try:
        plan = await llm_json(
            plan_system_prompt(),
            plan_user_prompt(topic, ctx.text, req.custom_prompt),
            0.35,
            role="generate",
        )
        facts = [str(x).strip() for x in (plan.get("facts") or []) if str(x).strip()]
        angles = [str(x).strip() for x in (plan.get("angles") or []) if str(x).strip()]
        if facts:
            outline = "Cover these facts (one card each, do not skip the important ones):\n" + "\n".join(
                f"- {f}" for f in facts[:12]
            )
            if angles:
                outline += "\nAngles: " + "; ".join(angles[:6])
            logger.info("Planned %s facts before generation", len(facts))
        if last_provider():
            providers_used.append(f"plan:{last_provider()}")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Planning pass skipped: %s", exc)

    planned_prompt = "\n\n".join(p for p in (req.custom_prompt, outline) if p)

    cards = await generate_card_pool(
        topic=topic,
        context_text=ctx.text,
        params=params,
        mode=req.mode,
        custom_prompt=planned_prompt,
        card_count=req.card_count,
        avoid_questions=req.avoid_questions,
        retry_questions=req.retry_questions,
    )
    if last_provider():
        providers_used.append(last_provider())

    judgment = await judge_cards(topic, req.difficulty, cards)
    if last_provider():
        providers_used.append(last_provider())

    if not judgment.passed:
        retries = 1
        critique = judgment.critique or "Too easy / low quality."
        override = (
            user_prompt(
                topic,
                params,
                ctx.text,
                req.mode,
                req.custom_prompt if not outline else planned_prompt,
                avoid_questions=req.avoid_questions,
                retry_questions=req.retry_questions,
            )
            + "\n\n"
            + retry_prompt(topic, req.difficulty, critique)
        )
        try:
            cards = await generate_cards(
                topic=topic,
                context_text=ctx.text,
                params=params,
                mode=req.mode,
                custom_prompt=req.custom_prompt,
                card_count=min(18, req.card_count + 4),
                override_user_prompt=override,
                avoid_questions=req.avoid_questions,
                retry_questions=req.retry_questions,
            )
            if last_provider():
                providers_used.append(last_provider())
            judgment = await judge_cards(topic, req.difficulty, cards)
            if last_provider():
                providers_used.append(last_provider())
        except Exception as exc:  # noqa: BLE001
            logger.warning("Retry generation failed: %s", exc)

    if len(cards) < 4:
        raise ValueError("AI did not generate enough cards. Try again.")

    if not judgment.passed and req.difficulty == "hard":
        logger.warning(
            "Hard deck judge still failing after retry (critique=%s). Accepting cards.",
            judgment.critique,
        )

    pool_size = len(cards)
    cards = pick_best_cards(cards, req.card_count, params.target_level)

    study_notes: list[str] = []
    if req.mode == "quiz":
        cards = await enrich_quiz_distractors(topic, cards)
    else:
        study_notes = await enrich_study_notes(
            topic,
            cards,
            custom_prompt=req.custom_prompt,
            mode=req.mode,
        )

    cards = enforce_level(cards, params.target_level)
    route = " → ".join(dict.fromkeys(p for p in providers_used if p))

    return GenerationResult(
        cards=cards,
        difficulty=req.difficulty,
        context_chars=ctx.char_count,
        context_source=ctx.source,
        retries=retries,
        judge_passed=judgment.passed,
        study_notes=study_notes,
        llm_route=route,
        params={
            "target_level": params.target_level,
            "temperature": params.temperature,
            "bloom_focus": params.bloom_focus,
            "elo_band": params.elo_band,
            "judge_avg_quality": judgment.avg_quality,
            "judge_critique": judgment.critique,
            "player_elo": req.player_elo,
            "llm_route": route,
            "pool_size_before_pick": pool_size,
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
