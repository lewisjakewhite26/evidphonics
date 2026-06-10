'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { allGraphemes, graphemeMap } from '@/data/graphemes'
import type { GraphemeData } from '@/data/types'
import { GraphemeMark } from '@/components/ui/GraphemeMark'
import { curriculumKey, searchGraphemes } from '@/lib/graphemeSearch'

type GraphemeSearchBarProps = {
  selected: string[]
  onToggle: (key: string) => void
}

export function GraphemeSearchBar({ selected, onToggle }: GraphemeSearchBarProps) {
  const [query, setQuery] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const labelId = useId()

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const results = useMemo(() => searchGraphemes(query, allGraphemes), [query])

  const showList = listOpen && query.trim().length > 0

  const closeList = useCallback(() => setListOpen(false), [])

  useEffect(() => {
    if (!showList) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeList()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [showList, closeList])

  const handleToggle = useCallback(
    (entry: GraphemeData) => {
      onToggle(curriculumKey(entry))
      inputRef.current?.focus()
    },
    [onToggle],
  )

  return (
    <section className="mx-auto w-full max-w-6xl" aria-labelledby={labelId}>
      <h2 id={labelId} className="sr-only">
        Search graphemes
      </h2>

      <div ref={rootRef} className="relative">
        <label htmlFor="grapheme-quick-search" className="mb-2 block text-sm font-semibold text-[#2D3748]">
          Quick find graphemes
        </label>
        <div className="relative">
          <MagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B00FF]"
            size={20}
            weight="duotone"
            aria-hidden
          />
          <input
            ref={inputRef}
            id="grapheme-quick-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setListOpen(true)
            }}
            onFocus={() => setListOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                closeList()
                inputRef.current?.blur()
              }
            }}
            placeholder="e.g. au, ch, oo — then tick to add"
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            className="font-andika w-full rounded-2xl border border-[rgba(139,0,255,0.2)] bg-white/90 py-3 pl-11 pr-10 text-base text-[#1A0033] shadow-sm outline-none ring-[#8B00FF]/30 placeholder:text-[#A0AEC0] focus:border-[#8B00FF] focus:ring-2"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setListOpen(false)
                inputRef.current?.focus()
              }}
              className="touch-target absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#718096] hover:bg-[#F4F0FD] hover:text-[#8B00FF]"
              aria-label="Clear search"
            >
              <X size={16} weight="bold" aria-hidden />
            </button>
          ) : null}
        </div>

        {showList ? (
          <ul
            id={listId}
            role="listbox"
            aria-label="Grapheme search results"
            className="absolute z-20 mt-1.5 max-h-[min(50vh,320px)] w-full overflow-y-auto rounded-2xl border border-[rgba(139,0,255,0.15)] bg-white py-1 shadow-evid-modal"
          >
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[#718096]" role="presentation">
                No graphemes match &ldquo;{query.trim()}&rdquo;
              </li>
            ) : (
              results.map((entry) => {
                const key = curriculumKey(entry)
                const isOn = selectedSet.has(key)
                return (
                  <li key={key} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isOn}
                      onClick={() => handleToggle(entry)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#FAF7FF] ${
                        isOn ? 'bg-[rgba(139,0,255,0.06)]' : ''
                      }`}
                    >
                      <span
                        className={`font-andika flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                          isOn
                            ? 'bg-gradient-to-br from-[#8B00FF] to-[#FF69B4] text-white'
                            : 'border border-[rgba(139,0,255,0.15)] bg-[#FAF7FF] text-[#1A0033]'
                        }`}
                      >
                        <GraphemeMark graphemeId={entry.grapheme} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#1A0033]">
                          {entry.keyword}
                        </span>
                        <span className="text-xs text-[#718096]">Phase {entry.phase}</span>
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
                          isOn
                            ? 'border-[#8B00FF] bg-[#8B00FF] text-white'
                            : 'border-[rgba(139,0,255,0.25)] bg-white text-transparent'
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map((key) => {
            const entry = graphemeMap.get(key)
            const label = entry?.keyword ?? key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggle(key)}
                className="font-andika inline-flex items-center gap-1.5 rounded-full border border-[rgba(139,0,255,0.2)] bg-white/90 px-2.5 py-1 text-sm font-semibold text-[#1A0033] shadow-sm transition hover:border-[#8B00FF] hover:bg-[#FAF7FF]"
                title={`Remove ${label}`}
              >
                <GraphemeMark graphemeId={entry?.grapheme ?? key} />
                <span className="max-w-[8rem] truncate text-xs font-normal text-[#718096]">{label}</span>
                <X size={12} weight="bold" className="text-[#8B00FF]" aria-hidden />
                <span className="sr-only">Remove {label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
