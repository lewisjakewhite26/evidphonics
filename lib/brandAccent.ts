/** Botanical reader — sage accent, forest ink, rose warmth. Spend colour in one place. */

export const BRAND_ACCENT = '#59AB86'
export const BRAND_ACCENT_DARK = '#3D8A6A'
export const BRAND_WARMTH = '#CF8CAA'
export const BRAND_SURFACE = '#F4F7F5'
export const BRAND_SHELL = '#F4F7F5'
export const BRAND_INK = '#152920'

/** Sole brand gradient (sage → rose). Use on progress fills only. */
export const BRAND_GRADIENT_CSS = `linear-gradient(135deg, ${BRAND_ACCENT} 0%, ${BRAND_WARMTH} 100%)`

/** Tailwind gradient stops for progress bars. */
export const BRAND_GRADIENT_TW = 'from-primary to-warmth' as const
