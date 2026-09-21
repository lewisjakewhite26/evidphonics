import { graphemeAccessibilityShort } from '@/lib/graphemeDisplay'

/** Structural shape shared by full `GraphemeData` and the lightweight picker-page index —
 * search/selection only ever needs these four fields, never the heavy per-word content. */
export interface CurriculumEntryLike {
  id?: string
  grapheme: string
  keyword: string
  phase: number
}

export function curriculumKey(entry: CurriculumEntryLike): string {
  return entry.id ?? entry.grapheme
}

function scoreGraphemeSearchMatch(entry: CurriculumEntryLike, q: string): number {
  const g = entry.grapheme.toLowerCase()
  const id = curriculumKey(entry).toLowerCase()
  const kw = entry.keyword.toLowerCase()
  const alt = graphemeAccessibilityShort(curriculumKey(entry)).toLowerCase()

  if (g === q || id === q || alt === q) return 100
  if (g.startsWith(q) || id.startsWith(q) || alt.startsWith(q)) return 80
  if (kw.startsWith(q)) return 60
  if (g.includes(q) || id.includes(q) || kw.includes(q) || alt.includes(q)) return 40
  return 0
}

/** Ranked grapheme matches for lesson-builder quick search (grapheme, id, keyword). */
export function searchGraphemes<T extends CurriculumEntryLike>(
  query: string,
  pool: T[],
  limit = 12,
): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return pool
    .map((entry) => ({ entry, score: scoreGraphemeSearchMatch(entry, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.entry.phase !== b.entry.phase) return a.entry.phase - b.entry.phase
      return a.entry.keyword.localeCompare(b.entry.keyword)
    })
    .slice(0, limit)
    .map(({ entry }) => entry)
}
