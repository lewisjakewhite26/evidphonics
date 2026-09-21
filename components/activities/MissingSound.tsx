'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretLeft } from '@phosphor-icons/react'
import { MissingSoundData } from '@/data/types'
import { speakPhoneme, speakWord } from '@/lib/audio'
import { motionSpring } from '@/lib/celebrations'
import { NUDGE_ANIMATE, NUDGE_TRANSITION } from '@/lib/animations'
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
  const [correctIdx, setCorrectIdx] = useState<number | null>(null)
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
      setCorrectIdx(i)
      speakWord(item.word)
      window.setTimeout(() => {
        if (last) {
          onComplete()
        } else {
          setIdx((v) => v + 1)
          setAdvancing(false)
          setCorrectIdx(null)
        }
      }, 700)
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
      activityType={data.type}
      title={data.title}
      instruction={data.instruction}
      progress={total > 1 ? { current: idx + 1, total } : undefined}
    >
      {total > 1 && idx > 0 && (
        <div className="flex w-full justify-start">
          <TactileButton
            variant="ghost"
            disabled={advancing}
            onClick={() => {
              setWrongIdx(null)
              setWrongTint(null)
              setCorrectIdx(null)
              setEncourage(false)
              setIdx((i) => Math.max(0, i - 1))
            }}
            className="!px-4 !min-h-0 !py-2 !text-sm"
          >
            <span className="inline-flex items-center gap-1.5">
              <CaretLeft className="h-4 w-4" />
              Previous
            </span>
          </TactileButton>
        </div>
      )}
      <p className="text-center font-andika text-4xl font-bold text-ink md:text-5xl">{item.display}</p>
      <div className="grid w-full grid-cols-2 gap-4">
        {item.options.map((opt, i) => {
          const isWrongShake = wrongIdx === i
          const showTint = wrongTint === i
          const isCorrect = correctIdx === i
          return (
            <motion.div
              key={opt}
              animate={isWrongShake ? NUDGE_ANIMATE : isCorrect ? { scale: [1, 1.08, 1] } : { x: 0 }}
              transition={isWrongShake ? NUDGE_TRANSITION : isCorrect ? { duration: 0.4 } : motionSpring}
              className="w-full"
            >
              <TactileButton
                variant="ghost"
                disabled={advancing}
                onClick={() => onPick(i)}
                hotkey={i + 1}
                className={`!w-full !max-w-none !px-4 font-andika text-4xl font-bold text-ink transition-colors duration-[600ms] ease-out ${
                  showTint ? '!bg-warning-light' : ''
                } ${isCorrect ? '!border-success !bg-success/20' : ''}`}
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
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-center text-base font-semibold text-primary"
          >
            Good try. Have another go.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </ActivityCardFrame>
  )
}
