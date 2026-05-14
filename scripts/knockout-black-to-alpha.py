"""Make near-black pixels transparent (for logomark PNGs on black matte)."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow: pip install pillow", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    path = Path(__file__).resolve().parent.parent / "public" / "company-mark.png"
    if not path.is_file():
        print(f"Missing {path}", file=sys.stderr)
        sys.exit(1)

    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size

    # How "dark" a pixel must be to count as background (0–255).
    # Black plate ~0–15; anti-alias ring slightly higher.
    hard = 28
    soft = 72

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # Darkness: low max channel => likely background, not the violet ribbon.
            m = max(r, g, b)
            if m <= hard:
                px[x, y] = (r, g, b, 0)
            elif m >= soft:
                continue
            else:
                # Smooth edge between hard and soft
                t = (m - hard) / (soft - hard)
                new_a = int(round(a * t))
                px[x, y] = (r, g, b, new_a)

    im.save(path, "PNG", optimize=True)
    print(f"Wrote transparent PNG: {path}")


if __name__ == "__main__":
    main()
