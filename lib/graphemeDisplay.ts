/** Curriculum ids for the two spellings of English “oo”. */
export const OO_SHORT_GRAPHEME_ID = 'oo-short'
export const OO_LONG_GRAPHEME_ID = 'oo-long'

const OO_IDS = new Set<string>([OO_SHORT_GRAPHEME_ID, OO_LONG_GRAPHEME_ID])

/** Display string for `oo-long` (Latin small letter o with macron, twice). */
export const OO_LONG_DISPLAY = '\u014D\u014D'

/**
 * Letters to underline inside anchor words (Sound Sort). Both oo variants use plain `oo`
 * in spelling; display difference is handled by {@link GraphemeMark}.
 */
export function graphemeHighlightLetters(curriculumSoundOrId: string): string {
  if (OO_IDS.has(curriculumSoundOrId)) return 'oo'
  return curriculumSoundOrId.replace(/[^a-zA-Z]/g, '').toLowerCase()
}

/** Tooltip / plain-language disambiguation */
export function graphemeAccessibilityShort(id: string): string {
  if (id === OO_SHORT_GRAPHEME_ID) return 'short oo'
  if (id === OO_LONG_GRAPHEME_ID) return 'long oo'
  return id
}
