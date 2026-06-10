'use client'

import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ActivityType } from '@/data/types'
import { motionSpringOrInstant } from '@/lib/celebrations'
import { LESSON_SHELL_GRADIENT } from '@/lib/lessonShellGradient'
import { useModalFocusTrap } from '@/src/hooks/useModalFocusTrap'

const ACTIVITY_LABELS: Record<ActivityType, { title: string; emoji: string }> = {
  speedySounds: { title: 'Speedy Sounds', emoji: '🎵' },
  soundBlender: { title: 'Sound Blender', emoji: '🚀' },
  trickyTrap: { title: 'Tricky Trap', emoji: '💡' },
  missingSound: { title: 'Missing Sound', emoji: '🔍' },
  rhymeTime: { title: 'Rhyme Time', emoji: '🎵' },
  soundSort: { title: 'Sound Sort', emoji: '🎯' },
  alienOrReal: { title: 'Alien or Real?', emoji: '👽' },
  writeIt: { title: 'Write It', emoji: '✍️' },
  quickReview: { title: 'Quick Review', emoji: '⚡' },
  missingWord: { title: 'Missing Word', emoji: '📝' },
  oddOneOut: { title: 'Odd One Out', emoji: '🔎' },
  wordBuilder: { title: 'Word Builder', emoji: '🧱' },
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

  const confirmExit = useCallback(() => {
    setExitConfirmOpen(false)
    onExit()
  }, [onExit])

  const info = ACTIVITY_LABELS[activityType] ?? { title: 'Activity', emoji: '📚' }
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="flex-shrink-0 font-sans">
      <div
        className="flex h-14 items-center gap-md border-b border-white/20 px-md"
        style={{ background: LESSON_SHELL_GRADIENT }}
      >
        <button
          type="button"
          onClick={() => setExitConfirmOpen(true)}
          className="relative flex h-14 w-14 flex-shrink-0 touch-target items-center justify-center rounded-full bg-white/20 text-white transition-colors duration-200 hover:bg-white/30"
          aria-haspopup="dialog"
          aria-expanded={exitConfirmOpen}
          title="End lesson"
        >
          <span className="relative z-10 text-label text-white">✕</span>
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-sm">
          <span className="text-[18px]" aria-hidden>
            {info.emoji}
          </span>
          <span className="truncate text-subheading font-bold text-white">{info.title}</span>
        </div>

        <div className="flex flex-shrink-0 items-center gap-sm">
          {Array.from({ length: totalCount }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i < currentIndex
                  ? 'h-3 w-3 bg-white/85'
                  : i === currentIndex
                    ? 'h-3 w-3 bg-white ring-2 ring-white/55'
                    : 'h-2.5 w-2.5 bg-white/35'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="h-1 bg-white/20">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #8B00FF 0%, #FF69B4 100%)',
          }}
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
                <h2 id="lesson-exit-title" className="text-lg font-bold text-[#1A0033]">
                  End lesson?
                </h2>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={dismissConfirm}
                    className="touch-target rounded-full bg-[#F4F0FD] px-4 py-2.5 text-sm font-semibold text-[#8B00FF] transition hover:bg-[#EDE8FA]"
                  >
                    Keep going
                  </button>
                  <button
                    type="button"
                    onClick={confirmExit}
                    className="touch-target rounded-full bg-[#8B00FF] px-4 py-2.5 text-sm font-semibold text-white shadow-evid-btn transition hover:-translate-y-0.5 hover:shadow-evid-btn-hover"
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
