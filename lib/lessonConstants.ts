import type { ActivityType } from '@/data/types'

/** Pedagogical run order — lesson flow is sorted to this sequence regardless of URL or UI selection order. */
export const ACTIVITY_ORDER: ActivityType[] = [
  'speedySounds',
  'trickyTrap',
  'quickReview',
  'soundBlender',
  'missingSound',
  'alienOrReal',
  'rhymeTime',
  'soundSort',
  'missingWord',
  'oddOneOut',
  'wordBuilder',
  'writeIt',
]

export function sortActivitiesByPedagogy(activities: ActivityType[]): ActivityType[] {
  const rank = (t: ActivityType) => {
    const i = ACTIVITY_ORDER.indexOf(t)
    return i === -1 ? ACTIVITY_ORDER.length : i
  }
  return [...activities].sort((a, b) => rank(a) - rank(b))
}

export const ALL_ACTIVITY_TYPES: ActivityType[] = [
  'speedySounds',
  'soundBlender',
  'trickyTrap',
  'missingSound',
  'rhymeTime',
  'soundSort',
  'alienOrReal',
  'writeIt',
  'quickReview',
  'missingWord',
  'oddOneOut',
  'wordBuilder',
]

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  speedySounds: 'Speedy Sounds',
  soundBlender: 'Sound Blender',
  trickyTrap: 'Tricky Trap',
  missingSound: 'Missing Sound',
  rhymeTime: 'Rhyme Time',
  soundSort: 'Sound Sort',
  alienOrReal: 'Alien or Real?',
  writeIt: 'Write It',
  quickReview: 'Quick Review',
  missingWord: 'Missing Word',
  oddOneOut: 'Odd One Out',
  wordBuilder: 'Word Builder',
}

export function parseActivitiesParam(raw: string): ActivityType[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((x): x is ActivityType => ALL_ACTIVITY_TYPES.includes(x as ActivityType))
}
