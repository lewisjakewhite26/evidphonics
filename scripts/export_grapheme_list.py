#!/usr/bin/env python3
"""Export all graphemes for external IPA review."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IPA_FILE = ROOT / "data" / "graphemeIpa.json"
OUT_MD = ROOT / "grapheme_list_for_ipa.md"
OUT_JSON = ROOT / "grapheme_list_for_ipa.json"

PHASE_FILES = [
    ROOT / "data" / "phase2.json",
    ROOT / "data" / "phase3.json",
    ROOT / "data" / "phase5.json",
    ROOT / "data" / "phase6.json",
    ROOT / "src" / "data" / "phase4.json",
]


def normalize_slug(value: str) -> str:
    s = value.lower().strip()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9-]", "", s)
    return s or "empty"


def load_graphemes(path: Path) -> list[dict]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and isinstance(raw.get("graphemes"), list):
        return raw["graphemes"]
    return []


def main() -> None:
    ipa = json.loads(IPA_FILE.read_text(encoding="utf-8"))
    keywords: dict[str, str] = {}
    phases: dict[str, int | str] = {}
    types: dict[str, str] = {}

    for path in PHASE_FILES:
        for e in load_graphemes(path):
            g = e.get("grapheme", "")
            if not g:
                continue
            key = f"grapheme_{normalize_slug(g)}"
            keywords[key] = e.get("keyword", "")
            phases[key] = e.get("phase", "")
            types[key] = e.get("type", "grapheme")

    rows = []
    for key in sorted(k for k in ipa if k.startswith("grapheme_")):
        slug = key.removeprefix("grapheme_")
        rows.append(
            {
                "key": key,
                "grapheme": slug,
                "keyword": keywords.get(key, ""),
                "phase": phases.get(key, ""),
                "type": types.get(key, "grapheme"),
                "current_tts": ipa[key],
            }
        )

    OUT_JSON.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# EvidPhonics grapheme list",
        "",
        f"**{len(rows)} graphemes** — British English isolated sounds for phonics teaching.",
        "",
        "Ask for: IPA transcription for each **isolated grapheme sound** (not the keyword word).",
        "Format each as slash-wrapped IPA for Eleven v3, e.g. `/ʃən/`, or a plain v2 alias if IPA fails.",
        "",
        "| # | Grapheme | Keyword | Phase | Type | Current TTS |",
        "|---|----------|---------|-------|------|-------------|",
    ]
    for i, r in enumerate(rows, 1):
        kw = r["keyword"] or "—"
        ph = r["phase"] or "—"
        ty = r["type"] or "grapheme"
        tts = r["current_tts"].replace("|", "\\|")
        g = r["grapheme"].replace("|", "\\|")
        lines.append(f"| {i} | {g} | {kw} | {ph} | {ty} | {tts} |")

    lines += ["", "## Graphemes only (copy-paste)", ""]
    for r in rows:
        lines.append(f"- {r['grapheme']}")

    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_MD}")
    print(f"Wrote {OUT_JSON}")


if __name__ == "__main__":
    main()
