'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { MeaningMatchData } from '@/data/types'
import { motionSpring } from '@/lib/celebrations'
import { speakSentence } from '@/lib/audio'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'
import { shuffle } from '@/lib/utils'

interface MeaningMatchProps {
  data: MeaningMatchData
  onComplete: () => void
}

const PAD_MEANINGS = ['a person who', 'without', 'full of', 'again', 'wrongly', 'the act of']

export function MeaningMatch({ data, onComplete }: MeaningMatchProps) {
  const pairs = data.pairs
  const [idx, setIdx] = useState(0)
  const [solved, setSolved] = useState(false)
  const [wrongKey, setWrongKey] = useState<string | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)
  const total = pairs.length
  const current = pairs[idx]

  const meaningPool = useMemo(() => {
    const s = new Set<string>()
    for (const p of pairs) s.add(p.meaning)
    for (const m of PAD_MEANINGS) s.add(m)
    return [...s]
  }, [pairs])

  const options = useMemo(() => {
    if (!current) return []
    const correct = current.meaning
    const rest = shuffle(meaningPool.filter((m) => m !== correct))
    const d1 = rest[0] ?? PAD_MEANINGS.find((m) => m !== correct) ?? 'again'
    return shuffle([correct, d1])
  }, [current, meaningPool, idx])

  const speak = useCallback(() => {
    if (!current) return
    speakSentence(`Match the meaning of ${current.affix}.`)
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
    if (label === current.meaning) {
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
        className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-center lg:gap-8"
      >
        <div
          className={`flex flex-1 flex-col items-center justify-center rounded-2xl border px-6 py-8 shadow-sm transition-colors duration-300 ${
            solved ? 'border-success bg-success-light ring-2 ring-success/30' : 'border-border bg-surface-raised'
          }`}
        >
          <p className="text-center font-andika text-5xl font-bold text-primary sm:text-6xl">{current.affix}</p>
          {current.examples.length > 0 && (
            <p className="mt-3 text-center text-sm text-text-sub">
              e.g. {current.examples.slice(0, 2).join(', ')}
            </p>
          )}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
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
                  className={`!w-full !max-w-none !px-4 font-andika text-2xl font-bold text-ink sm:text-3xl ${
                    isWrong ? '!border-error !bg-error-light' : ''
                  } ${solved && opt === current.meaning ? '!border-success !bg-success-light' : ''} ${
                    solved && opt !== current.meaning ? 'opacity-50' : ''
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
