import type { Transition } from 'framer-motion'
import { ActivityType } from '@/data/types'

export const motionSpring: Transition = { type: 'spring', stiffness: 300, damping: 20 }

export const motionInstant: Transition = { duration: 0 }

/** Use with Framer Motion `useReducedMotion()` — respects system reduced-motion preference. */
export function motionSpringOrInstant(reduceMotion: boolean | null): Transition {
  return reduceMotion ? motionInstant : motionSpring
}

const tier1: ActivityType[] = ['speedySounds', 'alienOrReal', 'missingSound']
const tier2: ActivityType[] = [
  'soundBlender',
  'trickyTrap',
  'rhymeTime',
  'soundSort',
  'quickReview',
  'missingWord',
  'oddOneOut',
  'wordBuilder',
]
const tier3: ActivityType[] = ['writeIt']

export function getCelebrationDurationMs(type: ActivityType): number {
  if (tier1.includes(type)) return 2000
  if (tier2.includes(type)) return 3000
  if (tier3.includes(type)) return 5000
  return 3000
}

export function shouldConfettiOnActivityComplete(type: ActivityType): boolean {
  return tier3.includes(type)
}

export function getActivityCelebrationTier(type: ActivityType): 1 | 2 | 3 {
  if (tier1.includes(type)) return 1
  if (tier2.includes(type)) return 2
  return 3
}
