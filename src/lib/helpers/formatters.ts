import type { Tables } from '../../types/supabase'

type Runner = Tables<'runners'>

export const formatPace = (pace: number): string => {
  const m = Math.floor(pace)
  const s = Math.round((pace - m) * 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const getNeighborhoods = (runner: Runner): string[] => {
  const extra = (runner.run_neighborhoods ?? [])
    .map(v => v.trim())
    .filter(Boolean)
  if (extra.length > 0) return Array.from(new Set(extra))
  return runner.neighborhood ? [runner.neighborhood] : []
}

export const formatNeighborhoodSummary = (values: string[]): string => {
  if (values.length === 0) return ''
  if (values.length === 1) return values[0]
  return `${values[0]} +${values.length - 1}`
}

export const timeMeta = (time: string): { abbrev: string; icon: string } => {
  const t = time.toLowerCase().trim()
  if (t.includes('morning') || t.includes('am') || t.includes('early'))
    return { abbrev: 'Morning', icon: 'coffee' }
  if (t.includes('noon') || t.includes('afternoon') || t.includes('midday'))
    return { abbrev: 'Afternoon', icon: 'sun' }
  return { abbrev: 'Evening', icon: 'moon' }
}

export type ScheduleChip = {
  day: string
  time: string
  label: string
  icon: string
}

export const buildScheduleChips = (
  days: string[],
  times: string[],
): ScheduleChip[] => {
  if (days.length && times.length) {
    return days.flatMap(day =>
      times.map(time => {
        const meta = timeMeta(time)
        return { day, time, label: `${day} ${meta.abbrev}`, icon: meta.icon }
      }),
    )
  }
  return days.map(day => ({ day, time: '', label: day, icon: '' }))
}
