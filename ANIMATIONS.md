# Success & Error Animations

Redesigned around a 3-tier feedback hierarchy so the intensity of the animation matches the size of the achievement, instead of every activity firing the same full "Celebration Burst" for a simple tap.

- **Tier 1 — Acknowledgment** (reveal/tap-to-hear tasks with no wrong answer): a small persistent check badge, no particles.
- **Tier 2 — Standard correct/incorrect** (most MCQ-style activities): a shared lift/flash for success, a soft amber "3-beat nudge" for wrong, anchored to where the child actually tapped.
- **Tier 3 — Milestone** (multi-step build tasks): richer, staggered, per-activity choreography on success; a targeted, partial correction on error rather than wiping everything.

---

## Shared building blocks

### 🎉 The "Celebration Burst"
File: `components/ui/CelebrationBurst.tsx` — unchanged. Reserved for genuine milestones (finishing a Sound Blender word, a Sound Sort placement, an Alien or Real/Missing Word/Odd One Out correct pick) and now anchored to the tapped element or relevant on-screen anchor rather than dead-center of the screen.

### ✅ `DoneCheckBadge`
File: `components/ui/DoneCheckBadge.tsx` — small white circle with a filled green check, springs in once. Replaces the burst for Tier 1 tap-and-reveal interactions.

### 🟠 The "3-beat nudge"
File: `lib/animations.ts` (`NUDGE_ANIMATE` / `NUDGE_TRANSITION`) — `x: [0, -6, 5, -3, 0]` over 0.3s. Replaces the old 4-8 beat, 0.45-0.6s shakes. Paired with an amber (`warning`) tint rather than harsh red, in line with "warm amber over harsh red."

---

## Per-activity

### Speedy Sounds (Tier 1)
- **Every tap**: tile gets a blue ring/fill, tactile press-settle (`scale: 0.97 → 1`), and a `DoneCheckBadge` pops in at the corner. No burst.

### Quick Review (Tier 1)
- **Every tap**: same pattern as Speedy Sounds — tactile press-settle + `DoneCheckBadge`, no burst.

### Tricky Trap (Tier 1)
- **Tapping a word**: unchanged handwritten checkmark (drawn stroke-by-stroke) and yellow tricky-letter pulse — kept exactly as-is, since it's the app's strongest piece of feedback design. The particle burst has been removed.

### Missing Sound (Tier 2)
- **Correct**: the chosen option now gets a visible success beat — a spring bounce (`scale: [1, 1.08, 1]`) and green fill/border — held briefly before advancing. Previously this had no success animation at all.
- **Wrong**: 3-beat nudge + amber tint (was: 8-beat shake + red tint).

### Rhyme Time (Tier 2)
- **Correct**: both tiles lift together (`y: [0, -10, 0]`) with a blue flash, instead of firing a burst.
- **Wrong**: a "see-saw" tilt — the two tiles rotate in opposite directions and settle, with an amber border/fill, instead of a horizontal shake.

### Alien or Real? (Tier 2)
- **Correct**: burst now anchored to the tapped button (not screen-center); the chosen button gets a bounce (`scale: [1, 1.08, 1]`) and a green fill. The other button is not highlighted.
- **Wrong**: the chosen button fades to 40% opacity with an amber border/fill; the unpicked button also dims. No thick rings on either side anymore — the explanation text below still states the correct answer.

### Missing Word (Tier 2)
- **Correct**: burst now anchored to the tapped option (not screen-center).
- **Wrong**: 3-beat nudge + amber tint (was: 6-beat shake + red tint).

### Odd One Out (Tier 2)
- **Correct**: burst anchored to the odd tile itself (not screen-center); the odd tile gets a small amber "Found!" badge with a sparkle icon instead of a blue ring, and the matching tiles get an amber underline instead of a green ring.
- **Wrong**: 3-beat nudge (already used amber, kept as the reference pattern).

### Word Builder (Tier 3)
- **Correct**: each filled slot bounces in left-to-right with a staggered delay (a "domino" effect, `scale: [1, 1.15, 1]` per slot, 0.08s stagger) instead of just sitting there filled.
- **Wrong**: only the slots that are actually wrong get nudged and briefly tinted amber, then ejected back to the tile bank — correctly-placed tiles stay put. Previously the entire tray shook and wiped itself on any mistake.

### Sound Blender (Tier 3)
- **Correct**: burst now anchored to the rocket handle at its docked (100%) position, rather than the track's right edge — a small but more accurate anchor fix.
- No wrong state (slider-based, nothing to get wrong).

### Sound Sort (Tier 2, tap-based per confirmed scope)
- **Correct**: the floating word card glides toward the chosen zone (`x` shift + shrink + fade) before the burst fires from that zone, instead of both card and burst sitting dead-center.
- **Wrong**: the card gives a small "lean toward the zone and spring back" nudge (`x: [0, ±24, 0]`) with an amber border, instead of a full shake.
- **Previous**: unchanged — silently removes the last chip.

### Write It
- Unchanged — no automatic right/wrong judgment, so nothing to animate.

---

## Quick reference table

| Activity | Tier | Success animation | Wrong animation |
|---|---|---|---|
| Speedy Sounds | 1 | Tactile settle + DoneCheckBadge | *(no wrong state)* |
| Quick Review | 1 | Tactile settle + DoneCheckBadge | *(no wrong state)* |
| Tricky Trap | 1 | Drawn-on checkmark + yellow letter pulse | *(no wrong state)* |
| Missing Sound | 2 | Bounce + green fill on the pick | 3-beat nudge + amber tint |
| Rhyme Time | 2 | Both tiles lift together + blue flash | See-saw tilt + amber |
| Alien or Real? | 2 | Burst from tapped button + bounce + green fill | Fade + amber on the pick |
| Missing Word | 2 | Burst from tapped option + green "Well done!" | 3-beat nudge + amber |
| Odd One Out | 2 | Burst from odd tile + amber "Found!" badge + underline | 3-beat nudge + amber |
| Word Builder | 3 | Domino staggered bounce across slots | Only wrong slots nudge + eject |
| Sound Blender | 3 | Burst from rocket's docked position | *(no wrong state)* |
| Sound Sort | 2 | Card glides into the chosen zone + burst | Card leans toward zone + springs back |
| Write It | — | *(none)* | *(none)* |
