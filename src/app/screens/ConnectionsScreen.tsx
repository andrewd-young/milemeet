import React, { useCallback, useEffect, useState } from 'react'

import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { FontAwesome5 } from '@expo/vector-icons'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useFocusEffect, useNavigation } from '@react-navigation/native'

import { supabase } from '../../lib/api/supabase'
import type { MainTabParamList } from '../../types/navigation'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'

type Runner = Tables<'runners'>
type ConnectionWithPartner = Tables<'run_connections'> & { partner: Runner }
type ConnectionsNav = BottomTabNavigationProp<MainTabParamList, 'Connections'>

const ConnectionsScreen = () => {
  const navigation = useNavigation<ConnectionsNav>()
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

  const formatPace = (pace: number): string => {
    const minutes = Math.floor(pace)
    const seconds = Math.round((pace - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`
  }

  const renderConnection = ({ item }: { item: ConnectionWithPartner }) => {
    const { partner } = item
    const daysLabel =
      partner.run_days && partner.run_days.length > 0
        ? partner.run_days.join(' • ')
        : 'Flexible'
    const timesLabel =
      partner.run_times && partner.run_times.length > 0
        ? partner.run_times.join(' • ')
        : 'Any time'

    return (
      <View style={globalStyles.runnerCard}>
        <View style={globalStyles.runnerCardHeader}>
          <View style={globalStyles.runnerAvatar}>
            <FontAwesome5 name="running" size={22} color="#16a34a" />
          </View>
          <View style={globalStyles.runnerHeaderText}>
            <Text style={globalStyles.runnerName}>{partner.name}</Text>
            <Text style={globalStyles.runnerNeighborhood}>
              {partner.neighborhood}
            </Text>
          </View>
        </View>

        <View style={globalStyles.runnerMetaRow}>
          <View style={globalStyles.runnerChip}>
            <Text style={globalStyles.runnerChipText}>
              Pace {formatPace(partner.pace)}
            </Text>
          </View>
          <View style={globalStyles.runnerChip}>
            <Text style={globalStyles.runnerChipText}>
              {partner.distance_min}–{partner.distance_max} mi
            </Text>
          </View>
        </View>

        <View style={globalStyles.runnerMetaRow}>
          <View style={globalStyles.runnerPill}>
            <Text style={globalStyles.runnerPillLabel}>Days</Text>
            <Text style={globalStyles.runnerPillValue}>{daysLabel}</Text>
          </View>
        </View>

        <View style={globalStyles.runnerMetaRow}>
          <View style={globalStyles.runnerPill}>
            <Text style={globalStyles.runnerPillLabel}>Time</Text>
            <Text style={globalStyles.runnerPillValue}>{timesLabel}</Text>
          </View>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={globalStyles.containerCentered}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={globalStyles.subtitle}>Loading your running circle...</Text>
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
          style={globalStyles.inlineButton}
        >
          <Text style={globalStyles.inlineButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!connections.length) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.title}>Your running circle</Text>
        <Text style={globalStyles.subtitle}>
          When you plan a great run with someone, they'll show up here so it's
          easy to head out together again.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('NearbyRunners')}
          style={[globalStyles.inlineButton, globalStyles.inlineButtonSelected]}
        >
          <Text style={globalStyles.inlineButtonTextSelected}>
            Browse nearby runners
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Your running circle</Text>
      <FlatList
        data={connections}
        keyExtractor={item => item.id}
        renderItem={renderConnection}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default ConnectionsScreen
