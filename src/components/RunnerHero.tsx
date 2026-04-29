import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'

import { FontAwesome5 } from '@expo/vector-icons'

import { colors, radii } from '../app/theme'
import {
  formatNeighborhoodSummary,
  formatPace,
  getNeighborhoods,
} from '../lib/helpers/formatters'
import { isNeighborhoodMatch, isPaceMatch } from '../lib/helpers/matchHelpers'
import type { Tables } from '../types/supabase'

type Runner = Tables<'runners'>

type RunnerHeroProps = {
  runner: Runner
  myRunner?: Runner
  badge?: React.ReactNode
  paddingTop?: number
  minHeight?: number
}

const RunnerHero = ({
  runner,
  myRunner,
  badge,
  paddingTop = 16,
  minHeight = 320,
}: RunnerHeroProps) => {
  const canCompare = !!myRunner && myRunner.id !== runner.id
  const paceMatch = canCompare && isPaceMatch(myRunner!, runner)
  const neighborhoodMatch = canCompare && isNeighborhoodMatch(myRunner!, runner)

  const neighborhoods = getNeighborhoods(runner)
  const neighborhoodSummary = formatNeighborhoodSummary(neighborhoods)

  return (
    <View style={[s.hero, { minHeight }]}>
      <FontAwesome5
        name="running"
        size={220}
        color={colors.accent}
        style={s.watermark}
      />
      <LinearGradient
        colors={['transparent', colors.overlayHeavy, colors.bg]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[s.content, { paddingTop }]}>
        {badge ? <View style={s.badgeSlot}>{badge}</View> : null}
        <Text style={s.name}>{runner.name}</Text>
        <View style={s.metaRow}>
          <View style={[s.paceBadge, paceMatch && s.paceBadgeMatch]}>
            <FontAwesome5 name="bolt" size={10} color={colors.bg} />
            <Text style={s.paceBadgeText}>{formatPace(runner.pace)}/mi</Text>
          </View>
          {neighborhoodSummary ? (
            <View style={s.locationRow}>
              <FontAwesome5
                name="map-marker-alt"
                size={12}
                color={
                  neighborhoodMatch ? colors.accentDim : colors.textSecondary
                }
              />
              <Text
                style={[
                  s.locationText,
                  neighborhoodMatch && s.locationTextMatch,
                ]}
              >
                {neighborhoodSummary}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -24,
    top: -16,
    opacity: 0.07,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  badgeSlot: {
    alignSelf: 'flex-start',
  },
  name: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  paceBadgeMatch: {
    backgroundColor: colors.accentDim,
  },
  paceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.bg,
    letterSpacing: 0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  locationTextMatch: {
    color: colors.accentDim,
    fontWeight: '600',
  },
})

export default RunnerHero
