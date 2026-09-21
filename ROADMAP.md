# Roadmap to Perfection

**Status: Phases 0, 1 (partial — RhymeTime done, audio regeneration blocked on your API key), 2, 4, and 5 all done. Phase 3 — the curriculum content pass — is the only phase not started, and the only thing left on this list besides the audio regeneration step.**

Scores as of the last full re-audit (`AUDIT.md`): **UI 85/100** (was 64/100), **pedagogy 54/100** (was 50/100) — written before Phase 5 finished, so the UI score is now a slight underestimate; worth another audit run once Phase 3 is done, since that's where the next real movement happens on both sides.

This started as a combination of the scored audit with a fresh investigation into four things flagged from your own notes (RhymeTime, TTS, alien words, "gun"). All four checked out as real, and two of them (RhymeTime, TTS) turned out more serious once traced to root cause than the notes suggested. Everything below is ordered by **fix-first priority**, not by category — do the phases top to bottom if picking this back up.

Each item states: what's wrong, the evidence, and the fix. Where a fix needed an external dependency (API key) or a decision only you could make, that's flagged explicitly; everything else marked ✅ has been done and verified (screenshots, automated tests, `tsc`/`lint`/`build` all clean at time of writing).

---

## Phase 0 — Do today (content safety, zero excuse to wait) — ✅ DONE

All six words below have been removed from the curriculum data, including every dependent reference (segments, distractor options, odd-one-out sets, morphemes, roots, alien-word lists) — not just the primary word list. Verified: all four edited JSON files still parse, and every edited word's segment breakdown still spells the replacement word correctly.

| Removed | Replaced with | File / grapheme |
|---|---|---|
| `gun` (Phase 2 `g` list) | `gum` | `data/phase2.json` |
| `gun` (Phase 2 `u` list) | `jug` | `data/phase2.json` |
| `skull` | `skunk` | `data/phase2.json` `k` |
| `drug` | `snug` | `src/data/phase4.json` `g` |
| `bomb` | *(removed, not replaced — list still has 13 real "mb" words)* | `data/phase6.json` `mb` |
| `dumb` | *(removed, not replaced)* | `data/phase6.json` `mb` |
| `goy` | `voy` | `data/phase5.json` `oy` alien words |

Note on `bomb`/`dumb`: English only has about 13–15 common short words ending in silent `mb`, and the list already used nearly all of them — there wasn't a good unused real-word replacement that wasn't more obscure than what it replaced, so those two were simply dropped rather than swapped, and every sentence/odd-one-out set that used them as a *distractor* (neither was ever the correct answer) now uses another already-present word from the same list instead (`comb`, `numb`, `tomb`).

`knife`, `die`/`cried`, `poison`, `fat`, `trap`, `rob`, `scream`, `wimp` were left as-is per the original note (standard/defensible, your call if you want any changed).

### 0.1 Remove "gun" and other avoidable inappropriate words
Confirmed: **"gun" appears twice** in Phase 2 — the *Reception-age* phase — in both the `g` grapheme's word list (`got, gap, gig, gas, gut, gun, gel, gem, grid, grin, grip, grab, gust, glob, glad`) and the `u` grapheme's (`up, us, ug, cup, cut, sun, run, fun, bus, bun, gun, mud, bug, dug, tug`). Both lists already have 14 other perfectly good words — dropping "gun" costs nothing (e.g. swap for "gum" in the `g` list; the `u` list doesn't even need a replacement, it already has "bun"/"fun").

Also found and worth a decision each:
- **`bomb`, `dumb`** (Phase 6, `mb` grapheme) — both trivially replaceable; `comb, thumb, lamb, climb, numb, crumb, limb` are all valid untaken alternatives for the same silent-`b` pattern.
- **`drug`** (Phase 4, `g` cluster row) — no pedagogical need, easily swapped.
- **`skull`** (Phase 2, `k`) — mildly macabre for 4–5 year-olds, worth a second look.
- **`goy`** (Phase 5, `oy` alien-word list) — flagged as nonsense but is a real word, and one that's sometimes used as a mild ethnic slur — remove regardless of intent.
- Lower-priority, standard/defensible on review (keep unless you feel otherwise): `knife` (unavoidable for teaching silent-`kn`, non-violent object), `die`/`cried`/`dying` (standard, appears in every UK SSP scheme's `ie` word list), `poison` (standard `oi` vocabulary), `fat` (traditional CVC word, some modern schemes now avoid it for body-image sensitivity — your call), `trap`/`rob`/`scream`/`wimp` (all benign in context).

---

## Phase 1 — Fix the two broken core mechanisms — RhymeTime ✅ fixed, TTS partially fixed

These aren't polish issues — they're the app actively teaching two of the twelve activities backwards.

### 1.1 RhymeTime is fundamentally broken — root cause found — ✅ FIXED

Your notes were right, and it's worse than "some pairs are wrong." The entire rhyme/non-rhyme judgement in `components/engine/LessonEngine.ts` (`rimeKey`, line 328) is:

```ts
function rimeKey(w: string): string {
  const s = w.toLowerCase().replace(/[^a-z]/g, '')
  if (s.length <= 2) return s
  return s.slice(-3)
}
```

This compares the **last 3 letters of the spelling** — not the sound, and not the actual rime (vowel + what follows). Two devastating consequences, both verified against your real data:

- **For any 3-letter word, the "last 3 letters" window includes the onset consonant itself**, so two words that share the exact same rime never match. Proved directly against Phase 2's own `a` grapheme word list: `cat, bat, hat, mat, pat` — five words that all genuinely rhyme (`/æt/`) — each produce a *different* rime key (`cat`, `bat`, `hat`, `mat`, `pat`), so the generator finds **zero** genuine rhyme pairs among them and silently backfills the whole activity with non-rhyme pairs instead. This is exactly your "every word was a non-rhyme" observation, and it will reproduce on almost every short-word grapheme in Phase 2/3, since 3–4 letter CVC words are the majority of the early curriculum.
- **For irregular spellings, matching the last 3 letters produces false positives with zero regard for pronunciation.** Confirmed directly: Phase 5's `ough` grapheme word list is `through, rough, cough, thorough, ...` — `cough` and `thorough` both end in the literal spelling `ough` → last-3-chars `ugh` → the algorithm calls them a rhyme, despite `/kɒf/` and `/ˈθʌrə/` sharing no sound at all. This is your exact "cough and thorough" example, reproduced from the real word list.
- `glad`/`dad`: `glad` → `lad`, `dad` → `dad` (3-letter word, whole word is the "rime" window) — different keys, marked non-rhyming despite genuinely rhyming. Your exact example, confirmed.

**Fix applied**: replaced the fixed-3-letter-suffix comparison with real onset-stripping in a new `lib/rhyme.ts`. It strips the actual onset (single consonant, digraph, or legal 2–3 letter blend — `str`, `sh`, `kn`, `wr`, etc., not just "the first 3 characters") and compares what's left, plus a small hand-maintained override table for the `ough` family (`through/rough/cough/thorough/thought/drought/though` — six unrelated vowel sounds hiding behind identical spelling, confirmed as the only irregular-spelling words that actually appear in any grapheme's `words` list).

Verified three ways: a standalone unit test against 17 known cases (including your exact `cat/bat`, `glad/dad`, and `cough/thorough` examples — all now correct); a full-corpus scan that found 56 rhyme groups of 4+ words across the real data, every one linguistically valid on inspection (`cat/bat/hat/mat/pat`, `night/light/right/might/tight/sight/fight/bright/flight/fright/knight/slight`, `book/look/cook/shook/brook/crook/nook/took/hook`, etc.); and live in the running app — screenshotted six random generated pairs and confirmed the correct/incorrect feedback matched reality every time, including catching a genuine `mat/cat` rhyme.

Not pursued: hand-authoring `pinned.rhymeTimePairs` per grapheme (the data model supports it but it's ~90 graphemes of manual work for no real gain over the algorithmic fix) and a full pronouncing-dictionary lookup (real infra, not justified — the spelling-based approach now handles the curriculum correctly since RhymeTime only ever compares words from within the same grapheme's own list).

**Bonus finding while in this code**: `data/phase5.json`'s `ough` grapheme has a second, unrelated bug in its `alienWords` — `throughp, thoughb, thoughtf, boughtg, broughtk, foughtl, oughtm, roughn` are real words (`through`, `thought`, `bought`, `brought`, `fought`, `ought`, `rough`) each with one random letter stuck on the end. This is a second, concrete instance of the exact "real word with a letter tacked on" pattern you flagged for alien words generally — left for Phase 3.3 rather than fixed here since it's a content-quality issue, not a mechanism bug.

### 1.2 TTS "shouting" — root cause found and partially fixed

Confirmed this is **not** a text-to-speech issue at runtime — audio is pre-rendered MP3 (ElevenLabs, via `download_tts.py`), played back as static files (`lib/audio.ts`). ElevenLabs' prosody is sensitive to punctuation, so an exclamation mark in the source text at *generation time* produces a genuinely shouted-sounding recording — and that's baked into the MP3 permanently, independent of any later text edits.

Traced the exact reason last session's copy fix (removing exclamation marks from the UI text) didn't fix the audio: `speech_segments.json` (the snapshot fed to the TTS downloader) is **stale** — 299 of its 3,252 entries still contain `!`/`—`, including exactly the feedback lines fixed in source. Root cause of the staleness: `scripts/extract_speech_segments.py` has two hardcoded tuples, `STATIC_FEEDBACK` and `STATIC_UI_FEEDBACK`, that **duplicate the feedback strings as literal text instead of importing them from the components** — so they silently drifted out of sync the moment the component text changed.

**Already fixed**: updated those two tuples in `scripts/extract_speech_segments.py` to match the current (already-corrected) component text exactly.

**Still needed (I can't do this part — no API key in this environment)**:
1. Run `python scripts/extract_speech_segments.py` to regenerate a clean `speech_segments.json` (all `prompt_*`/`word_*`/`sentence_*` entries are pulled dynamically from the phase JSON, which is already clean — only the `feedback_*` entries needed the script fix above).
2. Diff old vs new `speech_segments.json` to get the exact list of changed keys (anywhere the *slug* is unaffected by punctuation removal — since slugs strip punctuation — the safest approach is to just regenerate every `feedback_*` file, since that's the fixed set, rather than trying to diff-detect).
3. Run `python download_tts.py --only feedback` with a valid `ELEVENLABS_API_KEY`/`ELEVENLABS_VOICE_ID` in `.env.local` to re-render just the feedback clips.
4. Spot-check a few `prompt_*` files too — if any of those 299 stale entries were prompts (not just feedback), they need regenerating as well; rerunning the full extraction + a full `--skip-existing` download pass will only fill in what's missing/changed if you first delete the stale files, or just re-run without `--skip-existing` for the affected category.

This is the single most upsetting bug from a child's perspective (per your description) and it's now fully diagnosed with a clear three-command fix — it just needs the API key to execute.

**Interim mitigation applied — ✅ DONE**: since the audio can't be regenerated yet, all sound is temporarily disabled via a single kill switch, `SOUND_ENABLED = false` in `lib/audio.ts`. Every audio call in the app routes through `playAudioUrl`, so this one flag silences everything — no shouty clips can play. Callers that gate UI state on "audio finished" (button pulse animations, auto-advance timers) still resolve normally, since `onEnd` still fires asynchronously; only the actual sound is skipped. Flip it back to `true` once the audio is regenerated — nothing else needs to change.

---

## Phase 2 — Accessibility blockers — ✅ DONE

### 2.1 Fix the primary-button contrast failure — ✅ DONE (fixed as a side effect of the color overhaul)
`white` text on the old `bg-primary` (`#59AB86`) computed to **2.77:1**, failing WCAG AA even for large text. When the palette was rebuilt around Ocean Blue (per your request to move off the sage-green/rose-pink look), every new color was deliberately chosen to also pass contrast: `white` on the new `#2E5FB0` primary is **6.21:1**, and the full token set (`success`, `warning`, `error`, body text) was re-verified to pass AA across the board. `TactileButton`'s `primary` variant now just inherits the fixed token — no separate change was needed once the palette itself was correct.

### 2.2 Give Sound Blender a keyboard path — ✅ DONE
The rocket handle is now a real `role="slider"` — `tabIndex={0}`, `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext` (announces "Sound 2 of 3: ou", "Not started", or "Complete"), with a visible focus ring. Arrow Right/Up steps forward one phoneme, Arrow Left/Down steps back, Home resets, End jumps to complete — each step lands exactly on a phoneme boundary via a new `positionForStep()` helper, so keyboard control is precise rather than approximating the pixel-drag math. The existing Left/Right word-to-word navigation (added when RhymeTime was fixed) still works when focus is elsewhere; the slider's own handler calls `stopPropagation()` so the two don't conflict. Verified end-to-end with Playwright: focused the slider, pressed ArrowRight 5 times, watched it reach "Complete" with the celebration burst firing — fully operable with zero mouse/touch input.

### 2.3 Add `aria-live="polite"` to feedback text — ✅ DONE
Added `role="status" aria-live="polite"` to every dynamic feedback message found across the app: Missing Sound's "Good try" hint, Missing Word's correct/wrong message, Odd One Out's reveal, Alien or Real's correct/wrong message, Rhyme Time's wrong-hint, Sound Sort's completion screen, Sound Blender's "Complete" message, Tricky Trap's per-word explanation reveal, and Word Changer's "Why it matters" panel (the Phase 6/EvidLex extra, fixed for consistency in case it gets wired in per 4.2). Rhyme Time's correct-answer state has no text to begin with (just a visual highlight + celebration burst) so there was nothing to wire there. Verified live: clicked an answer in Missing Word and confirmed a real `[aria-live="polite"]` node appears in the DOM carrying the actual feedback text ("Well done!").

---

## Phase 3 — Content depth & curriculum integrity (from AUDIT.md's pedagogical findings)

### 3.1 Fix lesson-by-lesson decodability
225 words (176 in Phase 2 alone) require a grapheme not yet taught at that lesson's position — e.g. lesson 1 (`s`) already presents "words" needing `a/t/i/p/o/u/e/n/m/l/k`, none taught yet. Root cause: no "teaching set" grouping exists in the data model (confirmed — no `set` field anywhere). **Fix**: either (a) add a `set`/`week-group` concept so word-blending practice only activates once a full set of 4–5 letters is taught, matching real Letters and Sounds practice, or (b) re-curate each grapheme's `words` array to only use cumulative-taught GPCs at that exact position — (a) is the structurally correct fix, (b) is the fast patch.

### 3.2 Make tricky words cumulative, not a sliding window
`trickyWords` currently drops words it already introduced (confirmed: `he`/`was` present at one grapheme, gone two graphemes later) and covers only 20 of the standard 57 Phase 2–5 tricky words — missing `we, me, be, you, her, said, so, have, like, some, come, were, there, little, one, do, when, out, what, into`. **Fix**: change the field to accumulate across the phase rather than reset per-grapheme, and backfill the missing 37 words into the appropriate phase positions.

### 3.3 Redo the alien-word lists against the real DfE standard
Fetched the actual 2025 Phonics Screening Check pupils' materials for comparison. The official pseudo-words are genuinely novel: `gox, yech, quog, virp, phope, saunt, thresk, strume` — no two share a template, none are a real word with a letter appended.

Our data, by contrast, has clearly templated (or outright broken) rows:
- **`oy` (Phase 5)**: `doy, foy, goy, hoy, koy, loy, moy, noy` — literally every consonant of the alphabet cycled through `+oy`, zero structural variety. (`goy` was a real, sometimes-slur-adjacent word — already removed under Phase 0; `voy` is a placeholder, the row still needs the real rewrite this section describes.)
- **`sion`/`ssion`/`cian` (Phase 6)**: `dravision/dravission/dravician`, `stovision/stovission/stovician`, `provibion/provibssion/provibcian` — the *same* nonsense stems (`dra-`, `sto-`, `provib-`, `fru-`, `clu-`, `gri-`, `tre-`) reused across all three rows with only the suffix swapped.
- **`ough` (Phase 5)** — found while fixing RhymeTime (Phase 1.1): `throughp, thoughb, thoughtf, boughtg, broughtk, foughtl, oughtm, roughn` are real words (`through`, `thought`, `bought`, `brought`, `fought`, `ought`, `rough`) each with one random letter stuck on the end — the exact "real word with a letter tacked on" pattern this section is about, in a third place.
- By contrast, `kn`/`wr` (Phase 6: `kneb, knig, knolt, knusp...` / `wreb, wrig, wrolt, wrusp...`) are actually well-built — genuinely novel-sounding, phonotactically legal, deliberately parallel to let kids compare the two graphemes. Not everything needs rewriting, just the mechanically-generated/broken rows.

**Fix**: hand-write replacement pseudo-words for `oy`, `ay` (also templated: `dray, fay, glay, jway, kray, mday, nplay, pway` — and `jway/mday/nplay/pway` are illegal English consonant clusters, not just unimaginative), `ea`, `ir`, `ough` (the corrupted `throughp`/`thoughtf`/etc. list), and the `sion`/`ssion`/`cian` trio, using the DfE examples as the quality bar: short, single-syllable-feeling, legal English clusters, no shared template stem within a row.

### 3.4 Populate spaced review
`pinned.speedyRevisionGraphemes` is empty on all 92 Phase 2/3/5/6 rows; Phase 4's version is populated but 14 of 20 rows share the identical `[s,t,p,n]` list regardless of the lesson's actual content. **Fix**: populate this field per-grapheme with genuinely relevant prior-phase graphemes (e.g. a vowel-digraph lesson should revise prior vowel digraphs, not the four earliest consonants).

### 3.5 Fix the Phase 6 `tion` scoring bug
One `oddOneOutSets` entry has an explanation stating "no odd one out" while the schema still forces a numeric answer index — a child who correctly says "they're all the same" would be marked wrong. Either remove the "trick question" framing or add a schema option for "no odd one out is correct."

### 3.6 Clean up the smaller data-integrity bugs (all confirmed, all trivial)
- `froast` and `ench` — non-words padding `src/data/phase4.json`'s `oa-p4`/`ch-p4` example-word lists to hit a fixed quota. Remove or replace.
- `clang` duplicated in `ng-p4.exampleWords`.
- `provibion` (Phase 6 `sion` alien word) is missing its own target grapheme — should be `provibsion` or similar.
- `jway, mday, nplay, pway` (Phase 5 `ay` alien words) violate legal English onset clusters — covered under 3.3 but flagged again since it's a plausibility bug independent of the templating issue.

---

## Phase 4 — Performance & dead weight — ✅ DONE

### 4.1 Stop eagerly bundling curriculum JSON — ✅ DONE
Main bundle was 555KB (150KB gzip), flagged by Vite's own build output. Root cause: `data/graphemes.ts` statically imports all of `phase2/3/5.json` + `src/data/phase4.json` (~408KB raw), and three home-page files (`GraphemePickerPage.tsx`, `GraphemeSearchBar.tsx`, `ActivityPickerModal.tsx`) imported straight from it just to read `grapheme`/`keyword`/`phase`/`id`/`type` — four tiny fields — for the phase cards, search box, and activity-availability check.

**Fix applied**: added `scripts/generate-grapheme-index.mjs`, which reads the same phase JSON files and writes a ~9KB `data/graphemeIndex.json` containing only those four fields per grapheme (92 total) plus the phase-level activity allowlist. All three home-page files now import from the new `data/graphemeIndex.ts` instead of the heavy module; `lib/graphemeSearch.ts`'s search/key functions were generalized to a small structural type so they work against either the light index or the full data unchanged. `data/graphemes.ts` itself is untouched and still exports the full data — it's just no longer reachable from the eager bundle, only from `LessonEngine.ts`/`lessonQueries.ts`, which live behind the already-lazy `/lesson` route.

Result: main chunk **555KB → 374KB** (a 33% cut, and back under Vite's 500KB warning threshold), lesson chunk grew to carry the data that moved out (335KB, only loaded once a lesson actually opens). Verified end-to-end: home page, phase modal, search, and activity picker all still work from the light index; opening an actual lesson still pulls the full data correctly and renders real content.

Re-run `node scripts/generate-grapheme-index.mjs` after editing any phase JSON's `grapheme`/`keyword`/`id`/`type`/`enabledActivities` fields — nothing else needs it, but this one goes stale silently if forgotten.

### 4.2 Decide what to do with Phase 6 — ✅ DECIDED & DOCUMENTED
You confirmed Phase 6 (morphology: `un-`, `dis-`, `-tion`, `-ful`, etc.) belongs to **EvidLex**, a separate product — not something to wire into EvidPhonics. Added explicit comments at `data/graphemes.ts` (next to the phase imports, explaining why `phase6.json` isn't among them) and on `CurriculumPhaseNumber` in `data/types.ts` (why it stops at 5), pointing at the existing EvidLex references that were already scattered in the codebase (`data/types.ts`'s `morphemes`/`roots` field comments, `lib/activityIcons.ts`). No code behavior changed — this was purely closing the "why does this exist and go unused" question for whoever looks next.

### 4.3 Clear the lint debt — ✅ DONE
`npm run lint` now returns **zero problems** (was 18, then briefly 20 mid-session before cleanup, settled at 17 before this pass). Fixed every remaining issue rather than just the "safe" subset:
- 5× `let` → `const` (never-reassigned bindings in `LessonEngine.ts` and `soundBlenderLayout.ts`)
- 4× genuinely dead code removed (`speakWord` import in `SoundSort.tsx`, `n` in `WordBuilder.tsx`, `SpeechRate` type alias in `lib/audio.ts`, an unused loop index in `soundBlenderLayout.ts`)
- 2× missing/unnecessary hook dependencies fixed properly (not suppressed) in `OddOneOut.tsx`, `MeaningMatch.tsx`, `WordBuilder.tsx`
- 1× `PhaseSubjectCard.tsx`'s `PHASE_META` un-exported (it was never imported anywhere else, so exporting it alongside the component was needlessly breaking Vite's fast-refresh boundary)
- 2× dependency arrays restructured for clarity (`modalGraphemes` wrapped in its own `useMemo` in `GraphemePickerPage.tsx`; `activities.join(',')` extracted to a named `activitiesKey` in `LessonPage.tsx`)
- **Root cause fixed, not papered over**: `_day` (`lessonQueries.ts`) and `_phoneme` (`lib/audio.ts`) were already using the underscore-prefix "intentionally unused" convention, but `.eslintrc.cjs` never configured `argsIgnorePattern`/`varsIgnorePattern` to respect it — so the convention silently did nothing. Added the config instead of just fixing these two instances, so the same false-positive doesn't recur for the next underscore-prefixed parameter someone writes.

Verified: clean `tsc --noEmit`, clean production build, and a full screenshot sweep across all 12 activities plus mobile confirmed zero behavioral change from any of the above.

---

## Phase 5 — Polish — ✅ DONE

### 5.1 Icon system consistency — ✅ DONE
Was: two icon systems coexisting (real SVG icons on the home page, raw Unicode emoji glyphs on every lesson/activity screen), including a duplicated speaker glyph right next to the app's own `AudioButton` SVG icon on the same screen. **Fix applied**: every emoji in the app was removed and replaced with Phosphor icon components — a shared `lib/activityIcons.ts` map now drives both the lesson header and activity cards from one source instead of two separately-hardcoded emoji lists, and the 5 remaining lucide-react icons were migrated to Phosphor too so it's genuinely one icon system everywhere. Verified with a full-source Unicode-emoji scan: zero hits.

### 5.2 Fix inconsistent button color-coding — ✅ DONE (fixed as a side effect of the color overhaul)
Was: both options in a binary choice rendered the same green before an answer (Rhyme Time, Alien or Real). Once the palette moved to Ocean Blue, `TactileButton`'s `success` variant (green) and default `primary` variant (blue) became genuinely color-distinct, so the existing variant assignment on these buttons (one `success`, one default) now reads correctly without any component change. Verified by screenshot.

### 5.3 Reclaim the IWB screen space — ✅ DONE
Was: on a 1440×900 desktop/projector viewport, most activities rendered a small centered card with 300–400px of dead space below it. **Fix applied**: `ActivityStage` now vertically centers on large viewports (`lg:items-center`) instead of pinning to the top, and `ActivityCardFrame` scales up (wider max-width, larger padding/icon/title text) at `lg`/`xl` breakpoints. Mobile untouched (all new rules are `lg:`-gated). Verified by before/after screenshot comparison on Speedy Sounds and Missing Word.

### 5.4 Respect reduced-motion everywhere, not just at the page-transition level — ✅ DONE
Was: `useReducedMotion()` only checked in 3 top-level files; 16 of 16 activity components used Framer Motion without checking it at all, so the `initial={{scale:0, rotate:-10}}` pop-in fired regardless of the OS reduced-motion preference. **Fix applied**: rather than threading `useReducedMotion()` into every animated element across 16 files (high risk of missing one), wrapped the whole app in Framer Motion's own `<MotionConfig reducedMotion="user">` in `src/main.tsx`. This is a first-party, one-line-scoped mechanism that automatically disables transform/layout animation for anyone with the OS preference set, app-wide, with no per-component changes needed. Verified the underlying signal reaches the browser correctly (`window.matchMedia('(prefers-reduced-motion: reduce)').matches` is `true` under Playwright's `reducedMotion: 'reduce'` context option) and confirmed no runtime regressions with a full screenshot sweep across all 12 activities under normal motion.

### 5.5 Ship keyboard shortcuts / Previous controls consistently — ✅ DONE
**Hotkeys/Escape/slider** (done previously): number-key hotkeys (1–9, visible corner badge via `TactileButton`'s `hotkey` prop) drive Missing Word, Missing Sound, Odd One Out, Alien or Real, and Rhyme Time; Escape opens the exit dialog from anywhere; Sound Blender has a full keyboard-operable slider plus Left/Right word navigation.

**Previous navigation** (this pass): added to the 8 activities where it made sense — Missing Word, Missing Sound, Alien or Real, Rhyme Time, Odd One Out, Word Builder, Sound Sort, and Write It (a matching `CaretLeft` icon button next to its existing `CaretRight` "Next"). Each reuses the per-item reset logic the component already had for moving *forward*, so going back re-triggers the same clean reset rather than needing new state machinery. Sound Sort was the one genuinely tricky case — its "current index" isn't the whole story, since a correct sort permanently appends the word to one of two result-chip lists for the final summary screen; Previous now also pops that chip back off (verified live: chip count dropped from 1 to 0 on going back one step, no crash).

Left alone, correctly: Speedy Sounds, Quick Review, and Tricky Trap show every item on screen at once rather than one-at-a-time, so there's no "current position" for Previous to mean anything — not a gap, just not applicable to that interaction shape. Sound Blender already had its own Previous (word-to-word) from the earlier keyboard-access work.

Verified live with Playwright across every activity that got the button: hidden on the first item, appears after advancing, and — for the two randomized-correct-answer activities (Rhyme Time, Odd One Out) and the drag-free Sound Sort — confirmed by actually finding the correct choice and clicking through rather than assuming.

---

## Summary: current status

| Phase | Status |
|---|---|
| 0 — Content safety | ✅ Done |
| 1 — RhymeTime + TTS | ✅ RhymeTime fully fixed. TTS diagnosed + sound temporarily disabled; regeneration blocked on your ElevenLabs API key |
| 2 — Accessibility blockers | ✅ Done (contrast, Sound Blender keyboard path, live regions) |
| 3 — Curriculum content integrity | ⬜ Not started — decodability sequencing, tricky words, alien-word rewrites, spaced review, the `tion` scoring bug, the `froast`/`ench`/`ough` data bugs |
| 4 — Performance & dead weight | ✅ Done (bundle 555KB→374KB, Phase 6 documented, lint 18→0) |
| 5 — Polish | ✅ Done (icons, colors, IWB space, reduced-motion, hotkeys, Previous navigation) |

**What's left, in priority order:**
1. **Phase 3** — the only phase not started, and now the only substantial remaining effort. This is real curriculum-writing work, not code, and is where "perfect" mostly lives for a phonics product specifically. §3.1 (decodability sequencing) is the single highest-leverage item in it.
2. **Audio regeneration** (Phase 1.2's remaining steps) — needs your ElevenLabs API key; the pipeline bug is already fixed, it's a 3-command job once you have it.

Re-run the full audit (`AUDIT.md`) again after Phase 3 — that's where both scores will move the most from here.
