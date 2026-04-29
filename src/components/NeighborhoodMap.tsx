import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

import { FontAwesome5 } from '@expo/vector-icons'

import { colors } from '../app/theme'

type Props = {
  neighborhood?: string
  neighborhoods?: string[] | null
  height?: number
}

const normalizeNeighborhoods = (
  neighborhoods?: string[] | null,
  fallbackNeighborhood?: string,
) => {
  const normalized = (neighborhoods ?? [])
    .map(value => value.trim())
    .filter(Boolean)
  if (normalized.length > 0) return Array.from(new Set(normalized))
  if (fallbackNeighborhood?.trim()) return [fallbackNeighborhood.trim()]
  return []
}

const formatNeighborhoodLabel = (values: string[]) => {
  if (values.length === 0) return '—'
  if (values.length === 1) return values[0]
  return `${values[0]} +${values.length - 1} more`
}

// Placeholder for MapKit native integration.
const NeighborhoodMap = ({
  neighborhood,
  neighborhoods,
  height = 180,
}: Props) => {
  const normalized = normalizeNeighborhoods(neighborhoods, neighborhood)
  const displayLabel = formatNeighborhoodLabel(normalized)

  return (
    <View style={[s.container, { height }]}>
      <View style={[s.hLine, { top: '28%' }]} />
      <View style={[s.hLine, { top: '58%' }]} />
      <View style={[s.hLine, { top: '82%' }]} />
      <View style={[s.vLine, { left: '18%' }]} />
      <View style={[s.vLine, { left: '42%' }]} />
      <View style={[s.vLine, { left: '68%' }]} />
      <View style={[s.vLine, { left: '88%' }]} />
      <View style={s.locationContent}>
        <FontAwesome5 name="map-marker-alt" size={20} color={colors.accent} />
        <Text style={s.neighborhoodText} numberOfLines={1}>
          {displayLabel}
        </Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: colors.mapGrid,
  },
  vLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: colors.mapGrid,
  },
  locationContent: {
    alignItems: 'center',
    gap: 8,
  },
  neighborhoodText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
})

export default NeighborhoodMap
