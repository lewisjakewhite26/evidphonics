'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { RootHuntData } from '@/data/types'
import { motionSpring } from '@/lib/celebrations'
import { speakSentence } from '@/lib/audio'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'
import { shuffle } from '@/lib/utils'

interface RootHuntProps {
  data: RootHuntData
  onComplete: () => void
}

export function RootHunt({ data, onComplete }: RootHuntProps) {
  const items = data.items
  const [idx, setIdx] = useState(0)
  const [solved, setSolved] = useState(false)
  const [wrongKey, setWrongKey] = useState<string | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)
  const total = items.length
  const current = items[idx]

  const options = useMemo(() => {
    if (!current) return []
    return shuffle([current.root, ...current.distractorRoots])
  }, [current])

  const speak = useCallback(() => {
    if (!current) return
    speakSentence(current.word)
  }, [current])

  useEffect(() => {
    if (total === 0) onComplete()
  }, [total, onComplete])

  useEffect(() => {
    setSolved(false)
    setWrongKey(null)
    setBurst(null)
    speak()
  }, [idx, speak, total])

  const handlePick = (label: string) => {
    if (!current || solved) return
    if (label === current.root) {
      const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
      const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
      setBurst({ x: cx, y: cy })
      setSolved(true)
      window.setTimeout(() => {
        if (idx + 1 >= total) onComplete()
        else setIdx((i) => i + 1)
      }, 1400)
    } else {
      setWrongKey(label)
      window.setTimeout(() => setWrongKey(null), 500)
    }
  }

  if (total === 0 || !current) return null

  const before = current.word.slice(0, current.rootStart)
  const rootSlice = current.word.slice(current.rootStart, current.rootEnd)
  const after = current.word.slice(current.rootEnd)

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
        <p
          className={`text-center font-andika text-4xl font-bold leading-relaxed text-ink sm:text-5xl ${
            solved ? 'rounded-lg bg-success-light/90 px-2 py-1 ring-2 ring-success/40' : ''
          }`}
        >
          {solved ? (
            <>
              <span>{before}</span>
              <span className="border-b-4 border-primary font-bold text-primary">{rootSlice}</span>
              <span>{after}</span>
            </>
          ) : (
            <span>{current.word}</span>
          )}
        </p>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {options.map((opt) => {
            const isWrong = wrongKey === opt
            return (
              <motion.div
                key={opt}
                animate={isWrong ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
                transition={isWrong ? { duration: 0.45 } : motionSpring}
                className="w-full"
              >
                <TactileButton
                  variant="ghost"
                  disabled={solved}
                  onClick={() => handlePick(opt)}
                  className={`!w-full !max-w-none !px-4 font-andika text-3xl font-bold text-ink ${
                    isWrong ? '!border-error !bg-error-light' : ''
                  } ${solved && opt === current.root ? '!border-success !bg-success-light' : ''} ${
                    solved && opt !== current.root ? 'opacity-50' : ''
                  }`}
                >
                  {opt}
                </TactileButton>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
