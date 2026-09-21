'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretLeft } from '@phosphor-icons/react'
import type { AnchorWord, SoundSortData } from '@/data/types'
import { motionSpring } from '@/lib/celebrations'
import { AudioButton } from '@/components/ui/AudioButton'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'
import { graphemeHighlightLetters } from '@/lib/graphemeDisplay'

interface SoundSortProps {
  data: SoundSortData
  onComplete: () => void
}

function underlineSpan(word: string, sound: string): { start: number; end: number } {
  const g = graphemeHighlightLetters(sound)
  if (!g) return { start: 0, end: Math.min(1, word.length) }
  const w = word.toLowerCase()
  if (w.startsWith(g)) return { start: 0, end: g.length }
  const i = w.indexOf(g)
  if (i >= 0) return { start: i, end: i + g.length }
  return { start: 0, end: Math.min(g.length, word.length) }
}

function AnchorHeading({
  anchor,
  accent,
}: {
  anchor: AnchorWord
  accent: 'primary' | 'success'
}) {
  const { start, end } = underlineSpan(anchor.word, anchor.sound)
  const underlineCls =
    accent === 'primary' ? 'border-b-2 border-primary' : 'border-b-2 border-success'

  return (
    <div className="font-andika text-4xl font-bold text-ink md:text-5xl">
      {anchor.word.split('').map((ch, i) => (
        <span key={i} className={`inline-block min-w-[0.15em] ${i >= start && i < end ? underlineCls : ''}`}>
          {ch}
        </span>
      ))}
    </div>
  )
}

export function SoundSort({ data, onComplete }: SoundSortProps) {
  const anchors = data.anchorWords
  const sortWords = data.sortWords
  const [idx, setIdx] = useState(0)
  const [leftChips, setLeftChips] = useState<string[]>([])
  const [rightChips, setRightChips] = useState<string[]>([])
  const [nudgeSide, setNudgeSide] = useState<0 | 1 | null>(null)
  const [flySide, setFlySide] = useState<0 | 1 | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)
  const [finished, setFinished] = useState(false)

  const a0 = anchors[0]
  const a1 = anchors[1]

  const correctSideForWord = useCallback(
    (w: (typeof sortWords)[0]) => {
      const i = anchors.findIndex((a) => a.id === w.correctAnchorId)
      return i === 1 ? 1 : 0
    },
    [anchors],
  )

  const current = sortWords[idx]
  const total = sortWords.length
  const progress = leftChips.length + rightChips.length

  const handleZoneTap = (side: 0 | 1) => {
    if (finished || !current) return
    const correct = correctSideForWord(current)
    if (side === correct) {
      setFlySide(side)
      const cx = typeof window !== 'undefined' ? window.innerWidth * (side === 0 ? 0.25 : 0.75) : 0
      const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
      window.setTimeout(() => setBurst({ x: cx, y: cy }), 220)
      if (side === 0) {
        setLeftChips((c) => [...c, current.word])
      } else {
        setRightChips((c) => [...c, current.word])
      }
      window.setTimeout(() => {
        if (idx + 1 >= total) {
          setFinished(true)
        } else {
          setIdx((i) => i + 1)
        }
        setFlySide(null)
      }, 800)
    } else {
      setNudgeSide(side)
      window.setTimeout(() => setNudgeSide(null), 450)
    }
  }

  /** Un-sort the previous word from whichever zone it landed in (words only ever advance on a
   * correct placement, so sortWords[idx-1] is always exactly the most recently added chip). */
  const handlePrevious = () => {
    if (idx === 0) return
    const prevWord = sortWords[idx - 1]
    if (!prevWord) return
    if (correctSideForWord(prevWord) === 0) {
      setLeftChips((c) => c.slice(0, -1))
    } else {
      setRightChips((c) => c.slice(0, -1))
    }
    setNudgeSide(null)
    setFlySide(null)
    setIdx((i) => Math.max(0, i - 1))
  }

  const completion = useMemo(() => {
    if (!finished) return null
    return (
      <ActivityCardFrame activityType={data.type} title={data.title} instruction={data.instruction}>
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={motionSpring}
          className="flex w-full flex-col items-center gap-6 py-2"
        >
          <p className="text-center text-lg font-semibold text-ink">Sorting complete!</p>
          <p className="text-center text-sm text-text-sub">
            You sorted <span className="font-semibold text-primary">{total}</span> words.
          </p>
          <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
            <div className="rounded-xl border-2 border-primary/40 bg-primary-light/40 p-4">
              <p className="mb-2 text-sm font-semibold text-primary">{a0?.word}</p>
              <div className="flex flex-wrap gap-2">
                {leftChips.map((w, i) => (
                  <span
                    key={`lc-${i}-${w}`}
                    className="rounded-full border border-primary/30 bg-white px-3 py-1 text-sm font-bold text-ink"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border-2 border-success/40 bg-success-light/50 p-4">
              <p className="mb-2 text-sm font-semibold text-success">{a1?.word}</p>
              <div className="flex flex-wrap gap-2">
                {rightChips.map((w, i) => (
                  <span
                    key={`rc-${i}-${w}`}
                    className="rounded-full border border-success/40 bg-white px-3 py-1 text-sm font-bold text-ink"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <TactileButton onClick={onComplete}>Next →</TactileButton>
        </motion.div>
      </ActivityCardFrame>
    )
  }, [finished, total, leftChips, rightChips, a0?.word, a1?.word, onComplete, data.type, data.title, data.instruction])

  if (!a0 || !a1 || sortWords.length === 0) {
    return (
      <ActivityCardFrame activityType={data.type} title={data.title} instruction={data.instruction}>
        <p className="text-center text-sm text-text-sub">Sound Sort needs two anchor words and sort words.</p>
      </ActivityCardFrame>
    )
  }

  if (finished && completion) {
    return completion
  }

  return (
    <ActivityCardFrame
      activityType={data.type}
      title={data.title}
      instruction={data.instruction}
      progress={
        sortWords.length > 1
          ? {
              current: progress,
              total,
              fillRatio: progress / Math.max(1, total),
            }
          : undefined
      }
    >
      {sortWords.length > 1 && idx > 0 && (
        <div className="flex w-full justify-start">
          <TactileButton
            variant="ghost"
            onClick={handlePrevious}
            className="!px-4 !min-h-0 !py-2 !text-sm"
          >
            <span className="inline-flex items-center gap-1.5">
              <CaretLeft className="h-4 w-4" />
              Previous
            </span>
          </TactileButton>
        </div>
      )}
      <div className="relative flex min-h-[min(70vh,520px)] w-full flex-1 flex-row overflow-hidden rounded-xl border border-border">
        <button
          type="button"
          className="flex min-h-0 min-w-0 flex-1 flex-col border border-primary/40 bg-primary/15 pb-4 pt-8 text-left transition-colors hover:bg-primary/25 active:opacity-95"
          onClick={() => handleZoneTap(0)}
        >
          <div className="px-4 text-center">
            <AnchorHeading anchor={a0} accent="primary" />
          </div>
          <div className="mt-auto flex flex-wrap content-end gap-2 px-4">
            {leftChips.map((w, chipIdx) => (
              <motion.span
                key={`l-${chipIdx}-${w}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={motionSpring}
                className="rounded-full border border-primary/40 bg-primary-light/50 px-3 py-1 text-sm font-bold text-ink"
              >
                {w}
              </motion.span>
            ))}
          </div>
        </button>

        <button
          type="button"
          className="flex min-h-0 min-w-0 flex-1 flex-col border border-emerald-300 bg-emerald-50 pb-4 pt-8 text-left transition-colors hover:bg-emerald-100 active:opacity-95"
          onClick={() => handleZoneTap(1)}
        >
          <div className="px-4 text-center">
            <AnchorHeading anchor={a1} accent="success" />
          </div>
          <div className="mt-auto flex flex-wrap content-end gap-2 px-4">
            {rightChips.map((w, i) => (
              <motion.span
                key={`${w}-r-${i}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={motionSpring}
                className="rounded-full border border-success/50 bg-success-light/40 px-3 py-1 text-sm font-bold text-ink"
              >
                {w}
              </motion.span>
            ))}
          </div>
        </button>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={idx}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={
                  flySide !== null
                    ? {
                        x: flySide === 0 ? -140 : 140,
                        scale: 0.6,
                        opacity: 0,
                      }
                    : nudgeSide !== null
                      ? { x: [0, nudgeSide === 0 ? -24 : 24, 0], scale: 1, opacity: 1 }
                      : { scale: 1, opacity: 1, x: 0 }
                }
                exit={{ opacity: 0 }}
                transition={flySide !== null ? { duration: 0.35, ease: 'easeIn' } : { duration: 0.4 }}
                className={`pointer-events-auto flex max-w-sm flex-col items-center gap-4 rounded-xl border-2 bg-white p-8 shadow-lg ${
                  nudgeSide !== null ? 'border-warning' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AudioButton text={current.word} rate={0.8} />
                </div>
                <p className="text-center font-andika text-4xl font-bold text-ink">{current.word}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
