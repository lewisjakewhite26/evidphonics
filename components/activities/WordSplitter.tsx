'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { WordSplitterData } from '@/data/types'
import { motionSpring } from '@/lib/celebrations'
import { speakSentence } from '@/lib/audio'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface WordSplitterProps {
  data: WordSplitterData
  onComplete: () => void
}

function pillClass(role: 'prefix' | 'root' | 'suffix' | undefined): string {
  if (role === 'prefix') return 'border-primary bg-primary-light text-primary'
  if (role === 'suffix') return 'border-cyan-500 bg-cyan-50 text-cyan-900'
  return 'border-border-strong bg-white text-gray-900'
}

export function WordSplitter({ data, onComplete }: WordSplitterProps) {
  const items = data.items
  const [idx, setIdx] = useState(0)
  const total = items.length
  const current = items[idx]

  const speak = useCallback(() => {
    if (!current) return
    speakSentence(current.word)
  }, [current])

  useEffect(() => {
    if (total === 0) onComplete()
  }, [total, onComplete])

  useEffect(() => {
    speak()
  }, [speak])

  if (total === 0 || !current) return null

  const roles = current.morphemeRoles

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
        <p className="text-center font-andika text-4xl font-bold leading-relaxed text-gray-900 sm:text-5xl">
          {current.word}
        </p>

        <div className="flex w-full flex-wrap items-center justify-center gap-2 font-andika text-2xl font-bold sm:text-3xl">
          {current.morphemes.map((chunk, i) => (
            <span key={`${chunk}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-400">|</span>}
              <span
                className={`inline-flex rounded-full border-2 px-3 py-1.5 sm:px-4 sm:py-2 ${pillClass(
                  roles?.[i],
                )}`}
              >
                {chunk}
              </span>
            </span>
          ))}
        </div>

        <div className="flex w-full justify-center pt-2">
          <TactileButton
            onClick={() => {
              if (idx + 1 >= total) onComplete()
              else setIdx((i) => i + 1)
            }}
          >
            Next →
          </TactileButton>
        </div>
      </motion.div>
    </ActivityCardFrame>
  )
}
