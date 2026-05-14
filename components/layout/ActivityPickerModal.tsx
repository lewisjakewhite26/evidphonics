'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  type Icon,
  Alien,
  ArrowsClockwise,
  ArrowsLeftRight,
  ArrowsMerge,
  Lightning,
  MagnifyingGlass,
  MusicNotes,
  PencilSimple,
  PuzzlePiece,
  Scissors,
  SquaresFour,
  Target,
  TextT,
  Tree,
  WarningOctagon,
  Waveform,
} from '@phosphor-icons/react'
import { graphemeMap } from '@/data/graphemes'
import type { ActivityType, GraphemeData } from '@/data/types'
import { generateTileGradient } from '@/lib/tileGradient'
import { ACTIVITY_LABELS, ACTIVITY_ORDER, sortActivitiesByPedagogy } from '@/lib/lessonConstants'

const ACTIVITY_ORDER_KEY = ACTIVITY_ORDER.join(',')

const ACTIVITY_ICONS: Record<ActivityType, Icon> = {
  speedySounds: Lightning,
  trickyTrap: WarningOctagon,
  quickReview: ArrowsClockwise,
  soundBlender: Waveform,
  missingSound: MagnifyingGlass,
  alienOrReal: Alien,
  rhymeTime: MusicNotes,
  soundSort: ArrowsLeftRight,
  missingWord: TextT,
  oddOneOut: Target,
  wordBuilder: SquaresFour,
  writeIt: PencilSimple,
  wordChanger: ArrowsMerge,
  wordSplitter: Scissors,
  meaningMatch: PuzzlePiece,
  rootHunt: Tree,
}

/** Mirrors `buildLessonFromGraphemes` activity inclusion rules (type-level only). */
function isActivityAvailable(type: ActivityType, selection: GraphemeData[]): boolean {
  if (selection.length === 0) return true
  const hasMorphemeFocus = selection.some((s) => s.type === 'morpheme')
  const morphOnly = selection.every((s) => s.type === 'morpheme')

  if (hasMorphemeFocus) {
    if (['speedySounds', 'soundBlender', 'missingSound', 'wordBuilder'].includes(type)) return false
    if (!morphOnly && ['wordChanger', 'wordSplitter', 'meaningMatch', 'rootHunt'].includes(type)) return false
    return true
  }
  if (['wordChanger', 'wordSplitter', 'meaningMatch', 'rootHunt'].includes(type)) return false
  return true
}

export type ActivityPickerModalProps = {
  open: boolean
  graphemeIds: string[]
  onClose: () => void
  onStartLesson: (graphemeIds: string[], activities: ActivityType[]) => void
}

export function ActivityPickerModal({ open, graphemeIds, onClose, onStartLesson }: ActivityPickerModalProps) {
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([])

  const tileGradients = useMemo(() => {
    const m = new Map<ActivityType, string>()
    ACTIVITY_ORDER.forEach((type, index) => {
      m.set(type, generateTileGradient(index))
    })
    return m
  }, [ACTIVITY_ORDER_KEY])

  useEffect(() => {
    if (!open) return
    setSelectedActivities([])
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const selectionData = useMemo(
    () => graphemeIds.map((id) => graphemeMap.get(id)).filter((g): g is GraphemeData => Boolean(g)),
    [graphemeIds],
  )

  const toggleActivity = useCallback(
    (t: ActivityType) => {
      if (!isActivityAvailable(t, selectionData)) return
      setSelectedActivities((prev) =>
        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
      )
    },
    [selectionData],
  )

  const startLesson = useCallback(() => {
    if (selectedActivities.length === 0) return
    onStartLesson(graphemeIds, sortActivitiesByPedagogy([...selectedActivities]))
  }, [selectedActivities, graphemeIds, onStartLesson])

  const activityCount = selectedActivities.length

  const renderActivityTile = (type: ActivityType) => {
    const available = isActivityAvailable(type, selectionData)
    const on = selectedActivities.includes(type)
    const label = ACTIVITY_LABELS[type]
    const Icon = ACTIVITY_ICONS[type]

    let stateCls: string
    let selectedStyle: CSSProperties | undefined

    if (!available) {
      stateCls =
        'cursor-not-allowed border border-[rgba(139,0,255,0.12)] bg-white opacity-25 shadow-sm'
    } else if (on) {
      stateCls =
        'cursor-pointer border-0 text-white shadow-evid-btn transition hover:opacity-95'
      const bg = tileGradients.get(type)
      selectedStyle = bg ? { background: bg } : undefined
    } else {
      stateCls =
        'cursor-pointer border border-[rgba(139,0,255,0.12)] bg-white shadow-sm transition hover:border-[rgba(139,0,255,0.28)]'
    }

    const iconCls = on && available ? 'text-white' : available ? 'text-[#8B00FF]' : 'text-[#8B00FF]'
    const nameCls =
      on && available
        ? 'mt-1.5 text-center text-[12px] font-semibold leading-tight text-white'
        : 'mt-1.5 text-center text-[12px] font-semibold leading-tight text-[#2D3748]'

    return (
      <button
        key={type}
        type="button"
        disabled={!available}
        onClick={() => toggleActivity(type)}
        style={selectedStyle}
        title={label}
        className={`relative flex aspect-square w-full min-h-0 flex-col items-center justify-center rounded-[14px] px-1 py-2 text-center ${stateCls}`}
      >
        <Icon className={iconCls} weight="duotone" size={32} aria-hidden />
        <span className={`line-clamp-2 ${nameCls}`}>{label}</span>
      </button>
    )
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close activity picker"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-modal-title"
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-t-[20px] bg-white shadow-evid-modal sm:rounded-[20px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 flex-col gap-2 px-4 py-3 text-white sm:px-6 sm:py-4"
          style={{ background: 'linear-gradient(135deg, #8B00FF 0%, #FF69B4 100%)' }}
        >
          <h2 id="activity-modal-title" className="text-lg font-bold leading-snug sm:text-xl">
            Choose activities
          </h2>
          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-hidden">
            {graphemeIds.map((id) => {
              const g = graphemeMap.get(id)?.grapheme ?? id
              return (
                <span
                  key={id}
                  className="font-andika shrink-0 rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white"
                >
                  {g}
                </span>
              )
            })}
          </div>
        </div>

        <div className="shrink-0 bg-white p-6">
          <div className="grid grid-cols-6 gap-2">{ACTIVITY_ORDER.map((type) => renderActivityTile(type))}</div>
        </div>

        <div className="shrink-0 border-t border-[rgba(139,0,255,0.08)] bg-white px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4">
          <button
            type="button"
            disabled={activityCount === 0}
            onClick={startLesson}
            className={`w-full rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-evid-btn transition hover:-translate-y-0.5 hover:shadow-evid-btn-hover sm:py-3 sm:text-base ${
              activityCount > 0
                ? ''
                : 'cursor-not-allowed bg-gray-300 text-gray-500 shadow-none hover:translate-y-0'
            } `}
            style={
              activityCount > 0
                ? { background: 'linear-gradient(135deg, #8B00FF 0%, #FF69B4 100%)' }
                : undefined
            }
          >
            Start Lesson → ({activityCount} {activityCount === 1 ? 'activity' : 'activities'})
          </button>
        </div>
      </div>
    </div>
  )
}
