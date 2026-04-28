import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

import { FontAwesome5 } from '@expo/vector-icons'

import { colors } from '../app/theme'

type Props = { neighborhood: string; height?: number }

// Placeholder for MapKit native integration.
const NeighborhoodMap = ({ neighborhood, height = 180 }: Props) => (
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
        {neighborhood || '—'}
      </Text>
    </View>
  </View>
)

const s = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0D1520',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#1B2840',
  },
  vLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: '#1B2840',
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
