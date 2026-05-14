'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { AnchorWord, SoundSortData } from '@/data/types'
import { speakWord } from '@/lib/audio'
import { motionSpring } from '@/lib/celebrations'
import { AudioButton } from '@/components/ui/AudioButton'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface SoundSortProps {
  data: SoundSortData
  onComplete: () => void
}

function lettersFromSound(sound: string): string {
  return sound.replace(/[^a-zA-Z]/g, '').toLowerCase()
}

function underlineSpan(word: string, sound: string): { start: number; end: number } {
  const g = lettersFromSound(sound)
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
    <div className="font-andika text-4xl font-bold text-gray-900 md:text-5xl">
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
  const [shakeCard, setShakeCard] = useState(false)
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
      const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
      const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
      setBurst({ x: cx, y: cy })
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
      }, 800)
    } else {
      setShakeCard(true)
      window.setTimeout(() => setShakeCard(false), 500)
    }
  }

  const completion = useMemo(() => {
    if (!finished) return null
    return (
      <ActivityCardFrame emoji={data.emoji} title={data.title} instruction={data.instruction}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={motionSpring}
          className="flex w-full flex-col items-center gap-6 py-2"
        >
          <p className="text-center text-lg font-semibold text-gray-800">Sorting complete!</p>
          <p className="text-center text-sm text-gray-500">
            You sorted <span className="font-semibold text-primary">{total}</span> words.
          </p>
          <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
            <div className="rounded-xl border-2 border-primary/40 bg-primary-light/40 p-4">
              <p className="mb-2 text-sm font-semibold text-primary">{a0?.word}</p>
              <div className="flex flex-wrap gap-2">
                {leftChips.map((w, i) => (
                  <span
                    key={`lc-${i}-${w}`}
                    className="rounded-full border border-primary/30 bg-white px-3 py-1 text-sm font-bold text-gray-900"
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
                    className="rounded-full border border-success/40 bg-white px-3 py-1 text-sm font-bold text-gray-900"
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
  }, [finished, total, leftChips, rightChips, a0?.word, a1?.word, onComplete, data.emoji, data.title, data.instruction])

  if (!a0 || !a1 || sortWords.length === 0) {
    return (
      <ActivityCardFrame emoji={data.emoji} title={data.title} instruction={data.instruction}>
        <p className="text-center text-sm text-gray-500">Sound Sort needs two anchor words and sort words.</p>
      </ActivityCardFrame>
    )
  }

  if (finished && completion) {
    return completion
  }

  return (
    <ActivityCardFrame
      emoji={data.emoji}
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
      <div className="relative flex min-h-[min(70vh,520px)] w-full flex-1 flex-row overflow-hidden rounded-xl border border-gray-200">
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
                className="rounded-full border border-primary/40 bg-primary-light/50 px-3 py-1 text-sm font-bold text-gray-900"
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
                className="rounded-full border border-success/50 bg-success-light/40 px-3 py-1 text-sm font-bold text-gray-900"
              >
                {w}
              </motion.span>
            ))}
          </div>
        </button>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
          {current && (
            <motion.div
              animate={shakeCard ? { x: [0, -10, 10, -10, 10, 0] } : { scale: 1 }}
              transition={shakeCard ? { duration: 0.45 } : motionSpring}
              className="pointer-events-auto flex max-w-sm flex-col items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-8 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <AudioButton text={current.word} rate={0.8} />
              </div>
              <p className="text-center font-andika text-4xl font-bold text-gray-900">{current.word}</p>
            </motion.div>
          )}
        </div>
      </div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
