import type { Icon } from '@phosphor-icons/react'
import {
  Alien,
  ArrowsClockwise,
  Books,
  Lightbulb,
  Lightning,
  MagnifyingGlass,
  MusicNotes,
  NotePencil,
  PencilSimple,
  Question,
  Rocket,
  Scissors,
  Stack,
  Target,
  TreeStructure,
} from '@phosphor-icons/react'
import type { ActivityType } from '@/data/types'

/** Morphology/EvidLex activity types: not in the core lesson-builder ActivityType union yet, but the
 * components exist and share ActivityCardFrame, so they need an icon too. */
export type AnyActivityType = ActivityType | 'wordChanger' | 'wordSplitter' | 'meaningMatch' | 'rootHunt'

/** One icon per activity type, reused by the activity card header and the lesson header. */
export const ACTIVITY_ICONS: Record<AnyActivityType, Icon> = {
  speedySounds: MusicNotes,
  soundBlender: Rocket,
  trickyTrap: Lightbulb,
  missingSound: MagnifyingGlass,
  rhymeTime: MusicNotes,
  soundSort: Target,
  alienOrReal: Alien,
  writeIt: PencilSimple,
  quickReview: Lightning,
  missingWord: NotePencil,
  oddOneOut: Question,
  wordBuilder: Stack,
  wordChanger: ArrowsClockwise,
  wordSplitter: Scissors,
  meaningMatch: Books,
  rootHunt: TreeStructure,
}

export const DEFAULT_ACTIVITY_ICON: Icon = Books
