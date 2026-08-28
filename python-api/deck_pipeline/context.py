"""
Step 1 — Search & gather topic context (RAG corpus).

Providers (tried / merged):
1. Direct URL fetch when the topic looks like a domain or URL (TinyFish Fetch → raw httpx)
2. TinyFish Search + Fetch (free agent web APIs) if TINYFISH_API_KEY is set
3. DuckDuckGo HTML lite (no key) for extra URLs/snippets
4. Wikipedia REST API
5. Optional ScrapeGraphAI / Crawl4AI
6. model_knowledge fallback

When several sources return content we merge them so the LLM has denser facts.
"""

from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass, field
from urllib.parse import quote, urlparse

logger = logging.getLogger(__name__)

WIKI_UA = (
    "AcumenFlashcards/1.0 "
    "(https://github.com/acumen-app; educational flashcard generator)"
)

_DOMAIN_RE = re.compile(
    r"^(?:https?://)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)/?$",
    re.I,
)


@dataclass
class TopicContext:
    topic: str
    text: str
    source: str
    urls: list[str] = field(default_factory=list)

    @property
    def char_count(self) -> int:
        return len(self.text)


def _clean(text: str, limit: int = 12000) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


def _as_https_url(topic: str) -> str | None:
    """If topic is a bare domain or URL, return a normalised https URL."""
    raw = topic.strip()
    if " " in raw and not raw.lower().startswith(("http://", "https://")):
        return None
    if raw.lower().startswith(("http://", "https://")):
        parsed = urlparse(raw)
        if parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}{parsed.path or ''}".rstrip("/")
        return None
    m = _DOMAIN_RE.match(raw)
    if not m:
        return None
    host = m.group(1).lower()
    # Skip obvious non-sites
    if host.endswith((".png", ".jpg", ".jpeg", ".gif", ".pdf", ".svg")):
        return None
    return f"https://{host}"


def _merge_contexts(topic: str, parts: list[TopicContext]) -> TopicContext | None:
    usable = [p for p in parts if p and len(p.text) >= 80]
    if not usable:
        return None
    urls: list[str] = []
    seen_url: set[str] = set()
    blobs: list[str] = []
    sources: list[str] = []
    for p in usable:
        sources.append(p.source)
        blobs.append(f"[{p.source}]\n{p.text}")
        for u in p.urls:
            if u and u not in seen_url:
                seen_url.add(u)
                urls.append(u)
    return TopicContext(
        topic=topic,
        text=_clean("\n\n====\n\n".join(blobs), 14000),
        source="+".join(dict.fromkeys(sources)),
        urls=urls,
    )


async def _tinyfish_fetch_urls(
    urls: list[str],
    *,
    api_key: str,
    purpose: str,
) -> tuple[str, list[str]]:
    import httpx

    if not urls:
        return "", []
    headers = {"X-API-Key": api_key, "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60.0) as client:
        fetch = await client.post(
            "https://api.fetch.tinyfish.ai",
            headers=headers,
            json={
                "urls": urls[:5],
                "format": "markdown",
                "purpose": purpose,
                "ttl": 0,
            },
        )
        if fetch.status_code != 200:
            logger.warning("TinyFish fetch %s: %s", fetch.status_code, fetch.text[:200])
            return "", []
        fetched = fetch.json()
        chunks: list[str] = []
        kept: list[str] = []
        for page in fetched.get("results") or []:
            title = page.get("title") or ""
            body = page.get("text") or page.get("description") or ""
            if isinstance(body, dict):
                body = str(body)
            url = page.get("final_url") or page.get("url") or ""
            chunk = _clean(f"{title}\n{body}", 5000)
            if len(chunk) > 80:
                chunks.append(chunk)
                if url:
                    kept.append(url)
        return "\n\n---\n\n".join(chunks), kept


async def fetch_direct_url(topic: str, api_key: str | None = None) -> TopicContext | None:
    """When the topic is a website, fetch that site first (real page content)."""
    target = _as_https_url(topic)
    if not target:
        return None

    key = api_key or os.getenv("TINYFISH_API_KEY")
    purpose = f"Extract factual content about {topic} for educational flashcards"

    if key:
        try:
            page_text, urls = await _tinyfish_fetch_urls(
                [target, f"{target}/about", f"{target}/"],
                api_key=key,
                purpose=purpose,
            )
            if len(page_text) >= 120:
                return TopicContext(
                    topic=topic,
                    text=_clean(f"Primary site content from {target}:\n{page_text}", 12000),
                    source="tinyfish_direct",
                    urls=urls or [target],
                )
        except Exception as exc:  # noqa: BLE001
            logger.warning("TinyFish direct fetch failed: %s", exc)

    # Plain HTTP fallback (no JS) — better than nothing for simple sites.
    try:
        import httpx
        from html.parser import HTMLParser

        class _TextExtractor(HTMLParser):
            def __init__(self) -> None:
                super().__init__()
                self.parts: list[str] = []
                self._skip = 0

            def handle_starttag(self, tag, attrs):
                if tag in {"script", "style", "noscript", "svg"}:
                    self._skip += 1

            def handle_endtag(self, tag):
                if tag in {"script", "style", "noscript", "svg"} and self._skip:
                    self._skip -= 1

            def handle_data(self, data):
                if self._skip:
                    return
                t = data.strip()
                if t:
                    self.parts.append(t)

        async with httpx.AsyncClient(
            timeout=25.0,
            follow_redirects=True,
            headers={"User-Agent": WIKI_UA},
        ) as client:
            resp = await client.get(target)
            if resp.status_code != 200 or "html" not in (resp.headers.get("content-type") or ""):
                return None
            parser = _TextExtractor()
            parser.feed(resp.text[:200_000])
            text = _clean(" ".join(parser.parts), 10000)
            if len(text) < 120:
                return None
            return TopicContext(
                topic=topic,
                text=f"Primary site content from {target}:\n{text}",
                source="http_direct",
                urls=[str(resp.url)],
            )
    except Exception as exc:  # noqa: BLE001
        logger.warning("HTTP direct fetch failed: %s", exc)
        return None


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
    # Prefer the literal topic; add "facts" only for non-URL queries so we don't
    # drift to unrelated people (e.g. samuelsalin.com → Marshall Sahlins).
    query = topic.strip()
    if not _as_https_url(query):
        query = f"{topic} facts explained"

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            search = await client.get(
                "https://api.search.tinyfish.ai",
                params={
                    "query": query,
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
            urls = [r.get("url") for r in results[:5] if r.get("url")]
            snippet_blob = "\n".join(
                f"- {r.get('title', '')}: {r.get('snippet', '')}" for r in results[:8]
            )

            page_text, kept = await _tinyfish_fetch_urls(
                urls[:4],
                api_key=key,
                purpose=purpose,
            )
            if kept:
                urls = list(dict.fromkeys(kept + urls))

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


async def fetch_duckduckgo(topic: str) -> TopicContext | None:
    """Key-free DuckDuckGo HTML search — snippets + candidate URLs."""
    try:
        import httpx
    except ImportError:
        return None

    q = quote(topic.strip())
    url = f"https://html.duckduckgo.com/html/?q={q}"
    try:
        async with httpx.AsyncClient(
            timeout=20.0,
            follow_redirects=True,
            headers={"User-Agent": WIKI_UA},
        ) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            html = resp.text
            # Lightweight parse: result titles/snippets from DDG HTML.
            titles = re.findall(
                r'class="result__a"[^>]*>(.*?)</a>',
                html,
                flags=re.I | re.S,
            )
            snippets = re.findall(
                r'class="result__snippet"[^>]*>(.*?)</(?:a|td)',
                html,
                flags=re.I | re.S,
            )
            hrefs = re.findall(
                r'class="result__a"[^>]*href="([^"]+)"',
                html,
                flags=re.I,
            )

            def strip_tags(s: str) -> str:
                return _clean(re.sub(r"<[^>]+>", " ", s), 400)

            lines: list[str] = []
            urls: list[str] = []
            for i, title in enumerate(titles[:6]):
                snip = strip_tags(snippets[i]) if i < len(snippets) else ""
                lines.append(f"- {strip_tags(title)}: {snip}")
                if i < len(hrefs):
                    href = hrefs[i]
                    # DDG wraps redirects; keep absolute http(s) only.
                    if href.startswith("http"):
                        urls.append(href.split("&")[0])

            blob = _clean("DuckDuckGo results:\n" + "\n".join(lines), 6000)
            if len(blob) < 120:
                return None
            return TopicContext(topic=topic, text=blob, source="duckduckgo", urls=urls[:5])
    except Exception as exc:  # noqa: BLE001
        logger.warning("DuckDuckGo failed: %s", exc)
        return None


async def fetch_wikipedia(topic: str) -> TopicContext | None:
    try:
        import httpx
    except ImportError:
        logger.warning("httpx not installed; skip Wikipedia context")
        return None

    # Domains rarely have wiki pages — skip the noise.
    if _as_https_url(topic):
        return None

    title = quote(topic.strip().replace(" ", "_"))
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
    headers = {"User-Agent": WIKI_UA}

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 404:
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

    target = _as_https_url(topic) or (
        f"https://en.wikipedia.org/wiki/{quote(topic.strip().replace(' ', '_'))}"
    )
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
    Merges direct-site + search + wiki when available.
    """
    if not prefer_rich:
        return TopicContext(
            topic=topic,
            text=(
                f"Topic: {topic}. Generate accurate educational flashcards from general knowledge. "
                "Prefer precise facts over vague statements."
            ),
            source="model_knowledge",
            urls=[],
        )

    tf_key = tinyfish_api_key or os.getenv("TINYFISH_API_KEY")
    parts: list[TopicContext] = []

    direct = await fetch_direct_url(topic, tf_key)
    if direct:
        parts.append(direct)
        logger.info("context: direct site %s chars=%s", direct.source, direct.char_count)

    tf = await fetch_tinyfish(topic, tf_key)
    if tf:
        parts.append(tf)
        logger.info("context: tinyfish chars=%s urls=%s", tf.char_count, len(tf.urls))

    # DuckDuckGo fills gaps when TinyFish is missing or thin.
    if not tf or tf.char_count < 800:
        ddg = await fetch_duckduckgo(topic)
        if ddg:
            parts.append(ddg)
            logger.info("context: duckduckgo chars=%s", ddg.char_count)

    wiki = await fetch_wikipedia(topic)
    if wiki:
        parts.append(wiki)
        logger.info("context: wikipedia chars=%s", wiki.char_count)

    if not parts:
        ctx = await fetch_scrapegraph(topic, groq_api_key)
        if ctx:
            parts.append(ctx)
        ctx = await fetch_crawl4ai(topic)
        if ctx:
            parts.append(ctx)

    merged = _merge_contexts(topic, parts)
    if merged:
        logger.info(
            "context: merged source=%s chars=%s urls=%s",
            merged.source,
            merged.char_count,
            len(merged.urls),
        )
        return merged

    logger.warning("context: no web sources for %r — falling back to model knowledge", topic)
    return TopicContext(
        topic=topic,
        text=(
            f"Topic: {topic}. Generate accurate educational flashcards from general knowledge. "
            "Prefer precise facts over vague statements. "
            "If this looks like a website, focus on what that site/person is known for "
            "only when you are confident; otherwise say you lack sources."
        ),
        source="model_knowledge",
        urls=[],
    )
