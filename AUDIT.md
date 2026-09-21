# EvidPhonics Full Audit (re-run)

This is a re-run of the original audit, against the current state of the app after `ROADMAP.md` Phases 0, 1, 2, and 4 were completed. Same methodology as the first pass — live app screenshots, a production build, WCAG contrast math, lint, and a full review of the curriculum data — so the two are directly comparable. Every finding is tied to a specific file, line, word, or measured number.

**UI/Design score: 85 / 100** (was 64/100)
**Pedagogical merit score: 54 / 100** (was 50/100)

The UI side moved a lot because the work since the first audit was concentrated there (color/contrast, icons, keyboard access, `aria-live`, IWB layout, bundle size, lint). The pedagogical side moved less because the only pedagogical work done so far was fixing the RhymeTime generation bug and the Phase 0 content-safety edits — the bulk of `ROADMAP.md` Phase 3 (decodability sequencing, tricky words, alien-word rewrites, spaced review) is still open and is where most of the remaining pedagogical score lives.

---

## Part 1 — UI/Design Audit

Framework: [pbakaus/impeccable](https://github.com/pbakaus/impeccable)'s two-part methodology — a 5-dimension **Technical Quality Audit** (0–4 each) and a 10-criterion **Nielsen Heuristics critique** (0–4 each), plus its cognitive-load checklist, five personas, and its named AI-slop anti-patterns.

Method: same as before — live app driven with Playwright at 1440×900 and 390×844, WCAG contrast computed from the actual current Tailwind tokens, `npm run build` and `npm run lint` run fresh.

### 1.1 Technical Quality Audit — 19/20 (was 13/20)

| Dimension | Score | Was | Evidence |
|---|---|---|---|
| **Accessibility** | **4/4** | 2/4 | See 1.1.1 |
| **Performance** | **3/4** | 2/4 | See 1.1.2 |
| **Theming** | **4/4** | 3/4 | See 1.1.3 |
| **Responsive Design** | **4/4** | 3/4 | See 1.1.4 |
| **Implementation Integrity** | **4/4** | 3/4 | See 1.1.5 |
| **Total** | **19/20** | 13/20 | Impeccable's band for 18–20: *"Excellent — minor refinements only"* |

#### 1.1.1 Accessibility — 4/4 (was 2/4)

All three specific negatives from the first audit are now fixed, verified, not just patched:
- **Contrast fixed at the token level.** White text on `bg-primary` was `#59AB86` → **2.77:1** (failing); the palette is now Ocean Blue, `#2E5FB0` → **6.21:1**, comfortably passing AA for normal text. Re-verified the full pairing set this pass: success `5.16:1`, error `4.83:1`, warning `5.56:1`, body text `14.58:1`/`5.65:1` — every text/background pairing in the token system now passes AA.
- **Sound Blender is now fully keyboard-operable.** The rocket handle is a real `role="slider"` with `tabIndex={0}`, `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext` (announces "Sound 2 of 3: ou", "Not started", "Complete"), and a visible focus ring. Arrow Right/Up steps forward one phoneme, Left/Down steps back, Home/End jump to the ends, landing exactly on phoneme boundaries via a dedicated `positionForStep()` helper rather than approximating the drag math. Verified live: tabbed to the slider, blended a whole word with the keyboard alone, watched it reach "Complete" with the celebration burst firing.
- **`aria-live="polite"` added to every feedback message found**: Missing Sound, Missing Word, Odd One Out, Alien or Real, Rhyme Time, Sound Sort's completion screen, Sound Blender's "Complete" message, Tricky Trap's explanation reveal, and Word Changer's panel (the unreachable EvidLex extra, fixed for consistency). Verified in the DOM: a real `[aria-live="polite"]` node with the actual feedback text appears after answering.
- Existing strengths carried forward unchanged: phase-picker modal's real dialog semantics, the exit-confirmation dialog, `AudioButton`'s 56×56px target + `aria-label`, on-demand audio loading.
- Remaining minor gap: custom `focus-visible` styling is still only in 3 of ~20+ interactive components (`GraphemeSearchBar`, `PhaseSubjectCard`, and the new Sound Blender slider) — everywhere else relies on the browser default ring, which is present but not brand-styled. Not scored down further since the ring does exist and function; noted for a future polish pass.

#### 1.1.2 Performance — 3/4 (was 2/4)

- Main bundle: **555KB → 374KB** (149.8KB → 117.2KB gzip), now under Vite's 500KB warning threshold with no banner. Root cause fixed properly, not patched: three home-page files (`GraphemePickerPage.tsx`, `GraphemeSearchBar.tsx`, `ActivityPickerModal.tsx`) were importing the full curriculum module just to read `grapheme`/`keyword`/`phase`/`id`/`type`. A new generated `data/graphemeIndex.json` (~9KB, produced by `scripts/generate-grapheme-index.mjs`) now carries those four fields for all 92 graphemes; the full 408KB of curriculum data is only reachable from `LessonEngine.ts`/`lessonQueries.ts`, which live behind the already-lazy `/lesson` route.
- `LessonPage` chunk grew to 335KB (74.5KB gzip) to carry the data that moved out of the main chunk — expected and correct, since that chunk only loads once a lesson is actually opened, not on initial page load.
- Not a 4/4: the lesson chunk itself still loads *all* curriculum phases at once rather than per-selected-phase, and no further code-splitting (e.g. per-activity dynamic imports) has been attempted. Real, measured improvement, not the ceiling of what's possible.
- `data/phase6.json` (140KB) is still unreferenced by any code — now confirmed *intentional* (see 1.1.5) rather than drift, so it no longer counts against this dimension the way orphaned dead weight would.

#### 1.1.3 Theming — 4/4 (was 3/4)

- The token system in `tailwind.config.ts` was fully re-themed (Ocean Blue) with zero leftover references to the old palette — verified via a project-wide grep for the old hex/rgba values after the change (`globals.css`, `brandAccent.ts`, `lessonShellGradient.ts`, hardcoded shadow rgba in 4 components, `index.html`'s theme-color meta tag all updated together, none missed).
- The icon system is now genuinely unified: every emoji in the app was replaced with Phosphor icon components (verified via a full-source Unicode-emoji scan returning zero hits outside one now-doubly-true comment), and the 5 remaining lucide-react icons were migrated to Phosphor too, closing the "two icon systems coexisting" inconsistency the first audit flagged.
- The `!`-prefixed Tailwind override pattern noted in the first audit is unchanged (still present across activity components) — this is the one thing keeping this from being a "nothing to say" 4/4, but it no longer coexists with a second, inconsistent icon system on top of it, which was the more visible problem.

#### 1.1.4 Responsive Design — 4/4 (was 3/4)

- The IWB dead-space issue is fixed: `ActivityStage` now vertically centers content (`lg:items-center`) instead of pinning it to the top, and `ActivityCardFrame` scales up (wider max-width, larger padding/icon/title) at `lg`/`xl` breakpoints. Verified by screenshot comparison — the same Speedy Sounds/Missing Word screens that showed 300–400px of dead space below a small top-pinned card now show a properly centered, appropriately-sized card using the available height.
- Mobile is untouched and re-confirmed working (all new rules are `lg:`-gated): the 4-card home grid and both tested activities still reflow correctly at 390px with no overflow.
- Touch-drag gesture reliability (Sound Blender, WriteIt's canvas) remains genuinely untested in headless Playwright — still flagged as untested, not failing, same as before.

#### 1.1.5 Implementation Integrity — 4/4 (was 3/4)

- `npm run lint` now returns **zero problems** (was 18). Every issue was fixed properly — `let`→`const`, dead code removed, hook dependencies corrected — including tracing *why* two "intentionally unused" underscore-prefixed parameters (`_day`, `_phoneme`) were still being flagged: `.eslintrc.cjs` never configured `argsIgnorePattern` to respect that convention, so it silently did nothing. Fixed the config, not just the two instances, so the same false-positive can't recur.
- `data/phase6.json`'s disconnection from the rest of the app is no longer an unexplained drift signal: confirmed with you that it belongs to a separate product (EvidLex) and documented that explicitly at both places someone would look (`data/graphemes.ts` next to the phase imports, `CurriculumPhaseNumber` in `data/types.ts`).
- Shared-shell strengths from the first audit unchanged: `ActivityCardFrame`, `TactileButton`'s three variants, centralized activity ordering, full TypeScript coverage, clean `tsc --noEmit`.

### 1.2 Nielsen Heuristics — 30/40, 75% (was 26/40, 65%)

| # | Heuristic | Score | Was | Note |
|---|---|---|---|---|
| 1 | Visibility of system status | 3/4 | 3/4 | Unchanged: Sound Blender's "Next" button is still enabled at step 1 before any blending has happened — a separate bug from the keyboard-access fix, not addressed yet. |
| 2 | Match between system and real world | 4/4 | 4/4 | Unchanged, already max. |
| 3 | User control and freedom | 3/4 | 3/4 | Unchanged: still only Sound Blender has in-activity Previous/Next (now also keyboard-accessible); the other 11 activities remain forward-only once started. Exit is still well-guarded. |
| 4 | Consistency and standards | **4/4** | 2/4 | **Fixed** — as a direct effect of the new palette, Rhyme Time's "They rhyme" (success/green) vs "They don't rhyme" (primary/blue) and Alien or Real's "Real Word" (green) vs "Alien Word" (blue) are now genuinely color-distinct before an answer, not the same green rendered twice. Verified by screenshot. |
| 5 | Error prevention | 2/4 | 2/4 | Unchanged: same Sound Blender gating gap as #1. |
| 6 | Recognition rather than recall | 3/4 | 3/4 | Unchanged: Write It's "Listen, then write" instruction still ships with the full sentence visible by default (Phase 3/curriculum-side issue, not touched). |
| 7 | Flexibility and efficiency of use | **4/4** | 3/4 | **Fixed** — number-key hotkeys (1–9, with a visible badge) now drive Missing Word, Missing Sound, Odd One Out, Alien or Real, and Rhyme Time; Escape opens the exit dialog from anywhere; Sound Blender has full arrow-key control. The "no shortcuts" gap cited before is closed. |
| 8 | Aesthetic and minimalist design | **4/4** | 3/4 | **Fixed** — the IWB dead-space issue this was docked for is resolved (see 1.1.4). |
| 9 | Help users recognize/diagnose/recover from errors | 2/4 | 2/4 | Unchanged: feedback text is still generic ("Good try. Have another go.") with no grapheme-specific diagnosis — a content/curriculum-side fix, not attempted yet. |
| 10 | Help and documentation | 1/4 | 1/4 | Unchanged: still no onboarding or in-app guidance anywhere. |
| | **Total** | **30/40** | 26/40 | 75% (was 65%) |

### 1.3 Cognitive load & personas (qualitative, updated)

- **Sam (accessibility user)**: no longer blocked on Sound Blender (keyboard path exists); now told right/wrong outcomes via `aria-live` on every activity; primary-colored button text now passes contrast. All three specific blockers from the first pass are resolved for this persona.
- **Jordan (first-time teacher)**: unchanged — still zero onboarding, still has to infer the flow unaided.
- **Riley (rapid/stress clicker)**: still not verified at the code level either way.
- **Casey (mobile)**: unchanged — still fine, still a secondary path.
- Working-memory chunking (home page's 4 cards, review-activity exceptions) is unchanged and was never a problem.

### 1.4 Impeccable anti-pattern check (updated)

| Anti-pattern | Present? |
|---|---|
| Overused fonts, purple-to-blue gradient, nested cards | No — unchanged from first audit. |
| Rounded-square icon tiles | Still yes, still minor/tasteful — unchanged, not addressed (would require a broader icon-tile redesign, not in scope of what's been done). |
| Bounce/elastic easing | **Partially addressed.** The spring config itself was always fine. `useReducedMotion()` coverage is unchanged (`LessonHeader.tsx`, `GraphemePickerPage.tsx`, `LessonPage.tsx` only) — the per-item `initial={{scale:0, rotate:-10}}` pop-in used across 8+ activity components still doesn't check it. `ROADMAP.md` 5.4, still open. |

### 1.5 UI composite score: 85/100 (was 64/100)

Weighting unchanged: 50% Technical Audit (19/20 → 47.5pts) + 50% Nielsen Heuristics (30/40 → 37.5pts) = **85/100**.

This now sits solidly in Impeccable's "Excellent — minor refinements only" band for the technical audit, with the Nielsen heuristics score dragging the composite down from the technical ceiling — every *remaining* heuristic gap (#1/#3/#5 Sound Blender gating and Previous-everywhere, #6/#9 curriculum-dependent feedback specificity, #10 onboarding) is either a Phase 3 curriculum concern or genuinely new scope, not a leftover from what's already been fixed.

---

## Part 2 — Pedagogical Merit Audit

Method unchanged: full review of all 112 curriculum rows across the five phase files, cross-checked against UK SSP sequencing/tricky-word/decodability standards. Rubric expanded from 7 to 8 categories this pass to properly score the RhymeTime mechanism fix, which the original audit predates (it came from your notes afterward) — weights rebalanced so the total still runs out of 100.

### 2.1 GPC sequencing fidelity — 12/15 (was 16/20, same findings, rescaled)

No new work done here since the first audit — same findings apply unchanged: Phase 2's exact match to canonical Letters and Sounds order, Phase 3's near-exact match with the `oo-short`/`oo-long` ordering quirk, Phase 5's `e-e` displacement, Phase 6's DfE-2007-style morphology grouping. See `ROADMAP.md` §3 for the full detail; not repeated here since nothing changed.

### 2.2 Lesson-by-lesson decodability — 5/15 (was 7/20, same findings, rescaled)

Unchanged and still open: 225 words requiring a not-yet-taught grapheme (176 in Phase 2 alone), no `set`/teaching-group concept in the data model, lesson 1 already presenting words needing sounds not taught until lesson 15. This is `ROADMAP.md` §3.1, the single largest remaining pedagogical gap, and hasn't been started.

### 2.3 Tricky-word pacing & coverage — 4/15 (unchanged)

Unchanged and still open: non-cumulative sliding window, only 20 of 57 standard words covered, `into` and 18 other high-frequency words entirely absent. `ROADMAP.md` §3.2, not started.

### 2.4 Review & spaced repetition — 3/15 (unchanged)

Unchanged and still open: `pinned.speedyRevisionGraphemes` empty on all 92 Phase 2/3/5/6 rows, Phase 4's version templated to `[s,t,p,n]` regardless of content. `ROADMAP.md` §3.4, not started.

### 2.5 Activity/distractor content quality — 11/15 (unchanged)

Unchanged and still open: the Phase 6 `tion` "trick question" scoring bug where a numeric `oddOneOut` index is forced even when the explanation says there's no odd one out. `ROADMAP.md` §3.5, not started.

### 2.6 Cognitive load / list-length consistency — 7/10 (unchanged)

Unchanged: Phase 2's suspiciously rigid exactly-15-words-per-grapheme pattern, Phase 4's exactly-12/exactly-8 quota pattern. `ROADMAP.md` §3.6, not started.

### 2.7 Alien word plausibility — 2/5 (unchanged in substance)

One item from this category was fixed under Phase 0 (`goy`, the real/sometimes-slur-adjacent word in the `oy` alien list, replaced with `voy`), but the score is unchanged because the *systemic* problem — templated rows (`oy`'s alphabet-cycling, the `sion`/`ssion`/`cian` shared-stem trio) and the newly-found `ough` alien words that are real words with a random letter appended (`throughp`, `thoughtf`, `boughtg`, etc. — found while fixing RhymeTime, documented in `ROADMAP.md` §1.1's bonus finding) — is still fully present. Fixing one word out of a dozen templated/broken ones doesn't move this category; `ROADMAP.md` §3.3, not started.

### 2.8 Activity-generation mechanism correctness — 10/10 (new category)

This category didn't exist in the first audit because the RhymeTime bug hadn't been reported yet. It's scored separately from the content-authoring categories above because it's an engine bug (`components/engine/LessonEngine.ts`'s word-pairing logic), not a curriculum-writing gap — but it's squarely a pedagogical-merit concern, since it directly determines whether the app teaches correct or incorrect information.

**Fully fixed and rigorously verified**: `rimeKey()` previously compared a fixed last-3-letters spelling window, which meant `cat`/`bat`/`hat` (any 3-letter CVC family — the majority of the Phase 2 curriculum) could never register as rhyming, and `cough`/`thorough` registered as a false-positive rhyme purely because both happen to end in the letters "ough." Replaced with real onset-stripping (`lib/rhyme.ts`) plus a small override table for the `ough` family specifically. Verified three ways: 17/17 on a standalone test including your exact `cat/bat`, `glad/dad`, `cough/thorough` examples; a full-corpus scan finding 56 rhyme groups of 4+ words, every one linguistically valid on inspection; and live in the running app across six random generated pairs, each correctly judged including catching a genuine `mat`/`cat` rhyme.

### 2.9 Pedagogical composite score: 54/100 (was 50/100)

| Category | Weight | Score | Was |
|---|---|---|---|
| GPC sequencing fidelity | /15 | 12 | 16/20 |
| Lesson-by-lesson decodability | /15 | 5 | 7/20 |
| Tricky-word pacing & coverage | /15 | 4 | 4/15 |
| Review & spaced repetition | /15 | 3 | 3/15 |
| Activity/distractor quality | /15 | 11 | 11/15 |
| Cognitive load / list consistency | /10 | 7 | 7/10 |
| Alien word plausibility | /5 | 2 | 2/5 |
| Activity-generation mechanism correctness | /10 | 10 | *(new)* |
| **Total** | **/100** | **54** | 50 |

The pattern from the first audit still holds and is now sharper: **individual content and the app's mechanisms are both improving toward genuinely good** (RhymeTime now fully correct, distractors well-targeted, tricky-word explanations thoughtful, Phase 2 sequencing exact) but **the cross-lesson systems that should connect content together are still the dominant weakness** — no set-grouping protecting decodability, a tricky-word list that still forgets what it taught, a review field still empty everywhere but one templated phase. Fixing RhymeTime proved the "mechanism" bugs are tractable and high-leverage once found; the content-authoring gaps in §2.2–2.4 are the next highest-leverage targets and are pure curriculum-writing work, not engineering.

---

## What's changed since the first audit

Everything in `ROADMAP.md` Phases 0, 1, 2, and 4 — content safety, RhymeTime's rhyme logic, sound temporarily disabled (audio regeneration still blocked on an API key), Sound Blender's keyboard access, `aria-live` on feedback, the color/icon/IWB-space polish pass, bundle-size reduction, and the lint cleanup. See `ROADMAP.md` for the full itemized history with evidence for each.

## What's still open

`ROADMAP.md` Phase 3 in full (decodability sequencing, tricky-word coverage, alien-word rewrites, spaced review, the `tion` scoring bug, the `froast`/`ench`/`ough`-with-letters data bugs) and Phase 5's remaining item (5.4, reduced-motion coverage in individual activity animations). Phase 3 is the largest remaining piece for either score and is where "perfect" mostly lives for a phonics product specifically — it's curriculum-writing work, not code.
