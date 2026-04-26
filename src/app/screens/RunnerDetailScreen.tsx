import React, { useEffect, useState } from 'react'

import {
  ActivityIndicator,
  Button,
  ScrollView,
  Text,
  View,
} from 'react-native'

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { FontAwesome5 } from '@expo/vector-icons'

import { supabase } from '../../lib/api/supabase'
import type { RootStackParamList } from '../../types/navigation'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'

type Runner = Tables<'runners'>
type Connection = Tables<'run_connections'>

type RunnerDetailRoute = RouteProp<RootStackParamList, 'RunnerDetail'>
type RunnerDetailNav = StackNavigationProp<RootStackParamList, 'RunnerDetail'>

const RunnerDetailScreen = () => {
  const route = useRoute<RunnerDetailRoute>()
  const navigation = useNavigation<RunnerDetailNav>()
  const { runnerId } = route.params

  const [runner, setRunner] = useState<Runner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPlanning, setIsPlanning] = useState(false)
  const [planMessage, setPlanMessage] = useState<string | null>(null)

  useEffect(() => {
    loadRunner()
  }, [runnerId])

  const loadRunner = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .eq('id', runnerId)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        throw new Error('Runner not found')
      }
      setRunner(data)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlanRun = async () => {
    if (!runner) return
    setIsPlanning(true)
    setPlanMessage(null)
    setErrorMessage(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      const userId = authData.user?.id
      if (!userId) {
        throw new Error('Sign in to plan a run.')
      }

      const { data: me, error: meError } = await supabase
        .from('runners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (meError) throw meError
      if (!me) {
        throw new Error('Finish onboarding so we can match runs.')
      }

      const payload: Omit<Connection, 'id'> = {
        owner_runner_id: me.id,
        partner_runner_id: runner.id,
        status: 'planned',
        note: null,
        next_run_at: null,
        inserted_at: null,
        updated_at: null,
      }

      const { error } = await supabase
        .from('run_connections')
        .insert({
          owner_runner_id: payload.owner_runner_id,
          partner_runner_id: payload.partner_runner_id,
          status: payload.status,
          note: payload.note,
          next_run_at: payload.next_run_at,
        })

      if (error) throw error
      setPlanMessage('Saved to your running circle. Check the Connections tab.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not plan this run',
      )
    } finally {
      setIsPlanning(false)
    }
  }

  if (isLoading) {
    return (
      <View style={globalStyles.containerCentered}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={globalStyles.subtitle}>Loading runner…</Text>
      </View>
    )
  }

  if (errorMessage || !runner) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.subtitle}>{errorMessage ?? 'Runner not found.'}</Text>
      </View>
    )
  }

  const paceMinutes = Math.floor(runner.pace)
  const paceSeconds = Math.round((runner.pace - paceMinutes) * 60)
  const paceLabel = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}/mi`
  const distanceLabel = `${runner.distance_min}-${runner.distance_max} mi`

  const daysLabel =
    runner.run_days && runner.run_days.length > 0
      ? runner.run_days.join(', ')
      : 'Flexible days'
  const timesLabel =
    runner.run_times && runner.run_times.length > 0
      ? runner.run_times.join(', ')
      : 'Any time'

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View style={globalStyles.profileHeader}>
        <View style={globalStyles.profileImageContainer}>
          <FontAwesome5 name="running" size={70} color="#16a34a" />
        </View>
        <Text style={globalStyles.profileName}>
          {runner.name} 🏃‍♀️
        </Text>
        <Text style={globalStyles.subtitle}>{runner.neighborhood}</Text>
      </View>

      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>Running fit</Text>
        <View style={globalStyles.runnerMetaRow}>
          <View style={globalStyles.runnerChip}>
            <Text style={globalStyles.runnerChipText}>Pace {paceLabel}</Text>
          </View>
          <View style={globalStyles.runnerChip}>
            <Text style={globalStyles.runnerChipText}>{distanceLabel}</Text>
          </View>
        </View>
        <View style={globalStyles.runnerMetaRow}>
          <View style={globalStyles.runnerPill}>
            <Text style={globalStyles.runnerPillLabel}>Days 🗓</Text>
            <Text style={globalStyles.runnerPillValue}>{daysLabel}</Text>
          </View>
        </View>
        <View style={globalStyles.runnerMetaRow}>
          <View style={globalStyles.runnerPill}>
            <Text style={globalStyles.runnerPillLabel}>Time ⏰</Text>
            <Text style={globalStyles.runnerPillValue}>{timesLabel}</Text>
          </View>
        </View>
      </View>

      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>Vibes & story</Text>
        <Text style={globalStyles.profileFieldValue}>
          {runner.goals || 'No goals shared yet.'}
        </Text>
      </View>

      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>Plan a run together</Text>
        <Text style={globalStyles.subtitle}>
          Choose a public route, tell a friend where you’re going, and keep it at
          a pace where you can talk comfortably.
        </Text>
        {planMessage && (
          <Text style={[globalStyles.subtitle, { color: '#16a34a' }]}>
            {planMessage}
          </Text>
        )}
        {isPlanning ? (
          <ActivityIndicator size="large" color="#22c55e" />
        ) : (
          <Button title="Save to my running circle 🏃‍♂️" onPress={handlePlanRun} />
        )}
      </View>

      <Button title="Back to runners" onPress={() => navigation.goBack()} />
    </ScrollView>
  )
}

export default RunnerDetailScreen

