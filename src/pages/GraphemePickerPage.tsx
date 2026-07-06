'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { ActivityType, GraphemeData } from '@/data/types'
import { graphemesByPhase, CURRICULUM_PHASES_ORDERED } from '@/data/graphemes'
import { ActivityPickerModal } from '@/components/layout/ActivityPickerModal'
import { GraphemeSearchBar } from '@/components/layout/GraphemeSearchBar'
import { PhaseSubjectCard } from '@/components/layout/PhaseSubjectCard'
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

const PHASE_SHORT_TITLE: Record<number, string> = {
  2: 'Basic Code',
  3: 'Digraphs',
  4: 'Consonant Clusters',
  5: 'Alternative Spellings',
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
    <div className="relative min-h-screen font-andika">
      <SuitePageAmbient />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex shrink-0 flex-row items-center gap-3 border-b border-black/5 bg-white px-6 py-3 shadow-md sm:px-8 sm:py-4 lg:px-10">
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-primary shadow-card"
            aria-hidden
          >
            <div className="absolute inset-0 bg-white" style={LOGO_MARK_MASK_STYLE} />
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <h1 className="text-[1.6875rem] leading-tight tracking-tight sm:text-[1.8125rem]">
              <span className="font-normal text-primary">Evid</span>
              <span className="font-bold text-ink">Phonics</span>
            </h1>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-36 pt-6 sm:px-8 sm:pt-8 lg:px-10">
          <section className="mb-8 text-center sm:mb-10">
            <h2 className="text-heading font-bold text-ink sm:text-4xl">Build your phonics lesson</h2>
            <p className="mx-auto mt-2 max-w-2xl text-body text-text-sub">
              Choose a phase, pick graphemes, then select activities to teach on the whiteboard.
            </p>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            {phaseEntries.map(([phaseKey, graphemes], index) => {
              const phase = Number(phaseKey)
              const title = PHASE_SHORT_TITLE[phase] ?? `Phase ${phase}`
              const nFromPhase = selectedCountByPhase.get(phase) ?? 0
              const sampleIds = graphemes.slice(0, 3).map((g) => g.grapheme)
              return (
                <PhaseSubjectCard
                  key={phase}
                  phase={phase}
                  title={title}
                  totalGraphemes={graphemes.length}
                  selectedCount={nFromPhase}
                  sampleGraphemeIds={sampleIds}
                  onClick={() => setOpenPhase(phase)}
                  reduceMotion={reduceMotion}
                  index={index}
                />
              )
            })}
          </div>

          <section className="mt-10 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:mt-12 sm:p-6">
            <GraphemeSearchBar selected={selected} onToggle={toggleGrapheme} />
          </section>
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
              className="flex shrink-0 flex-col gap-0.5 border-b border-border bg-white px-4 py-3 sm:px-6 sm:py-4"
            >
              <p className="text-label font-bold uppercase tracking-[0.12em] text-primary">
                Phase {openPhase}
              </p>
              <h2 id="phase-modal-title" className="text-xl font-bold leading-snug text-ink sm:text-2xl">
                {modalTitle}
              </h2>
            </div>

            <div className="flex shrink-0 justify-end border-b border-border bg-bg px-3 py-2 sm:px-5">
              <button
                type="button"
                disabled={modalGraphemes.length === 0}
                onClick={toggleSelectAllInOpenPhase}
                className="touch-target rounded-[10px] border-2 border-primary bg-white px-3 py-1.5 text-label font-bold text-primary hover:bg-primary-light disabled:cursor-not-allowed disabled:border-border disabled:bg-bg disabled:text-text-hint"
              >
                {modalAllSelected ? 'Deselect all in this phase' : 'Select all in this phase'}
              </button>
            </div>

            <div className="shrink-0 px-3 pb-2 pt-3 sm:px-5 sm:pt-4">
              {modalGraphemes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border-strong bg-bg px-4 py-10 text-center text-body leading-relaxed text-text-sub">
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
                          ? 'border-0 bg-primary text-white shadow-evid-btn'
                          : 'border border-border bg-white text-ink hover:border-border-strong'
                      }`}
                    >
                      {isSelected ? (
                        <span
                          className="absolute right-0.5 top-0.5 text-label font-bold text-white sm:right-1 sm:top-1"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                      <span className={`text-base font-bold sm:text-lg ${isSelected ? 'text-white' : ''}`}>
                        <GraphemeMark graphemeId={entry.grapheme} />
                      </span>
                      <span
                        className={`mt-0.5 line-clamp-2 text-keyword leading-tight ${
                          isSelected ? 'text-white/85' : 'text-text-sub'
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
                <p className="mt-2 text-label font-normal text-text-sub">
                  oo = short (book) · {OO_LONG_DISPLAY} = long (moon)
                </p>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-border bg-white px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4">
              <button
                ref={doneButtonRef}
                type="button"
                disabled={modalPhaseSelectedCount === 0}
                onClick={openActivityPicker}
                className={`w-full rounded-full px-5 py-2.5 text-label font-semibold shadow-evid-btn transition hover:-translate-y-0.5 hover:shadow-evid-btn-hover sm:py-3 ${
                  modalPhaseSelectedCount > 0
                    ? 'bg-primary text-white'
                    : 'cursor-not-allowed bg-gray-300 text-text-sub shadow-none hover:translate-y-0'
                } `}
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
                className="mt-2 w-full text-center text-label text-text-sub hover:text-text-main"
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
