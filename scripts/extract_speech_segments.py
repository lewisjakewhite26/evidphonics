#!/usr/bin/env python3
"""
Scan EvidPhonics curriculum + activity sources and build speech_segments.json.

Includes words, sentences, activity prompts, curriculum explanations (Tricky Trap /
Odd One Out), morph-activity fields when present in phase JSON, and feedback strings.
Excludes isolated grapheme/phoneme sounds (use generate_grapheme_clips.py for those).

Run from repo root:
  python scripts/extract_speech_segments.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "speech_segments.json"

PHASE_DIRS = [ROOT / "data", ROOT / "src" / "data"]
LESSON_ENGINE = ROOT / "components" / "engine" / "LessonEngine.ts"
ACTIVITY_DIR = ROOT / "components" / "activities"

# Spoken checklist items (Write It activity)
WRITE_IT_CHECKLIST = ("Capital letter", "Finger spaces", "Full stop")

# Feedback / encouragement shown in activities (for future spoken feedback TTS)
STATIC_FEEDBACK = (
    "Well done!",
    "Good try! Have another go.",
    "Good try — look for the sound that is different.",
    "Correct! That's a real word!",
    "Correct! That's an alien word!",
    "That's actually a real word!",
    "That's actually an alien word!",
)

# Activity UI copy (displayed today; included for future spoken feedback)
STATIC_UI_FEEDBACK = (
    "Found it! That's the odd one out.",
    "Sorting complete!",
    "Complete! You blended all the sounds!",
    "Start dragging to blend the sounds!",
    "What happened?",
)

# Meaning Match distractor pool (MeaningMatch.tsx)
MEANING_MATCH_OPTIONS = (
    "a person who",
    "without",
    "full of",
    "again",
    "wrongly",
    "the act of",
)

# Template spoken when morph activities use dynamic affixes (MeaningMatch.tsx)
MEANING_MATCH_PROMPT_TEMPLATE = "Match the meaning of {affix}."

# Word Changer quiz choice labels (displayed; may be spoken later)
WORD_CHANGER_CHOICES = (
    "We build a longer word from the root and an affix.",
    "We add the ending to the root.",
    "We add the beginning to the root.",
    "We only swap two letters inside the root.",
    "We take letters off the end of the root.",
    "The root splits into two separate words.",
    "Nothing new is added — the word stays the same.",
)

WORD_LIST_KEYS = (
    "words",
    "alienWords",
    "exampleWords",
    "blendWords",
    "quickReviewWords",
    "wordBuilderWords",
)


def slugify(text: str, max_len: int = 40) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    if not s:
        s = "empty"
    if len(s) > max_len:
        s = s[:max_len].rstrip("-")
    return s or "empty"


def missing_word_for_speech(text: str) -> str:
    spoken = re.sub(r"_{2,}", " blank ", text)
    return re.sub(r"\s+", " ", spoken).strip()


def is_probably_word(text: str, grapheme_forms: set[str]) -> bool:
    t = text.strip()
    if not t:
        return False
    if t.lower() in grapheme_forms:
        return False
    # Skip bare grapheme-like tokens (single letter / known digraph slug)
    if len(t) <= 2 and t.isalpha() and t.lower() in grapheme_forms:
        return False
    return True


class SegmentCollector:
    """Value-deduped segment registry with slug collision suffixes."""

    def __init__(self) -> None:
        self.segments: dict[str, str] = {}
        self._value_keys: dict[str, str] = {}

    def add(self, prefix: str, text: str) -> None:
        text = text.strip()
        if not text:
            return
        norm = text.casefold()
        if norm in self._value_keys:
            return

        base = slugify(text)
        key = f"{prefix}_{base}"
        if key in self.segments:
            n = 2
            while f"{prefix}_{base}_{n}" in self.segments:
                n += 1
            key = f"{prefix}_{base}_{n}"

        self.segments[key] = text
        self._value_keys[norm] = key

    def count_prefix(self, prefix: str) -> int:
        p = f"{prefix}_"
        return sum(1 for k in self.segments if k.startswith(p))


def load_phase_entries(path: Path) -> tuple[list[dict[str, Any]], str | None]:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [], str(exc)

    if isinstance(raw, list):
        return [e for e in raw if isinstance(e, dict)], None
    if isinstance(raw, dict) and isinstance(raw.get("graphemes"), list):
        return [e for e in raw["graphemes"] if isinstance(e, dict)], None
    return [], "unexpected JSON shape (expected list or {graphemes: [...]})"


def discover_phase_files() -> list[Path]:
    found: list[Path] = []
    seen: set[str] = set()
    for directory in PHASE_DIRS:
        if not directory.is_dir():
            continue
        for path in sorted(directory.glob("phase*.json")):
            if path.name.endswith("-consistency-report.json"):
                continue
            key = str(path.resolve())
            if key not in seen:
                seen.add(key)
                found.append(path)
    return found


def collect_grapheme_forms(entries: list[dict[str, Any]]) -> set[str]:
    forms: set[str] = set()
    for entry in entries:
        g = entry.get("grapheme")
        if isinstance(g, str) and g.strip():
            forms.add(g.strip().casefold())

        for rel in entry.get("relatedGraphemes") or []:
            if isinstance(rel, str) and rel.strip():
                forms.add(rel.strip().casefold())

        for rev in entry.get("speedyRevisionGraphemes") or []:
            if isinstance(rev, str) and rev.strip():
                forms.add(rev.strip().casefold())

        pinned = entry.get("pinned")
        if isinstance(pinned, dict):
            for rev in pinned.get("speedyRevisionGraphemes") or []:
                if isinstance(rev, str) and rev.strip():
                    forms.add(rev.strip().casefold())

        segments = entry.get("segments")
        if isinstance(segments, dict):
            for segs in segments.values():
                if isinstance(segs, list):
                    for seg in segs:
                        if isinstance(seg, str) and seg.strip():
                            forms.add(seg.strip().casefold())

    return forms


def add_word(collector: SegmentCollector, grapheme_forms: set[str], word: str) -> None:
    if is_probably_word(word, grapheme_forms):
        collector.add("word", word)


def add_sentence(collector: SegmentCollector, text: str) -> None:
    spoken = missing_word_for_speech(text)
    if spoken:
        collector.add("sentence", spoken)


def extract_words_from_entry(
    collector: SegmentCollector,
    entry: dict[str, Any],
    grapheme_forms: set[str],
) -> None:
    keyword = entry.get("keyword")
    if isinstance(keyword, str):
        add_word(collector, grapheme_forms, keyword)

    for key in WORD_LIST_KEYS:
        for word in entry.get(key) or []:
            if isinstance(word, str):
                add_word(collector, grapheme_forms, word)

    for tricky in entry.get("trickyWords") or []:
        if isinstance(tricky, dict):
            w = tricky.get("word")
            if isinstance(w, str):
                add_word(collector, grapheme_forms, w)

    segments = entry.get("segments")
    if isinstance(segments, dict):
        for word in segments.keys():
            if isinstance(word, str):
                add_word(collector, grapheme_forms, word)

    for odd_set in entry.get("oddOneOutSets") or []:
        if not isinstance(odd_set, dict):
            continue
        for word in odd_set.get("words") or []:
            if isinstance(word, str):
                add_word(collector, grapheme_forms, word)

    pinned = entry.get("pinned")
    if isinstance(pinned, dict):
        for key in ("blendWords", "wordBuilderWords", "quickReviewWords"):
            for word in pinned.get(key) or []:
                if isinstance(word, str):
                    add_word(collector, grapheme_forms, word)
        for pair in pinned.get("rhymeTimePairs") or []:
            if isinstance(pair, dict):
                for k in ("word1", "word2"):
                    w = pair.get(k)
                    if isinstance(w, str):
                        add_word(collector, grapheme_forms, w)
        for alien in pinned.get("alienOrRealWords") or []:
            if isinstance(alien, dict):
                w = alien.get("word")
                if isinstance(w, str):
                    add_word(collector, grapheme_forms, w)
        for ms in pinned.get("missingSoundWords") or []:
            if isinstance(ms, dict):
                w = ms.get("word")
                if isinstance(w, str):
                    add_word(collector, grapheme_forms, w)


def extract_sentences_from_entry(
    collector: SegmentCollector,
    entry: dict[str, Any],
    grapheme_forms: set[str],
) -> None:
    for sentence in entry.get("writeItSentences") or []:
        if not isinstance(sentence, dict):
            continue
        text = sentence.get("text") or sentence.get("sentence")
        if isinstance(text, str):
            add_sentence(collector, text)

    for sentence in entry.get("missingWordSentences") or []:
        if not isinstance(sentence, dict):
            continue
        text = sentence.get("text") or sentence.get("sentence")
        if isinstance(text, str):
            add_sentence(collector, text)
        missing = sentence.get("missingWord") or sentence.get("answer")
        if isinstance(missing, str):
            add_word(collector, grapheme_forms, missing)
        for opt in sentence.get("options") or sentence.get("distractors") or []:
            if isinstance(opt, str):
                add_word(collector, grapheme_forms, opt)


def extract_explanations_from_entry(collector: SegmentCollector, entry: dict[str, Any]) -> None:
    """Tricky Trap + Odd One Out reveal text from curriculum JSON."""
    for tricky in entry.get("trickyWords") or []:
        if isinstance(tricky, dict):
            explanation = tricky.get("explanation")
            if isinstance(explanation, str):
                collector.add("prompt", explanation)

    for odd_set in entry.get("oddOneOutSets") or []:
        if not isinstance(odd_set, dict):
            continue
        explanation = odd_set.get("explanation") or odd_set.get("reason")
        if isinstance(explanation, str):
            collector.add("prompt", explanation)


def _extract_morph_node(
    collector: SegmentCollector,
    node: dict[str, Any],
    grapheme_forms: set[str],
) -> None:
    """Recognise morph-activity shapes anywhere in phase JSON."""
    if "affix" in node and "meaning" in node:
        affix = node.get("affix")
        meaning = node.get("meaning")
        if isinstance(affix, str) and affix.strip():
            collector.add("sentence", MEANING_MATCH_PROMPT_TEMPLATE.format(affix=affix.strip()))
        if isinstance(meaning, str):
            collector.add("prompt", meaning)
        for example in node.get("examples") or []:
            if isinstance(example, str):
                add_word(collector, grapheme_forms, example)

    if "root" in node and "result" in node and "meaningHint" in node:
        root = node.get("root")
        result = node.get("result")
        hint = node.get("meaningHint")
        if isinstance(root, str):
            add_word(collector, grapheme_forms, root)
        if isinstance(result, str):
            add_word(collector, grapheme_forms, result)
        if isinstance(root, str) and isinstance(result, str):
            collector.add("sentence", f"{root.strip()}. {result.strip()}.")
        if isinstance(hint, str):
            collector.add("prompt", hint)
        prefix = node.get("prefix")
        suffix = node.get("suffix")
        if isinstance(prefix, str) and prefix.strip():
            collector.add("prompt", f'We add the beginning "{prefix.strip()}" to the root.')
        if isinstance(suffix, str) and suffix.strip():
            collector.add("prompt", f'We add the ending "{suffix.strip()}" to the root.')

    if "word" in node and "root" in node and "distractorRoots" in node:
        word = node.get("word")
        root = node.get("root")
        if isinstance(word, str):
            add_word(collector, grapheme_forms, word)
            collector.add("sentence", word.strip())
        if isinstance(root, str):
            add_word(collector, grapheme_forms, root)
        distractors = node.get("distractorRoots")
        if isinstance(distractors, list):
            for d in distractors:
                if isinstance(d, str):
                    add_word(collector, grapheme_forms, d)

    if "word" in node and "morphemes" in node and isinstance(node.get("morphemes"), list):
        word = node.get("word")
        if isinstance(word, str):
            add_word(collector, grapheme_forms, word)
            collector.add("sentence", word.strip())
        for morpheme in node["morphemes"]:
            if isinstance(morpheme, str) and morpheme.strip():
                m = morpheme.strip()
                if m.casefold() not in grapheme_forms:
                    collector.add("prompt", m)


def walk_morph_data(
    obj: Any,
    collector: SegmentCollector,
    grapheme_forms: set[str],
) -> None:
    if isinstance(obj, dict):
        _extract_morph_node(collector, obj, grapheme_forms)
        for value in obj.values():
            walk_morph_data(value, collector, grapheme_forms)
    elif isinstance(obj, list):
        for item in obj:
            walk_morph_data(item, collector, grapheme_forms)


def extract_morph_from_entry(
    collector: SegmentCollector,
    entry: dict[str, Any],
    grapheme_forms: set[str],
) -> None:
    walk_morph_data(entry, collector, grapheme_forms)


def extract_ui_strings_from_activities(collector: SegmentCollector) -> None:
    """Pull hardcoded JSX copy and inline encouragement from activity components."""
    if not ACTIVITY_DIR.is_dir():
        return

    jsx_text_re = re.compile(
        r">(?:\s|&apos;|&#39;)*([A-Z][^<{]+?(?:[!?.]|\.{3}))(?:\s|&apos;|&#39;)*<"
    )
    encourage_re = re.compile(r"^\s*([A-Z][^<{]+[!?.])\s*$", re.MULTILINE)

    for path in ACTIVITY_DIR.glob("*.tsx"):
        source = path.read_text(encoding="utf-8")
        source = source.replace("&apos;", "'").replace("&#39;", "'")
        for match in jsx_text_re.finditer(source):
            text = re.sub(r"\s+", " ", match.group(1)).strip()
            if len(text) >= 4 and not text.startswith("{"):
                if any(
                    text.startswith(p)
                    for p in ("Correct!", "That's", "Good try", "Well done", "Found it", "Sorting")
                ):
                    collector.add("feedback", text)
                elif text.endswith("?"):
                    collector.add("prompt", text)
                else:
                    collector.add("feedback", text)
        for match in encourage_re.finditer(source):
            text = match.group(1).strip()
            if "Good try" in text or text.startswith("Well done"):
                collector.add("feedback", text)


def extract_prompts_from_lesson_engine(collector: SegmentCollector) -> None:
    if not LESSON_ENGINE.exists():
        return
    source = LESSON_ENGINE.read_text(encoding="utf-8")
    for match in re.finditer(r"instruction:\s*['\"]([^'\"]+)['\"]", source):
        collector.add("prompt", match.group(1))
    for item in WRITE_IT_CHECKLIST:
        collector.add("prompt", item)


def extract_prompts_from_activities(collector: SegmentCollector) -> None:
    if not ACTIVITY_DIR.is_dir():
        return
    instruction_re = re.compile(r"instruction:\s*['\"]([^'\"]+)['\"]")
    for path in ACTIVITY_DIR.glob("*.tsx"):
        source = path.read_text(encoding="utf-8")
        for match in instruction_re.finditer(source):
            collector.add("prompt", match.group(1))


def extract_feedback_strings(collector: SegmentCollector) -> None:
    for text in STATIC_FEEDBACK:
        collector.add("feedback", text)
    for text in STATIC_UI_FEEDBACK:
        collector.add("feedback", text)
    for text in MEANING_MATCH_OPTIONS:
        collector.add("prompt", text)
    for text in WORD_CHANGER_CHOICES:
        collector.add("prompt", text)

    if ACTIVITY_DIR.is_dir():
        feedback_re = re.compile(r"setFeedback\(\s*['\"]([^'\"]+)['\"]\s*\)")
        for path in ACTIVITY_DIR.glob("*.tsx"):
            source = path.read_text(encoding="utf-8")
            for match in feedback_re.finditer(source):
                collector.add("feedback", match.group(1))


def main() -> None:
    collector = SegmentCollector()
    parse_errors: list[str] = []
    all_entries: list[dict[str, Any]] = []

    phase_files = discover_phase_files()
    if not phase_files:
        print("WARNING: no phase*.json files found under data/ or src/data/")

    for path in phase_files:
        entries, err = load_phase_entries(path)
        if err:
            parse_errors.append(f"{path.relative_to(ROOT)}: {err}")
            continue
        if not entries:
            parse_errors.append(f"{path.relative_to(ROOT)}: no grapheme entries")
            continue
        all_entries.extend(entries)

    grapheme_forms = collect_grapheme_forms(all_entries)

    for path in phase_files:
        entries, err = load_phase_entries(path)
        if err or not entries:
            continue
        for entry in entries:
            extract_words_from_entry(collector, entry, grapheme_forms)
            extract_sentences_from_entry(collector, entry, grapheme_forms)
            extract_explanations_from_entry(collector, entry)
            extract_morph_from_entry(collector, entry, grapheme_forms)

    extract_prompts_from_lesson_engine(collector)
    extract_prompts_from_activities(collector)
    extract_feedback_strings(collector)
    extract_ui_strings_from_activities(collector)

    OUTPUT.write_text(
        json.dumps(collector.segments, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    total = len(collector.segments)
    print(f"Wrote {total} segments to {OUTPUT}")
    print()
    print("Breakdown by prefix:")
    for prefix in ("word", "prompt", "sentence", "feedback"):
        print(f"  {prefix}_  {collector.count_prefix(prefix)}")

    if parse_errors:
        print()
        print("Source files with issues:")
        for msg in parse_errors:
            print(f"  - {msg}")

    if total == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
