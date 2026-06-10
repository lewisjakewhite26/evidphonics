'use client'

import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Activity } from '@/data/types'
import {
  ActivityType,
  type AlienOrRealData,
  type MissingSoundData,
  type QuickReviewData,
  type RhymeTimeData,
  type SoundBlenderData,
  type MissingWordData,
  type OddOneOutData,
  type SoundSortData,
  type SpeedySoundsData,
  type TrickyTrapData,
  type WordBuilderData,
  type WriteItData,
} from '@/data/types'
import { TactileButton } from '@/components/ui/TactileButton'
import { AlienOrReal } from './AlienOrReal'
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
import { WriteIt } from './WriteIt'

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
  const navigate = useNavigate()

  if (!activityData || activityData.type !== activityType) {
    console.error('[EvidPhonics ActivityShell] Activity payload mismatch — lesson step will not advance.', {
      expectedActivityType: activityType,
      receivedType: activityData?.type ?? '(no payload)',
      receivedId: activityData && 'id' in activityData ? activityData.id : undefined,
    })
    return (
      <ActivityStage>
        <div className="flex max-w-3xl flex-col items-center justify-center gap-lg rounded-[20px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(139,0,255,0.1)]">
          <p className="max-w-md text-base font-semibold text-gray-800">
            Something went wrong loading this activity.
          </p>
          <p className="max-w-md text-sm text-gray-600">
            This step doesn&apos;t match the lesson data. Go back to the home screen and start again.
          </p>
          <TactileButton type="button" onClick={() => navigate('/')}>
            Back to home
          </TactileButton>
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
    default:
      body = (
        <p className="text-body text-text-sub">This activity type is not available yet.</p>
      )
  }

  return <ActivityStage>{body}</ActivityStage>
}

export default ActivityShell
