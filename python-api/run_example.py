"""
Quick local test (no server):

  set GROQ_API_KEY=...
  python run_example.py --topic doctor --difficulty hard
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys

from dotenv import load_dotenv

load_dotenv()

# Allow running from python-api/
sys.path.insert(0, os.path.dirname(__file__))

from deck_pipeline import GenerationRequest, run_deck_pipeline


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", default="Roman Empire")
    parser.add_argument("--difficulty", default="medium", choices=["easy", "medium", "hard"])
    parser.add_argument("--mode", default="study", choices=["study", "quiz"])
    parser.add_argument("--elo", type=float, default=None)
    parser.add_argument("--no-web", action="store_true")
    args = parser.parse_args()

    result = await run_deck_pipeline(
        GenerationRequest(
            topic=args.topic,
            difficulty=args.difficulty,
            mode=args.mode,
            player_elo=args.elo,
            use_web_context=not args.no_web,
            custom_prompt="",
        )
    )
    print(json.dumps(result.to_dict(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
