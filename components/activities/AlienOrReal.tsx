'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { AlienOrRealData } from '@/data/types'
import { speakWord } from '@/lib/audio'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface AlienOrRealProps {
  data: AlienOrRealData
  onComplete: () => void
}

export function AlienOrReal({ data, onComplete }: AlienOrRealProps) {
  const words = data.words
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [answered, setAnswered] = useState(false)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (words.length === 0) onComplete()
  }, [words.length, onComplete])

  const currentWord = words[currentWordIndex]
  const isLastWord = currentWordIndex === words.length - 1

  useEffect(() => {
    const w = data.words[currentWordIndex]?.word
    if (w) speakWord(w)
  }, [currentWordIndex, data.words])

  const handleAnswer = (isReal: boolean) => {
    if (answered || !currentWord) return

    setSelectedAnswer(isReal)
    setAnswered(true)

    const isCorrect = isReal === currentWord.isReal
    if (isCorrect) {
      setBurst({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    }

    window.setTimeout(() => {
      if (isLastWord) {
        onComplete()
      } else {
        setCurrentWordIndex((i) => i + 1)
        setSelectedAnswer(null)
        setAnswered(false)
        setBurst(null)
      }
    }, 1500)
  }

  if (words.length === 0) return null
  if (!currentWord) return null

  const total = words.length

  const realChosen = selectedAnswer === true
  const alienChosen = selectedAnswer === false
  const correctIsReal = currentWord.isReal

  const realBtnClass =
    answered && realChosen
      ? correctIsReal
        ? '!ring-4 !ring-success'
        : '!border-error !bg-error-light !text-ink'
      : answered && correctIsReal && alienChosen
        ? '!ring-4 !ring-success'
        : ''

  const alienBtnClass =
    answered && alienChosen
      ? !correctIsReal
        ? '!ring-4 !ring-success'
        : '!border-error !bg-error-light !text-ink'
      : answered && !correctIsReal && realChosen
        ? '!ring-4 !ring-success'
        : ''

  return (
    <ActivityCardFrame
      emoji={data.emoji}
      title={data.title}
      instruction={data.instruction}
      progress={total > 1 ? { current: currentWordIndex + 1, total } : undefined}
    >
      <motion.div
        key={currentWordIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="flex w-full flex-col items-center gap-8"
      >
        <div className="text-center font-andika text-4xl font-bold tracking-wide text-ink md:text-6xl">
          {currentWord.word}
        </div>

        <div className="grid w-full max-w-xl grid-cols-2 gap-4">
          <TactileButton
            variant="success"
            onClick={() => handleAnswer(true)}
            disabled={answered}
            className={`!px-4 ${realBtnClass}`}
          >
            <span className="flex flex-col items-center gap-1">
              <span className="text-3xl" aria-hidden>
                ✅
              </span>
              <span>Real Word</span>
            </span>
          </TactileButton>

          <TactileButton
            onClick={() => handleAnswer(false)}
            disabled={answered}
            className={`!px-4 ${alienBtnClass}`}
          >
            <span className="flex flex-col items-center gap-1">
              <span className="text-3xl" aria-hidden>
                👽
              </span>
              <span>Alien Word</span>
            </span>
          </TactileButton>
        </div>

        {answered && (
          <div className="text-center">
            <p
              className={`inline-block rounded-2xl border-2 px-6 py-3 text-sm font-semibold ${
                selectedAnswer === currentWord.isReal
                  ? 'border-success bg-success-light text-ink'
                  : 'border-warning bg-warning-light text-ink'
              }`}
            >
              {selectedAnswer === currentWord.isReal ? (
                <>
                  Correct! {currentWord.isReal ? "That's a real word!" : "That's an alien word!"}
                </>
              ) : (
                <>
                  {currentWord.isReal
                    ? "That's actually a real word!"
                    : "That's actually an alien word!"}
                </>
              )}
            </p>
          </div>
        )}
      </motion.div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
