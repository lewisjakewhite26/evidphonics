'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SpeedySoundsData } from '@/data/types'
import { speakPhoneme } from '@/lib/audio'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'
import { GraphemeMark } from '@/components/ui/GraphemeMark'
import { DoneCheckBadge } from '@/components/ui/DoneCheckBadge'

interface SpeedySoundsProps {
  data: SpeedySoundsData
  onComplete: () => void
}

export function SpeedySounds({ data, onComplete }: SpeedySoundsProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())

  const handleLetterClick = (index: number) => {
    const g = data.graphemes[index]
    if (!g) return

    speakPhoneme(g.grapheme)

    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const isComplete = selectedIndices.size === data.graphemes.length
  const total = data.graphemes.length

  return (
    <ActivityCardFrame
      activityType={data.type}
      title={data.title}
      instruction={data.instruction}
      progress={
        total > 1
          ? {
              current: selectedIndices.size,
              total,
            }
          : undefined
      }
    >
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3">
        {data.graphemes.map((g, index) => {
          const isSelected = selectedIndices.has(index)
          return (
            <motion.div
              key={`${g.grapheme}-${index}`}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
              className="w-full"
            >
              <motion.div whileTap={{ scale: 0.97 }}>
                <TactileButton
                  variant="ghost"
                  type="button"
                  onClick={() => handleLetterClick(index)}
                  className={`!h-auto !min-h-[140px] !w-full !max-w-none !rounded-3xl !px-8 !py-8 ${
                    isSelected
                      ? '!border-primary !bg-primary-light !ring-2 !ring-primary/30'
                      : '!border-border'
                  }`}
                >
                  <span className="relative flex flex-col items-center gap-4">
                    <span className="text-center font-andika text-4xl font-bold text-ink md:text-5xl">
                      <GraphemeMark graphemeId={g.grapheme} />
                    </span>
                    {isSelected && <DoneCheckBadge />}
                  </span>
                </TactileButton>
              </motion.div>
            </motion.div>
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
    </ActivityCardFrame>
  )
}
