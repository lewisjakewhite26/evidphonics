#!/usr/bin/env python3
"""
ElevenLabs bulk downloader for EvidPhonics.

  grapheme_*  → use scripts/generate_grapheme_clips.py (sentence TTS + ffmpeg trim)
  word_*      → eleven_multilingual_v2 + plain text
  sentence_*  → eleven_multilingual_v2 + plain text
  prompt_*    → eleven_multilingual_v2 + plain text
  feedback_*  → eleven_multilingual_v2 + plain text

Voice settings are hardcoded on every request (stability 0.8, similarity_boost 0.75,
style 0.0, use_speaker_boost true).

Usage (PowerShell):
  # Keys in .env.local (gitignored) are loaded automatically, or:
  $env:ELEVENLABS_API_KEY = "your_key"
  $env:ELEVENLABS_VOICE_ID = "your_voice_id"
  python download_tts.py                    # words + sentences + prompts + feedback
  python download_tts.py --only word --limit 20

Output paths mirror lib/audioPaths.ts:
  public/audio/graphemes/{slug}.mp3
  public/audio/words/{slug}.mp3
  public/audio/sentences/{slug}.mp3
  public/audio/prompts/{slug}.mp3
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parent


def _load_env_local() -> None:
    """Load .env.local into os.environ (gitignored — keys never committed)."""
    env_file = ROOT / ".env.local"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_env_local()

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "YOUR_ELEVENLABS_API_KEY_HERE")
ELEVENLABS_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "YOUR_VOICE_ID_HERE")

MODEL_GRAPHEMES = "eleven_v3"
MODEL_PLAIN = "eleven_multilingual_v2"

VOICE_SETTINGS: dict[str, Any] = {
    "stability": 0.8,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": True,
}

TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

SEGMENTS_FILE = ROOT / "speech_segments.json"
AUDIO_ROOT = ROOT / "public" / "audio"


def normalize_slug(value: str) -> str:
    s = value.lower().strip()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9-]", "", s)
    return s or "empty"


def segment_category(key: str) -> str:
    if key.startswith("grapheme_"):
        return "grapheme"
    if key.startswith("word_"):
        return "word"
    if key.startswith("sentence_"):
        return "sentence"
    if key.startswith("prompt_"):
        return "prompt"
    if key.startswith("feedback_"):
        return "feedback"
    return "misc"


def output_path_for_key(key: str, text: str) -> Path:
    """Match lib/audioPaths.ts URL layout under public/audio/."""
    if key.startswith("grapheme_"):
        slug = key.removeprefix("grapheme_")
        return AUDIO_ROOT / "graphemes" / f"{slug}.mp3"
    if key.startswith("word_"):
        return AUDIO_ROOT / "words" / f"{normalize_slug(text)}.mp3"
    if key.startswith("sentence_"):
        return AUDIO_ROOT / "sentences" / f"{normalize_slug(text)}.mp3"
    if key.startswith("prompt_"):
        slug = key.removeprefix("prompt_")
        return AUDIO_ROOT / "prompts" / f"{slug}.mp3"
    if key.startswith("feedback_"):
        slug = key.removeprefix("feedback_")
        return AUDIO_ROOT / "feedback" / f"{slug}.mp3"
    return AUDIO_ROOT / "misc" / f"{normalize_slug(key)}.mp3"


def load_segments() -> dict[str, str]:
    if not SEGMENTS_FILE.exists():
        print(f"Missing {SEGMENTS_FILE}. Run: python scripts/extract_speech_segments.py")
        sys.exit(1)
    data = json.loads(SEGMENTS_FILE.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        print("speech_segments.json must be a JSON object")
        sys.exit(1)
    return {str(k): str(v) for k, v in data.items() if str(v).strip()}


def safe_log_text(text: str, max_len: int = 60) -> str:
    """ASCII-safe snippet for Windows console (IPA in log lines)."""
    return text[:max_len].encode("ascii", "backslashreplace").decode("ascii")


def resolve_grapheme_tts(text: str) -> tuple[str, str]:
    """
    Grapheme clips: slash-wrapped text → v3 IPA; plain text → v2 phonetic alias.
    Never use XML/SSML phoneme tags.
    """
    stripped = text.strip()
    if stripped.startswith("<"):
        raise ValueError(f"grapheme text must not use XML: {text!r}")
    if stripped.startswith("/") and stripped.endswith("/"):
        return MODEL_GRAPHEMES, stripped
    if "/" in stripped:
        raise ValueError(f"ambiguous grapheme payload (mixed slashes): {text!r}")
    return MODEL_PLAIN, stripped


def download_segment(key: str, text: str, dest: Path) -> str:
    category = segment_category(key)

    if category == "grapheme":
        model_id, payload_text = resolve_grapheme_tts(text)
    elif category in ("word", "sentence", "prompt", "feedback"):
        model_id = MODEL_PLAIN
        payload_text = text.strip()
    else:
        model_id = MODEL_PLAIN
        payload_text = text.strip()

    dest.parent.mkdir(parents=True, exist_ok=True)
    url = TTS_URL.format(voice_id=ELEVENLABS_VOICE_ID)

    body = {
        "text": payload_text,
        "model_id": model_id,
        "voice_settings": VOICE_SETTINGS,
    }

    response = requests.post(
        url,
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        json=body,
        timeout=120,
    )
    if response.status_code != 200:
        detail = response.text[:300]
        raise RuntimeError(f"HTTP {response.status_code}: {detail}")

    dest.write_bytes(response.content)
    return model_id


def main() -> None:
    parser = argparse.ArgumentParser(description="Dual-model ElevenLabs TTS downloader")
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--limit", type=int, default=0, help="First N segments after filtering (0 = all)")
    parser.add_argument(
        "--only",
        choices=("grapheme", "word", "sentence", "prompt", "feedback", "all"),
        default="all",
        help="Download one category only",
    )
    parser.add_argument("--delay", type=float, default=0.25, help="Seconds between API calls")
    parser.add_argument(
        "--match",
        default="",
        help="Only keys containing this substring (e.g. tion)",
    )
    args = parser.parse_args()

    if ELEVENLABS_API_KEY.startswith("YOUR_"):
        print("Set ELEVENLABS_API_KEY")
        sys.exit(1)
    if ELEVENLABS_VOICE_ID.startswith("YOUR_"):
        print("Set ELEVENLABS_VOICE_ID")
        sys.exit(1)

    segments = load_segments()
    items = [(k, v) for k, v in segments.items() if not k.startswith("grapheme_")]

    if args.only != "all":
        items = [(k, v) for k, v in items if segment_category(k) == args.only]

    if args.match:
        needle = args.match.lower()
        items = [(k, v) for k, v in items if needle in k.lower()]

    if args.limit > 0:
        items = items[: args.limit]

    total = len(items)
    ok = skipped = failed = 0

    print(f"Downloading {total} segment(s) to {AUDIO_ROOT}")
    print(f"  grapheme_*  -> {MODEL_GRAPHEMES} (IPA /.../) or {MODEL_PLAIN} (plain alias)")
    print(f"  word/sentence/prompt_* -> {MODEL_PLAIN}  (plain text)")
    print(f"  voice_settings -> {VOICE_SETTINGS}")

    for i, (key, text) in enumerate(items, start=1):
        dest = output_path_for_key(key, text)
        rel = dest.relative_to(ROOT)

        if args.skip_existing and dest.exists() and dest.stat().st_size > 0:
            skipped += 1
            print(f"[{i}/{total}] skip (exists) {rel}")
            continue

        try:
            model_id = download_segment(key, text, dest)
            ok += 1
            print(f"[{i}/{total}] ok  {rel}  <-  {safe_log_text(text)!r}  [{model_id}]")
        except Exception as exc:  # noqa: BLE001 — CLI: surface API/validation errors
            failed += 1
            print(f"[{i}/{total}] FAIL {rel}: {exc}")

        if args.delay > 0 and i < total:
            time.sleep(args.delay)

    print(f"\nDone. downloaded={ok}, skipped={skipped}, failed={failed}, total={total}")


if __name__ == "__main__":
    main()
