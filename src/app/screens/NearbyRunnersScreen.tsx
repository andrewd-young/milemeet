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

const NearbyRunnersScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [runners, setRunners] = useState<Runner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchRunners()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchRunners()
    }, []),
  )

  const fetchRunners = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id

      const excludeIds: string[] = []

      if (userId) {
        const { data: me } = await supabase
          .from('runners')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()

        if (me) {
          excludeIds.push(me.id)

          const [ownerConns, partnerConns] = await Promise.all([
            supabase
              .from('run_connections')
              .select('partner_runner_id')
              .eq('owner_runner_id', me.id),
            supabase
              .from('run_connections')
              .select('owner_runner_id')
              .eq('partner_runner_id', me.id),
          ])

          ownerConns.data?.forEach(c => excludeIds.push(c.partner_runner_id))
          partnerConns.data?.forEach(c => excludeIds.push(c.owner_runner_id))
        }
      }

      let query = supabase
        .from('runners')
        .select('*')
        .order('inserted_at', { ascending: false })
        .limit(20)

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`)
      }

      const { data, error } = await query
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
    const scheduleChips = [...(item.run_days ?? []), ...(item.run_times ?? [])]

    return (
      <TouchableOpacity
        style={globalStyles.runnerCard}
        onPress={() => router.push(`/runner/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={s.cardHeader}>
          <View style={globalStyles.runnerAvatarRinged}>
            <FontAwesome5 name="running" size={22} color={colors.accent} />
          </View>
          <View style={globalStyles.runnerHeaderText}>
            <Text style={globalStyles.runnerName}>{item.name}</Text>
            <Text style={globalStyles.runnerNeighborhood}>
              {item.neighborhood}
            </Text>
          </View>
          <FontAwesome5
            name="chevron-right"
            size={13}
            color={colors.textTertiary}
          />
        </View>

        <View style={s.statsBar}>
          <View style={s.statItem}>
            <Text style={s.statLabel}>AVG PACE</Text>
            <Text style={s.statValueAccent}>{formatPace(item.pace)}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statLabel}>DISTANCE</Text>
            <Text style={s.statValue}>
              {item.distance_min}–{item.distance_max} mi
            </Text>
          </View>
        </View>

        {scheduleChips.length > 0 ? (
          <View style={globalStyles.runnerMetaRow}>
            {scheduleChips.map(chip => (
              <View key={chip} style={globalStyles.runnerChip}>
                <Text style={globalStyles.runnerChipText}>{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {item.goals ? (
          <View style={globalStyles.runnerGoalsRow}>
            <Text style={globalStyles.runnerGoalsLabel}>VIBES</Text>
            <Text style={globalStyles.runnerGoalsText} numberOfLines={2}>
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={runners}
        keyExtractor={item => item.id}
        renderItem={renderRunner}
        contentContainerStyle={[
          s.listContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 90 },
        ]}
        ListHeaderComponent={
          <View style={s.pageHeader}>
            <Text style={globalStyles.title}>Nearby Runners</Text>
            <Text style={globalStyles.subtitle}>
              Find your perfect pace partner.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const s = StyleSheet.create({
  pageHeader: {
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.elevated,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statValueAccent: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
  },
})

export default NearbyRunnersScreen
