import type { Tables } from '../../types/supabase'
import {
  ALL_RUN_DAYS,
  ALL_RUN_TIMES,
  MATCH_WEIGHTS,
  PACE_THRESHOLDS,
} from './matchConfig'

type Runner = Tables<'runners'>

export const paceScore = (me: Runner, other: Runner): number => {
  const diff = Math.abs(me.pace - other.pace)
  for (const { maxDiff, score } of PACE_THRESHOLDS) {
    if (diff <= maxDiff) return score
  }
  return 0
}

export const neighborhoodScore = (me: Runner, other: Runner): number => {
  if (me.neighborhood === other.neighborhood) return 100

  const myZones = new Set(
    [me.neighborhood, ...(me.run_neighborhoods ?? [])].filter(Boolean),
  )

  const theirZones = [
    other.neighborhood,
    ...(other.run_neighborhoods ?? []),
  ].filter(Boolean)

  if (theirZones.some(z => myZones.has(z))) return 70

  return 0
}

export const scheduleScore = (me: Runner, other: Runner): number => {
  const myDays = new Set(me.run_days ?? [])
  const myTimes = new Set(me.run_times ?? [])

  const sharedDays = (other.run_days ?? []).filter(d => myDays.has(d)).length
  const sharedTimes = (other.run_times ?? []).filter(t => myTimes.has(t)).length

  const totalSlots = ALL_RUN_DAYS.length + ALL_RUN_TIMES.length
  return Math.round(((sharedDays + sharedTimes) / totalSlots) * 100)
}

export const goalsScore = (me: Runner, other: Runner): number => {
  if (!me.goals || !other.goals) return 0

  const myGoals = new Set(
    me.goals
      .split(',')
      .map(g => g.trim().toLowerCase())
      .filter(Boolean),
  )
  const theirGoals = other.goals
    .split(',')
    .map(g => g.trim().toLowerCase())
    .filter(Boolean)

  const shared = theirGoals.filter(g => myGoals.has(g)).length
  const total = Math.max(myGoals.size, theirGoals.length, 1)
  return Math.round((shared / total) * 100)
}

export const totalScore = (me: Runner, other: Runner): number => {
  return Math.round(
    paceScore(me, other) * MATCH_WEIGHTS.pace +
      neighborhoodScore(me, other) * MATCH_WEIGHTS.neighborhood +
      scheduleScore(me, other) * MATCH_WEIGHTS.schedule +
      goalsScore(me, other) * MATCH_WEIGHTS.goals,
  )
}
