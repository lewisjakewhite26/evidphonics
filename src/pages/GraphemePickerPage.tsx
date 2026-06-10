'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { ActivityType, GraphemeData } from '@/data/types'
import { graphemesByPhase, CURRICULUM_PHASES_ORDERED } from '@/data/graphemes'
import { ActivityPickerModal } from '@/components/layout/ActivityPickerModal'
import { GraphemeSearchBar } from '@/components/layout/GraphemeSearchBar'
import { SuitePageAmbient } from '@/components/layout/SuitePageAmbient'
import { GraphemeMark } from '@/components/ui/GraphemeMark'
import { TactileButton } from '@/components/ui/TactileButton'
import {
  graphemeAccessibilityShort,
  OO_LONG_DISPLAY,
  OO_LONG_GRAPHEME_ID,
  OO_SHORT_GRAPHEME_ID,
} from '@/lib/graphemeDisplay'
import { useModalFocusTrap } from '@/src/hooks/useModalFocusTrap'
import { curriculumKey } from '@/lib/graphemeSearch'
import { sortActivitiesByPedagogy } from '@/lib/lessonConstants'

const BRAND_HEADER_GRADIENT = 'linear-gradient(135deg, #8B00FF 0%, #FF69B4 100%)'

const LOGO_MARK_MASK_STYLE: CSSProperties = {
  WebkitMaskImage: 'url(/company-mark.png)',
  WebkitMaskSize: '78%',
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskImage: 'url(/company-mark.png)',
  maskSize: '78%',
  maskRepeat: 'no-repeat',
  maskPosition: 'center',
}

const PHASE_SECTION_TITLE: Record<number, string> = {
  2: 'Phase 2 — Basic Code',
  3: 'Phase 3 — Digraphs',
  4: 'Phase 4 — Consonant Clusters',
  5: 'Phase 5 — Alternative Spellings',
}

/** Hand-picked on-brand gradients — distinct angles/stops, not procedural. */
const PHASE_CARD_LINEAR: Record<number, string> = {
  2: 'linear-gradient(135deg, #6B00F5 0%, #C850C0 100%)',
  3: 'linear-gradient(160deg, #C850C0 0%, #FF6B9D 100%)',
  4: 'linear-gradient(150deg, #9B30FF 0%, #E040D0 100%)',
  5: 'linear-gradient(120deg, #8B00FF 0%, #FF69B4 100%)',
}

const PHASE_CARD_SURFACE_HIGHLIGHT =
  'radial-gradient(ellipse 125% 95% at 0% 0%, rgba(255,255,255,0.15) 0%, transparent 58%)'

function phaseCardBackgroundStyle(phase: number): CSSProperties {
  const linear = PHASE_CARD_LINEAR[phase] ?? PHASE_CARD_LINEAR[2]
  return {
    backgroundImage: `${PHASE_CARD_SURFACE_HIGHLIGHT}, ${linear}`,
  }
}

export default function GraphemePickerPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])
  const [openPhase, setOpenPhase] = useState<number | null>(null)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const doneButtonRef = useRef<HTMLButtonElement>(null)
  const addAnotherPhaseRef = useRef<HTMLButtonElement>(null)
  const phaseModalRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const phaseEntries = useMemo(
    () =>
      CURRICULUM_PHASES_ORDERED.map(
        (phaseNum) => [String(phaseNum), graphemesByPhase[phaseNum] ?? []] as [string, GraphemeData[]],
      ),
    [],
  )

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const toggleGrapheme = useCallback((g: string) => {
    setSelected((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }, [])

  const modalAllSelected = useMemo(() => {
    if (openPhase === null) return false
    const list = graphemesByPhase[openPhase] ?? []
    return list.length > 0 && list.every((e) => selectedSet.has(curriculumKey(e)))
  }, [openPhase, selectedSet])

  const toggleSelectAllInOpenPhase = useCallback(() => {
    if (openPhase === null) return
    const list = graphemesByPhase[openPhase] ?? []
    setSelected((prev) => {
      const inPhase = new Set(list.map(curriculumKey))
      const allOn = list.every((e) => prev.includes(curriculumKey(e)))
      if (allOn) return prev.filter((g) => !inPhase.has(g))
      const next = new Set(prev)
      for (const e of list) next.add(curriculumKey(e))
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

  useModalFocusTrap(openPhase !== null, phaseModalRef, closeModal)

  useEffect(() => {
    if (openPhase === null && !activityModalOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [openPhase, activityModalOpen])

  const modalGraphemes = openPhase !== null ? (graphemesByPhase[openPhase] ?? []) : []

  const showOoLegend = useMemo(() => {
    const ids = new Set(modalGraphemes.map((e) => e.grapheme))
    return ids.has(OO_SHORT_GRAPHEME_ID) && ids.has(OO_LONG_GRAPHEME_ID)
  }, [modalGraphemes])

  const modalTitle =
    openPhase !== null ? (PHASE_SECTION_TITLE[openPhase] ?? `Phase ${openPhase}`) : ''

  const modalPhaseSelectedCount = useMemo(() => {
    if (openPhase === null) return 0
    const list = graphemesByPhase[openPhase] ?? []
    return list.filter((e) => selectedSet.has(curriculumKey(e))).length
  }, [openPhase, selectedSet])

  useEffect(() => {
    if (openPhase === null) return
    const list = graphemesByPhase[openPhase] ?? []
    const count = list.filter((e) => selectedSet.has(curriculumKey(e))).length
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
      m.set(phase, graphemes.filter((g) => selectedSet.has(curriculumKey(g))).length)
    }
    return m
  }, [phaseEntries, selectedSet])

  return (
    <div className="relative min-h-screen font-sans">
      <SuitePageAmbient />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex shrink-0 flex-row items-center gap-3 px-6 py-3 sm:px-8 sm:py-3.5 lg:pl-10">
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl shadow-evid-btn"
            style={{ background: BRAND_HEADER_GRADIENT }}
            aria-hidden
          >
            <div className="absolute inset-0 bg-white" style={LOGO_MARK_MASK_STYLE} />
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <h1 className="text-[1.6875rem] leading-tight tracking-tight sm:text-[1.8125rem]">
              <span className="font-normal text-[#8B00FF]">Evid</span>
              <span className="font-bold text-[#1A1A2E]">Phonics</span>
            </h1>
          </div>
        </header>

        <main className="flex flex-1 flex-col px-4 pt-2 pb-36 sm:px-8 sm:pt-4 lg:px-12">
          <GraphemeSearchBar selected={selected} onToggle={toggleGrapheme} />

          <p className="mx-auto mt-6 mb-3 w-full max-w-6xl text-center text-xs font-semibold uppercase tracking-widest text-[#718096] sm:mt-8">
            Or browse by phase
          </p>

          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {phaseEntries.map(([phaseKey, graphemes]) => {
              const phase = Number(phaseKey)
              const title = PHASE_SECTION_TITLE[phase] ?? `Phase ${phase}`
              const phaseLabel = `Phase ${phase}`
              const nFromPhase = selectedCountByPhase.get(phase) ?? 0
              const isPhaseSelected = nFromPhase > 0
              const graphemeSummary =
                graphemes.length === 0
                  ? 'Coming soon'
                  : `${graphemes.length} grapheme${graphemes.length === 1 ? '' : 's'}`
              return (
                <motion.button
                  key={phase}
                  type="button"
                  onClick={() => setOpenPhase(phase)}
                  whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                  transition={
                    reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 28 }
                  }
                  style={phaseCardBackgroundStyle(phase)}
                  className={`group relative flex min-h-[min(34vh,240px)] w-full flex-col rounded-3xl p-5 text-left shadow-[0_16px_44px_-12px_rgba(0,0,0,0.28)] ring-1 ring-white/25 transition-shadow duration-200 hover:shadow-[0_28px_64px_-10px_rgba(0,0,0,0.45)] sm:min-h-[min(38vh,300px)] sm:p-7 md:p-8 ${
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
                  <span className="mt-2 text-sm text-white opacity-80 sm:text-base">{graphemeSummary}</span>
                  <span className="mt-auto inline-flex w-fit shrink-0 self-start rounded-full bg-white/20 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-[2px] sm:px-5 sm:py-3 sm:text-base">
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

      {openPhase !== null
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
              role="presentation"
            >
          <div
            ref={phaseModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="phase-modal-title"
            className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[20px] bg-white shadow-evid-modal sm:max-h-[min(88vh,720px)] sm:rounded-[20px]"
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
                disabled={modalGraphemes.length === 0}
                onClick={toggleSelectAllInOpenPhase}
                className="touch-target rounded-[10px] border-2 border-[#8B00FF] bg-white px-3 py-1.5 text-xs font-bold text-[#8B00FF] hover:bg-[rgba(139,0,255,0.06)] disabled:cursor-not-allowed disabled:border-[#D4C4EB] disabled:bg-[#F4F0FD] disabled:text-[#A0A0A0] sm:text-sm"
              >
                {modalAllSelected ? 'Deselect all in this phase' : 'Select all in this phase'}
              </button>
            </div>

            <div className="shrink-0 px-3 pb-2 pt-3 sm:px-5 sm:pt-4">
              {modalGraphemes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[rgba(139,0,255,0.2)] bg-[#FAF7FF]/90 px-4 py-10 text-center text-sm leading-relaxed text-[#718096]">
                  Phase {openPhase} graphemes are not available yet. Check back after the curriculum is added.
                </p>
              ) : (
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2 md:grid-cols-6">
                {modalGraphemes.map((entry) => {
                  const key = curriculumKey(entry)
                  const isSelected = selectedSet.has(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleGrapheme(key)}
                      title={`${entry.keyword} · ${graphemeAccessibilityShort(entry.grapheme)}`}
                      className={`font-andika touch-target relative flex flex-col items-center justify-center rounded-[12px] px-0.5 py-1.5 text-center transition sm:py-2 ${
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
                        <GraphemeMark graphemeId={entry.grapheme} />
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
              )}
              {modalGraphemes.length > 0 && showOoLegend ? (
                <p className="mt-2 text-xs font-normal text-[#718096]/90">
                  oo = short (book) · {OO_LONG_DISPLAY} = long (moon)
                </p>
              ) : null}
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
                  : modalGraphemes.length === 0
                    ? 'No graphemes yet'
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
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close phase picker"
            onClick={closeModal}
          />
            </div>,
            document.body,
          )
        : null}

      <ActivityPickerModal
        open={activityModalOpen}
        graphemeIds={selected}
        onClose={closeActivityPicker}
        onStartLesson={handleStartLessonFromModal}
      />
    </div>
  )
}
