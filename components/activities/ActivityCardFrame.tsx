'use client'

import type { ReactNode } from 'react'
import type { AnyActivityType } from '@/lib/activityIcons'
import { ACTIVITY_ICONS, DEFAULT_ACTIVITY_ICON } from '@/lib/activityIcons'
import { AudioButton } from '@/components/ui/AudioButton'

export type ActivityProgress = {
  /** Shown as "current / total" (e.g. 3 / 8) */
  current: number
  total: number
  /** Bar fill 0–1; defaults to current / total */
  fillRatio?: number
}

export type ActivityCardFrameProps = {
  activityType: AnyActivityType
  title: string
  instruction: string
  /** Omit or use total <= 1 to hide the progress bar */
  progress?: ActivityProgress
  children: ReactNode
}

export function ActivityCardFrame({
  activityType,
  title,
  instruction,
  progress,
  children,
}: ActivityCardFrameProps) {
  const Icon = ACTIVITY_ICONS[activityType] ?? DEFAULT_ACTIVITY_ICON
  const showProgress = progress !== undefined && progress.total > 1
  const fill =
    showProgress && progress
      ? Math.min(
          1,
          Math.max(0, progress.fillRatio ?? progress.current / Math.max(1, progress.total)),
        )
      : 0

  return (
    <div className="flex w-full max-w-3xl flex-col items-center lg:max-w-4xl xl:max-w-5xl">
      <div className="flex w-full flex-col items-center gap-6 rounded-[20px] border border-border bg-white p-6 shadow-card sm:p-8 lg:gap-8 lg:p-10 xl:p-12">
        {showProgress && progress && (
          <div className="w-full shrink-0 space-y-1">
            <div className="flex w-full justify-end">
              <span className="text-label text-text-sub">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 lg:h-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-warmth transition-[width] duration-300 ease-out"
                style={{ width: `${fill * 100}%` }}
              />
            </div>
          </div>
        )}

        <header className="w-full shrink-0 space-y-2 lg:space-y-3">
          <div className="flex w-full items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 lg:h-12 lg:w-12"
              aria-hidden
            >
              <Icon className="h-6 w-6 text-primary lg:h-7 lg:w-7" weight="duotone" />
            </div>
            <h2 className="text-xl font-semibold text-ink lg:text-2xl">{title}</h2>
          </div>
          <div className="flex w-full items-start gap-2 sm:pl-1">
            <AudioButton text={instruction} rate={0.85} />
            <p className="flex-1 text-body leading-snug text-text-sub lg:text-lg">{instruction}</p>
          </div>
        </header>

        <div className="flex w-full flex-col items-center gap-6 lg:gap-8">{children}</div>
      </div>
    </div>
  )
}
