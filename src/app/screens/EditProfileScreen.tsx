import React, { useEffect, useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { supabase } from '../../lib/api/supabase'
import type { RootStackParamList } from '../../types/navigation'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'

type Runner = Tables<'runners'>
type Nav = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TIMES = ['Morning', 'Afternoon', 'Evening']

const parsePace = (paceStr: string): number | null => {
  const match = paceStr.match(/^(\d+):(\d{2})$/)
  if (!match) return null
  return parseInt(match[1], 10) + parseInt(match[2], 10) / 60
}

const formatPaceNumber = (pace: number): string => {
  const minutes = Math.floor(pace)
  const seconds = Math.round((pace - minutes) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const EditProfileScreen = () => {
  const navigation = useNavigation<Nav>()
  const [runner, setRunner] = useState<Runner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [pace, setPace] = useState('')
  const [distanceRange, setDistanceRange] = useState<[number, number]>([3, 6])
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [goals, setGoals] = useState('')
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')

  useEffect(() => {
    fetchRunner()
  }, [])

  const fetchRunner = async () => {
    setIsLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id ?? null

      let data: Runner | null = null

      if (userId) {
        const { data: byUser } = await supabase
          .from('runners')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        data = byUser
      }

      if (!data) {
        const { data: fallback } = await supabase
          .from('runners')
          .select('*')
          .order('inserted_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        data = fallback
      }

      if (data) {
        setRunner(data)
        setName(data.name)
        setBio(data.bio ?? '')
        setPace(formatPaceNumber(data.pace))
        setDistanceRange([data.distance_min, data.distance_max])
        setSelectedDays(data.run_days ?? [])
        setSelectedTimes(data.run_times ?? [])
        setGoals(data.goals ?? '')
        setInstagram(data.instagram ?? '')
        setLinkedin(data.linkedin ?? '')
      }
    } catch {
      Alert.alert('Error', 'Could not load your profile.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleItem = (
    item: string,
    list: string[],
    setList: (l: string[]) => void,
  ) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  const handleMinDistanceChange = (val: number) => {
    setDistanceRange([val, Math.max(val + 1, distanceRange[1])])
  }

  const handleMaxDistanceChange = (val: number) => {
    setDistanceRange([distanceRange[0], Math.max(val, distanceRange[0] + 1)])
  }

  const handleSave = async () => {
    if (!runner) return
    const parsedPace = parsePace(pace)
    if (!parsedPace) {
      Alert.alert('Invalid pace', 'Enter pace as M:SS, e.g. 8:30')
      return
    }
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('runners')
        .update({
          name: name.trim(),
          bio: bio.trim() || null,
          pace: parsedPace,
          distance_min: distanceRange[0],
          distance_max: distanceRange[1],
          run_days: selectedDays,
          run_times: selectedTimes,
          goals: goals.trim() || null,
          instagram: instagram.trim() || null,
          linkedin: linkedin.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', runner.id)

      if (error) throw error
      navigation.goBack()
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof Error ? error.message : 'Unknown error',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <View style={globalStyles.containerCentered}>
        <ActivityIndicator size="large" color="#1fb28a" />
      </View>
    )
  }

  if (!runner) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.subtitle}>No profile found.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={globalStyles.title}>Edit Profile</Text>

      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>About Me</Text>
        <Text style={globalStyles.label}>Name</Text>
        <TextInput
          style={globalStyles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#888"
        />
        <Text style={globalStyles.label}>Bio</Text>
        <TextInput
          style={[globalStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          value={bio}
          onChangeText={setBio}
          placeholder="A little about you..."
          placeholderTextColor="#888"
          multiline
        />
      </View>

      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>Running Details</Text>
        <Text style={globalStyles.label}>Pace (min:sec per mile)</Text>
        <TextInput
          style={globalStyles.input}
          value={pace}
          onChangeText={setPace}
          placeholder="e.g. 8:30"
          placeholderTextColor="#888"
        />
        <Text style={globalStyles.label}>Distance range (miles)</Text>
        <View style={globalStyles.stepperRow}>
          <Text style={globalStyles.stepperLabel}>Min</Text>
          <TouchableOpacity
            style={globalStyles.stepperButton}
            onPress={() => handleMinDistanceChange(Math.max(1, distanceRange[0] - 1))}
          >
            <Text style={globalStyles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={globalStyles.stepperValue}>{distanceRange[0]}</Text>
          <TouchableOpacity
            style={globalStyles.stepperButton}
            onPress={() => handleMinDistanceChange(Math.min(distanceRange[0] + 1, distanceRange[1] - 1))}
          >
            <Text style={globalStyles.stepperButtonText}>+</Text>
          </TouchableOpacity>
          <Text style={[globalStyles.stepperLabel, { marginLeft: 16 }]}>Max</Text>
          <TouchableOpacity
            style={globalStyles.stepperButton}
            onPress={() => handleMaxDistanceChange(Math.max(distanceRange[1] - 1, distanceRange[0] + 1))}
          >
            <Text style={globalStyles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={globalStyles.stepperValue}>{distanceRange[1]}</Text>
          <TouchableOpacity
            style={globalStyles.stepperButton}
            onPress={() => handleMaxDistanceChange(Math.min(26, distanceRange[1] + 1))}
          >
            <Text style={globalStyles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={globalStyles.sliderLabel}>
          {distanceRange[0]} – {distanceRange[1]} miles
        </Text>

        <Text style={globalStyles.label}>Run days</Text>
        <View style={globalStyles.inlineButtons}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[
                globalStyles.inlineButton,
                selectedDays.includes(day) && globalStyles.inlineButtonSelected,
              ]}
              onPress={() => toggleItem(day, selectedDays, setSelectedDays)}
            >
              <Text
                style={
                  selectedDays.includes(day)
                    ? globalStyles.inlineButtonTextSelected
                    : globalStyles.inlineButtonText
                }
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={globalStyles.label}>Run times</Text>
        <View style={globalStyles.inlineButtons}>
          {TIMES.map(time => (
            <TouchableOpacity
              key={time}
              style={[
                globalStyles.inlineButton,
                selectedTimes.includes(time) &&
                  globalStyles.inlineButtonSelected,
              ]}
              onPress={() => toggleItem(time, selectedTimes, setSelectedTimes)}
            >
              <Text
                style={
                  selectedTimes.includes(time)
                    ? globalStyles.inlineButtonTextSelected
                    : globalStyles.inlineButtonText
                }
              >
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={globalStyles.label}>Goals</Text>
        <TextInput
          style={[globalStyles.input, { minHeight: 60, textAlignVertical: 'top' }]}
          value={goals}
          onChangeText={setGoals}
          placeholder="What are you training for?"
          placeholderTextColor="#888"
          multiline
        />
      </View>

      <View style={globalStyles.sectionBox}>
        <Text style={globalStyles.sectionTitle}>Social</Text>
        <Text style={globalStyles.label}>Instagram</Text>
        <TextInput
          style={globalStyles.input}
          value={instagram}
          onChangeText={setInstagram}
          placeholder="@handle"
          placeholderTextColor="#888"
          autoCapitalize="none"
        />
        <Text style={globalStyles.label}>LinkedIn</Text>
        <TextInput
          style={globalStyles.input}
          value={linkedin}
          onChangeText={setLinkedin}
          placeholder="linkedin.com/in/..."
          placeholderTextColor="#888"
          autoCapitalize="none"
        />
      </View>

      {isSaving ? (
        <ActivityIndicator size="large" color="#1fb28a" style={{ marginTop: 8 }} />
      ) : (
        <Button title="Save changes" onPress={handleSave} />
      )}
    </ScrollView>
  )
}

export default EditProfileScreen
