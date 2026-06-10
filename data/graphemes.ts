import phase2Raw from './phase2.json'
import phase3Raw from './phase3.json'
import phase5Raw from './phase5.json'
import phase4Raw from '@/src/data/phase4.json'
import type { ActivityType, GraphemeData, WeekMeta, CurriculumPhaseNumber } from './types'
import {
  extractEnabledActivitiesFromPhaseJson,
  parsePhase4Root,
  type Phase4FileJson,
} from './phase4Normalize'

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

const phase4Bundle = parsePhase4Root(phase4Raw as Phase4FileJson)
const phase4 = phase4Bundle.graphemes

const allow2 = extractEnabledActivitiesFromPhaseJson(phase2Raw)
const allow3 = extractEnabledActivitiesFromPhaseJson(phase3Raw)
const allow5 = extractEnabledActivitiesFromPhaseJson(phase5Raw)
const allow4 = phase4Bundle.enabledActivities.length > 0 ? phase4Bundle.enabledActivities : undefined

/**
 * Per-phase activity allowlists from optional `enabledActivities` in phase JSON.
 * Phases without this field impose no extra restriction in the picker / lesson builder.
 */
export const phaseActivityAllowlist: Partial<Record<number, ActivityType[]>> = {
  ...(allow2 && { 2: allow2 }),
  ...(allow3 && { 3: allow3 }),
  ...(allow4 && { 4: allow4 }),
  ...(allow5 && { 5: allow5 }),
}

export function intersectActivityAllowlistForSelection(selection: GraphemeData[]): Set<ActivityType> | null {
  let allow: Set<ActivityType> | null = null
  for (const g of selection) {
    const list = phaseActivityAllowlist[g.phase]
    if (!list?.length) continue
    const next = new Set<ActivityType>(list)
    if (allow === null) {
      allow = next
    } else {
      const prev: Set<ActivityType> = allow
      allow = new Set([...prev].filter((t) => next.has(t)))
    }
  }
  return allow
}

export const graphemesByPhase: Record<number, GraphemeData[]> = {
  2: phase2,
  3: phase3,
  4: phase4,
  5: phase5,
}

/** Phase order used across the home grid and curriculum aggregates (2 → 3 → 4 → 5). */
export const CURRICULUM_PHASES_ORDERED = [2, 3, 4, 5] as const satisfies readonly CurriculumPhaseNumber[]

export const allGraphemes: GraphemeData[] = [...phase2, ...phase3, ...phase4, ...phase5]

/**
 * Global curriculum slot 1…N in presentation order (phase 2 → 3 → 4 → 5).
 * `week` / `step` query params on `/lesson` index into this list; inserting Phase 4 shifts
 * later phases’ indices (bookmark older `?week=` values may point at a different grapheme).
 */
export const allWeeks: WeekMeta[] = allGraphemes.map((entry, index) => ({
  week: index + 1,
  stepInPhase:
    graphemesByPhase[entry.phase].findIndex((g) => (g.id ?? g.grapheme) === (entry.id ?? entry.grapheme)) + 1,
  focus: entry.id ?? entry.grapheme,
  termName: `Phase ${entry.phase}`,
  termNumber: entry.phase,
  phase: entry.phase,
}))

/** First global week index (1-based) of Phase 5 after the current curriculum ordering. */
export const PHASE5_FIRST_GLOBAL_WEEK = phase2.length + phase3.length + phase4.length + 1

/** Lookup by curriculum id when present (`Phase 4`), else display grapheme. */
export const graphemeMap = new Map(allGraphemes.map((entry) => [entry.id ?? entry.grapheme, entry]))
