import type { WeekMeta } from '@/data/types'

/** e.g. "Phase 3 · Step 3" */
export function formatPhaseStep(meta: Pick<WeekMeta, 'phase' | 'stepInPhase'>): string {
  return `Phase ${meta.phase} · Step ${meta.stepInPhase}`
}

/** Compact row label when phase is already shown in a section header. */
export function formatStepOnly(meta: Pick<WeekMeta, 'stepInPhase'>): string {
  return `Step ${meta.stepInPhase}`
}
