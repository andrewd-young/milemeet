import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'

import { colors, radii } from '../app/theme'
import { formatPace } from '../lib/helpers/formatters'
import type { Tables } from '../types/supabase'
import NeighborhoodMap from './NeighborhoodMap'

type Runner = Tables<'runners'>

type Stat = {
  label: string
  value: string | number
  accent?: boolean
}

type RunnerActivityCardProps = {
  runner: Runner
  stats?: Stat[]
  mapHeight?: number
}

const defaultStats = (runner: Runner): Stat[] => [
  { label: 'DISTANCE', value: `${runner.distance_max} mi`, accent: true },
  { label: 'AVG PACE', value: `${formatPace(runner.pace)}/mi` },
  { label: 'DAYS/WK', value: runner.run_days?.length ?? '—' },
]

const RunnerActivityCard = ({
  runner,
  stats,
  mapHeight = 180,
}: RunnerActivityCardProps) => {
  const resolvedStats = stats ?? defaultStats(runner)

  return (
    <View style={s.card}>
      <View>
        <NeighborhoodMap
          neighborhood={runner.neighborhood ?? ''}
          neighborhoods={runner.run_neighborhoods}
          height={mapHeight}
        />
        <LinearGradient
          colors={['transparent', colors.overlayMedium, colors.surface]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={s.mapGradient}
        />
      </View>
      <View style={s.statsRow}>
        {resolvedStats.map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <View style={s.divider} />}
            <View style={s.stat}>
              <Text style={s.statLabel}>{stat.label}</Text>
              <Text style={[s.statValue, stat.accent && s.statValueAccent]}>
                {stat.value}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  statValueAccent: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
})

export default RunnerActivityCard
