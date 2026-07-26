"""Step 2 — LLM card generation (Groq → OpenAI → Gemini)."""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

from .models import Card
from .prompts import system_prompt, user_prompt
from .elo import DifficultyParams
from .models import StudyMode

logger = logging.getLogger(__name__)


class LLMError(RuntimeError):
    pass


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def _chat_groq(system: str, user: str, temperature: float) -> str:
    import httpx

    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise LLMError("GROQ_API_KEY missing")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.1-8b-instant",
                "temperature": temperature,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
        )
        if resp.status_code != 200:
            raise LLMError(f"Groq {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _chat_openai(system: str, user: str, temperature: float) -> str:
    import httpx

    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise LLMError("OPENAI_API_KEY missing")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o-mini",
                "temperature": temperature,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
        )
        if resp.status_code != 200:
            raise LLMError(f"OpenAI {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _chat_gemini(system: str, user: str, temperature: float) -> str:
    import httpx

    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise LLMError("GEMINI_API_KEY missing")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-1.5-flash:generateContent?key={key}"
    )
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "systemInstruction": {"parts": [{"text": system}]},
                "contents": [{"role": "user", "parts": [{"text": user}]}],
                "generationConfig": {
                    "temperature": temperature,
                    "responseMimeType": "application/json",
                },
            },
        )
        if resp.status_code != 200:
            raise LLMError(f"Gemini {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def llm_json(system: str, user: str, temperature: float) -> dict[str, Any]:
    errors: list[str] = []
    for name, fn in (
        ("groq", _chat_groq),
        ("openai", _chat_openai),
        ("gemini", _chat_gemini),
    ):
        try:
            raw = await fn(system, user, temperature)
            return _extract_json(raw)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{name}: {exc}")
            logger.warning("LLM provider %s failed: %s", name, exc)
    raise LLMError("All LLM providers failed: " + " | ".join(errors))


def parse_cards(payload: dict[str, Any], target_level: int) -> list[Card]:
    cards: list[Card] = []
    for i, item in enumerate((payload.get("cards") or [])[:12]):
        front = str(item.get("front") or "").strip()
        back = str(item.get("back") or "").strip()
        if not front or not back:
            continue
        try:
            level = int(item.get("difficulty") or target_level)
        except (TypeError, ValueError):
            level = target_level
        bloom = str(item.get("bloom_level") or "understand").lower()
        cards.append(
            Card(
                front=front,
                back=back,
                difficulty=max(1, min(3, level)),
                order_index=i + 1,
                bloom_level=bloom,
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
            )
        )
    return out


async def generate_cards(
    topic: str,
    context_text: str,
    params: DifficultyParams,
    mode: StudyMode,
    custom_prompt: str = "",
    card_count: int = 10,
    override_user_prompt: str | None = None,
) -> list[Card]:
    sys = system_prompt(params, card_count)
    usr = override_user_prompt or user_prompt(
        topic, params, context_text, mode, custom_prompt
    )
    payload = await llm_json(sys, usr, params.temperature)
    cards = parse_cards(payload, params.target_level)
    if len(cards) < 4:
        raise LLMError("AI did not generate enough cards")
    return cards
