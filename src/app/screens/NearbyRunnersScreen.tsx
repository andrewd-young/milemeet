import React, { useEffect, useState } from 'react'

import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { FontAwesome5 } from '@expo/vector-icons'

import { supabase } from '../../lib/api/supabase'
import type { RootStackParamList } from '../../types/navigation'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'

type Runner = Tables<'runners'>

const NearbyRunnersScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'MainTabs'>>()
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
        `Couldn’t load nearby runners: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const renderRunnerCard = ({ item }: { item: Runner }) => {
    const paceMinutes = Math.floor(item.pace)
    const paceSeconds = Math.round((item.pace - paceMinutes) * 60)
    const paceLabel = `${paceMinutes}:${paceSeconds
      .toString()
      .padStart(2, '0')}/mi`

    const distanceLabel = `${item.distance_min}-${item.distance_max} mi`
    const daysLabel =
      item.run_days && item.run_days.length > 0
        ? item.run_days.join(' • ')
        : 'Flexible days'
    const timesLabel =
      item.run_times && item.run_times.length > 0
        ? item.run_times.join(' • ')
        : 'Any time'

    return (
      <TouchableOpacity
        style={globalStyles.runnerCard}
        onPress={() =>
          navigation.navigate('RunnerDetail', {
            runnerId: item.id,
          })
        }
      >
        <View style={globalStyles.runnerCardHeader}>
          <View style={globalStyles.runnerAvatar}>
            <FontAwesome5 name="running" size={22} color="#16a34a" />
          </View>
          <View style={globalStyles.runnerHeaderText}>
            <Text style={globalStyles.runnerName}>
              {item.name} <Text>🏃‍♂️</Text>
            </Text>
            <Text style={globalStyles.runnerNeighborhood}>
              {item.neighborhood}
            </Text>
          </View>
        </View>

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

        {item.goals && (
          <View style={globalStyles.runnerGoalsRow}>
            <Text style={globalStyles.runnerGoalsLabel}>Vibes ✨</Text>
            <Text style={globalStyles.runnerGoalsText}>{item.goals}</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  if (isLoading) {
    return (
      <View style={globalStyles.containerCentered}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={globalStyles.subtitle}>Finding runners near you… 🧭</Text>
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
          style={globalStyles.inlineButton}
        >
          <Text style={globalStyles.inlineButtonTextSelected}>Try again 🔁</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!runners.length) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.title}>No nearby runners yet 👀</Text>
        <Text style={globalStyles.subtitle}>
          As more people join, you’ll see runners who share your pace and
          routes here.
        </Text>
      </View>
    )
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Run with someone new today 🏃‍♀️</Text>
      <Text style={globalStyles.subtitle}>
        These runners are a good fit for your pace, distance, and usual
        routes.
      </Text>
      <FlatList
        data={runners}
        keyExtractor={item => item.id}
        renderItem={renderRunnerCard}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default NearbyRunnersScreen
