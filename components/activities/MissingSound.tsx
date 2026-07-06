'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MissingSoundData } from '@/data/types'
import { speakPhoneme, speakWord } from '@/lib/audio'
import { motionSpring } from '@/lib/celebrations'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface MissingSoundProps {
  data: MissingSoundData
  onComplete: () => void
}

export function MissingSound({ data, onComplete }: MissingSoundProps) {
  const words = data.words
  const [idx, setIdx] = useState(0)
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const [wrongTint, setWrongTint] = useState<number | null>(null)
  const [encourage, setEncourage] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const encourageTimer = useRef<number | null>(null)
  const tintTimer = useRef<number | null>(null)

  useEffect(() => {
    if (words.length === 0) onComplete()
  }, [words.length, onComplete])

  useEffect(() => {
    return () => {
      if (encourageTimer.current !== null) window.clearTimeout(encourageTimer.current)
      if (tintTimer.current !== null) window.clearTimeout(tintTimer.current)
    }
  }, [])

  if (words.length === 0) return null

  const item = words[idx]
  const last = idx >= words.length - 1

  if (!item) {
    return null
  }

  const clearEncourageLater = () => {
    if (encourageTimer.current !== null) window.clearTimeout(encourageTimer.current)
    encourageTimer.current = window.setTimeout(() => {
      setEncourage(false)
      encourageTimer.current = null
    }, 1500)
  }

  const onPick = (i: number) => {
    if (advancing) return
    if (i === item.correctIndex) {
      setAdvancing(true)
      speakWord(item.word)
      window.setTimeout(() => {
        if (last) {
          onComplete()
        } else {
          setIdx((v) => v + 1)
          setAdvancing(false)
        }
      }, 500)
      return
    }

    speakPhoneme(item.options[i])
    setWrongIdx(i)
    setWrongTint(i)
    setEncourage(true)
    clearEncourageLater()

    if (tintTimer.current !== null) window.clearTimeout(tintTimer.current)
    tintTimer.current = window.setTimeout(() => {
      setWrongTint(null)
      setWrongIdx(null)
      tintTimer.current = null
    }, 600)
  }

  const total = words.length

  return (
    <ActivityCardFrame
      emoji={data.emoji}
      title={data.title}
      instruction={data.instruction}
      progress={total > 1 ? { current: idx + 1, total } : undefined}
    >
      <p className="text-center font-andika text-4xl font-bold text-ink md:text-5xl">{item.display}</p>
      <div className="grid w-full grid-cols-2 gap-4">
        {item.options.map((opt, i) => {
          const isWrongShake = wrongIdx === i
          const showTint = wrongTint === i
          return (
            <motion.div
              key={opt}
              animate={isWrongShake ? { x: [0, -8, 8, -8, 8, -6, 6, 0] } : { x: 0 }}
              transition={isWrongShake ? { duration: 0.45, ease: 'easeInOut' } : motionSpring}
              className="w-full"
            >
              <TactileButton
                variant="ghost"
                disabled={advancing}
                onClick={() => onPick(i)}
                className={`!w-full !max-w-none !px-4 font-andika text-4xl font-bold text-ink transition-colors duration-[600ms] ease-out ${
                  showTint ? '!bg-red-500/35' : ''
                }`}
              >
                {opt}
              </TactileButton>
            </motion.div>
          )
        })}
      </div>
      <AnimatePresence>
        {encourage ? (
          <motion.p
            key="encourage-msg"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-center text-base font-semibold text-primary"
          >
            Good try! Have another go.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </ActivityCardFrame>
  )
}
