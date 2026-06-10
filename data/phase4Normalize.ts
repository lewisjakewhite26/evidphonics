import type {
  ActivityType,
  GraphemeData,
  GraphemeMissingWordSentence,
  GraphemeOddOneOutSet,
  GraphemePinnedContent,
  GraphemeWriteItSentence,
} from './types'
import { ACTIVITY_ORDER } from '@/lib/lessonConstants'
import { shuffle } from '@/lib/utils'

type Phase4MissingRaw = { sentence: string; answer: string; distractors: string[] }
type Phase4OddRaw = { words: string[]; oddOne: string; reason: string }
type Phase4WriteRaw = { sentence: string; targetWord: string }

export type Phase4GraphemeJson = Record<string, unknown>

export type Phase4FileJson = {
  phase: number
  graphemes: Phase4GraphemeJson[]
  enabledActivities?: string[]
}

export function normalizeActivityImportKey(raw: string): ActivityType | null {
  const t = raw.trim()
  const found = ACTIVITY_ORDER.find((a) => a.toLowerCase() === t.toLowerCase())
  return found ?? null
}

/** Optional top-level `enabledActivities` on any phase JSON file. */
export function extractEnabledActivitiesFromPhaseJson(raw: unknown): ActivityType[] | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const ea = (raw as { enabledActivities?: unknown }).enabledActivities
  if (!Array.isArray(ea) || ea.length === 0) return undefined
  const list = ea
    .filter((x): x is string => typeof x === 'string')
    .map(normalizeActivityImportKey)
    .filter((x): x is ActivityType => Boolean(x))
  return list.length > 0 ? list : undefined
}

export function parsePhase4Root(raw: Phase4FileJson): {
  graphemes: GraphemeData[]
  enabledActivities: ActivityType[]
} {
  const enabled = extractEnabledActivitiesFromPhaseJson(raw) ?? []

  const graphemes = raw.graphemes.map(normalizePhase4Grapheme)

  return { graphemes, enabledActivities: enabled }
}

export function normalizePhase4Grapheme(raw: Phase4GraphemeJson): GraphemeData {
  const blendWords = (raw.blendWords as string[]) ?? []
  const exampleWords = (raw.exampleWords as string[]) ?? []
  const words = exampleWords.length > 0 ? exampleWords : [...blendWords]

  const missingRaw = (raw.missingWordSentences as Phase4MissingRaw[]) ?? []
  const missingWordSentences: GraphemeMissingWordSentence[] = missingRaw.map((m) => {
    const options = shuffle([m.answer, ...m.distractors])
    return {
      text: m.sentence,
      missingWord: m.answer,
      missingIndex: options.indexOf(m.answer),
      options,
    }
  })

  const oddRaw = (raw.oddOneOutSets as Phase4OddRaw[]) ?? []
  const oddOneOutSets: GraphemeOddOneOutSet[] = oddRaw.map((o) => {
    let oddOneOut = o.words.indexOf(o.oddOne)
    if (oddOneOut < 0) oddOneOut = 0
    return {
      words: o.words,
      oddOneOut,
      explanation: o.reason,
    }
  })

  const writeRaw = (raw.writeItSentences as Phase4WriteRaw[]) ?? []
  const writeItSentences: GraphemeWriteItSentence[] = writeRaw.map((w) => ({
    text: w.sentence,
    targetSounds: [w.targetWord],
    trickyWords: [],
  }))

  const pinned: GraphemePinnedContent = {
    blendWords,
    missingWordSentences,
    oddOneOutSets,
    writeItSentences,
    wordBuilderWords: (raw.wordBuilderWords as string[]) ?? [],
    quickReviewWords: (raw.quickReviewWords as string[]) ?? [],
    speedyRevisionGraphemes: (raw.speedyRevisionGraphemes as string[]) ?? [],
  }

  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : undefined

  return {
    id,
    grapheme: String(raw.grapheme ?? ''),
    keyword: String(raw.keyword ?? ''),
    phase: 4,
    type: 'grapheme',
    words,
    alienWords: [],
    segments: { ...((raw.segments as Record<string, string[]>) ?? {}) },
    sortPair: '',
    relatedGraphemes: [],
    missingWordSentences,
    oddOneOutSets,
    writeItSentences,
    trickyWords: [],
    pinned,
  }
}
