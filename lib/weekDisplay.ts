import { DayName } from '@/data/types'

export const SCHOOL_DAYS: { slug: DayName; label: string }[] = [
  { slug: 'monday', label: 'Monday' },
  { slug: 'tuesday', label: 'Tuesday' },
  { slug: 'wednesday', label: 'Wednesday' },
  { slug: 'thursday', label: 'Thursday' },
  { slug: 'friday', label: 'Friday' },
]

export function dayFocusFromWeekFocus(weekFocus: string, day: DayName): string {
  if (day === 'friday') return 'Review'
  const parts = weekFocus
    .split(' · ')
    .map((s) => s.trim())
    .filter(Boolean)
  const idx =
    day === 'monday' ? 0 : day === 'tuesday' ? 1 : day === 'wednesday' ? 2 : 3
  const part = parts[idx]
  if (part !== undefined) return part
  return parts[0] ?? weekFocus
}

export function todayDaySlug(): DayName | null {
  const js = new Date().getDay()
  const map: Record<number, DayName | null> = {
    0: null,
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: null,
  }
  return map[js] ?? null
}
