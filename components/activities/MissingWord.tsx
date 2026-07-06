'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { MissingWordData } from '@/data/types'
import { speakSentence } from '@/lib/audio'
import { motionSpring } from '@/lib/celebrations'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface MissingWordProps {
  data: MissingWordData
  onComplete: () => void
}

function splitSentence(text: string): { before: string; after: string } {
  const marker = '___'
  const i = text.indexOf(marker)
  if (i < 0) return { before: text, after: '' }
  return { before: text.slice(0, i), after: text.slice(i + marker.length) }
}

function sentenceForSpeech(text: string): string {
  return text.replace(/___+/g, ' blank ')
}

export function MissingWord({ data, onComplete }: MissingWordProps) {
  const sentences = data.sentences
  const [idx, setIdx] = useState(0)
  const [solved, setSolved] = useState(false)
  const [wrongKey, setWrongKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (sentences.length === 0) onComplete()
  }, [sentences.length, onComplete])

  const current = sentences[idx]
  const total = sentences.length

  const { before, after } = useMemo(() => splitSentence(current?.text ?? ''), [current?.text])

  const speakCurrent = useCallback(() => {
    if (!current) return
    speakSentence(sentenceForSpeech(current.text))
  }, [current])

  useEffect(() => {
    if (!current) return
    setSolved(false)
    setWrongKey(null)
    setFeedback(null)
    setChosen(null)
    setBurst(null)
    speakCurrent()
  }, [current, speakCurrent])

  const handlePick = (word: string) => {
    if (!current || solved) return
    if (word === current.missingWord) {
      const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
      const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
      setBurst({ x: cx, y: cy })
      setChosen(word)
      setSolved(true)
      setFeedback('Well done!')
      window.setTimeout(() => {
        if (idx + 1 >= total) {
          onComplete()
        } else {
          setIdx((i) => i + 1)
        }
      }, 1500)
    } else {
      setWrongKey(word)
      setFeedback('Good try! Have another go.')
      window.setTimeout(() => setWrongKey(null), 500)
    }
  }

  if (total === 0) return null
  if (!current) return null

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
        className="flex w-full flex-col gap-6"
      >
        <p className="text-center font-andika text-4xl font-bold leading-relaxed text-ink">
          <span>{before}</span>
          {solved && chosen ? (
            <span className="mx-1 inline-block font-bold text-primary">{chosen}</span>
          ) : (
            <span
              aria-label="Blank"
              className="mx-1 inline-block h-[1.15em] w-[120px] shrink-0 rounded-md border-b-4 border-dashed border-primary bg-primary-light align-baseline"
            />
          )}
          <span>{after}</span>
        </p>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {current.options.map((opt) => {
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
                  className={`!w-full !max-w-none !px-4 font-andika text-4xl font-bold text-ink ${
                    isWrong ? '!border-error !bg-error-light' : ''
                  } ${solved ? 'opacity-60' : ''}`}
                >
                  {opt}
                </TactileButton>
              </motion.div>
            )
          })}
        </div>

        {feedback && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center text-sm font-medium ${solved ? 'text-success' : 'text-text-sub'}`}
          >
            {feedback}
          </motion.p>
        )}
      </motion.div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
