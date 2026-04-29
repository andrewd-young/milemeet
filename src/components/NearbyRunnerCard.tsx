import React from 'react'

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'

import { FontAwesome5 } from '@expo/vector-icons'

import { colors, radii } from '../app/theme'
import {
  formatNeighborhoodSummary,
  formatPace,
  getNeighborhoods,
} from '../lib/helpers/formatters'
import {
  isGoalMatch,
  isNeighborhoodMatch,
  isPaceMatch,
} from '../lib/helpers/matchHelpers'
import type { Tables } from '../types/supabase'

type Runner = Tables<'runners'>

type NearbyRunnerCardProps = {
  runner: Runner
  onPress: () => void
  score?: number
  myRunner?: Runner
  activeFilterDays?: string[]
  activeFilterTimes?: string[]
}

const NearbyRunnerCard = ({
  runner,
  onPress,
  score,
  myRunner,
  activeFilterDays = [],
  activeFilterTimes = [],
}: NearbyRunnerCardProps) => {
  const canCompare = !!myRunner && myRunner.id !== runner.id
  const paceMatch = canCompare && isPaceMatch(myRunner!, runner)
  const neighborhoodMatch = canCompare && isNeighborhoodMatch(myRunner!, runner)

  const schedulePills = [
    ...(runner.run_days ?? []),
    ...(runner.run_times ?? []),
  ]
  const goalsPills = runner.goals
    ? runner.goals
        .split(',')
        .map(g => g.trim())
        .filter(Boolean)
    : []
  const allPills = [...schedulePills, ...goalsPills].slice(0, 6)

  const myDays = new Set(myRunner?.run_days ?? [])
  const myTimes = new Set(myRunner?.run_times ?? [])

  const isFilterMatch = (chip: string) =>
    activeFilterDays.includes(chip) || activeFilterTimes.includes(chip)

  const isUserMatch = (chip: string) => {
    if (!canCompare) return false
    if (myDays.has(chip) || myTimes.has(chip)) return true
    return isGoalMatch(myRunner!, chip)
  }

  const neighborhoodSummary = formatNeighborhoodSummary(
    getNeighborhoods(runner),
  )

  const metaParts = [
    `${formatPace(runner.pace)}/mi`,
    `${runner.distance_min}–${runner.distance_max} mi`,
    neighborhoodSummary,
  ].filter(Boolean)

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <FontAwesome5
        name="running"
        size={220}
        color={colors.accent}
        style={s.cardWatermark}
      />

      <LinearGradient
        colors={['transparent', colors.overlayHeavy, colors.bg]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {score !== undefined ? (
        <View style={s.scoreBadge}>
          <Text style={s.scorePct}>{score}%</Text>
          <Text style={s.scoreLabel}>match</Text>
        </View>
      ) : null}

      <View style={s.cardContent}>
        <View style={s.nameRow}>
          <Text style={s.cardName}>{runner.name}</Text>
          {runner.linkedin ? (
            <View style={s.linkedinBadge}>
              <FontAwesome5 name="linkedin" size={11} color={colors.linkedin} />
            </View>
          ) : null}
        </View>

        <Text style={s.metaLine}>
          {metaParts.map((part, i) => (
            <React.Fragment key={part}>
              {i > 0 && <Text style={s.metaBase}>{'  ·  '}</Text>}
              <Text
                style={[
                  s.metaBase,
                  i === 0 && paceMatch && s.metaMatch,
                  i === metaParts.length - 1 &&
                    neighborhoodSummary === part &&
                    neighborhoodMatch &&
                    s.metaMatch,
                ]}
              >
                {part}
              </Text>
            </React.Fragment>
          ))}
        </Text>

        {allPills.length > 0 ? (
          <View style={s.chipsRow}>
            {allPills.map(chip => {
              const filterMatch = isFilterMatch(chip)
              const userMatch = !filterMatch && isUserMatch(chip)
              return (
                <View
                  key={chip}
                  style={[
                    s.chip,
                    userMatch && s.chipUserMatch,
                    filterMatch && s.chipFilterMatch,
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      userMatch && s.chipTextUserMatch,
                      filterMatch && s.chipTextFilterMatch,
                    ]}
                  >
                    {chip}
                  </Text>
                </View>
              )
            })}
          </View>
        ) : null}

        <View style={s.ctaBar}>
          <FontAwesome5 name="running" size={15} color={colors.bg} />
          <Text style={s.ctaText}>View Profile</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    aspectRatio: 1,
    minHeight: 320,
    marginBottom: 14,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardWatermark: {
    position: 'absolute',
    right: -24,
    top: -16,
    opacity: 0.07,
  },
  scoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  scorePct: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.violet,
    letterSpacing: -0.5,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  cardContent: {
    padding: 18,
    gap: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  linkedinBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.linkedin + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLine: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  metaBase: {
    color: colors.textSecondary,
  },
  metaMatch: {
    color: colors.accentDim,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: colors.elevated,
  },
  chipUserMatch: {
    backgroundColor: colors.accentSubtle,
  },
  chipFilterMatch: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextUserMatch: {
    color: colors.accentDim,
    fontWeight: '600',
  },
  chipTextFilterMatch: {
    color: colors.bg,
    fontWeight: '700',
  },
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 13,
    marginTop: 2,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: -0.2,
  },
})

export default NearbyRunnerCard
