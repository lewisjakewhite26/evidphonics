"""One-off: convert bare slug keys in graphemeIpa.json to grapheme_* slash format."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
p = ROOT / "data" / "graphemeIpa.json"
raw = json.loads(p.read_text(encoding="utf-8"))
out: dict[str, str] = {
    "_readme": (
        "Source of truth for isolated grapheme TTS (Eleven v3). "
        "Keys: grapheme_{slug}. Values: raw IPA wrapped in forward slashes (no XML tags). "
        "Regenerate: python scripts/extract_speech_segments.py"
    )
}
for k, v in sorted(raw.items()):
    if k.startswith("_"):
        continue
    key = k if k.startswith("grapheme_") else f"grapheme_{k}"
    ipa = str(v).strip().strip("/")
    out[key] = f"/{ipa}/"
p.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Migrated {len([x for x in out if x.startswith('grapheme_')])} entries")
