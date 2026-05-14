'use client'

import type { ReactNode } from 'react'
import type { Activity } from '@/data/types'
import {
  ActivityType,
  type AlienOrRealData,
  type MeaningMatchData,
  type MissingSoundData,
  type QuickReviewData,
  type RhymeTimeData,
  type RootHuntData,
  type SoundBlenderData,
  type MissingWordData,
  type OddOneOutData,
  type SoundSortData,
  type SpeedySoundsData,
  type TrickyTrapData,
  type WordBuilderData,
  type WordChangerData,
  type WordSplitterData,
  type WriteItData,
} from '@/data/types'
import { TactileButton } from '@/components/ui/TactileButton'
import { AlienOrReal } from './AlienOrReal'
import { MeaningMatch } from './MeaningMatch'
import { MissingSound } from './MissingSound'
import { MissingWord } from './MissingWord'
import { OddOneOut } from './OddOneOut'
import { QuickReview } from './QuickReview'
import { SoundBlender } from './SoundBlender'
import { SoundSort } from './SoundSort'
import { SpeedySounds } from './SpeedySounds'
import { TrickyTrap } from './TrickyTrap'
import { WordBuilder } from './WordBuilder'
import { RhymeTime } from './RhymeTime'
import { RootHunt } from './RootHunt'
import { WriteIt } from './WriteIt'
import { WordChanger } from './WordChanger'
import { WordSplitter } from './WordSplitter'

interface ActivityShellProps {
  activityType: ActivityType
  activityData: Activity | undefined
  onComplete: () => void
}

function ActivityStage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 items-start justify-center overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="font-andika flex w-full min-h-0 flex-col items-center pb-8">{children}</div>
    </div>
  )
}

export function ActivityShell({ activityType, activityData, onComplete }: ActivityShellProps) {
  if (!activityData || activityData.type !== activityType) {
    return (
      <ActivityStage>
        <div className="flex max-w-3xl flex-col items-center justify-center gap-lg rounded-[20px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(139,0,255,0.1)]">
          <p className="max-w-md text-base text-gray-600">
            No activity content for this step and day yet.
          </p>
          <TactileButton onClick={onComplete}>Continue →</TactileButton>
        </div>
      </ActivityStage>
    )
  }

  let body: ReactNode
  switch (activityData.type) {
    case 'speedySounds':
      body = <SpeedySounds data={activityData as SpeedySoundsData} onComplete={onComplete} />
      break
    case 'soundBlender':
      body = <SoundBlender data={activityData as SoundBlenderData} onComplete={onComplete} />
      break
    case 'trickyTrap':
      body = <TrickyTrap data={activityData as TrickyTrapData} onComplete={onComplete} />
      break
    case 'alienOrReal':
      body = <AlienOrReal data={activityData as AlienOrRealData} onComplete={onComplete} />
      break
    case 'soundSort':
      body = <SoundSort data={activityData as SoundSortData} onComplete={onComplete} />
      break
    case 'quickReview':
      body = <QuickReview data={activityData as QuickReviewData} onComplete={onComplete} />
      break
    case 'writeIt':
      body = <WriteIt data={activityData as WriteItData} onComplete={onComplete} />
      break
    case 'missingWord':
      body = <MissingWord data={activityData as MissingWordData} onComplete={onComplete} />
      break
    case 'oddOneOut':
      body = <OddOneOut data={activityData as OddOneOutData} onComplete={onComplete} />
      break
    case 'wordBuilder':
      body = <WordBuilder data={activityData as WordBuilderData} onComplete={onComplete} />
      break
    case 'missingSound':
      body = <MissingSound data={activityData as MissingSoundData} onComplete={onComplete} />
      break
    case 'rhymeTime':
      body = <RhymeTime data={activityData as RhymeTimeData} onComplete={onComplete} />
      break
    case 'wordChanger':
      body = <WordChanger data={activityData as WordChangerData} onComplete={onComplete} />
      break
    case 'wordSplitter':
      body = <WordSplitter data={activityData as WordSplitterData} onComplete={onComplete} />
      break
    case 'meaningMatch':
      body = <MeaningMatch data={activityData as MeaningMatchData} onComplete={onComplete} />
      break
    case 'rootHunt':
      body = <RootHunt data={activityData as RootHuntData} onComplete={onComplete} />
      break
    default:
      body = (
        <p className="text-body text-text-sub">This activity type is not available yet.</p>
      )
  }

  return <ActivityStage>{body}</ActivityStage>
}

export default ActivityShell
