'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { motion } from 'framer-motion'
import { CaretLeft, Sparkle } from '@phosphor-icons/react'
import type { OddOneOutData } from '@/data/types'
import { motionSpring } from '@/lib/celebrations'
import { NUDGE_ANIMATE, NUDGE_TRANSITION } from '@/lib/animations'
import { shuffle } from '@/lib/utils'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface OddOneOutProps {
  data: OddOneOutData
  onComplete: () => void
}

export function OddOneOut({ data, onComplete }: OddOneOutProps) {
  const sets = data.sets
  const [setIdx, setSetIdx] = useState(0)
  const [phase, setPhase] = useState<'pick' | 'reveal'>('pick')
  const [wrongPick, setWrongPick] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (sets.length === 0) onComplete()
  }, [sets.length, onComplete])

  const current = sets[setIdx]
  const total = sets.length

  const display = useMemo(() => {
    if (!current) return { words: [] as string[], oddIndex: 0 }
    const items = current.words.map((word, i) => ({
      word,
      isOdd: i === current.oddOneOut,
    }))
    const shuffled = shuffle(items)
    return {
      words: shuffled.map((item) => item.word),
      oddIndex: shuffled.findIndex((item) => item.isOdd),
    }
  }, [current])

  useEffect(() => {
    setPhase('pick')
    setWrongPick(null)
    setFeedback(null)
    setBurst(null)
  }, [setIdx])

  const handlePick = (i: number, e: MouseEvent<HTMLButtonElement>) => {
    if (!current || phase === 'reveal') return
    const odd = display.oddIndex
    if (i === odd) {
      const rect = e.currentTarget.getBoundingClientRect()
      setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      setPhase('reveal')
      setFeedback(null)
      window.setTimeout(() => {
        if (setIdx + 1 >= total) {
          onComplete()
        } else {
          setSetIdx((s) => s + 1)
        }
      }, 2000)
    } else {
      setWrongPick(i)
      setFeedback('Good try. Look for the sound that is different.')
      window.setTimeout(() => setWrongPick(null), 600)
    }
  }

  if (total === 0) return null
  if (!current) return null

  const odd = display.oddIndex

  return (
    <ActivityCardFrame
      activityType={data.type}
      title={data.title}
      instruction={data.instruction}
      progress={total > 1 ? { current: setIdx + 1, total } : undefined}
    >
      {total > 1 && setIdx > 0 && (
        <div className="flex w-full justify-start">
          <TactileButton
            variant="ghost"
            disabled={phase === 'reveal'}
            onClick={() => setSetIdx((s) => Math.max(0, s - 1))}
            className="!px-4 !min-h-0 !py-2 !text-sm"
          >
            <span className="inline-flex items-center gap-1.5">
              <CaretLeft className="h-4 w-4" />
              Previous
            </span>
          </TactileButton>
        </div>
      )}
      <motion.div
        key={setIdx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionSpring}
        className="flex w-full flex-col gap-6"
      >
        <div className="grid w-full grid-cols-2 gap-4">
          {display.words.map((word, i) => {
            const isOdd = i === odd
            const isWrong = wrongPick === i
            const showCorrectOdd = phase === 'reveal' && isOdd
            const glowMatch = phase === 'reveal' && !isOdd

            const cardTransition = isWrong ? NUDGE_TRANSITION : motionSpring

            return (
              <motion.div
                key={`${setIdx}-${i}-${word}`}
                animate={isWrong ? NUDGE_ANIMATE : {}}
                transition={cardTransition}
                className="w-full"
              >
                <TactileButton
                  variant="ghost"
                  disabled={phase === 'reveal'}
                  onClick={(e) => handlePick(i, e)}
                  hotkey={i + 1}
                  className={`relative !h-auto !min-h-24 !w-full !max-w-none !whitespace-normal !px-4 !py-6 font-andika text-4xl font-bold text-ink ${
                    isWrong ? '!border-warning !bg-warning-light' : ''
                  } ${glowMatch ? '!text-warmth underline decoration-warmth decoration-4 underline-offset-4' : ''} ${
                    showCorrectOdd ? '!border-primary !bg-primary-light' : ''
                  }`}
                >
                  {word}
                  {showCorrectOdd && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className="absolute -right-2 -top-2 flex items-center gap-1 rounded-full bg-warmth px-2 py-1 text-xs font-bold text-white shadow-sm"
                    >
                      <Sparkle className="h-3 w-3" weight="fill" aria-hidden />
                      Found!
                    </motion.span>
                  )}
                </TactileButton>
              </motion.div>
            )
          })}
        </div>

        {phase === 'reveal' && (
          <div role="status" aria-live="polite" className="flex flex-col gap-3 text-center">
            <p className="font-andika text-2xl font-bold text-primary md:text-3xl">
              Found it! That&apos;s the odd one out.
            </p>
            <p className="font-andika text-xl font-bold text-ink md:text-2xl">{current.explanation}</p>
          </div>
        )}

        {feedback && phase === 'pick' && (
          <p className="text-center text-sm text-text-sub">{feedback}</p>
        )}
      </motion.div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
