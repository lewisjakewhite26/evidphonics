'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { WordChangerData, WordChangerStep } from '@/data/types'
import { motionSpring } from '@/lib/celebrations'
import { speakSentence } from '@/lib/audio'
import { shuffle } from '@/lib/utils'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface WordChangerProps {
  data: WordChangerData
  onComplete: () => void
}

function renderResultWord(step: WordChangerStep) {
  const w = step.result
  if (step.prefix) {
    const pl = step.prefix.length
    return (
      <>
        <span className="font-bold text-primary">{w.slice(0, pl)}</span>
        <span>{w.slice(pl)}</span>
      </>
    )
  }
  if (step.suffix) {
    const sl = step.suffix.length
    return (
      <>
        <span>{w.slice(0, w.length - sl)}</span>
        <span className="font-bold text-primary">{w.slice(w.length - sl)}</span>
      </>
    )
  }
  return <span>{w}</span>
}

function correctChoiceLabel(step: WordChangerStep): string {
  if (step.suffix) {
    return `We add the ending “${step.suffix}” to the root.`
  }
  if (step.prefix) {
    return `We add the beginning “${step.prefix}” to the root.`
  }
  return 'We build a longer word from the root and an affix.'
}

const WRONG_CHOICE_POOL = [
  'We only swap two letters inside the root.',
  'We take letters off the end of the root.',
  'The root splits into two separate words.',
  'Nothing new is added — the word stays the same.',
]

function buildShuffledChoices(step: WordChangerStep): string[] {
  const correct = correctChoiceLabel(step)
  const wrongs = shuffle(WRONG_CHOICE_POOL.filter((w) => w !== correct))
  return shuffle([correct, wrongs[0]!, wrongs[1]!])
}

export function WordChanger({ data, onComplete }: WordChangerProps) {
  const steps = data.steps
  const [idx, setIdx] = useState(0)
  const [quizSolved, setQuizSolved] = useState(false)
  const [wrongChoice, setWrongChoice] = useState<string | null>(null)
  const total = steps.length
  const current = steps[idx]

  const choices = useMemo(() => (current ? buildShuffledChoices(current) : []), [current])

  const speak = useCallback(() => {
    if (!current) return
    speakSentence(`${current.root}. ${current.result}.`)
  }, [current])

  useEffect(() => {
    if (total === 0) onComplete()
  }, [total, onComplete])

  useEffect(() => {
    setQuizSolved(false)
    setWrongChoice(null)
  }, [idx])

  useEffect(() => {
    speak()
  }, [speak])

  if (total === 0 || !current) return null

  const correctLabel = correctChoiceLabel(current)

  const handleChoice = (label: string) => {
    if (quizSolved) return
    if (label === correctLabel) {
      setQuizSolved(true)
      setWrongChoice(null)
    } else {
      setWrongChoice(label)
      window.setTimeout(() => setWrongChoice(null), 650)
    }
  }

  const advance = () => {
    if (idx + 1 >= total) onComplete()
    else setIdx((i) => i + 1)
  }

  return (
    <ActivityCardFrame
      emoji={data.emoji}
      title={data.title}
      instruction={data.instruction}
      progress={total > 1 ? { current: idx + 1, total } : undefined}
    >
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionSpring}
        className="flex w-full flex-col items-center gap-6"
      >
        <p className="text-center font-andika text-4xl font-bold leading-relaxed text-ink sm:text-5xl">
          {current.root}
        </p>

        <p className="text-center font-andika text-3xl font-bold leading-relaxed text-ink sm:text-4xl">
          {renderResultWord(current)}
        </p>

        <div className="w-full max-w-xl">
          <p className="mb-3 text-center text-base font-bold text-ink">What happened?</p>
          <div className="flex flex-col gap-3">
            {choices.map((label) => {
              const isWrong = wrongChoice === label
              return (
                <motion.div
                  key={label}
                  animate={isWrong ? { x: [0, -5, 5, -5, 5, 0] } : { x: 0 }}
                  transition={isWrong ? { duration: 0.42 } : motionSpring}
                  className="w-full"
                >
                  <TactileButton
                    variant="ghost"
                    type="button"
                    disabled={quizSolved}
                    onClick={() => handleChoice(label)}
                    className={`!h-auto !min-h-14 !w-full !max-w-none !whitespace-normal !px-4 !py-3 text-left font-andika text-lg font-bold leading-snug text-ink sm:!py-4 sm:text-xl ${
                      isWrong ? '!border-error !bg-error-light' : ''
                    } ${quizSolved && label === correctLabel ? '!border-success !bg-success-light' : ''} ${
                      quizSolved && label !== correctLabel ? 'opacity-45' : ''
                    }`}
                  >
                    {label}
                  </TactileButton>
                </motion.div>
              )
            })}
          </div>
        </div>

        {quizSolved ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionSpring}
            className="w-full max-w-xl rounded-2xl border border-border bg-surface-raised px-4 py-3 sm:px-6 sm:py-4"
          >
            <p className="text-center text-sm font-semibold text-text-sub">Why it matters</p>
            <p className="mt-1 text-center text-base font-medium leading-snug text-ink">{current.meaningHint}</p>
          </motion.div>
        ) : null}

        <div className="flex w-full justify-center pt-2">
          <TactileButton disabled={!quizSolved} onClick={advance}>
            Next →
          </TactileButton>
        </div>
      </motion.div>
    </ActivityCardFrame>
  )
}
