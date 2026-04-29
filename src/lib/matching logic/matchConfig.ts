export const MATCH_WEIGHTS = {
  pace: 0.35,
  neighborhood: 0.3,
  schedule: 0.25,
  goals: 0.1,
} as const

// Min/mile difference thresholds → points awarded
export const PACE_THRESHOLDS = [
  { maxDiff: 0.25, score: 100 },
  { maxDiff: 0.5, score: 70 },
  { maxDiff: 1.0, score: 40 },
  { maxDiff: 1.5, score: 15 },
  { maxDiff: Infinity, score: 0 },
] as const

export const ALL_RUN_DAYS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const
export const ALL_RUN_TIMES = ['Morning', 'Afternoon', 'Evening'] as const
