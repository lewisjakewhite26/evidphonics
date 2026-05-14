'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { GraphemeData } from '@/data/types'
import { graphemesByPhase } from '@/data/graphemes'
import { ActivityPickerModal } from '@/components/layout/ActivityPickerModal'
import { SuitePageAmbient } from '@/components/layout/SuitePageAmbient'
import { TactileButton } from '@/components/ui/TactileButton'
import { generateTileGradient } from '@/lib/tileGradient'
import { sortActivitiesByPedagogy } from '@/lib/lessonConstants'
import type { ActivityType } from '@/data/types'

const PHASE_SECTION_TITLE: Record<number, string> = {
  2: 'Phase 2 — Basic Code',
  3: 'Phase 3 — Digraphs',
  5: 'Phase 5 — Alternative Spellings',
  6: 'Phase 6 — Spelling Patterns',
}

export default function GraphemePickerPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])
  const [openPhase, setOpenPhase] = useState<number | null>(null)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const doneButtonRef = useRef<HTMLButtonElement>(null)
  const addAnotherPhaseRef = useRef<HTMLButtonElement>(null)

  const phaseEntries = useMemo(
    () =>
      Object.entries(graphemesByPhase).sort(([a], [b]) => Number(a) - Number(b)) as [string, GraphemeData[]][],
    [],
  )

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const toggleGrapheme = useCallback((g: string) => {
    setSelected((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }, [])

  const modalAllSelected = useMemo(() => {
    if (openPhase === null) return false
    const list = graphemesByPhase[openPhase] ?? []
    return list.length > 0 && list.every((e) => selectedSet.has(e.grapheme))
  }, [openPhase, selectedSet])

  const toggleSelectAllInOpenPhase = useCallback(() => {
    if (openPhase === null) return
    const list = graphemesByPhase[openPhase] ?? []
    setSelected((prev) => {
      const inPhase = new Set(list.map((e) => e.grapheme))
      const allOn = list.every((e) => prev.includes(e.grapheme))
      if (allOn) return prev.filter((g) => !inPhase.has(g))
      const next = new Set(prev)
      for (const e of list) next.add(e.grapheme)
      return [...next]
    })
  }, [openPhase])

  const openActivityPicker = useCallback(() => {
    if (selected.length === 0) return
    setOpenPhase(null)
    setActivityModalOpen(true)
  }, [selected])

  const closeActivityPicker = useCallback(() => setActivityModalOpen(false), [])

  const handleStartLessonFromModal = useCallback(
    (graphemeIds: string[], activities: ActivityType[]) => {
      const ordered = sortActivitiesByPedagogy(activities)
      const q = new URLSearchParams({
        graphemes: graphemeIds.join(','),
        activities: ordered.join(','),
      })
      navigate(`/lesson?${q.toString()}`)
    },
    [navigate],
  )

  const closeModal = useCallback(() => setOpenPhase(null), [])

  useEffect(() => {
    if (openPhase === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openPhase, closeModal])

  useEffect(() => {
    if (openPhase === null && !activityModalOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [openPhase, activityModalOpen])

  const modalGraphemes = openPhase !== null ? (graphemesByPhase[openPhase] ?? []) : []
  const modalTitle =
    openPhase !== null ? (PHASE_SECTION_TITLE[openPhase] ?? `Phase ${openPhase}`) : ''

  const modalPhaseSelectedCount = useMemo(() => {
    if (openPhase === null) return 0
    const list = graphemesByPhase[openPhase] ?? []
    return list.filter((e) => selectedSet.has(e.grapheme)).length
  }, [openPhase, selectedSet])

  useEffect(() => {
    if (openPhase === null) return
    const list = graphemesByPhase[openPhase] ?? []
    const count = list.filter((e) => selectedSet.has(e.grapheme)).length
    const id = window.requestAnimationFrame(() => {
      if (count > 0) {
        doneButtonRef.current?.focus()
      } else {
        addAnotherPhaseRef.current?.focus()
      }
    })
    return () => window.cancelAnimationFrame(id)
    // Intentionally only when the modal opens (phase id changes), not on each selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPhase])

  const selectedCountByPhase = useMemo(() => {
    const m = new Map<number, number>()
    for (const [phaseKey, graphemes] of phaseEntries) {
      const phase = Number(phaseKey)
      m.set(phase, graphemes.filter((g) => selectedSet.has(g.grapheme)).length)
    }
    return m
  }, [phaseEntries, selectedSet])

  return (
    <div className="relative min-h-screen font-sans">
      <SuitePageAmbient />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex shrink-0 flex-row items-start gap-4 pr-8 pl-10 pt-8">
          <div
            className="h-12 w-12 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #8B00FF 0%, #FF69B4 100%)',
              WebkitMaskImage: 'url(/company-mark.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              WebkitMaskSourceType: 'luminance',
              maskImage: 'url(/company-mark.png)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              maskMode: 'luminance',
            }}
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A0033]">EvidPhonics</h1>
            <p className="mt-1 text-sm text-[#718096]">Interactive phonics for every classroom</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center px-4 pt-4 pb-36 sm:px-8 lg:px-12">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {phaseEntries.map(([phaseKey, graphemes], cardIndex) => {
              const phase = Number(phaseKey)
              const title = PHASE_SECTION_TITLE[phase] ?? `Phase ${phase}`
              const phaseLabel = `Phase ${phase}`
              const nFromPhase = selectedCountByPhase.get(phase) ?? 0
              const isPhaseSelected = nFromPhase > 0
              const gradient = generateTileGradient(cardIndex % 4)
              return (
                <motion.button
                  key={phase}
                  type="button"
                  onClick={() => setOpenPhase(phase)}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  style={{ background: gradient }}
                  className={`group relative flex min-h-[min(34vh,240px)] flex-col rounded-3xl p-5 text-left shadow-[0_16px_44px_-12px_rgba(0,0,0,0.28)] ring-1 ring-white/25 transition-shadow duration-200 hover:shadow-[0_28px_64px_-10px_rgba(0,0,0,0.45)] sm:min-h-[min(38vh,300px)] sm:p-7 md:p-8 ${
                    isPhaseSelected ? 'ring-2 ring-white/80' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white opacity-70 sm:text-xs">
                      {phaseLabel}
                    </span>
                    {nFromPhase > 0 ? (
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/35 backdrop-blur-sm sm:text-xs">
                        {nFromPhase} selected
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl">{title}</span>
                  <span className="mt-2 text-sm text-white opacity-80 sm:text-base">
                    {graphemes.length} grapheme{graphemes.length === 1 ? '' : 's'}
                  </span>
                  <span className="mt-auto inline-flex max-w-full rounded-full bg-white/20 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-[2px] sm:px-5 sm:py-3 sm:text-base">
                    Choose graphemes →
                  </span>
                </motion.button>
              )
            })}
          </div>
        </main>
      </div>

      {selected.length > 0 ? (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-40 -translate-x-1/2">
          <TactileButton
            type="button"
            variant="primary"
            size="lg"
            onClick={openActivityPicker}
            className="pointer-events-auto"
          >
            Build Lesson → ({selected.length} selected)
          </TactileButton>
        </div>
      ) : null}

      {openPhase !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close phase picker"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="phase-modal-title"
            className="relative flex max-h-[min(92dvh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[20px] bg-white shadow-evid-modal sm:max-h-[min(88vh,720px)] sm:rounded-[20px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex shrink-0 flex-col gap-0.5 px-4 py-3 text-white sm:px-6 sm:py-4"
              style={{ background: 'linear-gradient(135deg, #8B00FF 0%, #FF69B4 100%)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/90">
                Phase {openPhase}
              </p>
              <h2 id="phase-modal-title" className="text-lg font-bold leading-snug sm:text-xl">
                {modalTitle}
              </h2>
            </div>

            <div className="flex shrink-0 justify-end border-b border-[rgba(139,0,255,0.1)] bg-[#FAF7FF]/80 px-3 py-2 sm:px-5">
              <button
                type="button"
                onClick={toggleSelectAllInOpenPhase}
                className="touch-target rounded-[10px] border-2 border-[#8B00FF] bg-white px-3 py-1.5 text-xs font-bold text-[#8B00FF] hover:bg-[rgba(139,0,255,0.06)] sm:text-sm"
              >
                {modalAllSelected ? 'Deselect all in this phase' : 'Select all in this phase'}
              </button>
            </div>

            <div className="shrink-0 px-3 pb-2 pt-3 sm:px-5 sm:pt-4">
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {modalGraphemes.map((entry) => {
                  const isSelected = selectedSet.has(entry.grapheme)
                  return (
                    <button
                      key={entry.grapheme}
                      type="button"
                      onClick={() => toggleGrapheme(entry.grapheme)}
                      title={`${entry.grapheme} (${entry.keyword})`}
                      className={`font-andika relative flex min-h-[52px] flex-col items-center justify-center rounded-[12px] px-0.5 py-1.5 text-center transition sm:min-h-[56px] sm:py-2 ${
                        isSelected
                          ? 'border-0 text-white shadow-evid-btn'
                          : 'border border-[rgba(139,0,255,0.15)] bg-[#FAF7FF] text-[#1A0033] hover:border-[rgba(139,0,255,0.28)]'
                      }`}
                      style={
                        isSelected
                          ? { background: 'linear-gradient(135deg, #8B00FF 0%, #FF69B4 100%)' }
                          : undefined
                      }
                    >
                      {isSelected ? (
                        <span
                          className="absolute right-0.5 top-0.5 text-[10px] font-bold text-white drop-shadow-sm sm:right-1 sm:top-1 sm:text-xs"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                      <span className={`text-base font-bold sm:text-lg ${isSelected ? 'text-white' : ''}`}>
                        {entry.grapheme}
                      </span>
                      <span
                        className={`mt-0.5 line-clamp-2 text-[9px] leading-tight sm:text-[10px] ${
                          isSelected ? 'text-white/80' : 'text-[#718096]'
                        }`}
                      >
                        {entry.keyword}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="shrink-0 border-t border-[rgba(139,0,255,0.08)] bg-white px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4">
              <button
                ref={doneButtonRef}
                type="button"
                disabled={modalPhaseSelectedCount === 0}
                onClick={openActivityPicker}
                className={`w-full rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-evid-btn transition hover:-translate-y-0.5 hover:shadow-evid-btn-hover sm:py-3 sm:text-base ${
                  modalPhaseSelectedCount > 0
                    ? ''
                    : 'cursor-not-allowed bg-gray-300 text-gray-500 shadow-none hover:translate-y-0'
                } `}
                style={
                  modalPhaseSelectedCount > 0
                    ? { background: 'linear-gradient(135deg, #8B00FF 0%, #FF69B4 100%)' }
                    : undefined
                }
              >
                {modalPhaseSelectedCount > 0
                  ? `✓ Done — ${modalPhaseSelectedCount} grapheme${modalPhaseSelectedCount === 1 ? '' : 's'} added`
                  : 'Select graphemes above'}
              </button>
              <button
                ref={addAnotherPhaseRef}
                type="button"
                onClick={closeModal}
                className="mt-2 w-full text-center text-sm text-[#718096] hover:text-[#2D3748]"
              >
                ＋ Add graphemes from another phase
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ActivityPickerModal
        open={activityModalOpen}
        graphemeIds={selected}
        onClose={closeActivityPicker}
        onStartLesson={handleStartLessonFromModal}
      />
    </div>
  )
}
