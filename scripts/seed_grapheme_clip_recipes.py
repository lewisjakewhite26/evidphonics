#!/usr/bin/env python3
"""
Build starter trim recipes for generate_grapheme_clips.py from grapheme_list_for_ipa.json.

Strategy (tune per entry in data/graphemeClipRecipe.json):
  - Most graphemes: speak keyword alone, trim from start (sound at word onset).
  - Suffix morphemes (tion, sion, -ful, …): speak keyword, trim from END of clip.

Run: python scripts/seed_grapheme_clip_recipes.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIST = ROOT / "grapheme_list_for_ipa.json"
OUT = ROOT / "data" / "graphemeClipRecipe.json"

SUFFIX_SLUGS = {
    "-ful",
    "-less",
    "-ly",
    "-ment",
    "-ness",
    "-tion-suffix",
    "tion",
    "sion",
    "ssion",
    "cian",
}

PREFIX_SLUGS = {"dis-", "mis-", "re-", "un-"}


def grapheme_len(slug: str) -> int:
    return max(1, len(re.sub(r"[^a-z0-9]", "", slug)) or 1)


def duration_ms(slug: str, *, from_end: bool) -> int:
    n = grapheme_len(slug)
    if from_end:
        if n >= 4:
            return 520
        return 420
    if n == 1:
        return 320
    if n == 2:
        return 400
    if n <= 4:
        return 480
    return 560


def main() -> None:
    rows = json.loads(LIST.read_text(encoding="utf-8"))
    recipes: dict[str, dict] = {
        "_readme": (
            "ElevenLabs sentence → trim → grapheme MP3. "
            "tts_text: full phrase to synthesise. "
            "trim_mode: start (default) keeps audio from trim_start_ms for trim_duration_ms; "
            "end keeps the last trim_duration_ms of the file. "
            "Tune values after listening to _work/{slug}-full.mp3."
        )
    }

    for row in rows:
        key = row["key"]
        slug = row["grapheme"]
        keyword = (row.get("keyword") or "").strip()

        from_end = (
            slug in SUFFIX_SLUGS
            or slug.endswith("-suffix")
            or (slug.startswith("-") and slug != "-")
        )

        if keyword:
            tts_text = keyword
            kw = keyword.lower()
            g = slug.lower().lstrip("-")
            # If the keyword does not open with the grapheme, skip the leading consonant(s).
            trim_start_ms = 0
            if g and not kw.startswith(g) and not from_end:
                trim_start_ms = 220 if len(g) >= 2 else 180
        elif slug in PREFIX_SLUGS or slug.rstrip("-") in {"dis", "mis", "re", "un"}:
            tts_text = f"{slug.replace('-', '')}happy."
            trim_start_ms = 0
        elif slug == "-":
            tts_text = "A table."
            trim_start_ms = 0
            from_end = False
        else:
            tts_text = f"{slug}."
            trim_start_ms = 0

        recipes[key] = {
            "tts_text": tts_text,
            "trim_mode": "end" if from_end else "start",
            "trim_start_ms": trim_start_ms,
            "trim_duration_ms": duration_ms(slug, from_end=from_end),
        }

    OUT.write_text(json.dumps(recipes, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(recipes) - 1} recipes to {OUT}")


if __name__ == "__main__":
    main()
