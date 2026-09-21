/** Ocean Blue: confident blue accent, deep navy ink, warm amber warmth. Spend colour in one place. */

export const BRAND_ACCENT = '#2E5FB0'
export const BRAND_ACCENT_DARK = '#244A8A'
export const BRAND_WARMTH = '#D98B1F'
export const BRAND_SURFACE = '#F5F7FA'
export const BRAND_SHELL = '#F5F7FA'
export const BRAND_INK = '#16233D'

/** Sole brand gradient (blue → amber). Use on progress fills only. */
export const BRAND_GRADIENT_CSS = `linear-gradient(135deg, ${BRAND_ACCENT} 0%, ${BRAND_WARMTH} 100%)`

/** Tailwind gradient stops for progress bars. */
export const BRAND_GRADIENT_TW = 'from-primary to-warmth' as const
