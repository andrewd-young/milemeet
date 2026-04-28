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
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import NearbyRunnerCard from '../../components/NearbyRunnerCard'
import { supabase } from '../../lib/api/supabase'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'
import { colors } from '../theme'

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

  const renderRunner = ({ item }: { item: Runner }) => {
    return (
      <NearbyRunnerCard
        runner={item}
        onPress={() => router.push(`/runner/${item.id}`)}
      />
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
})

export default NearbyRunnersScreen
