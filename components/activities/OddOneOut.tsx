'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { OddOneOutData } from '@/data/types'
import { motionSpring } from '@/lib/celebrations'
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

  useEffect(() => {
    setPhase('pick')
    setWrongPick(null)
    setFeedback(null)
    setBurst(null)
  }, [setIdx])

  const handlePick = (i: number) => {
    if (!current || phase === 'reveal') return
    const odd = current.oddOneOut
    if (i === odd) {
      const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
      const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
      setBurst({ x: cx, y: cy })
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
      setFeedback('Good try — look for the sound that is different.')
      window.setTimeout(() => setWrongPick(null), 600)
    }
  }

  if (total === 0) return null
  if (!current) return null

  const odd = current.oddOneOut

  return (
    <ActivityCardFrame
      emoji={data.emoji}
      title={data.title}
      instruction={data.instruction}
      progress={total > 1 ? { current: setIdx + 1, total } : undefined}
    >
      <motion.div
        key={setIdx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionSpring}
        className="flex w-full flex-col gap-6"
      >
        <div className="grid w-full grid-cols-2 gap-4">
          {current.words.map((word, i) => {
            const isOdd = i === odd
            const isWrong = wrongPick === i
            const showCorrectOdd = phase === 'reveal' && isOdd
            const glowMatch = phase === 'reveal' && !isOdd

            const cardTransition = isWrong ? { duration: 0.45 } : motionSpring

            return (
              <motion.div
                key={`${setIdx}-${i}-${word}`}
                animate={isWrong ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                transition={cardTransition}
                className="w-full"
              >
                <TactileButton
                  variant="ghost"
                  disabled={phase === 'reveal'}
                  onClick={() => handlePick(i)}
                  className={`relative !h-auto !min-h-24 !w-full !max-w-none !whitespace-normal !px-4 !py-6 font-andika text-4xl font-bold text-gray-900 ${
                    isWrong ? '!border-warning !bg-warning-light' : ''
                  } ${glowMatch ? '!border-success !ring-2 !ring-success/40' : ''} ${
                    showCorrectOdd ? '!border-primary !bg-primary-light !ring-2 !ring-primary/35' : ''
                  }`}
                >
                  {word}
                </TactileButton>
              </motion.div>
            )
          })}
        </div>

        {phase === 'reveal' && (
          <div className="flex flex-col gap-3 text-center">
            <p className="font-andika text-2xl font-bold text-primary md:text-3xl">
              Found it! That&apos;s the odd one out.
            </p>
            <p className="font-andika text-xl font-bold text-gray-900 md:text-2xl">{current.explanation}</p>
          </div>
        )}

        {feedback && phase === 'pick' && (
          <p className="text-center text-sm text-gray-500">{feedback}</p>
        )}
      </motion.div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
