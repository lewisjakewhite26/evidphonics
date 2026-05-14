'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'
import type { RhymeTimeData } from '@/data/types'
import { speakWithHooks } from '@/lib/audio'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface RhymeTimeProps {
  data: RhymeTimeData
  onComplete: () => void
}

export function RhymeTime({ data, onComplete }: RhymeTimeProps) {
  const [index, setIndex] = useState(0)
  const [correctFlash, setCorrectFlash] = useState(false)
  const [shake, setShake] = useState(false)
  const [wrongHint, setWrongHint] = useState(false)
  const [audioActive, setAudioActive] = useState(false)
  const [advanceLock, setAdvanceLock] = useState(false)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)
  const wordsRowRef = useRef<HTMLDivElement>(null)

  const pairs = data.pairs
  const pair = pairs[index]
  const total = pairs.length
  const last = index >= total - 1

  useEffect(() => {
    if (pairs.length === 0) onComplete()
  }, [pairs.length, onComplete])

  useEffect(() => {
    setBurst(null)
  }, [index])

  const playWords = useCallback(() => {
    if (!pair || audioActive || advanceLock) return
    setAudioActive(true)
    speakWithHooks(pair.word1, 0.8, () => {
      window.setTimeout(() => {
        speakWithHooks(pair.word2, 0.8, () => setAudioActive(false))
      }, 380)
    })
  }, [pair, audioActive, advanceLock])

  const handleChoice = useCallback(
    (saidRhyme: boolean) => {
      if (!pair || advanceLock) return
      const ok = saidRhyme === pair.rhymes
      setWrongHint(false)
      if (ok) {
        setAdvanceLock(true)
        setCorrectFlash(true)
        const row = wordsRowRef.current
        if (row) {
          const r = row.getBoundingClientRect()
          setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }
        window.setTimeout(() => {
          setCorrectFlash(false)
          if (last) {
            onComplete()
          } else {
            setIndex((i) => i + 1)
          }
          setAdvanceLock(false)
        }, 1000)
      } else {
        setShake(true)
        setWrongHint(true)
        window.setTimeout(() => setShake(false), 550)
      }
    },
    [pair, last, onComplete, advanceLock],
  )

  if (total === 0 || !pair) return null

  const wordTile = (word: string, sideShake: boolean, sideFlash: boolean) => (
    <motion.div
      animate={sideShake ? { x: [0, -10, 10, -8, 8, 0] } : {}}
      transition={{ duration: sideShake ? 0.45 : 0.35 }}
      className={`flex min-h-32 min-w-[140px] flex-1 items-center justify-center rounded-xl border-2 px-4 py-6 text-center transition-colors duration-300 md:min-w-0 ${
        sideFlash ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white'
      }`}
    >
      <span className="text-center font-andika text-4xl font-bold text-gray-900">{word}</span>
    </motion.div>
  )

  return (
    <ActivityCardFrame
      emoji={data.emoji}
      title={data.title}
      instruction={data.instruction}
      progress={total > 1 ? { current: index + 1, total } : undefined}
    >
      <div className="flex w-full flex-col gap-8">
        <div ref={wordsRowRef} className="flex flex-wrap items-stretch justify-center gap-4 md:flex-nowrap">
          {wordTile(pair.word1, shake, correctFlash)}
          {wordTile(pair.word2, shake, correctFlash)}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="relative">
            <TactileButton
              variant="ghost"
              onClick={playWords}
              disabled={audioActive || advanceLock}
              className="!min-h-14 !min-w-14 !rounded-full !p-0 !px-0"
              aria-label="Play both words"
            >
              <span className="relative inline-flex items-center justify-center">
                {audioActive && (
                  <span
                    className="absolute inset-0 rounded-full border-[3px] border-primary/60"
                    aria-hidden
                  />
                )}
                <Volume2 className="relative z-10 h-7 w-7 text-primary" strokeWidth={2.5} />
              </span>
            </TactileButton>
          </div>
        </div>

        {wrongHint && (
          <p className="text-center text-sm font-medium text-gray-500">
            Nice try — listen again, then choose!
          </p>
        )}

        <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
          <TactileButton
            variant="success"
            onClick={() => handleChoice(true)}
            disabled={advanceLock}
            className="sm:max-w-xs sm:flex-1"
          >
            ✅ They rhyme!
          </TactileButton>
          <TactileButton
            onClick={() => handleChoice(false)}
            disabled={advanceLock}
            className="sm:max-w-xs sm:flex-1"
          >
            ❌ They don&apos;t rhyme!
          </TactileButton>
        </div>
      </div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
