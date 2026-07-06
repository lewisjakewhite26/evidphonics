#!/usr/bin/env python3
"""Convert teacher-recorded .webm graphemes to .mp3 for the app. Requires ffmpeg on PATH."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRAPHEMES = ROOT / "public" / "audio" / "graphemes"


def main() -> None:
    webms = sorted(GRAPHEMES.glob("*.webm"))
    if not webms:
        print(f"No .webm files in {GRAPHEMES}")
        sys.exit(1)

    ok = failed = 0
    for src in webms:
        dest = src.with_suffix(".mp3")
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(src),
            "-codec:a",
            "libmp3lame",
            "-qscale:a",
            "2",
            str(dest),
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            ok += 1
            print(f"ok  {dest.name}")
        except (subprocess.CalledProcessError, FileNotFoundError) as exc:
            failed += 1
            print(f"FAIL {src.name}: {exc}")

    print(f"\nDone. converted={ok}, failed={failed}")


if __name__ == "__main__":
    main()
