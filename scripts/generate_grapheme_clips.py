#!/usr/bin/env python3
"""
Generate grapheme MP3s via ElevenLabs full phrases + ffmpeg trim.

Pipeline per grapheme:
  1. Synthesise tts_text (full word/sentence) with eleven_multilingual_v2
  2. Save raw audio to public/audio/graphemes/_work/{slug}-full.mp3
  3. Trim per graphemeClipRecipe.json → public/audio/graphemes/{slug}.mp3

Recipes: data/graphemeClipRecipe.json (seed with scripts/seed_grapheme_clip_recipes.py)

Usage:
  python scripts/seed_grapheme_clip_recipes.py
  python scripts/generate_grapheme_clips.py --limit 5
  python scripts/generate_grapheme_clips.py --match au
  python scripts/generate_grapheme_clips.py --approve-all   # writes grapheme-approved.json

Requires: ffmpeg on PATH, requests, .env.local with ElevenLabs keys
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parent.parent

RECIPES_FILE = ROOT / "data" / "graphemeClipRecipe.json"
WORK_DIR = ROOT / "public" / "audio" / "graphemes" / "_work"
OUT_DIR = ROOT / "public" / "audio" / "graphemes"
APPROVED_FILE = ROOT / "public" / "audio" / "grapheme-approved.json"

TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
MODEL = "eleven_multilingual_v2"
VOICE_SETTINGS: dict[str, Any] = {
    "stability": 0.8,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": True,
}


def load_env_local() -> None:
    env_file = ROOT / ".env.local"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_env_local()

API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "")

_FFMPEG: str | None = None
_FFPROBE: str | None = None


def resolve_ffmpeg() -> str:
    global _FFMPEG
    if _FFMPEG:
        return _FFMPEG
    found = shutil.which("ffmpeg")
    if found:
        _FFMPEG = found
        return found
    try:
        import imageio_ffmpeg

        _FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
        return _FFMPEG
    except ImportError as exc:
        raise RuntimeError(
            "ffmpeg not on PATH. Install ffmpeg or: pip install imageio-ffmpeg"
        ) from exc


def resolve_ffprobe() -> str:
    global _FFPROBE
    if _FFPROBE:
        return _FFPROBE
    found = shutil.which("ffprobe")
    if found:
        _FFPROBE = found
        return found
    ffmpeg = resolve_ffmpeg()
    sibling = Path(ffmpeg).with_name("ffprobe.exe" if os.name == "nt" else "ffprobe")
    if sibling.exists():
        _FFPROBE = str(sibling)
        return _FFPROBE
    _FFPROBE = ffmpeg
    return _FFPROBE


def slug_from_key(key: str) -> str:
    return key.removeprefix("grapheme_")


def probe_duration_ms(path: Path) -> int:
    ffprobe = resolve_ffprobe()
    if Path(ffprobe).name.lower().startswith("ffprobe"):
        try:
            cmd = [
                ffprobe,
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(path),
            ]
            out = subprocess.check_output(cmd, text=True).strip()
            return int(float(out) * 1000)
        except (subprocess.CalledProcessError, ValueError):
            pass

    result = subprocess.run(
        [resolve_ffmpeg(), "-i", str(path)],
        capture_output=True,
        text=True,
        check=False,
    )
    for line in (result.stderr or "").splitlines():
        if "Duration:" in line:
            match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", line)
            if match:
                h, m, s = match.groups()
                return int((int(h) * 3600 + int(m) * 60 + float(s)) * 1000)
    raise RuntimeError(f"Could not read duration for {path}")


def ffmpeg_trim(src: Path, dest: Path, *, mode: str, start_ms: int, duration_ms: int) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)

    if mode == "end":
        total = probe_duration_ms(src)
        start_ms = max(0, total - duration_ms)
        mode = "start"

    start_sec = start_ms / 1000.0
    dur_sec = duration_ms / 1000.0

    cmd = [
        resolve_ffmpeg(),
        "-y",
        "-i",
        str(src),
        "-ss",
        f"{start_sec:.3f}",
        "-t",
        f"{dur_sec:.3f}",
        "-codec:a",
        "libmp3lame",
        "-qscale:a",
        "2",
        str(dest),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def download_tts(text: str, dest: Path) -> None:
    url = TTS_URL.format(voice_id=VOICE_ID)
    response = requests.post(
        url,
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        json={
            "text": text,
            "model_id": MODEL,
            "voice_settings": VOICE_SETTINGS,
        },
        timeout=120,
    )
    if response.status_code != 200:
        raise RuntimeError(f"HTTP {response.status_code}: {response.text[:300]}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(response.content)


def load_recipes() -> dict[str, dict]:
    if not RECIPES_FILE.exists():
        print(f"Missing {RECIPES_FILE}. Run: python scripts/seed_grapheme_clip_recipes.py")
        sys.exit(1)
    raw = json.loads(RECIPES_FILE.read_text(encoding="utf-8"))
    return {k: v for k, v in raw.items() if k.startswith("grapheme_") and isinstance(v, dict)}


def main() -> None:
    parser = argparse.ArgumentParser(description="ElevenLabs sentence + trim grapheme clips")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--match", default="", help="Substring filter on grapheme slug")
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--delay", type=float, default=0.3)
    parser.add_argument(
        "--approve-all",
        action="store_true",
        help="Write all recipe slugs to public/audio/grapheme-approved.json",
    )
    args = parser.parse_args()

    if not API_KEY or not VOICE_ID:
        print("Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env.local")
        sys.exit(1)

    recipes = load_recipes()
    items = sorted(recipes.items())

    if args.match:
        needle = args.match.lower()
        if needle.startswith("="):
            exact = needle[1:]
            items = [(k, v) for k, v in items if slug_from_key(k) == exact]
        else:
            items = [(k, v) for k, v in items if needle in slug_from_key(k)]

    if args.limit > 0:
        items = items[: args.limit]

    if args.approve_all:
        slugs = sorted(slug_from_key(k) for k, _ in items)
        APPROVED_FILE.write_text(json.dumps(slugs, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {len(slugs)} slugs to {APPROVED_FILE}")

    total = len(items)
    ok = skipped = failed = 0

    print(f"Generating {total} grapheme clip(s)")
    print(f"  model={MODEL}  work={WORK_DIR}  out={OUT_DIR}")

    for i, (key, recipe) in enumerate(items, start=1):
        slug = slug_from_key(key)
        tts_text = str(recipe.get("tts_text", "")).strip()
        trim_mode = str(recipe.get("trim_mode", "start"))
        trim_start = int(recipe.get("trim_start_ms", 0))
        trim_dur = int(recipe.get("trim_duration_ms", 400))

        if not tts_text:
            print(f"[{i}/{total}] SKIP {slug}: empty tts_text")
            skipped += 1
            continue

        out_mp3 = OUT_DIR / f"{slug}.mp3"
        full_mp3 = WORK_DIR / f"{slug}-full.mp3"

        if args.skip_existing and out_mp3.exists() and out_mp3.stat().st_size > 0:
            print(f"[{i}/{total}] skip (exists) {out_mp3.name}")
            skipped += 1
            continue

        try:
            download_tts(tts_text, full_mp3)
            ffmpeg_trim(
                full_mp3,
                out_mp3,
                mode=trim_mode,
                start_ms=trim_start,
                duration_ms=trim_dur,
            )
            ok += 1
            print(
                f"[{i}/{total}] ok  {out_mp3.name}  "
                f"<- {tts_text!r}  trim={trim_mode}@{trim_start}+{trim_dur}ms"
            )
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"[{i}/{total}] FAIL {slug}: {exc}")

        if args.delay > 0 and i < total:
            time.sleep(args.delay)

    print(f"\nDone. ok={ok}, skipped={skipped}, failed={failed}, total={total}")
    print(f"Listen to _work/*-full.mp3 to tune trim values in {RECIPES_FILE}")


if __name__ == "__main__":
    main()
