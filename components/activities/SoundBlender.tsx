'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject, ReactNode, RefObject } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BlendWord, SoundBlenderData, WordSegment } from '@/data/types'
import { speakPhoneme, speakWord } from '@/lib/audio'
import { AudioButton } from '@/components/ui/AudioButton'
import { CelebrationBurst } from '@/components/ui/CelebrationBurst'
import { TactileButton } from '@/components/ui/TactileButton'
import { ActivityCardFrame } from '@/components/activities/ActivityCardFrame'
import {
  buildBlendWordLayout,
  type DisplayGroup,
  type LetterSlot,
} from '@/components/activities/soundBlenderLayout'

interface SoundBlenderProps {
  data: SoundBlenderData
  onComplete: () => void
}

const EMPTY_SEGMENTS: WordSegment[] = []

/**
 * Split digraph arc: chord endpoints share the **same horizontal line as sound-dot centres**
 * (any `[data-phoneme-indicator]` row inside the band). Curve bulges downward only.
 */
function MagicSplitDigraphArc({
  vowelIdx,
  eIdx,
  letterRefs,
  phonemeBandRef,
  arcLit,
  remeasureKey,
}: {
  vowelIdx: number
  eIdx: number
  letterRefs: MutableRefObject<(HTMLElement | null)[]>
  phonemeBandRef: RefObject<HTMLElement | null>
  arcLit: boolean
  remeasureKey: number
}) {
  const [pathD, setPathD] = useState<string | null>(null)

  const strokeArc = arcLit ? '#2D0A6E' : '#D1D5DB'

  useLayoutEffect(() => {
    function measure() {
      const vowelEl = letterRefs.current[vowelIdx]
      const eEl = letterRefs.current[eIdx]
      const bandEl = phonemeBandRef.current
      if (!bandEl) {
        setPathD(null)
        return
      }
      const stripEl = bandEl.querySelector('[data-phoneme-indicator]') as HTMLElement | null
      if (!vowelEl || !eEl || !stripEl) {
        setPathD(null)
        return
      }
      const br = bandEl.getBoundingClientRect()
      const sr = stripEl.getBoundingClientRect()
      const vr = vowelEl.getBoundingClientRect()
      const er = eEl.getBoundingClientRect()
      const ax = vr.left + vr.width / 2 - br.left
      const bx = er.left + er.width / 2 - br.left
      const span = Math.abs(bx - ax)
      if (span < 2) {
        setPathD(null)
        return
      }
      /** Arc attaches on the same line as phoneme dots (strip vertical centre) */
      const chordY = sr.top - br.top + sr.height / 2
      const sagitta = Math.min(Math.max(span * 0.42, 26), Math.min(64, span * 0.52))
      const apexY = chordY + sagitta
      const third = span / 3
      const d = `M ${ax} ${chordY} C ${ax + third} ${apexY} ${bx - third} ${apexY} ${bx} ${chordY}`
      setPathD(d)
    }

    measure()
    window.addEventListener('resize', measure)
    const ro = new ResizeObserver(measure)
    const bandEl = phonemeBandRef.current
    const vowelEl = letterRefs.current[vowelIdx]
    const eEl = letterRefs.current[eIdx]
    if (bandEl) ro.observe(bandEl)
    if (vowelEl) ro.observe(vowelEl)
    if (eEl) ro.observe(eEl)
    return () => {
      window.removeEventListener('resize', measure)
      ro.disconnect()
    }
  }, [vowelIdx, eIdx, letterRefs, phonemeBandRef, remeasureKey])

  if (!pathD) return null

  return (
    <svg
      width="100%"
      height="100%"
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
      aria-hidden
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeArc}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-300"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function SoundBlender({ data, onComplete }: SoundBlenderProps) {
  const wordList = data.words
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [sliderPosition, setSliderPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set())
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const lastSpokenIndexRef = useRef<number | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  /** Once per word when slider first reaches ≥95% (avoids duplicate speak). */
  const endCelebrationDoneRef = useRef(false)

  const letterRefs = useRef<(HTMLElement | null)[]>([])
  const wordBlockRef = useRef<HTMLDivElement>(null)
  const phonemeBandRef = useRef<HTMLDivElement>(null)
  const [arcRedraw, setArcRedraw] = useState(0)

  const currentWordData: BlendWord | undefined = wordList[currentWordIndex]
  const segments = currentWordData?.segments ?? EMPTY_SEGMENTS
  const word = currentWordData?.word ?? ''

  const blendLayout = useMemo(
    () => (word ? buildBlendWordLayout(word, segments) : null),
    [word, segments],
  )

  useEffect(() => {
    const id = requestAnimationFrame(() => setArcRedraw((k) => k + 1))
    return () => cancelAnimationFrame(id)
  }, [word, blendLayout])

  const useSpellingLayout = blendLayout !== null
  const phonemeSteps = blendLayout?.steps
  const n = useSpellingLayout ? (phonemeSteps?.length ?? 0) : segments.length

  const currentPhonemeIndex =
    sliderPosition < 5
      ? -1
      : sliderPosition >= 95
        ? n
        : Math.floor((sliderPosition / 100) * n)

  const tryMarkSlideComplete = useCallback(
    (percentage: number) => {
      if (percentage < 95) return
      if (endCelebrationDoneRef.current) return
      endCelebrationDoneRef.current = true
      setCompletedWords((prev) => {
        if (prev.has(currentWordIndex)) return prev
        queueMicrotask(() => {
          const rect = trackRef.current?.getBoundingClientRect()
          if (rect) {
            setBurst({ x: rect.right, y: rect.top + rect.height / 2 })
          }
          speakWord(word)
        })
        return new Set([...prev, currentWordIndex])
      })
    },
    [currentWordIndex, word],
  )

  const setSliderFromClientX = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || rect.width <= 0) return
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setSliderPosition(percentage)
      tryMarkSlideComplete(percentage)
    },
    [tryMarkSlideComplete],
  )

  const handleReset = () => {
    setSliderPosition(0)
    lastSpokenIndexRef.current = null
  }

  const handleNextWord = () => {
    if (currentWordIndex < wordList.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setSliderPosition(0)
      lastSpokenIndexRef.current = null
      endCelebrationDoneRef.current = false
    }
  }

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
      setSliderPosition(0)
      lastSpokenIndexRef.current = null
      endCelebrationDoneRef.current = false
    }
  }

  useEffect(() => {
    if (currentPhonemeIndex < 0 || currentPhonemeIndex >= n) return

    if (useSpellingLayout && phonemeSteps) {
      const label = phonemeSteps[currentPhonemeIndex]?.speakLabel
      if (!label) return
      if (lastSpokenIndexRef.current === currentPhonemeIndex) return
      lastSpokenIndexRef.current = currentPhonemeIndex
      speakPhoneme(label)
      return
    }

    const seg = segments[currentPhonemeIndex]
    if (!seg || seg.isSilent) return
    if (lastSpokenIndexRef.current === currentPhonemeIndex) return
    lastSpokenIndexRef.current = currentPhonemeIndex
    speakPhoneme(seg.grapheme)
  }, [currentPhonemeIndex, n, segments, phonemeSteps, useSpellingLayout])

  useEffect(() => {
    lastSpokenIndexRef.current = null
    endCelebrationDoneRef.current = false
    setBurst(null)
  }, [currentWordIndex])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: PointerEvent) => {
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return
      setSliderFromClientX(e.clientX)
    }
    const onUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return
      pointerIdRef.current = null
      setIsDragging(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [isDragging, setSliderFromClientX])

  const startDragRocket = (e: React.PointerEvent) => {
    e.preventDefault()
    pointerIdRef.current = e.pointerId
    const el = e.currentTarget as HTMLElement
    if (typeof el.setPointerCapture === 'function') {
      el.setPointerCapture(e.pointerId)
    }
    setIsDragging(true)
    setSliderFromClientX(e.clientX)
  }

  const onTrackPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-rocket]')) return
    setSliderFromClientX(e.clientX)
  }

  /** Resolve slot steps by re-walking layout groups — slots hold step indices from buildBlendWordLayout internal logic; we reconstruct from groups */
  const filledSlots = useMemo(() => {
    if (!blendLayout || !word) return null
    const w = word.toLowerCase()
    const chars = w.split('')
    const slots: LetterSlot[] = chars.map((char) => ({
      char,
      step: -1,
      role: 'normal' as const,
    }))
    for (const g of blendLayout.groups) {
      if (g.type === 'run') {
        for (let i = g.start; i <= g.end; i++) {
          slots[i].step = g.step
          slots[i].role = 'normal'
        }
      } else {
        slots[g.index].step = g.step
        slots[g.index].role = g.role
      }
    }
    return slots
  }, [blendLayout, word])

  function stepActive(stepIndex: number): boolean {
    if (currentPhonemeIndex < 0) return false
    if (currentPhonemeIndex >= n) return true
    return stepIndex <= currentPhonemeIndex
  }

  function stepCurrent(stepIndex: number): boolean {
    return stepIndex === currentPhonemeIndex
  }

  function renderSpellingWord() {
    if (!blendLayout || !filledSlots) return null

    return (
      <div ref={wordBlockRef} className="relative mb-8">
        <div
          ref={phonemeBandRef}
          className="relative z-[11] mt-1 w-full overflow-visible pb-12"
        >
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 items-stretch">
            {blendLayout.groups.map((g: DisplayGroup) => {
              const cellKey =
                g.type === 'run' ? `col-run-${g.start}` : `col-s-${g.index}`

              let letterBlock: ReactNode
              if (g.type === 'run') {
                const text = word.slice(g.start, g.end + 1)
                const st = g.step
                const active = stepActive(st)
                const current = stepCurrent(st)
                letterBlock = (
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: current ? 1.05 : 1, rotate: 0 }}
                    transition={{ delay: g.start * 0.05 }}
                    className="relative flex items-center"
                  >
                    <div
                      className={`rounded-xl border-2 px-2 py-1 transition-all duration-300 sm:px-3 sm:py-2 ${
                        current
                          ? 'border-primary bg-primary'
                          : active
                            ? 'border-primary bg-primary-light'
                            : 'border-border bg-white'
                      }`}
                    >
                      <span
                        className={`flex font-andika font-bold tracking-tight ${
                          current ? 'text-white' : active ? 'text-ink' : 'text-text-sub'
                        } text-4xl sm:text-5xl md:text-6xl`}
                      >
                        {text.split('').map((letter, k) => {
                          const idx = g.start + k
                          return (
                            <span
                              key={idx}
                              ref={(el) => {
                                letterRefs.current[idx] = el
                              }}
                              className="inline-block"
                            >
                              {letter}
                            </span>
                          )
                        })}
                      </span>
                    </div>
                  </motion.div>
                )
              } else {
                const idx = g.index
                const slot = filledSlots[idx]
                const st = g.step
                const active = stepActive(st)
                const current = stepCurrent(st)
                letterBlock = (
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: current ? 1.05 : 1, rotate: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative"
                  >
                    <div
                      ref={(el) => {
                        letterRefs.current[idx] = el
                      }}
                      className={`rounded-xl border-2 px-2 py-1 transition-all duration-300 sm:px-3 sm:py-2 ${
                        current
                          ? 'border-primary bg-primary'
                          : active
                            ? 'border-primary bg-primary-light'
                            : 'border-border bg-white'
                      }`}
                    >
                      <span
                        className={`font-andika text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl ${
                          current ? 'text-white' : active ? 'text-ink' : 'text-text-sub'
                        }`}
                      >
                        {slot.char}
                      </span>
                    </div>
                  </motion.div>
                )
              }

              let indicator: ReactNode
              if (g.type === 'run') {
                const runLen = g.end - g.start + 1
                const st = g.step
                const current = stepCurrent(st)
                const active = stepActive(st)
                const isDigraphRun = runLen > 1
                if (isDigraphRun) {
                  indicator = (
                    <div
                      className={`h-2 w-full rounded-full transition-all duration-300 ${
                        current ? 'bg-primary-darker' : active ? 'bg-primary' : 'bg-border-strong'
                      }`}
                    />
                  )
                } else {
                  indicator = (
                    <div
                      className={`h-3 w-3 rounded-full transition-all duration-300 ${
                        current ? 'bg-primary-darker' : active ? 'bg-primary' : 'bg-border-strong'
                      }`}
                    />
                  )
                }
              } else {
                const st = g.step
                const current = stepCurrent(st)
                const active = stepActive(st)
                if (g.role === 'magicVowel' || g.role === 'magicE') {
                  indicator = <div className="h-3 w-3" aria-hidden />
                } else {
                  indicator = (
                    <div
                      className={`h-3 w-3 rounded-full transition-all duration-300 ${
                        current ? 'bg-primary-darker' : active ? 'bg-primary' : 'bg-border-strong'
                      }`}
                    />
                  )
                }
              }

              return (
                <div
                  key={cellKey}
                  className="flex min-w-0 max-w-full flex-col items-center"
                >
                  <div className="flex min-h-0 w-full flex-1 flex-col justify-end items-center">
                    {letterBlock}
                  </div>
                  <div
                    data-phoneme-indicator
                    className="mt-1 flex h-4 w-full shrink-0 items-center justify-center"
                  >
                    {indicator}
                  </div>
                </div>
              )
            })}
          </div>

          {blendLayout.magicPairs.map((pair) => {
            const pairStep = filledSlots[pair.vowelIdx]?.step ?? -1
            const lit = stepActive(pairStep)
            return (
              <MagicSplitDigraphArc
                key={`arc-${pair.vowelIdx}-${pair.eIdx}`}
                vowelIdx={pair.vowelIdx}
                eIdx={pair.eIdx}
                letterRefs={letterRefs}
                phonemeBandRef={phonemeBandRef}
                arcLit={lit}
                remeasureKey={arcRedraw}
              />
            )
          })}
        </div>
      </div>
    )
  }

  function renderLegacySegments() {
    return (
      <div className="mb-8">
        <div className="relative mb-8 flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {segments.map((segment: WordSegment, idx: number) => {
            const isSplitDigraphPair =
              segment.splitDigraphWith !== undefined ||
              segments.some((p) => p.splitDigraphWith === idx)

            const partnerIndex =
              segment.splitDigraphWith !== undefined
                ? segment.splitDigraphWith
                : segments.findIndex((p) => p.splitDigraphWith === idx)

            const isActive =
              idx <= currentPhonemeIndex ||
              (isSplitDigraphPair &&
                partnerIndex !== -1 &&
                (currentPhonemeIndex === idx || currentPhonemeIndex === partnerIndex))

            const isCurrent =
              idx === currentPhonemeIndex ||
              (isSplitDigraphPair &&
                partnerIndex !== -1 &&
                (currentPhonemeIndex === idx || currentPhonemeIndex === partnerIndex))

            const isDigraph = segment.grapheme.length > 1
            const hasSplitDigraph = segment.splitDigraphWith !== undefined

            const arcLit =
              isCurrent ||
              (idx <= currentPhonemeIndex &&
                hasSplitDigraph &&
                segment.splitDigraphWith !== undefined &&
                segment.splitDigraphWith <= currentPhonemeIndex)

            return (
              <motion.div
                key={`${segment.grapheme}-${idx}`}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: isCurrent ? 1.05 : 1, rotate: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative"
                id={`segment-${idx}`}
              >
                {hasSplitDigraph &&
                  segment.splitDigraphWith !== undefined &&
                  segment.splitDigraphWith > idx && (
                    <div
                      className="pointer-events-none absolute left-0 top-0 z-20"
                      style={{
                        width: `calc(${(segment.splitDigraphWith - idx) * 100}% + ${(segment.splitDigraphWith - idx - 1) * 4}px + 100%)`,
                      }}
                    >
                      <svg
                        className="w-full"
                        style={{
                          marginTop: '-40px',
                          height: '45px',
                        }}
                        viewBox="0 0 300 60"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M 40 55 Q 150 5, 260 55"
                          stroke={arcLit ? '#2D0A6E' : '#d1d5db'}
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                          className="transition-all duration-300"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                  )}

                <div
                  className={`rounded-xl border-2 px-2 py-1 transition-all duration-300 sm:px-3 sm:py-2 ${
                    isCurrent
                      ? 'border-primary bg-primary'
                      : isActive
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-white'
                  }`}
                >
                  <span
                    className={`font-andika text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl ${
                      isCurrent ? 'text-white' : isActive ? 'text-ink' : 'text-text-sub'
                    }`}
                  >
                    {segment.grapheme === '-' ? '' : segment.grapheme}
                  </span>
                </div>

                <div className="mt-3 flex justify-center">
                  {segment.grapheme === '-' ? (
                    <div className="h-3" />
                  ) : segment.isSilent ? (
                    <div className="h-3" />
                  ) : isDigraph && !hasSplitDigraph ? (
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCurrent
                          ? 'bg-primary-darker'
                          : isActive
                            ? 'bg-primary'
                            : 'bg-border-strong'
                      }`}
                      style={{ width: `${segment.grapheme.length * 1.5}rem` }}
                    />
                  ) : hasSplitDigraph ? (
                    <div className="h-3" />
                  ) : (
                    <div
                      className={`h-3 w-3 rounded-full transition-all duration-300 ${
                        isCurrent
                          ? 'bg-primary-darker'
                          : isActive
                            ? 'bg-primary'
                            : 'bg-border-strong'
                      }`}
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  const statusPhonemeLabel = useSpellingLayout
    ? phonemeSteps?.[currentPhonemeIndex]?.speakLabel ?? ''
    : segments[currentPhonemeIndex]?.grapheme ?? ''

  if (!currentWordData || n === 0) {
    return (
      <ActivityCardFrame emoji={data.emoji} title={data.title} instruction={data.instruction}>
        <TactileButton onClick={onComplete}>Next Activity →</TactileButton>
      </ActivityCardFrame>
    )
  }

  const wordProgressFill =
    (currentWordIndex + (completedWords.has(currentWordIndex) ? 1 : sliderPosition / 100)) /
    Math.max(1, wordList.length)

  return (
    <ActivityCardFrame
      emoji={data.emoji}
      title={data.title}
      instruction={data.instruction}
      progress={
        wordList.length > 1
          ? {
              current: currentWordIndex + 1,
              total: wordList.length,
              fillRatio: wordProgressFill,
            }
          : undefined
      }
    >
      <motion.div
        key={currentWordIndex}
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="flex w-full flex-col items-center"
      >
        {useSpellingLayout ? renderSpellingWord() : renderLegacySegments()}

        <div className="mt-8 w-full">
          <p className="mb-6 text-center text-sm text-text-sub">
            Drag the rocket to blend the sounds →
          </p>
          <div
            ref={trackRef}
            id="slider-track"
            className="relative h-24 overflow-hidden rounded-full border-2 border-border bg-gray-200 shadow-inner"
            onPointerDown={onTrackPointerDown}
            onPointerMove={(e) => {
              if (isDragging) {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
                setSliderPosition(percentage)
                if (percentage >= 95) tryMarkSlideComplete(percentage)
              }
            }}
          >
            <motion.div
              className="absolute bottom-0 left-0 top-0 bg-gradient-to-r from-primary to-warmth"
              style={{ width: `${sliderPosition}%` }}
            />

            <div className="absolute inset-0 flex items-center justify-between px-12">
              {Array.from({ length: n }, (_, idx) => (
                <div key={idx} className="h-8 w-2 rounded-full bg-white/60" />
              ))}
            </div>

            <div
              data-rocket
              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing"
              style={{ left: `${sliderPosition}%` }}
              onPointerDown={startDragRocket}
            >
              <motion.div
                animate={{
                  scale: isDragging ? 1.15 : 1,
                }}
              >
                <div className="flex h-20 w-20 select-none items-center justify-center rounded-full border-[3px] border-primary bg-white shadow-lg leading-none">
                  <span className="text-4xl" aria-hidden>
                    🚀
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="mt-6 text-center">
            {currentPhonemeIndex < 0 ? (
              <p className="text-sm text-text-sub">Start dragging to blend the sounds!</p>
            ) : currentPhonemeIndex >= n ? (
              <p className="text-sm text-text-sub">
                <span className="font-semibold text-primary">Complete! You blended all the sounds! 🎉</span>
              </p>
            ) : (
              <p className="text-sm text-text-sub">
                Sound {currentPhonemeIndex + 1} of {n}:{' '}
                <span className="font-andika text-4xl font-bold text-ink">
                  /{statusPhonemeLabel}/
                </span>
              </p>
            )}
          </div>

          <div className="mt-4 flex w-full justify-center">
            <TactileButton variant="ghost" onClick={handleReset} className="!px-8">
              Reset
            </TactileButton>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-4">
          <TactileButton
            variant="ghost"
            onClick={handlePreviousWord}
            disabled={currentWordIndex === 0}
            className="!px-6"
          >
            <span className="inline-flex items-center gap-2">
              <ChevronLeft className="h-5 w-5" />
              Previous
            </span>
          </TactileButton>

          {currentWordIndex === wordList.length - 1 ? (
            <TactileButton onClick={onComplete}>
              <span className="inline-flex items-center gap-2">
                Done
                <ChevronRight className="h-5 w-5" />
              </span>
            </TactileButton>
          ) : (
            <TactileButton onClick={handleNextWord}>
              <span className="inline-flex items-center gap-2">
                Next
                <ChevronRight className="h-5 w-5" />
              </span>
            </TactileButton>
          )}
        </div>
      </motion.div>
      {burst && (
        <CelebrationBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
    </ActivityCardFrame>
  )
}
