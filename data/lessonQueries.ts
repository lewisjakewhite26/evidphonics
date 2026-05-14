import { buildLessonFromGraphemes } from '@/components/engine/LessonEngine'
import { allGraphemes, allWeeks, graphemeMap } from './graphemes'
import type { GraphemeData, LessonData } from './types'

export function getLessonForGrapheme(grapheme: string): LessonData | null {
  const data = graphemeMap.get(grapheme)
  if (!data) return null
  return buildLessonFromGraphemes([data], allGraphemes)
}

export function getLessonForGraphemes(graphemeIds: string[]): LessonData | null {
  const seenId = new Set<string>()
  const sources: GraphemeData[] = []
  for (const id of graphemeIds) {
    const trimmed = id.trim()
    if (!trimmed || seenId.has(trimmed)) continue
    seenId.add(trimmed)
    const data = graphemeMap.get(trimmed)
    if (!data) return null
    sources.push(data)
  }
  if (sources.length === 0) return null
  return buildLessonFromGraphemes(sources, allGraphemes)
}

export function getLesson(stepOrGrapheme: number | string, _day?: string): LessonData | null {
  if (typeof stepOrGrapheme === 'string') {
    return getLessonForGrapheme(stepOrGrapheme)
  }
  const week = allWeeks.find((item) => item.week === stepOrGrapheme)
  if (!week) return null
  return getLessonForGrapheme(week.focus)
}
