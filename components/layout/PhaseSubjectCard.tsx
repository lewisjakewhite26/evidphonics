'use client'

import { motion } from 'framer-motion'
import type { Icon } from '@phosphor-icons/react'
import { BookOpen, CaretRight, CirclesThree, Sparkle, TextAa } from '@phosphor-icons/react'
import { BRAND_GRADIENT_TW } from '@/lib/brandAccent'
import { GraphemeMark } from '@/components/ui/GraphemeMark'

type PhaseMeta = {
  icon: Icon
  description: string
}

export const PHASE_META: Record<number, PhaseMeta> = {
  2: {
    icon: BookOpen,
    description: 'Single letters & first sounds',
  },
  3: {
    icon: TextAa,
    description: 'Two letters, one sound',
  },
  4: {
    icon: CirclesThree,
    description: 'Blends at the start & end',
  },
  5: {
    icon: Sparkle,
    description: 'Alternative spellings',
  },
}

type PhaseSubjectCardProps = {
  phase: number
  title: string
  totalGraphemes: number
  selectedCount: number
  sampleGraphemeIds: string[]
  onClick: () => void
  reduceMotion: boolean | null
  index: number
}

export function PhaseSubjectCard({
  phase,
  title,
  totalGraphemes,
  selectedCount,
  sampleGraphemeIds,
  onClick,
  reduceMotion,
  index,
}: PhaseSubjectCardProps) {
  const meta = PHASE_META[phase] ?? PHASE_META[2]
  const Icon = meta.icon
  const available = totalGraphemes > 0
  const progressPct = totalGraphemes > 0 ? Math.round((selectedCount / totalGraphemes) * 100) : 0
  const hasSelection = selectedCount > 0

  return (
    <motion.button
      type="button"
      disabled={!available}
      onClick={onClick}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { delay: index * 0.08, type: 'spring', stiffness: 320, damping: 28 }}
      whileHover={reduceMotion || !available ? undefined : { scale: 1.02, y: -4 }}
      whileTap={reduceMotion || !available ? undefined : { scale: 0.98 }}
      className={`group relative w-full overflow-hidden rounded-3xl bg-white p-6 text-left shadow-lg transition-shadow hover:shadow-xl sm:p-8 ${
        !available ? 'cursor-not-allowed opacity-60' : ''
      }`}
      aria-label={
        available
          ? `Phase ${phase}, ${title}. ${totalGraphemes} graphemes${hasSelection ? `, ${selectedCount} selected` : ''}`
          : `Phase ${phase}, ${title}. Coming soon`
      }
    >
      <div
        className="absolute inset-0 bg-primary opacity-0 transition-opacity group-hover:opacity-[0.04] group-focus-visible:opacity-[0.04]"
        aria-hidden
      />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-light shadow-sm sm:h-16 sm:w-16">
              <Icon className="h-7 w-7 text-primary sm:h-8 sm:w-8" weight="duotone" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-label font-bold uppercase tracking-wide text-primary">Phase {phase}</p>
              <h3 className="text-subheading font-bold leading-tight text-ink sm:text-2xl">{title}</h3>
              <p className="mt-0.5 text-keyword text-text-sub">{meta.description}</p>
            </div>
          </div>
          {available ? (
            <CaretRight
              className="mt-1 h-7 w-7 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              weight="bold"
              aria-hidden
            />
          ) : null}
        </div>

        {available ? (
          <>
            {sampleGraphemeIds.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {sampleGraphemeIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center rounded-xl border border-black/5 bg-primary-light px-3 py-1.5 text-base font-bold text-primary"
                  >
                    <GraphemeMark graphemeId={id} />
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-primary-light px-3 py-2 text-center">
                <p className="text-xl font-bold text-primary">{totalGraphemes}</p>
                <p className="text-keyword text-text-sub">Graphemes</p>
              </div>
              <div className="rounded-2xl bg-primary-light px-3 py-2 text-center">
                <p className="text-xl font-bold text-primary">{selectedCount}</p>
                <p className="text-keyword text-text-sub">Selected</p>
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-keyword text-text-sub">
                <span>Lesson progress</span>
                <span>{hasSelection ? `${progressPct}%` : 'Tap to choose'}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${BRAND_GRADIENT_TW}`}
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.35 }}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-border-strong bg-white/80 px-4 py-6 text-center text-body text-text-sub">
            Coming soon
          </p>
        )}
      </div>
    </motion.button>
  )
}
