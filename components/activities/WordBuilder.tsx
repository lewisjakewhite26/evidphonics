'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { WordBuilderData } from '@/data/types'
import { speakWord } from '@/lib/audio'
import { motionSpring } from '@/lib/celebrations'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'

interface WordBuilderProps {
  data: WordBuilderData
  onComplete: () => void
}

type Tile = { id: string; label: string }

function makeTiles(graphemes: string[], distractors: string[], wordIndex: number): Tile[] {
  const labels = [...graphemes, ...distractors]
  const shuffled: Tile[] = labels.map((label, i) => ({
    id: `w${wordIndex}-${i}-${label}`,
    label,
  }))
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function WordBuilder({ data, onComplete }: WordBuilderProps) {
  const words = data.words
  const [wordIdx, setWordIdx] = useState(0)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [slots, setSlots] = useState<(string | null)[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [shakeSlots, setShakeSlots] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)

  const current = words[wordIdx]
  const n = current?.graphemes.length ?? 0

  const resetWord = useCallback(() => {
    if (!current) return
    setTiles(makeTiles(current.graphemes, current.distractors, wordIdx))
    setSlots(Array.from({ length: current.graphemes.length }, () => null))
    setSelectedId(null)
    setShakeSlots(false)
    setCelebrate(false)
    setBurst(null)
  }, [current, wordIdx])

  useEffect(() => {
    if (!current) return
    resetWord()
    speakWord(current.word)
  }, [wordIdx, resetWord])

  const idToLabel = useMemo(() => {
    const m = new Map<string, string>()
    tiles.forEach((t) => m.set(t.id, t.label))
    return m
  }, [tiles])

  const placedIds = useMemo(() => new Set(slots.filter(Boolean) as string[]), [slots])

  const handleBankTap = (tile: Tile) => {
    if (celebrate || placedIds.has(tile.id)) return
    setSelectedId((s) => (s === tile.id ? null : tile.id))
  }

  const handleSlotTap = (slotIndex: number) => {
    if (celebrate || !current) return
    const occupant = slots[slotIndex]
    if (occupant) {
      setSlots((prev) => {
        const next = [...prev]
        next[slotIndex] = null
        return next
      })
      setSelectedId(null)
      return
    }
    if (!selectedId) return
    setSlots((prev) => {
      const next = [...prev]
      next[slotIndex] = selectedId
      return next
    })
    setSelectedId(null)

    const nextSlots = [...slots]
    nextSlots[slotIndex] = selectedId
    if (nextSlots.every(Boolean)) {
      const built = nextSlots.map((id) => (id ? idToLabel.get(id) ?? '' : ''))
      const ok = built.every((g, i) => g === current.graphemes[i])
      if (ok) {
        const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
        const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
        setBurst({ x: cx, y: cy })
        setCelebrate(true)
        window.setTimeout(() => {
          if (wordIdx + 1 >= words.length) {
            onComplete()
          } else {
            setWordIdx((w) => w + 1)
          }
        }, 1500)
      } else {
        setShakeSlots(true)
        window.setTimeout(() => {
          setShakeSlots(false)
          setSlots(Array.from({ length: current.graphemes.length }, () => null))
          setSelectedId(null)
        }, 1000)
      }
    }
  }

  if (!current || words.length === 0) {
    return (
      <ActivityCardFrame emoji={data.emoji} title={data.title} instruction={data.instruction}>
        <p className="text-center text-sm text-gray-500">No words for this activity.</p>
      </ActivityCardFrame>
    )
  }

  return (
    <ActivityCardFrame
      emoji={data.emoji}
      title={data.title}
      instruction={data.instruction}
      progress={words.length > 1 ? { current: wordIdx + 1, total: words.length } : undefined}
    >
      <div className="flex w-full justify-center">
        <TactileButton
          variant="ghost"
          type="button"
          onClick={() => {
            if (current) speakWord(current.word)
          }}
          className="!min-h-16 !px-10 !text-lg"
          aria-label="Hear the word"
        >
          🔊 Hear the word
        </TactileButton>
      </div>

      <motion.div
        key={wordIdx}
        animate={shakeSlots ? { x: [0, -8, 8, -8, 8, 0] } : { scale: 1, x: 0 }}
        transition={shakeSlots ? { duration: 0.45 } : motionSpring}
        className={`flex w-full flex-col gap-6 rounded-xl border-2 p-6 ${
          shakeSlots ? 'border-error bg-error-light/40' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="mb-2 flex flex-wrap items-end justify-center gap-2">
          {current.graphemes.map((g, i) => {
            const tid = slots[i]
            const label = tid ? idToLabel.get(tid) : null
            const minW = g.length > 1 ? 'min-w-[3.2rem]' : 'min-w-[2.25rem]'
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <motion.button
                  type="button"
                  onClick={() => handleSlotTap(i)}
                  whileTap={{ scale: 0.97 }}
                  transition={motionSpring}
                  className={`flex h-16 items-center justify-center rounded-md border-2 px-2 font-andika text-4xl font-bold ${minW} ${
                    label
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {label ?? ' '}
                </motion.button>
                <div className="flex h-3 items-center justify-center">
                  {g.length > 1 ? (
                    <span className="h-1 w-8 rounded-full bg-primary" aria-hidden />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mb-2 flex flex-wrap justify-center gap-3">
          {tiles.map((t) => {
            const placed = placedIds.has(t.id)
            const sel = selectedId === t.id
            return (
              <motion.button
                key={t.id}
                type="button"
                disabled={placed || celebrate}
                onClick={() => handleBankTap(t)}
                whileTap={placed ? undefined : { scale: 0.95 }}
                transition={motionSpring}
                animate={sel ? { scale: 1.08 } : { scale: 1 }}
                className={`min-h-14 min-w-14 touch-target rounded-lg border-2 px-3 py-2 font-andika text-4xl font-bold ${
                  placed
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-50'
                    : sel
                      ? 'border-primary bg-primary-light text-gray-900 ring-2 ring-primary/30'
                      : 'border-gray-300 bg-white text-gray-900 shadow-sm'
                }`}
              >
                {t.label}
              </motion.button>
            )
          })}
        </div>

        <div className="flex justify-center">
          <TactileButton variant="ghost" onClick={resetWord} disabled={celebrate}>
            Clear
          </TactileButton>
        </div>
      </motion.div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
