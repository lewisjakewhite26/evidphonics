'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { QuickReviewData } from '@/data/types'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'
import { DoneCheckBadge } from '@/components/ui/DoneCheckBadge'

interface QuickReviewProps {
  data: QuickReviewData
  onComplete: () => void
}

export function QuickReview({ data, onComplete }: QuickReviewProps) {
  const reviewWords = data.words.map((word) => ({ word, phonemes: [] as string[] }))
  const [clickedWords, setClickedWords] = useState<Set<number>>(new Set())

  const handleWordClick = (index: number) => {
    setClickedWords((prev) => {
      const updated = new Set(prev)
      if (updated.has(index)) updated.delete(index)
      else updated.add(index)
      return updated
    })
  }

  const allClicked = clickedWords.size === reviewWords.length
  const total = reviewWords.length

  return (
    <ActivityCardFrame
      activityType={data.type}
      title={data.title}
      instruction={data.instruction}
      progress={total > 1 ? { current: clickedWords.size, total } : undefined}
    >
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        {reviewWords.map((item, wordIndex) => {
          const isClicked = clickedWords.has(wordIndex)

          return (
            <motion.div
              key={wordIndex}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: wordIndex * 0.1, type: 'spring', stiffness: 200 }}
              className="flex w-full max-w-xs flex-col items-center gap-4"
            >
              <motion.div whileTap={{ scale: 0.97 }} className="relative w-full">
                <TactileButton
                  variant="ghost"
                  type="button"
                  onClick={() => handleWordClick(wordIndex)}
                  className={`!h-auto !min-h-[120px] !w-full !max-w-none !rounded-2xl !px-6 !py-6 font-andika text-4xl font-bold text-ink md:!text-5xl ${
                    isClicked ? '!border-primary !bg-primary-light !ring-2 !ring-primary/25' : '!border-border'
                  }`}
                >
                  {item.word}
                </TactileButton>
                {isClicked && <DoneCheckBadge />}
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {allClicked && (
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex w-full justify-center pt-2"
        >
          <TactileButton onClick={onComplete}>Next →</TactileButton>
        </motion.div>
      )}
    </ActivityCardFrame>
  )
}
