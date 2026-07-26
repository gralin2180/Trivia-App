"""
Step 1 — Search & gather topic context (RAG corpus).

Providers (tried in order):
1. TinyFish Search + Fetch (free agent web APIs) if TINYFISH_API_KEY is set
2. Optional ScrapeGraphAI / Crawl4AI
3. Wikipedia REST API (always available with httpx)
"""

from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass
from urllib.parse import quote

logger = logging.getLogger(__name__)


@dataclass
class TopicContext:
    topic: str
    text: str
    source: str
    urls: list[str]

    @property
    def char_count(self) -> int:
        return len(self.text)


def _clean(text: str, limit: int = 12000) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


async def fetch_tinyfish(topic: str, api_key: str | None = None) -> TopicContext | None:
    """
    TinyFish free Search + Fetch for agents:
    https://www.tinyfish.ai/blog/search-and-fetch-are-now-free-for-every-agent-everywhere
    """
    key = api_key or os.getenv("TINYFISH_API_KEY")
    if not key:
        return None

    try:
        import httpx
    except ImportError:
        return None

    headers = {"X-API-Key": key}
    purpose = (
        f"Gather accurate study notes and quiz facts about {topic} "
        "for educational flashcards"
    )

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            search = await client.get(
                "https://api.search.tinyfish.ai",
                params={
                    "query": f"{topic} facts explained",
                    "purpose": purpose,
                    "page": 0,
                },
                headers=headers,
            )
            if search.status_code != 200:
                logger.warning("TinyFish search %s: %s", search.status_code, search.text[:200])
                return None

            payload = search.json()
            results = payload.get("results") or []
            urls = [r.get("url") for r in results[:4] if r.get("url")]
            snippet_blob = "\n".join(
                f"- {r.get('title', '')}: {r.get('snippet', '')}" for r in results[:6]
            )

            page_text = ""
            if urls:
                fetch = await client.post(
                    "https://api.fetch.tinyfish.ai",
                    headers={**headers, "Content-Type": "application/json"},
                    json={
                        "urls": urls[:3],
                        "format": "markdown",
                        "purpose": purpose,
                        "ttl": 0,
                    },
                )
                if fetch.status_code == 200:
                    fetched = fetch.json()
                    chunks: list[str] = []
                    for page in fetched.get("results") or []:
                        title = page.get("title") or ""
                        body = page.get("text") or page.get("description") or ""
                        if isinstance(body, dict):
                            body = str(body)
                        chunk = _clean(f"{title}\n{body}", 4000)
                        if len(chunk) > 80:
                            chunks.append(chunk)
                    page_text = "\n\n---\n\n".join(chunks)

            combined = _clean(
                f"Search snippets:\n{snippet_blob}\n\nPage content:\n{page_text}",
                12000,
            )
            if len(combined) < 120:
                return None

            return TopicContext(
                topic=topic,
                text=combined,
                source="tinyfish",
                urls=urls,
            )
    except Exception as exc:  # noqa: BLE001
        logger.warning("TinyFish failed: %s", exc)
        return None


async def fetch_wikipedia(topic: str) -> TopicContext | None:
    try:
        import httpx
    except ImportError:
        logger.warning("httpx not installed; skip Wikipedia context")
        return None

    title = quote(topic.strip().replace(" ", "_"))
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
    headers = {"User-Agent": "TriviaApp/1.0 (learning; contact@localhost)"}

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 404:
                # search fallback
                search = await client.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "opensearch",
                        "search": topic,
                        "limit": 1,
                        "namespace": 0,
                        "format": "json",
                    },
                    headers=headers,
                )
                data = search.json()
                if not data[1]:
                    return None
                title = quote(data[1][0].replace(" ", "_"))
                resp = await client.get(
                    f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}",
                    headers=headers,
                )
            if resp.status_code != 200:
                return None
            payload = resp.json()
            extract = payload.get("extract") or ""
            page_url = (payload.get("content_urls") or {}).get("desktop", {}).get("page") or ""
            if len(extract) < 80:
                return None
            return TopicContext(
                topic=topic,
                text=_clean(extract, 8000),
                source="wikipedia",
                urls=[page_url] if page_url else [],
            )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Wikipedia fetch failed: %s", exc)
        return None


async def fetch_crawl4ai(topic: str) -> TopicContext | None:
    """Optional: Crawl4AI → LLM-ready markdown from a search landing page."""
    try:
        from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
    except ImportError:
        return None

    # Use Wikipedia mobile page as a reliable crawl target
    target = f"https://en.wikipedia.org/wiki/{quote(topic.strip().replace(' ', '_'))}"
    try:
        browser = BrowserConfig(headless=True, verbose=False)
        run_cfg = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
        async with AsyncWebCrawler(config=browser) as crawler:
            result = await crawler.arun(url=target, config=run_cfg)
            md = ""
            if result and result.markdown:
                md = getattr(result.markdown, "fit_markdown", None) or getattr(
                    result.markdown, "raw_markdown", None
                ) or str(result.markdown)
            md = _clean(md, 12000)
            if len(md) < 200:
                return None
            return TopicContext(topic=topic, text=md, source="crawl4ai", urls=[target])
    except Exception as exc:  # noqa: BLE001
        logger.warning("Crawl4AI failed: %s", exc)
        return None


async def fetch_scrapegraph(topic: str, api_key: str | None = None) -> TopicContext | None:
    """Optional: ScrapeGraphAI SearchGraph with natural-language prompt."""
    if not api_key:
        return None
    try:
        from scrapegraphai.graphs import SearchGraph
    except ImportError:
        return None

    graph_config = {
        "llm": {
            "model": "groq/llama-3.1-8b-instant",
            "api_key": api_key,
            "temperature": 0.1,
        },
        "max_results": 3,
        "verbose": False,
    }
    prompt = (
        f"Extract concise, factual study notes about '{topic}' suitable for quiz flashcards. "
        "Include key terms, mechanisms, and non-obvious facts. Avoid ads and navigation junk."
    )
    try:
        graph = SearchGraph(prompt=prompt, config=graph_config)
        # SearchGraph.run is sync in many versions
        result = graph.run()
        text = _clean(str(result), 12000)
        if len(text) < 120:
            return None
        return TopicContext(topic=topic, text=text, source="scrapegraphai", urls=[])
    except Exception as exc:  # noqa: BLE001
        logger.warning("ScrapeGraphAI failed: %s", exc)
        return None


async def gather_topic_context(
    topic: str,
    *,
    groq_api_key: str | None = None,
    tinyfish_api_key: str | None = None,
    prefer_rich: bool = True,
) -> TopicContext:
    """
    Build a raw text corpus for RAG-style generation.
    Prefers TinyFish (free Search+Fetch), then optional scrapers, then Wikipedia.
    """
    if prefer_rich:
        ctx = await fetch_tinyfish(topic, tinyfish_api_key or os.getenv("TINYFISH_API_KEY"))
        if ctx:
            return ctx
        ctx = await fetch_scrapegraph(topic, groq_api_key)
        if ctx:
            return ctx
        ctx = await fetch_crawl4ai(topic)
        if ctx:
            return ctx

    ctx = await fetch_wikipedia(topic)
    if ctx:
        return ctx

    return TopicContext(
        topic=topic,
        text=(
            f"Topic: {topic}. Generate accurate educational flashcards from general knowledge. "
            "Prefer precise facts over vague statements."
        ),
        source="model_knowledge",
        urls=[],
    )
