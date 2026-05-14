'use client'

import type { ReactNode } from 'react'
import { AudioButton } from '@/components/ui/AudioButton'

export type ActivityProgress = {
  /** Shown as "current / total" (e.g. 3 / 8) */
  current: number
  total: number
  /** Bar fill 0–1; defaults to current / total */
  fillRatio?: number
}

export type ActivityCardFrameProps = {
  emoji: string
  title: string
  instruction: string
  /** Omit or use total <= 1 to hide the progress bar */
  progress?: ActivityProgress
  children: ReactNode
}

export function ActivityCardFrame({ emoji, title, instruction, progress, children }: ActivityCardFrameProps) {
  const showProgress = progress !== undefined && progress.total > 1
  const fill =
    showProgress && progress
      ? Math.min(
          1,
          Math.max(0, progress.fillRatio ?? progress.current / Math.max(1, progress.total)),
        )
      : 0

  return (
    <div className="flex w-full max-w-3xl flex-col items-center">
      <div className="flex w-full flex-col items-center gap-6 rounded-[20px] bg-white p-6 shadow-[0_10px_30px_rgba(139,0,255,0.1)] sm:p-8">
        {showProgress && progress && (
          <div className="w-full shrink-0 space-y-1">
            <div className="flex w-full justify-end">
              <span className="text-sm text-gray-500">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#8B00FF] transition-[width] duration-300 ease-out"
                style={{ width: `${fill * 100}%` }}
              />
            </div>
          </div>
        )}

        <header className="w-full shrink-0 space-y-2">
          <div className="flex w-full items-center gap-3">
            <div
              className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 p-2 text-2xl leading-none"
              aria-hidden
            >
              {emoji}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          </div>
          <div className="flex w-full items-start gap-2 sm:pl-1">
            <AudioButton text={instruction} rate={0.85} />
            <p className="flex-1 text-sm leading-snug text-gray-500">{instruction}</p>
          </div>
        </header>

        <div className="flex w-full flex-col items-center gap-6">{children}</div>
      </div>
    </div>
  )
}
