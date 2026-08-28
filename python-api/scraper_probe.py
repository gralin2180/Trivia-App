"""One-off probe: show exactly what the context scraper collects for a topic."""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

_API_DIR = Path(__file__).resolve().parent
load_dotenv(_API_DIR / ".env", override=True)
load_dotenv(_API_DIR.parent / ".env", override=False)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

from deck_pipeline.context import gather_topic_context  # noqa: E402


async def main() -> None:
    topic = sys.argv[1] if len(sys.argv) > 1 else "samuelsalin.com"
    print(f"=== Scraper probe for topic: {topic!r} ===")
    print(f"TINYFISH_API_KEY set: {bool(os.getenv('TINYFISH_API_KEY'))}")
    print(f"GROQ_API_KEY set:     {bool(os.getenv('GROQ_API_KEY'))}")
    try:
        import scrapegraphai  # noqa: F401
        print("scrapegraphai installed: True")
    except ImportError:
        print("scrapegraphai installed: False")
    try:
        import crawl4ai  # noqa: F401
        print("crawl4ai installed:      True")
    except ImportError:
        print("crawl4ai installed:      False")
    print()

    ctx = await gather_topic_context(topic)
    print("--- RESULT ---")
    print(f"source:     {ctx.source}")
    print(f"urls:       {ctx.urls}")
    print(f"char_count: {ctx.char_count}")
    print("--- FULL TEXT COLLECTED ---")
    print(ctx.text)


if __name__ == "__main__":
    asyncio.run(main())
