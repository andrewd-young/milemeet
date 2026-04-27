import React, { useEffect, useState } from 'react'

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useRouter } from 'expo-router'

import { Host, ProgressView } from '@expo/ui/swift-ui'
import { progressViewStyle, tint } from '@expo/ui/swift-ui/modifiers'
import { FontAwesome5 } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '../../lib/api/supabase'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'
import { colors, radii } from '../theme'

type Runner = Tables<'runners'>

const NearbyRunnersScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [runners, setRunners] = useState<Runner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchRunners()
  }, [])

  const fetchRunners = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .order('inserted_at', { ascending: false })
        .limit(20)
      if (error) throw error
      setRunners(data || [])
    } catch (error) {
      setErrorMessage(
        `Couldn't load nearby runners: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const formatPace = (pace: number) => {
    const m = Math.floor(pace)
    const s = Math.round((pace - m) * 60)
    return `${m}:${s.toString().padStart(2, '0')}/mi`
  }

  const renderRunner = ({ item }: { item: Runner }) => {
    const daysLabel = item.run_days?.length
      ? item.run_days.join(' · ')
      : 'Flexible'
    const timesLabel = item.run_times?.length
      ? item.run_times.join(', ')
      : 'Any time'

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/runner/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={s.header}>
          <View style={s.avatar}>
            <FontAwesome5 name="running" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.neighborhood}>{item.neighborhood}</Text>
          </View>
          <FontAwesome5
            name="chevron-right"
            size={13}
            color={colors.textTertiary}
          />
        </View>

        <View style={s.chipsRow}>
          <View style={s.chip}>
            <Text style={s.chipLabel}>PACE</Text>
            <Text style={s.chipValue}>{formatPace(item.pace)}</Text>
          </View>
          <View style={s.chip}>
            <Text style={s.chipLabel}>DISTANCE</Text>
            <Text style={s.chipValue}>
              {item.distance_min}–{item.distance_max} mi
            </Text>
          </View>
        </View>

        <View style={s.pillsRow}>
          <View style={s.pill}>
            <Text style={s.pillLabel}>DAYS</Text>
            <Text style={s.pillValue}>{daysLabel}</Text>
          </View>
          <View style={s.pill}>
            <Text style={s.pillLabel}>TIME</Text>
            <Text style={s.pillValue}>{timesLabel}</Text>
          </View>
        </View>

        {item.goals ? (
          <View style={s.vibesRow}>
            <Text style={s.vibesLabel}>VIBES</Text>
            <Text style={s.vibesText} numberOfLines={2}>
              {item.goals}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <View style={globalStyles.containerCentered}>
        <Host matchContents>
          <ProgressView
            modifiers={[progressViewStyle('circular'), tint(colors.accent)]}
          />
        </Host>
        <Text style={[globalStyles.subtitle, { marginTop: 16 }]}>
          Finding runners near you…
        </Text>
      </View>
    )
  }

  if (errorMessage) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={[globalStyles.subtitle, { marginBottom: 16 }]}>
          {errorMessage}
        </Text>
        <TouchableOpacity
          onPress={fetchRunners}
          style={[globalStyles.inlineButton, globalStyles.inlineButtonSelected]}
        >
          <Text style={globalStyles.inlineButtonTextSelected}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!runners.length) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.title}>No nearby runners yet</Text>
        <Text style={globalStyles.subtitle}>
          As more people join, you'll see runners who share your pace and routes
          here.
        </Text>
      </View>
    )
  }

  return (
    <View style={[globalStyles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={globalStyles.title}>Nearby Runners</Text>
      <Text style={globalStyles.subtitle}>Find your perfect pace partner.</Text>
      <FlatList
        data={runners}
        keyExtractor={item => item.id}
        renderItem={renderRunner}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  neighborhood: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 2,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  chipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  vibesRow: {
    gap: 3,
    paddingTop: 2,
  },
  vibesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.8,
  },
  vibesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
})

export default NearbyRunnersScreen
