/** Brand gradient arc on the HSL wheel — violet / magenta / hot pink only (never green, orange, etc.). */
const BRAND_HUE_MIN = 250
const BRAND_HUE_MAX = 340

/** Phase picker cards (curriculum ids): spaced across the band so each reads distinct but on-brand. */
const PHASE_CARD_HUE_CENTER: Record<number, number> = {
  2: 262,
  3: 296,
  4: 312,
  5: 328,
}

function clampBrandHue(h: number): number {
  return Math.min(BRAND_HUE_MAX, Math.max(BRAND_HUE_MIN, Math.round(h)))
}

/** Two hue stops, both strictly inside [BRAND_HUE_MIN, BRAND_HUE_MAX]. */
function brandGradientHues(seed: number, r: (o: number) => number): [number, number] {
  const gap = 14 + r(2) * 22 // 14–36° separation

  let h1: number
  if (seed === 2 || seed === 3 || seed === 4 || seed === 5) {
    h1 = PHASE_CARD_HUE_CENTER[seed]!
  } else {
    const room = BRAND_HUE_MAX - BRAND_HUE_MIN - gap
    const spread = Math.max(1, room)
    const slot = (seed * 47 + Math.floor(r(11) * 97)) % 100
    h1 = BRAND_HUE_MIN + (slot / 99) * spread * 0.92 + spread * 0.04
  }

  h1 = clampBrandHue(h1 + (r(1) - 0.5) * 14)

  let h2 = h1 + gap
  if (h2 > BRAND_HUE_MAX) {
    h2 = h1 - gap
  }
  h2 = clampBrandHue(h2)

  if (Math.abs(h2 - h1) < 8) {
    h2 = clampBrandHue(Math.min(BRAND_HUE_MAX, h1 + 18))
    if (Math.abs(h2 - h1) < 8) {
      h1 = clampBrandHue(Math.max(BRAND_HUE_MIN, h2 - 18))
    }
  }

  return [h1, h2]
}

/** Procedural HSL linear gradient for activity tiles, phase cards, etc. */
export function generateTileGradient(seed: number): string {
  const seededRand = (offset: number) => {
    const x = Math.sin(seed * 12.9898 + offset * 43758.5453) * 10000
    return x - Math.floor(x)
  }

  const angle = Math.floor(seededRand(0) * 75 + 95)

  const [hue1, hue2] = brandGradientHues(seed, seededRand)

  const sat1 = Math.floor(seededRand(3) * 18 + 78)
  const sat2 = Math.floor(seededRand(4) * 22 + 70)
  const light1 = Math.floor(seededRand(5) * 14 + 34)
  const light2 = Math.floor(seededRand(6) * 14 + 46)

  return `linear-gradient(${angle}deg, hsl(${hue1}, ${sat1}%, ${light1}%) 0%, hsl(${hue2}, ${sat2}%, ${light2}%) 100%)`
}
