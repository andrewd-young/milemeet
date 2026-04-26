import React, { useEffect, useState } from 'react'

import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { FontAwesome5 } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { supabase } from '../../lib/api/supabase'
import type { RootStackParamList } from '../../types/navigation'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'

type Runner = Tables<'runners'>

const ProfileScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [runner, setRunner] = useState<Runner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchRunner()
  }, [])

  const fetchRunner = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id ?? null

      let data: Runner | null = null

      if (userId) {
        const { data: byUser, error: byUserError } = await supabase
          .from('runners')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (byUserError) throw byUserError
        data = byUser
      }

      if (!data) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('runners')
          .select('*')
          .order('inserted_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fallbackError) throw fallbackError
        data = fallback
      }

      setRunner(data)
    } catch (error) {
      setErrorMessage(
        `Failed to load profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
      setRunner(null)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPace = (pace: number): string => {
    const minutes = Math.floor(pace)
    const seconds = Math.round((pace - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`
  }

  const formatDistanceRange = (min: number, max: number): string => {
    return `${min} - ${max} miles`
  }

  const formatRunDaysAndTimes = (
    days: string[] | null,
    times: string[] | null,
  ): string => {
    const daysStr = days && days.length > 0 ? days.join(', ') : 'Not set'
    const timesStr = times && times.length > 0 ? times.join(', ') : 'Not set'
    return `${daysStr} at ${timesStr}`
  }

  const formatArrayField = (arr: string[] | null): string => {
    if (!arr || arr.length === 0) return 'Not set'
    return arr.join(', ')
  }

  if (isLoading) {
    return (
      <View style={globalStyles.containerCentered}>
        <ActivityIndicator size="large" color="#1fb28a" />
        <Text style={[globalStyles.subtitle, { marginTop: 16 }]}>
          Loading profile...
        </Text>
      </View>
    )
  }

  if (errorMessage) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={[globalStyles.subtitle, { color: '#ff0000' }]}>
          {errorMessage}
        </Text>
      </View>
    )
  }

  if (!runner) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.subtitle}>No runner found.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Profile Image & Name */}
      <View style={globalStyles.profileHeader}>
        <View style={globalStyles.profileImageContainer}>
          <FontAwesome5 name="user-circle" size={70} color="#1fb28a" />
        </View>
        <TouchableOpacity>
          <Text style={globalStyles.profileName}>{runner.name}</Text>
        </TouchableOpacity>
      </View>

      {/* About Me Section */}
      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>About Me</Text>
        <ProfileFieldRow
          icon="user"
          label="Bio"
          value={runner.bio || 'Not set'}
          isEmpty={!runner.bio}
        />
      </View>

      {/* Running Details Section */}
      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>Running Details</Text>
        <ProfileFieldRow
          icon="tachometer-alt"
          label="Preferred Pace"
          value={formatPace(runner.pace)}
        />
        <ProfileFieldRow
          icon="ruler"
          label="Distance Range"
          value={formatDistanceRange(runner.distance_min, runner.distance_max)}
        />
        <ProfileFieldRow
          icon="calendar-alt"
          label="Run Days & Times"
          value={formatRunDaysAndTimes(runner.run_days, runner.run_times)}
        />
        <ProfileFieldRow
          icon="map-marker-alt"
          label="Neighborhoods"
          value={formatArrayField(runner.run_neighborhoods)}
          isEmpty={
            !runner.run_neighborhoods || runner.run_neighborhoods.length === 0
          }
          isLast
        />
      </View>

      {/* Achievements & Clubs Section */}
      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>Achievements & Clubs</Text>
        <ProfileFieldRow
          icon="flag"
          label="Goals"
          value={runner.goals || 'Not set'}
          isEmpty={!runner.goals}
        />
        <ProfileFieldRow
          icon="medal"
          label="Past Races"
          value={formatArrayField(runner.past_races)}
          isEmpty={!runner.past_races || runner.past_races.length === 0}
        />
        <ProfileFieldRow
          icon="running"
          label="Run Clubs"
          value={formatArrayField(runner.run_clubs)}
          isEmpty={!runner.run_clubs || runner.run_clubs.length === 0}
          isLast
        />
      </View>

      {/* Connected Apps Section */}
      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>Connected Apps</Text>
        <AppConnectionRow
          appName="Strava"
          icon="running"
          connected={!!runner.strava}
          username={runner.strava}
        />
        <AppConnectionRow
          appName="Instagram"
          icon="instagram"
          connected={!!runner.instagram}
          username={runner.instagram}
        />
        <AppConnectionRow
          appName="LinkedIn"
          icon="linkedin"
          connected={!!runner.linkedin}
          username={runner.linkedin}
          isLast
        />
      </View>

      {__DEV__ && (
        <TouchableOpacity
          onPress={() => navigation.navigate('OnboardingName')}
          style={{
            margin: 24,
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#555',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#888', fontSize: 13 }}>
            DEV — Restart onboarding
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

type ProfileFieldRowProps = {
  icon: string
  label: string
  value: string
  isEmpty?: boolean
  isLast?: boolean
}

const ProfileFieldRow = ({
  icon,
  label,
  value,
  isEmpty = false,
  isLast = false,
}: ProfileFieldRowProps) => {
  return (
    <TouchableOpacity
      style={[
        globalStyles.profileFieldRow,
        isLast && globalStyles.profileFieldRowLast,
      ]}
    >
      <FontAwesome5
        name={icon as any}
        size={20}
        color="#666"
        style={globalStyles.profileFieldIcon}
      />
      <View style={globalStyles.profileFieldContent}>
        <Text style={globalStyles.profileFieldLabel}>{label}</Text>
        <Text
          style={
            isEmpty
              ? globalStyles.profileFieldValueEmpty
              : globalStyles.profileFieldValue
          }
        >
          {value}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

type AppConnectionRowProps = {
  appName: string
  icon: string
  connected: boolean
  username: string | null
  isLast?: boolean
}

const AppConnectionRow = ({
  appName,
  icon,
  connected,
  username,
  isLast = false,
}: AppConnectionRowProps) => {
  return (
    <TouchableOpacity
      style={[
        globalStyles.appConnectionRow,
        isLast && globalStyles.appConnectionRowLast,
      ]}
    >
      <View style={globalStyles.appConnectionInfo}>
        <FontAwesome5 name={icon as any} size={20} color="#666" />
        <View>
          <Text style={globalStyles.appConnectionName}>{appName}</Text>
          {connected && username && (
            <Text style={globalStyles.appConnectionStatus}>{username}</Text>
          )}
        </View>
      </View>
      <Text style={globalStyles.appConnectionStatus}>
        {connected ? 'Connected' : 'Not connected'}
      </Text>
    </TouchableOpacity>
  )
}

export default ProfileScreen
