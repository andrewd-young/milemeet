import type { Tables } from '../../types/supabase'
import { neighborhoodScore, paceScore } from '../matching logic/matchScore'

type Runner = Tables<'runners'>

export const isPaceMatch = (me: Runner, other: Runner): boolean =>
  paceScore(me, other) > 0

export const isNeighborhoodMatch = (me: Runner, other: Runner): boolean =>
  neighborhoodScore(me, other) > 0

export const isScheduleChipMatch = (
  me: Runner,
  day: string,
  time: string,
): boolean => {
  const myDays = new Set(me.run_days ?? [])
  const myTimes = new Set(me.run_times ?? [])
  if (!time) return myDays.has(day)
  return myDays.has(day) && myTimes.has(time)
}

export const isGoalMatch = (me: Runner, goal: string): boolean => {
  const myGoals = new Set(
    (me.goals ?? '')
      .split(',')
      .map(g => g.trim().toLowerCase())
      .filter(Boolean),
  )
  return myGoals.has(goal.trim().toLowerCase())
}
