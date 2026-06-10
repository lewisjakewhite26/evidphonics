'use client'

import {
  OO_LONG_DISPLAY,
  OO_LONG_GRAPHEME_ID,
  OO_SHORT_GRAPHEME_ID,
} from '@/lib/graphemeDisplay'

type GraphemeMarkProps = {
  graphemeId: string
  className?: string
}

/**
 * Renders curriculum grapheme ids: `oo-short` → `oo`, `oo-long` → `ōō` (U+014D U+014D).
 */
export function GraphemeMark({ graphemeId, className }: GraphemeMarkProps) {
  if (graphemeId === OO_SHORT_GRAPHEME_ID) {
    return <span className={className}>oo</span>
  }
  if (graphemeId === OO_LONG_GRAPHEME_ID) {
    return <span className={className}>{OO_LONG_DISPLAY}</span>
  }
  return <span className={className}>{graphemeId}</span>
}
