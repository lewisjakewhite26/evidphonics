'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import { ActivityType } from '@/data/types'
import { motionSpringOrInstant } from '@/lib/celebrations'
import { LESSON_SHELL_ACCENT } from '@/lib/lessonShellGradient'
import { ACTIVITY_ICONS, DEFAULT_ACTIVITY_ICON } from '@/lib/activityIcons'
import { useModalFocusTrap } from '@/src/hooks/useModalFocusTrap'

const ACTIVITY_TITLES: Record<ActivityType, string> = {
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

interface LessonHeaderProps {
  activityType: ActivityType
  currentIndex: number
  totalCount: number
  completedCount: number
  onExit: () => void
}

export default function LessonHeader({
  activityType,
  currentIndex,
  totalCount,
  completedCount,
  onExit,
}: LessonHeaderProps) {
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const exitPanelRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const dismissConfirm = useCallback(() => setExitConfirmOpen(false), [])

  useModalFocusTrap(exitConfirmOpen, exitPanelRef, dismissConfirm)

  /** Escape opens the exit-confirm dialog from anywhere in the lesson; once open, useModalFocusTrap's
   * own Escape handler closes it again, so this only needs to handle the closed -> open direction. */
  useEffect(() => {
    if (exitConfirmOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const target = e.target as HTMLElement | null
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return
      setExitConfirmOpen(true)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [exitConfirmOpen])

  const confirmExit = useCallback(() => {
    setExitConfirmOpen(false)
    onExit()
  }, [onExit])

  const title = ACTIVITY_TITLES[activityType] ?? 'Activity'
  const Icon = ACTIVITY_ICONS[activityType] ?? DEFAULT_ACTIVITY_ICON
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="flex-shrink-0 font-andika">
      <div className="relative flex h-14 items-center gap-md border-b border-border bg-white px-md">
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: LESSON_SHELL_ACCENT }}
          aria-hidden
        />

        <button
          type="button"
          onClick={() => setExitConfirmOpen(true)}
          className="relative flex h-14 w-14 flex-shrink-0 touch-target items-center justify-center rounded-full border-2 border-border text-primary transition-colors duration-200 hover:bg-primary/5"
          aria-haspopup="dialog"
          aria-expanded={exitConfirmOpen}
          title="End lesson"
        >
          <X className="relative z-10 h-5 w-5 text-primary" weight="bold" aria-hidden />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-sm">
          <Icon className="h-5 w-5 text-primary" weight="duotone" aria-hidden />
          <span className="truncate text-subheading font-bold text-ink">{title}</span>
        </div>

        <div className="flex flex-shrink-0 items-center gap-sm">
          {Array.from({ length: totalCount }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i < currentIndex
                  ? 'h-3 w-3 bg-primary'
                  : i === currentIndex
                    ? 'h-3 w-3 bg-primary ring-2 ring-primary/25'
                    : 'h-2.5 w-2.5 bg-primary/20'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="h-1 bg-gray-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-warmth"
          animate={{ width: `${progressPct}%` }}
          transition={motionSpringOrInstant(reduceMotion)}
        />
      </div>

      {exitConfirmOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4"
              role="presentation"
              onClick={dismissConfirm}
            >
              <div
                ref={exitPanelRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="lesson-exit-title"
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id="lesson-exit-title" className="text-lg font-bold text-ink">
                  End lesson?
                </h2>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={dismissConfirm}
                    className="touch-target rounded-full bg-primary-light px-4 py-2.5 text-label font-semibold text-primary transition hover:bg-primary/20"
                  >
                    Keep going
                  </button>
                  <button
                    type="button"
                    onClick={confirmExit}
                    className="touch-target rounded-full bg-primary px-4 py-2.5 text-label font-semibold text-white shadow-evid-btn transition hover:-translate-y-0.5 hover:shadow-evid-btn-hover"
                  >
                    End lesson
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
