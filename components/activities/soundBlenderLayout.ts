import type { WordSegment } from '@/data/types'

export type LetterRole = 'normal' | 'magicVowel' | 'magicE'

export interface LetterSlot {
  char: string
  step: number
  role: LetterRole
}

export interface PhonemeStepMeta {
  speakLabel: string
  /** True when this step is the merged magic-e sound (speak once; skip silent fragments). */
  isMagicE: boolean
}

export interface BlendWordLayout {
  /** Grouped display units left-to-right in spelling order */
  groups: DisplayGroup[]
  steps: PhonemeStepMeta[]
  /** Indices of magic-e pairs (vowel index → silent e index) for arcs */
  magicPairs: { vowelIdx: number; eIdx: number }[]
}

export type DisplayGroup =
  | {
      type: 'run'
      start: number
      end: number
      step: number
      role: 'normal'
    }
  | {
      type: 'single'
      index: number
      step: number
      role: LetterRole
    }

type MergedUnit =
  | { kind: 'plain'; grapheme: string; segmentIndices: number[] }
  | { kind: 'magicE'; vowel: string; segmentIndices: number[] }

const MAGIC_TOKEN = /^([aeiou])-e$/i

function lettersOnly(g: string): string {
  return g.replace(/[^a-z]/gi, '').toLowerCase()
}

export function mergeSegmentsForBlend(segments: WordSegment[]): MergedUnit[] {
  const tokens = segments.map((s) => s.grapheme)
  const out: MergedUnit[] = []
  let i = 0
  const n = tokens.length

  while (i < n) {
    const t0 = tokens[i]
    const t1 = tokens[i + 1]
    const t2 = tokens[i + 2]

    if (
      t1 === '-' &&
      t2 === 'e' &&
      t0.length === 1 &&
      /^[aeiou]$/i.test(t0)
    ) {
      out.push({
        kind: 'magicE',
        vowel: t0.toLowerCase(),
        segmentIndices: [i, i + 1, i + 2],
      })
      i += 3
      continue
    }

    const single = MAGIC_TOKEN.exec(t0)
    if (single) {
      out.push({
        kind: 'magicE',
        vowel: single[1].toLowerCase(),
        segmentIndices: [i],
      })
      i += 1
      continue
    }

    out.push({
      kind: 'plain',
      grapheme: t0,
      segmentIndices: [i],
    })
    i += 1
  }

  return out
}

function speakLabelForUnit(unit: MergedUnit, segments: WordSegment[]): string {
  if (unit.kind === 'magicE') {
    const raw = unit.segmentIndices.map((j) => segments[j]?.grapheme ?? '').join('')
    // Pedagogical label: "o-e", "a-e" — never strip the hyphen for display/speech naming.
    if (raw) return raw
    return `${unit.vowel}-e`
  }
  const g = lettersOnly(unit.grapheme)
  return (g || segments[unit.segmentIndices[0]]?.grapheme) ?? ''
}

function assignSlots(word: string, merged: MergedUnit[]): LetterSlot[] | null {
  const w = word.toLowerCase()
  const slots: LetterSlot[] = w.split('').map((char) => ({
    char,
    step: -1,
    role: 'normal',
  }))

  let cursor = 0

  for (let stepIdx = 0; stepIdx < merged.length; stepIdx++) {
    const unit = merged[stepIdx]
    if (unit.kind === 'plain') {
      const letters = lettersOnly(unit.grapheme)
      if (!letters) {
        continue
      }
      let start = w.indexOf(letters, cursor)
      if (start < 0) {
        return null
      }
      for (let k = 0; k < letters.length; k++) {
        slots[start + k].step = stepIdx
        slots[start + k].role = 'normal'
      }
      cursor = start + letters.length
    } else {
      const vi = w.indexOf(unit.vowel, cursor)
      if (vi < 0) {
        return null
      }
      /** Silent magic-e is always the final letter in CVCE-style words in this curriculum. */
      let ei = -1
      if (w.endsWith('e')) {
        ei = w.length - 1
      } else {
        for (let j = w.length - 1; j > vi; j--) {
          if (w[j] === 'e') {
            ei = j
            break
          }
        }
      }
      if (ei <= vi) {
        return null
      }
      slots[vi].step = stepIdx
      slots[vi].role = 'magicVowel'
      slots[ei].step = stepIdx
      slots[ei].role = 'magicE'
      cursor = vi + 1
    }
  }

  if (slots.some((s) => s.step < 0)) {
    return null
  }

  return slots
}

function buildGroups(slots: LetterSlot[]): DisplayGroup[] {
  const groups: DisplayGroup[] = []
  let i = 0
  while (i < slots.length) {
    const step = slots[i].step
    const role = slots[i].role

    if (role === 'magicVowel' || role === 'magicE') {
      groups.push({ type: 'single', index: i, step, role })
      i += 1
      continue
    }

    let j = i + 1
    while (
      j < slots.length &&
      slots[j].step === step &&
      slots[j].role === 'normal'
    ) {
      j += 1
    }
    groups.push({
      type: 'run',
      start: i,
      end: j - 1,
      step,
      role: 'normal',
    })
    i = j
  }

  return groups
}

export function buildBlendWordLayout(
  word: string,
  segments: WordSegment[],
): BlendWordLayout | null {
  const merged = mergeSegmentsForBlend(segments)
  const slots = assignSlots(word, merged)
  if (!slots) {
    return null
  }

  const steps: PhonemeStepMeta[] = merged.map((unit, idx) => ({
    speakLabel: speakLabelForUnit(unit, segments),
    isMagicE: unit.kind === 'magicE',
  }))

  const magicPairs: { vowelIdx: number; eIdx: number }[] = []
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].role !== 'magicVowel') continue
    const step = slots[i].step
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[j].role === 'magicE' && slots[j].step === step) {
        magicPairs.push({ vowelIdx: i, eIdx: j })
        break
      }
    }
  }

  return {
    groups: buildGroups(slots),
    steps,
    magicPairs,
  }
}
