import { normalizeAudioFilename } from '@/lib/audioPaths'

/**
 * Grapheme MP3 approval list for scripts/generate_grapheme_clips.py and grapheme-recorder.
 * Runtime grapheme tiles are visual-only; this file is not used for playback fallback.
 */
let approvedSlugs: Set<string> | null = null
let loadPromise: Promise<Set<string>> | null = null

export function normalizeGraphemeSlug(grapheme: string): string {
  return normalizeAudioFilename(
    grapheme === 'oo-short' || grapheme === 'oo-long' ? grapheme : grapheme,
  )
}

async function fetchApprovedSlugs(): Promise<Set<string>> {
  try {
    const res = await fetch('/audio/grapheme-approved.json', { cache: 'no-store' })
    if (!res.ok) return new Set()
    const data: unknown = await res.json()
    if (!Array.isArray(data)) return new Set()
    return new Set(data.filter((x): x is string => typeof x === 'string').map(normalizeAudioFilename))
  } catch {
    return new Set()
  }
}

export function preloadGraphemeApprovals(): void {
  if (loadPromise) return
  loadPromise = fetchApprovedSlugs().then((set) => {
    approvedSlugs = set
    return set
  })
}

export function isGraphemeMp3Approved(grapheme: string): boolean {
  const slug = normalizeGraphemeSlug(grapheme)
  if (!approvedSlugs) {
    preloadGraphemeApprovals()
    return false
  }
  return approvedSlugs.has(slug)
}

/** Call after updating grapheme-approved.json during a recording session. */
export async function refreshGraphemeApprovals(): Promise<void> {
  approvedSlugs = await fetchApprovedSlugs()
  loadPromise = Promise.resolve(approvedSlugs)
}
