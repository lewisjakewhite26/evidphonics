'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ActivityType } from '@/data/types'
import { motionSpring } from '@/lib/celebrations'
import { LESSON_SHELL_GRADIENT } from '@/lib/lessonShellGradient'

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
  wordChanger: { title: 'Word Changer', emoji: '🔄' },
  wordSplitter: { title: 'Word Splitter', emoji: '✂️' },
  meaningMatch: { title: 'Meaning Match', emoji: '🧩' },
  rootHunt: { title: 'Root Hunt', emoji: '🔍' },
}

const HOLD_MS = 1500
const RELEASE_MS = 300
const RING_R = 18
const RING_C = 2 * Math.PI * RING_R

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
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
  const [ringProgress, setRingProgress] = useState(0)
  const [exitFlash, setExitFlash] = useState(false)
  const ringProgressRef = useRef(0)
  const holdRafRef = useRef<number | null>(null)
  const releaseRafRef = useRef<number | null>(null)
  const holdStartRef = useRef(0)
  const releaseFromRef = useRef(0)
  const releaseStartRef = useRef(0)
  const exitTriggeredRef = useRef(false)

  const setProgress = useCallback((p: number) => {
    ringProgressRef.current = p
    setRingProgress(p)
  }, [])

  const clearHold = useCallback(() => {
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current)
      holdRafRef.current = null
    }
  }, [])

  const clearRelease = useCallback(() => {
    if (releaseRafRef.current !== null) {
      cancelAnimationFrame(releaseRafRef.current)
      releaseRafRef.current = null
    }
  }, [])

  const finishExit = useCallback(() => {
    if (exitTriggeredRef.current) return
    exitTriggeredRef.current = true
    setExitFlash(true)
    window.setTimeout(() => {
      setExitFlash(false)
      setProgress(0)
      onExit()
      exitTriggeredRef.current = false
    }, 200)
  }, [onExit, setProgress])

  const tickHold = useCallback(() => {
    const step = (now: number) => {
      const elapsed = now - holdStartRef.current
      const p = Math.min(1, elapsed / HOLD_MS)
      setProgress(p)
      if (p >= 1) {
        clearHold()
        finishExit()
        return
      }
      holdRafRef.current = requestAnimationFrame(step)
    }
    holdRafRef.current = requestAnimationFrame(step)
  }, [clearHold, finishExit, setProgress])

  const runReleaseAnimation = useCallback(
    (from: number) => {
      clearRelease()
      releaseFromRef.current = from
      releaseStartRef.current = performance.now()
      const step = (now: number) => {
        const u = Math.min(1, (now - releaseStartRef.current) / RELEASE_MS)
        const p = releaseFromRef.current * (1 - easeOutCubic(u))
        setProgress(p)
        if (u < 1) {
          releaseRafRef.current = requestAnimationFrame(step)
        } else {
          releaseRafRef.current = null
          setProgress(0)
        }
      }
      releaseRafRef.current = requestAnimationFrame(step)
    },
    [clearRelease, setProgress],
  )

  const startHold = useCallback(() => {
    if (exitTriggeredRef.current) return
    clearRelease()
    clearHold()
    holdStartRef.current = performance.now()
    tickHold()
  }, [clearHold, clearRelease, tickHold])

  const endHold = useCallback(() => {
    clearHold()
    const p = ringProgressRef.current
    if (p >= 1 || exitTriggeredRef.current) return
    if (p > 0.001) {
      runReleaseAnimation(p)
    } else {
      setProgress(0)
    }
  }, [clearHold, runReleaseAnimation, setProgress])

  useEffect(() => {
    return () => {
      clearHold()
      clearRelease()
    }
  }, [clearHold, clearRelease])

  const info = ACTIVITY_LABELS[activityType] ?? { title: 'Activity', emoji: '📚' }
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const dashOffset = RING_C * (1 - ringProgress)

  return (
    <div className="flex-shrink-0 font-sans">
      <div
        className="flex h-14 items-center gap-md border-b border-white/20 px-md"
        style={{ background: LESSON_SHELL_GRADIENT }}
      >
        <button
          type="button"
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          className={`relative flex h-14 w-14 flex-shrink-0 touch-target items-center justify-center rounded-full text-white transition-colors duration-200 ${
            exitFlash ? 'bg-success/50' : 'bg-white/20'
          }`}
          title="Hold to exit"
          style={{ transition: 'background-color 200ms ease-out' }}
        >
          <svg className="absolute inset-0 h-14 w-14 -rotate-90" viewBox="0 0 40 40" aria-hidden>
            <circle cx="20" cy="20" r={RING_R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r={RING_R}
              fill="none"
              stroke="#FF69B4"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={dashOffset}
            />
          </svg>
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
          transition={{ ...motionSpring }}
        />
      </div>
    </div>
  )
}
