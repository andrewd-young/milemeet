import React, { useCallback, useEffect, useState } from 'react'

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
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '../../lib/api/supabase'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'
import { colors, radii } from '../theme'

type Runner = Tables<'runners'>
type ConnectionWithPartner = Tables<'run_connections'> & { partner: Runner }
const ConnectionsScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [connections, setConnections] = useState<ConnectionWithPartner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchConnections = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id ?? null

      let currentRunner: Runner | null = null

      if (userId) {
        const { data } = await supabase
          .from('runners')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        currentRunner = data
      }

      if (!currentRunner) {
        const { data } = await supabase
          .from('runners')
          .select('*')
          .order('inserted_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        currentRunner = data
      }

      if (!currentRunner) {
        setConnections([])
        return
      }

      const { data, error } = await supabase
        .from('run_connections')
        .select('*, partner:runners!run_connections_partner_runner_id_fkey(*)')
        .eq('owner_runner_id', currentRunner.id)
        .order('inserted_at', { ascending: false })

      if (error) throw error
      setConnections((data as ConnectionWithPartner[]) ?? [])
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not load connections',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConnections()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchConnections()
    }, []),
  )

  const formatPace = (pace: number) => {
    const m = Math.floor(pace)
    const sec = Math.round((pace - m) * 60)
    return `${m}:${sec.toString().padStart(2, '0')}/mi`
  }

  const renderConnection = ({ item }: { item: ConnectionWithPartner }) => {
    const { partner } = item
    const daysLabel = partner.run_days?.length
      ? partner.run_days.join(' · ')
      : 'Flexible'
    const timesLabel = partner.run_times?.length
      ? partner.run_times.join(', ')
      : 'Any time'

    return (
      <View style={s.card}>
        <View style={s.header}>
          <View style={s.avatar}>
            <FontAwesome5 name="running" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{partner.name}</Text>
            <Text style={s.neighborhood}>{partner.neighborhood}</Text>
          </View>
          <View style={s.savedBadge}>
            <Text style={s.savedBadgeText}>Saved</Text>
          </View>
        </View>

        <View style={s.chipsRow}>
          <View style={s.chip}>
            <Text style={s.chipLabel}>PACE</Text>
            <Text style={s.chipValue}>{formatPace(partner.pace)}</Text>
          </View>
          <View style={s.chip}>
            <Text style={s.chipLabel}>DISTANCE</Text>
            <Text style={s.chipValue}>
              {partner.distance_min}–{partner.distance_max} mi
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
      </View>
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
          Loading your running circle…
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
          onPress={fetchConnections}
          style={[globalStyles.inlineButton, globalStyles.inlineButtonSelected]}
        >
          <Text style={globalStyles.inlineButtonTextSelected}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!connections.length) {
    return (
      <View style={globalStyles.containerCentered}>
        <View style={s.emptyIcon}>
          <FontAwesome5 name="running" size={32} color={colors.accent} />
        </View>
        <Text style={globalStyles.title}>Your Running Circle</Text>
        <Text style={globalStyles.subtitle}>
          Save runners you want to run with. They'll show up here for easy
          access.
        </Text>
        <TouchableOpacity
          onPress={() => router.navigate('/(tabs)')}
          style={[globalStyles.inlineButton, globalStyles.inlineButtonSelected]}
        >
          <Text style={globalStyles.inlineButtonTextSelected}>
            Browse nearby runners
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const count = connections.length

  return (
    <View style={[globalStyles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={globalStyles.title}>Your Running Circle</Text>
      <Text style={globalStyles.subtitle}>
        {count} saved {count === 1 ? 'runner' : 'runners'}
      </Text>
      <FlatList
        data={connections}
        keyExtractor={item => item.id}
        renderItem={renderConnection}
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
  savedBadge: {
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
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
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
})

export default ConnectionsScreen
