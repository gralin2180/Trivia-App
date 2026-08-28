"""Unified LLM router: OpenRouter free models first, then Groq / Gemini / OpenAI.

Roles:
  generate — draft flashcards (fast free models, with fallbacks)
  judge    — quality gate on a *different* model when possible
  enrich   — quiz distractors / study-note bullets (cheap/fast)
"""

from __future__ import annotations

import contextvars
import json
import logging
import os
import re
from typing import Any, Literal

logger = logging.getLogger(__name__)

LlmRole = Literal["generate", "judge", "enrich"]


class LLMError(RuntimeError):
    pass


_request_keys: contextvars.ContextVar[dict[str, str]] = contextvars.ContextVar(
    "request_llm_keys", default={}
)
_last_provider: contextvars.ContextVar[str] = contextvars.ContextVar(
    "last_llm_provider", default=""
)
_preferred_openrouter_model: contextvars.ContextVar[str] = contextvars.ContextVar(
    "preferred_openrouter_model", default=""
)
_access_mode: contextvars.ContextVar[str] = contextvars.ContextVar("llm_access_mode", default="builtin")


def set_request_keys(keys: dict[str, str]) -> contextvars.Token:
    cleaned = {k: v.strip() for k, v in keys.items() if v and v.strip()}
    return _request_keys.set(cleaned)


def reset_request_keys(token: contextvars.Token) -> None:
    _request_keys.reset(token)


def set_preferred_model(model_id: str) -> contextvars.Token:
    return _preferred_openrouter_model.set((model_id or "").strip())


def reset_preferred_model(token: contextvars.Token) -> None:
    _preferred_openrouter_model.reset(token)


def set_access_mode(mode: str) -> contextvars.Token:
    cleaned = (mode or "builtin").strip().lower()
    if cleaned not in ("builtin", "device_key", "local_ollama"):
        cleaned = "builtin"
    return _access_mode.set(cleaned)


def reset_access_mode(token: contextvars.Token) -> None:
    _access_mode.reset(token)


def last_provider() -> str:
    return _last_provider.get() or ""


def _provider_key(provider: str, env_var: str) -> str | None:
    return _request_keys.get().get(provider) or os.getenv(env_var)


def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise
        return json.loads(match.group(0))


# OpenRouter free pool — wide list so fallbacks survive catalog churn.
# `openrouter/free` auto-picks whatever free model is currently healthy.
OPENROUTER_MODELS: dict[LlmRole, tuple[str, ...]] = {
    "generate": (
        "nvidia/nemotron-3.5-lightning:free",
        "inclusionai/ling-3.0-flash:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "openai/gpt-oss-20b:free",
        "google/gemma-4-31b-it:free",
        "google/gemma-4-26b-a4b-it:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "minimax/minimax-m2.7:free",
        "poolside/laguna-s-2.1:free",
        "poolside/laguna-xs-2.1:free",
        "cohere/north-mini-code:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "openrouter/free",
    ),
    "judge": (
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "google/gemma-4-31b-it:free",
        "nvidia/nemotron-3.5-lightning:free",
        "inclusionai/ling-3.0-flash:free",
        "openrouter/free",
    ),
    "enrich": (
        "nvidia/nemotron-3.5-lightning:free",
        "inclusionai/ling-3.0-flash:free",
        "openai/gpt-oss-20b:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "openrouter/free",
    ),
}

# Catalog returned to the app (OpenCode-style picker labels).
BUILTIN_MODEL_CATALOG: tuple[dict[str, str], ...] = (
    {"id": "auto", "label": "Auto (best free)", "openRouterId": "openrouter/free"},
    {"id": "nemotron-lightning", "label": "Nemotron 3.5 Lightning", "openRouterId": "nvidia/nemotron-3.5-lightning:free"},
    {"id": "nemotron-ultra", "label": "Nemotron 3 Ultra", "openRouterId": "nvidia/nemotron-3-ultra-550b-a55b:free"},
    {"id": "nemotron-super", "label": "Nemotron 3 Super", "openRouterId": "nvidia/nemotron-3-super-120b-a12b:free"},
    {"id": "nemotron-nano", "label": "Nemotron 3 Nano", "openRouterId": "nvidia/nemotron-3-nano-30b-a3b:free"},
    {"id": "ling-flash", "label": "Ling 3 Flash", "openRouterId": "inclusionai/ling-3.0-flash:free"},
    {"id": "gemma-4", "label": "Gemma 4 31B", "openRouterId": "google/gemma-4-31b-it:free"},
    {"id": "gpt-oss-20b", "label": "GPT-OSS 20B", "openRouterId": "openai/gpt-oss-20b:free"},
    {"id": "laguna-code", "label": "Laguna S 2.1", "openRouterId": "poolside/laguna-s-2.1:free"},
    {"id": "minimax-m27", "label": "MiniMax M2.7", "openRouterId": "minimax/minimax-m2.7:free"},
)


def _openrouter_models_for_role(role: LlmRole) -> tuple[str, ...]:
    base = list(OPENROUTER_MODELS[role])
    preferred = _preferred_openrouter_model.get().strip()
    if preferred and preferred not in base:
        base.insert(0, preferred)
    elif preferred:
        base.remove(preferred)
        base.insert(0, preferred)
    # De-dupe while preserving order.
    seen: set[str] = set()
    ordered: list[str] = []
    for mid in base:
        if mid not in seen:
            seen.add(mid)
            ordered.append(mid)
    return tuple(ordered)

GROQ_MODELS: dict[LlmRole, tuple[str, ...]] = {
    "generate": (
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.6-27b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
    ),
    "judge": (
        "openai/gpt-oss-120b",
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-20b",
    ),
    "enrich": (
        "openai/gpt-oss-20b",
        "qwen/qwen3.6-27b",
        "llama-3.1-8b-instant",
    ),
}

POLLINATIONS_MODELS: dict[LlmRole, tuple[str, ...]] = {
    "generate": ("openai-fast", "gpt-oss", "llama", "mistral", "qwen", "gemma", "deepseek", "nemotron"),
    "judge": ("openai-fast", "llama", "mistral", "qwen"),
    "enrich": ("openai-fast", "llama", "mistral"),
}

OLLAMA_PREFERRED = (
    "llama3.3",
    "llama3.2",
    "llama3.1",
    "qwen2.5",
    "mistral",
    "gemma2",
    "phi3",
    "deepseek-r1",
    "llama3",
)

GEMINI_MODELS = ("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash")


def _openrouter_headers(key: str) -> dict[str, str]:
    referer = (
        os.getenv("OPENROUTER_HTTP_REFERER")
        or os.getenv("EXPO_PUBLIC_AI_API_URL")
        or "https://github.com/gralin2180/Trivia-App"
    )
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": referer.rstrip("/"),
        "X-Title": "ACUMEN",
    }


async def _openai_compatible(
    url: str,
    key: str,
    model: str,
    system: str,
    user: str,
    temperature: float,
    *,
    extra_headers: dict[str, str] | None = None,
    extra_body: dict[str, Any] | None = None,
    timeout: float = 90.0,
    json_mode: bool = True,
) -> str:
    import httpx

    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if extra_headers:
        headers.update(extra_headers)

    body: dict[str, Any] = {
        "model": model,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    if extra_body:
        body.update(extra_body)

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(url, headers=headers, json=body)
        if resp.status_code != 200:
            raise LLMError(f"{resp.status_code}: {resp.text[:280]}")
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        if not content:
            raise LLMError("empty model content")
        return content


async def _chat_openrouter(system: str, user: str, temperature: float, role: LlmRole) -> str:
    key = _provider_key("openrouter", "OPENROUTER_API_KEY")
    if not key:
        raise LLMError("OPENROUTER_API_KEY missing")

    models = _openrouter_models_for_role(role)
    last_err = "no model tried"
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = _openrouter_headers(key)

    for i, model in enumerate(models):
        fallbacks = list(models[i + 1 :])
        extra = {"models": fallbacks} if fallbacks else None
        try:
            return await _openai_compatible(
                url,
                key,
                model,
                system,
                user,
                temperature,
                extra_headers=headers,
                extra_body=extra,
                timeout=100.0,
                json_mode=True,
            )
        except Exception as exc:  # noqa: BLE001
            last_err = f"{model} json-mode: {exc}"
            logger.warning("OpenRouter %s failed: %s", model, exc)
        try:
            return await _openai_compatible(
                url,
                key,
                model,
                system,
                user,
                temperature,
                extra_headers=headers,
                extra_body=extra,
                timeout=100.0,
                json_mode=False,
            )
        except Exception as exc:  # noqa: BLE001
            last_err = f"{model}: {exc}"
            logger.warning("OpenRouter %s (plain) failed: %s", model, exc)
    raise LLMError(f"OpenRouter {last_err}")


async def _chat_groq(system: str, user: str, temperature: float, role: LlmRole) -> str:
    key = _provider_key("groq", "GROQ_API_KEY")
    if not key:
        raise LLMError("GROQ_API_KEY missing")
    last_err = "no model tried"
    extra = None
    if role == "generate":
        extra = {"reasoning_effort": "medium", "max_tokens": 6000}
    elif role == "judge":
        extra = {"reasoning_effort": "low", "max_tokens": 2500}
    for model in GROQ_MODELS[role]:
        try:
            return await _openai_compatible(
                "https://api.groq.com/openai/v1/chat/completions",
                key,
                model,
                system,
                user,
                temperature,
                timeout=120.0 if role == "generate" else 80.0,
                json_mode=True,
                extra_body=extra,
            )
        except Exception as exc:  # noqa: BLE001
            last_err = f"{model}: {exc}"
            logger.warning("Groq %s failed: %s", model, exc)
            if "reasoning_effort" in str(exc).lower() or "400" in str(exc):
                try:
                    return await _openai_compatible(
                        "https://api.groq.com/openai/v1/chat/completions",
                        key,
                        model,
                        system,
                        user,
                        temperature,
                        timeout=90.0,
                        json_mode=True,
                    )
                except Exception as exc2:  # noqa: BLE001
                    last_err = f"{model}: {exc2}"
    raise LLMError(f"Groq {last_err}")


async def _chat_openai(system: str, user: str, temperature: float, role: LlmRole) -> str:
    key = _provider_key("openai", "OPENAI_API_KEY")
    if not key:
        raise LLMError("OPENAI_API_KEY missing")
    return await _openai_compatible(
        "https://api.openai.com/v1/chat/completions",
        key,
        "gpt-4o-mini",
        system,
        user,
        temperature,
        timeout=75.0,
        json_mode=True,
    )


async def _chat_gemini(system: str, user: str, temperature: float, role: LlmRole) -> str:
    import httpx

    key = _provider_key("gemini", "GEMINI_API_KEY")
    if not key:
        raise LLMError("GEMINI_API_KEY missing")

    last_err = "no model tried"
    async with httpx.AsyncClient(timeout=90.0) as client:
        for model in GEMINI_MODELS:
            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model}:generateContent"
            )
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json", "x-goog-api-key": key},
                json={
                    "systemInstruction": {"parts": [{"text": system}]},
                    "contents": [{"role": "user", "parts": [{"text": user}]}],
                    "generationConfig": {
                        "temperature": temperature,
                        "responseMimeType": "application/json",
                    },
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            last_err = f"{model} {resp.status_code}: {resp.text[:200]}"
            if resp.status_code not in (404, 400):
                break
    raise LLMError(f"Gemini {last_err}")


_ollama_models_cache: list[str] | None = None


async def _ollama_installed() -> list[str]:
    global _ollama_models_cache
    if _ollama_models_cache is not None:
        return _ollama_models_cache
    import httpx

    base = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=1.8) as client:
            resp = await client.get(f"{base}/api/tags")
            if resp.status_code != 200:
                _ollama_models_cache = []
                return []
            names = [str(m.get("name") or "").split(":")[0] for m in (resp.json().get("models") or [])]
            _ollama_models_cache = [n for n in names if n]
            return _ollama_models_cache
    except Exception:  # noqa: BLE001
        _ollama_models_cache = []
        return []


def _pick_ollama_model(installed: list[str]) -> str | None:
    lower = {n.lower(): n for n in installed}
    for want in OLLAMA_PREFERRED:
        for have, original in lower.items():
            if have == want or have.startswith(want):
                return original
    return installed[0] if installed else None


async def _chat_ollama(system: str, user: str, temperature: float, role: LlmRole) -> str:
    installed = await _ollama_installed()
    model = _pick_ollama_model(installed)
    if not model:
        raise LLMError("Ollama not running (no local open-source models)")
    base = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
    return await _openai_compatible(
        f"{base}/v1/chat/completions",
        "ollama",
        model,
        system,
        user,
        temperature,
        timeout=180.0,
        json_mode=False,
    )


async def _chat_pollinations(system: str, user: str, temperature: float, role: LlmRole) -> str:
    """Public OSS gateway. Works with no key on some tiers; optional POLLINATIONS_API_KEY."""
    import httpx

    key = _provider_key("pollinations", "POLLINATIONS_API_KEY")
    models = POLLINATIONS_MODELS[role]
    last_err = "no model tried"
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"

    body_base = {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "jsonMode": True,
    }
    urls = [
        "https://text.pollinations.ai/v1/chat/completions",
        "https://gen.pollinations.ai/v1/chat/completions",
    ]
    async with httpx.AsyncClient(timeout=httpx.Timeout(25.0, connect=4.0)) as client:
        for url in urls:
            if "gen.pollinations" in url and not key:
                continue
            for model in models:
                try:
                    resp = await client.post(url, headers=headers, json={**body_base, "model": model})
                    if resp.status_code in (401, 402, 403):
                        last_err = f"{model} {resp.status_code}"
                        break
                    if resp.status_code != 200:
                        last_err = f"{model} {resp.status_code}: {resp.text[:160]}"
                        continue
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    if content:
                        return content
                except Exception as exc:  # noqa: BLE001
                    last_err = f"{model}: {exc}"
                    logger.warning("Pollinations %s failed: %s", model, exc)
    raise LLMError(f"Pollinations {last_err}")


_CHATTERS = {
    "openrouter": _chat_openrouter,
    "groq": _chat_groq,
    "gemini": _chat_gemini,
    "openai": _chat_openai,
    "ollama": _chat_ollama,
    "pollinations": _chat_pollinations,
}


def _provider_order(role: LlmRole, force: str | None, exclude: set[str]) -> list[str]:
    mode = _access_mode.get() or "builtin"
    if mode == "local_ollama":
        preferred = ["ollama", "openrouter", "groq", "gemini", "openai", "pollinations"]
    else:
        # Keyed OSS hosts first, then local Ollama (no key), then public Pollinations.
        preferred = ["openrouter", "groq", "gemini", "openai", "ollama", "pollinations"]
    if role == "judge":
        # Prefer a different brain than generate when we can.
        last = _last_provider.get()
        if last in preferred:
            preferred = [p for p in preferred if p != last] + [last]

    user_keys = _request_keys.get()
    if force:
        preferred = [force] + [p for p in preferred if p != force]
    elif user_keys:
        preferred.sort(key=lambda name: name not in user_keys)

    return [p for p in preferred if p not in exclude]


async def llm_json(
    system: str,
    user: str,
    temperature: float,
    role: LlmRole = "generate",
    force_provider: str | None = None,
    exclude_providers: list[str] | None = None,
) -> dict[str, Any]:
    errors: list[str] = []
    exclude = set(exclude_providers or [])
    order = _provider_order(role, force_provider, exclude)

    for name in order:
        fn = _CHATTERS[name]
        try:
            raw = await fn(system, user, temperature, role)
            parsed = _extract_json(raw)
            _last_provider.set(name)
            logger.info("LLM %s via %s", role, name)
            return parsed
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{name}: {exc}")
            logger.warning("LLM provider %s (%s) failed: %s", name, role, exc)

    raise LLMError("All LLM providers failed: " + " | ".join(errors))


def available_providers() -> dict[str, bool]:
    ollama_on = bool(_ollama_models_cache)
    return {
        "openrouter": bool(_provider_key("openrouter", "OPENROUTER_API_KEY")),
        "groq": bool(_provider_key("groq", "GROQ_API_KEY")),
        "gemini": bool(_provider_key("gemini", "GEMINI_API_KEY")),
        "openai": bool(_provider_key("openai", "OPENAI_API_KEY")),
        "ollama": ollama_on,
        "pollinations": True,
    }


def builtin_model_catalog() -> list[dict[str, str]]:
    return [dict(entry) for entry in BUILTIN_MODEL_CATALOG]


def fallback_chain_summary() -> dict[str, list[str]]:
    return {role: list(_openrouter_models_for_role(role)) for role in ("generate", "judge", "enrich")}
