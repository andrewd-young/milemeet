import React, { useEffect, useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '../../lib/api/supabase'
import type { RootStackParamList } from '../../types/navigation'
import type { Tables } from '../../types/supabase'
import { colors, radii } from '../theme'

type Runner = Tables<'runners'>
type Nav = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TIMES = ['Morning', 'Afternoon', 'Evening']
const PRESET_GOALS = [
  'Run a 5K',
  'Half Marathon',
  'Full Marathon',
  'Improve My Pace',
  'Morning Runs',
  'Trail Running',
  'Social Running',
  'Build Endurance',
  'Race to Win',
  'Run Daily',
]

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
  const insets = useSafeAreaInsets()
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
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoals, setCustomGoals] = useState<string[]>([])
  const [goalInput, setGoalInput] = useState('')
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
        if (data.goals) {
          const parts = data.goals.split(', ')
          setSelectedGoals(parts.filter(g => PRESET_GOALS.includes(g)))
          setCustomGoals(parts.filter(g => !PRESET_GOALS.includes(g)))
        }
        setInstagram(data.instagram ?? '')
        setLinkedin(data.linkedin ?? '')
      }
    } catch {
      Alert.alert('Error', 'Could not load your profile.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggle = (
    item: string,
    list: string[],
    setList: (l: string[]) => void,
  ) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  const addCustomGoal = () => {
    const trimmed = goalInput.trim()
    if (
      trimmed &&
      !customGoals.includes(trimmed) &&
      !selectedGoals.includes(trimmed)
    ) {
      setCustomGoals(prev => [...prev, trimmed])
    }
    setGoalInput('')
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

    const allGoals = [
      ...selectedGoals,
      ...customGoals,
      ...(goalInput.trim() ? [goalInput.trim()] : []),
    ]

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
          goals: allGoals.length > 0 ? allGoals.join(', ') : null,
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
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} style={s.flex} />
      </View>
    )
  }

  if (!runner) {
    return (
      <View style={[s.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>No profile found.</Text>
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* About Me */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>ABOUT ME</Text>
            <Text style={s.fieldLabel}>Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              keyboardAppearance="dark"
            />
            <Text style={s.fieldLabel}>Bio</Text>
            <TextInput
              style={[s.input, s.inputMultiline]}
              value={bio}
              onChangeText={setBio}
              placeholder="A little about you..."
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              keyboardAppearance="dark"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Running Details */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>RUNNING DETAILS</Text>
            <Text style={s.fieldLabel}>Pace (min:sec per mile)</Text>
            <TextInput
              style={[s.input, { marginBottom: 16 }]}
              value={pace}
              onChangeText={setPace}
              placeholder="e.g. 8:30"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              keyboardAppearance="dark"
              keyboardType="numbers-and-punctuation"
            />
            <Text style={s.fieldLabel}>Distance range (miles)</Text>
            <View style={s.distanceBlock}>
              <View style={s.stepperRow}>
                <Text style={s.stepperLabel}>Min</Text>
                <TouchableOpacity
                  style={s.stepperBtn}
                  onPress={() =>
                    setDistanceRange([
                      Math.max(1, distanceRange[0] - 1),
                      distanceRange[1],
                    ])
                  }
                >
                  <Text style={s.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.stepperValue}>{distanceRange[0]}</Text>
                <TouchableOpacity
                  style={s.stepperBtn}
                  onPress={() =>
                    setDistanceRange([
                      Math.min(distanceRange[0] + 1, distanceRange[1] - 1),
                      distanceRange[1],
                    ])
                  }
                >
                  <Text style={s.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={s.stepperDivider} />
              <View style={s.stepperRow}>
                <Text style={s.stepperLabel}>Max</Text>
                <TouchableOpacity
                  style={s.stepperBtn}
                  onPress={() =>
                    setDistanceRange([
                      distanceRange[0],
                      Math.max(distanceRange[1] - 1, distanceRange[0] + 1),
                    ])
                  }
                >
                  <Text style={s.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.stepperValue}>{distanceRange[1]}</Text>
                <TouchableOpacity
                  style={s.stepperBtn}
                  onPress={() =>
                    setDistanceRange([
                      distanceRange[0],
                      Math.min(26, distanceRange[1] + 1),
                    ])
                  }
                >
                  <Text style={s.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Schedule */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>SCHEDULE</Text>
            <Text style={s.fieldLabel}>Run days</Text>
            <View style={s.chipGrid}>
              {DAYS.map(day => {
                const selected = selectedDays.includes(day)
                return (
                  <TouchableOpacity
                    key={day}
                    style={[s.chip, selected && s.chipSelected]}
                    onPress={() => toggle(day, selectedDays, setSelectedDays)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Run times</Text>
            <View style={s.chipGrid}>
              {TIMES.map(time => {
                const selected = selectedTimes.includes(time)
                return (
                  <TouchableOpacity
                    key={time}
                    style={[s.chip, selected && s.chipSelected]}
                    onPress={() => toggle(time, selectedTimes, setSelectedTimes)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Goals */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>GOALS</Text>
            <Text style={s.fieldLabel}>SUGGESTED</Text>
            <View style={s.chipGrid}>
              {PRESET_GOALS.map(goal => {
                const selected = selectedGoals.includes(goal)
                return (
                  <TouchableOpacity
                    key={goal}
                    style={[s.chip, selected && s.chipSelected]}
                    onPress={() => toggle(goal, selectedGoals, setSelectedGoals)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>
                      {goal}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {customGoals.length > 0 && (
              <View style={[s.chipGrid, { marginTop: 12 }]}>
                {customGoals.map(goal => (
                  <TouchableOpacity
                    key={goal}
                    style={s.customTag}
                    onPress={() =>
                      setCustomGoals(prev => prev.filter(g => g !== goal))
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={s.customTagText}>{goal}</Text>
                    <Ionicons
                      name="close"
                      size={12}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={s.goalInputRow}>
              <TextInput
                style={s.goalInput}
                value={goalInput}
                onChangeText={setGoalInput}
                onSubmitEditing={addCustomGoal}
                placeholder="Add your own goal..."
                placeholderTextColor={colors.textTertiary}
                keyboardAppearance="dark"
                selectionColor={colors.accent}
                returnKeyType="done"
                blurOnSubmit={false}
                autoCorrect={false}
              />
              {goalInput.trim().length > 0 && (
                <TouchableOpacity
                  onPress={addCustomGoal}
                  style={s.goalInputAdd}
                >
                  <Ionicons
                    name="return-down-back"
                    size={18}
                    color={colors.accent}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Social */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>SOCIAL</Text>
            <Text style={s.fieldLabel}>Instagram</Text>
            <TextInput
              style={s.input}
              value={instagram}
              onChangeText={setInstagram}
              placeholder="@handle"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              keyboardAppearance="dark"
              autoCapitalize="none"
            />
            <Text style={s.fieldLabel}>LinkedIn</Text>
            <TextInput
              style={[s.input, { marginBottom: 0 }]}
              value={linkedin}
              onChangeText={setLinkedin}
              placeholder="linkedin.com/in/..."
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              keyboardAppearance="dark"
              autoCapitalize="none"
            />
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
          {isSaving ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <TouchableOpacity
              style={s.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={s.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.elevated,
    borderRadius: radii.lg,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 14,
    marginBottom: 0,
  },
  distanceBlock: {
    backgroundColor: colors.elevated,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    width: 32,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  stepperValue: {
    width: 36,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepperDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: '#1C2010',
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  customTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.elevated,
  },
  customTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 12,
  },
  goalInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: '100%',
  },
  goalInputAdd: {
    paddingLeft: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bg,
    letterSpacing: -0.1,
  },
})

export default EditProfileScreen
