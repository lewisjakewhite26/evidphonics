'use client'

import type { ActivityType } from '@/data/types'
import { TactileButton } from '@/components/ui/TactileButton'

export function ActivityPlaceholder({
  type,
  onComplete,
}: {
  type: ActivityType
  onComplete: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-md py-xl text-center">
      <p className="max-w-md text-body text-text-sub">
        The <span className="font-bold text-text-main">{type}</span> activity will appear here soon.
      </p>
      <TactileButton onClick={onComplete}>Continue →</TactileButton>
    </div>
  )
}
