'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { TrickyTrapData } from '@/data/types'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface TrickyTrapProps {
  data: TrickyTrapData
  onComplete: () => void
}

export function TrickyTrap({ data, onComplete }: TrickyTrapProps) {
  const words = data.words
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set())
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (words.length === 0) onComplete()
  }, [words.length, onComplete])

  const handleWordClick = (word: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (completedWords.has(word)) {
      setCompletedWords((prev) => {
        const next = new Set(prev)
        next.delete(word)
        return next
      })
    } else {
      const rect = event.currentTarget.getBoundingClientRect()
      setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      setCompletedWords((prev) => new Set([...prev, word]))
    }
  }

  const isComplete = completedWords.size === words.length
  const total = words.length

  if (words.length === 0) return null

  return (
    <ActivityCardFrame
      emoji={data.emoji}
      title={data.title}
      instruction={data.instruction}
      progress={total > 1 ? { current: completedWords.size, total } : undefined}
    >
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        {words.map((item, index) => {
          const isCompleted = completedWords.has(item.word)
          const isHovered = hoveredWord === item.word
          const trickyIndices = item.trickyLetters

          return (
            <motion.button
              key={item.word}
              type="button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: index * 0.1,
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
              onClick={(e) => handleWordClick(item.word, e)}
              onMouseEnter={() => setHoveredWord(item.word)}
              onMouseLeave={() => setHoveredWord(null)}
              className={`relative w-full cursor-pointer rounded-3xl border-2 border-border bg-white p-10 text-center shadow-md transition-all duration-300 ${
                isCompleted
                  ? 'border-primary ring-2 ring-primary/25'
                  : isHovered
                    ? 'border-primary/40 shadow-lg'
                    : 'hover:border-primary/30'
              }`}
            >
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="absolute -right-3 -top-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary-light shadow-md">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6 text-primary"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: 0.5,
                          ease: 'easeOut',
                          delay: 0.2,
                        }}
                      />
                    </svg>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="font-andika text-4xl font-bold text-ink md:text-5xl">
                    {item.word.split('').map((letter, i) => {
                      const isTricky = trickyIndices.includes(i)
                      return (
                        <motion.span
                          key={i}
                          className={
                            isCompleted && isTricky
                              ? 'rounded-sm bg-warning-light px-0.5 text-ink'
                              : ''
                          }
                          animate={isCompleted && isTricky ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                        >
                          {letter}
                        </motion.span>
                      )
                    })}
                  </div>
                </div>

                {isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="rounded-xl border border-border bg-primary-light/60 px-4 py-2"
                  >
                    <p className="text-sm font-medium text-text-main">{item.explanation}</p>
                  </motion.div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {isComplete && (
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex w-full justify-center pt-2"
        >
          <TactileButton onClick={onComplete}>Next →</TactileButton>
        </motion.div>
      )}
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
