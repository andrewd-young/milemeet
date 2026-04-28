import React from 'react'

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'

import { FontAwesome5 } from '@expo/vector-icons'

import { colors, radii } from '../app/theme'
import type { Tables } from '../types/supabase'

type Runner = Tables<'runners'>

type NearbyRunnerCardProps = {
  runner: Runner
  onPress: () => void
}

const formatPace = (pace: number) => {
  const m = Math.floor(pace)
  const s = Math.round((pace - m) * 60)
  return `${m}:${s.toString().padStart(2, '0')}/mi`
}

const NearbyRunnerCard = ({ runner, onPress }: NearbyRunnerCardProps) => {
  const scheduleChips = [
    ...(runner.run_days ?? []),
    ...(runner.run_times ?? []),
  ]

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <FontAwesome5
        name="running"
        size={220}
        color={colors.accent}
        style={s.cardWatermark}
      />

      <LinearGradient
        colors={['transparent', 'rgba(13,13,13,0.7)', colors.bg]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={s.cardContent}>
        <View style={s.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardName}>{runner.name}</Text>
            {runner.neighborhood ? (
              <View style={s.locationRow}>
                <FontAwesome5
                  name="map-marker-alt"
                  size={11}
                  color={colors.textSecondary}
                />
                <Text style={s.cardNeighborhood}>{runner.neighborhood}</Text>
              </View>
            ) : null}
          </View>
          <View style={s.paceBadge}>
            <FontAwesome5 name="bolt" size={9} color={colors.bg} />
            <Text style={s.paceBadgeText}>{formatPace(runner.pace)}</Text>
          </View>
        </View>

        <Text style={s.distanceText}>
          {runner.distance_min}-{runner.distance_max}{' '}
          <Text style={s.distanceUnit}>mi range</Text>
        </Text>

        {scheduleChips.length > 0 ? (
          <View style={s.chipsRow}>
            {scheduleChips.slice(0, 5).map(chip => (
              <View key={chip} style={s.chip}>
                <Text style={s.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {runner.goals ? (
          <View style={s.goalsRow}>
            <Text style={s.goalsLabel}>GOALS</Text>
            <Text style={s.goalsText} numberOfLines={2}>
              {runner.goals}
            </Text>
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
  cardContent: {
    padding: 18,
    gap: 8,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardNeighborhood: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  paceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 11,
    marginTop: 2,
  },
  paceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: -0.2,
  },

  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  distanceUnit: {
    fontWeight: '400',
    color: colors.textSecondary,
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
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  goalsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  goalsLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textTertiary,
  },
  goalsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 13,
    marginTop: 4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: -0.2,
  },
})

export default NearbyRunnerCard
