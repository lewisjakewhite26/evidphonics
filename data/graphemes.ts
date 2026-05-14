import phase2Raw from './phase2.json'
import phase3Raw from './phase3.json'
import phase5Raw from './phase5.json'
import phase6Raw from './phase6.json'
import type { GraphemeData, WeekMeta } from './types'

type PhaseFileShape = GraphemeData[] | { phase: number; graphemes: GraphemeData[] }

function normalizePhaseData(raw: unknown): GraphemeData[] {
  const parsed = raw as PhaseFileShape
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.graphemes)) {
    return parsed.graphemes
  }
  return []
}

const phase2 = normalizePhaseData(phase2Raw)
const phase3 = normalizePhaseData(phase3Raw)
const phase5 = normalizePhaseData(phase5Raw)
const phase6 = normalizePhaseData(phase6Raw)

export const graphemesByPhase: Record<number, GraphemeData[]> = {
  2: phase2,
  3: phase3,
  5: phase5,
  6: phase6,
}

export const allGraphemes: GraphemeData[] = [...phase2, ...phase3, ...phase5, ...phase6]

/** Fast lookup for lesson building (kept with static curriculum data). */
export const graphemeMap = new Map(allGraphemes.map((entry) => [entry.grapheme, entry]))

export const allWeeks: WeekMeta[] = allGraphemes.map((entry, index) => ({
  week: index + 1,
  stepInPhase: graphemesByPhase[entry.phase].findIndex((g) => g.grapheme === entry.grapheme) + 1,
  focus: entry.grapheme,
  termName: `Phase ${entry.phase}`,
  termNumber: entry.phase,
  phase: entry.phase,
}))
