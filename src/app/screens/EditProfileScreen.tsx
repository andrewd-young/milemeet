import React, { useEffect, useRef, useState } from 'react'

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useRouter } from 'expo-router'

import { Host, ProgressView } from '@expo/ui/swift-ui'
import { progressViewStyle, tint } from '@expo/ui/swift-ui/modifiers'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GlassIconButton from '../../components/GlassIconButton'
import { useMyRunner } from '../../context/MyRunnerContext'
import { supabase } from '../../lib/api/supabase'
import { formatPace } from '../../lib/helpers/formatters'
import { colors, radii } from '../theme'

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

const EditProfileScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { myRunner: runner, isLoading, refreshRunner } = useMyRunner()
  const initialized = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [pace, setPace] = useState('')
  const [distanceRange, setDistanceRange] = useState<[number, number]>([3, 6])
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoals, setCustomGoals] = useState<string[]>([])
  const [goalInput, setGoalInput] = useState('')
  const [pastRaces, setPastRaces] = useState<string[]>([])
  const [runClubs, setRunClubs] = useState<string[]>([])
  const [raceInput, setRaceInput] = useState('')
  const [clubInput, setClubInput] = useState('')
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [strava, setStrava] = useState('')
  const [stravaPublic, setStravaPublic] = useState(false)

  useEffect(() => {
    if (!runner || initialized.current) return
    initialized.current = true
    setName(runner.name)
    setBio(runner.bio ?? '')
    setPace(formatPace(runner.pace))
    setDistanceRange([runner.distance_min, runner.distance_max])
    setSelectedDays(runner.run_days ?? [])
    setSelectedTimes(runner.run_times ?? [])
    if (runner.goals) {
      const parts = runner.goals.split(', ')
      setSelectedGoals(parts.filter(g => PRESET_GOALS.includes(g)))
      setCustomGoals(parts.filter(g => !PRESET_GOALS.includes(g)))
    }
    setPastRaces(runner.past_races ?? [])
    setRunClubs(runner.run_clubs ?? [])
    setInstagram(runner.instagram ?? '')
    setLinkedin(runner.linkedin ?? '')
    setStrava(runner.strava ?? '')
    setStravaPublic(runner.strava_public ?? false)
  }, [runner])

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    )
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    )
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  const toggle = (
    item: string,
    list: string[],
    setList: (l: string[]) => void,
  ) => {
    setList(
      list.includes(item) ? list.filter(i => i !== item) : [...list, item],
    )
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

  const addRace = () => {
    const trimmed = raceInput.trim()
    if (trimmed && !pastRaces.includes(trimmed)) {
      setPastRaces(prev => [...prev, trimmed])
    }
    setRaceInput('')
  }

  const addClub = () => {
    const trimmed = clubInput.trim()
    if (trimmed && !runClubs.includes(trimmed)) {
      setRunClubs(prev => [...prev, trimmed])
    }
    setClubInput('')
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
          past_races: pastRaces.length > 0 ? pastRaces : null,
          run_clubs: runClubs.length > 0 ? runClubs : null,
          instagram: instagram.trim() || null,
          linkedin: linkedin.trim() || null,
          strava: strava.trim() || null,
          strava_public: stravaPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', runner.id)

      if (error) throw error
      await refreshRunner()
      router.back()
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
      <View
        style={[
          s.root,
          {
            paddingTop: insets.top,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Host matchContents>
          <ProgressView
            modifiers={[progressViewStyle('circular'), tint(colors.accent)]}
          />
        </Host>
      </View>
    )
  }

  if (!runner) {
    return (
      <View
        style={[
          s.root,
          {
            paddingTop: insets.top,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>No profile found.</Text>
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <GlassIconButton
          systemName="chevron.left"
          onPress={() => router.back()}
        />
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
                    onPress={() =>
                      toggle(time, selectedTimes, setSelectedTimes)
                    }
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
                    onPress={() =>
                      toggle(goal, selectedGoals, setSelectedGoals)
                    }
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
                  <Text style={s.goalInputAddText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Races & Clubs */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>RACES & CLUBS</Text>
            {pastRaces.length > 0 && (
              <View style={[s.chipGrid, { marginBottom: 10 }]}>
                {pastRaces.map(race => (
                  <TouchableOpacity
                    key={race}
                    style={s.customTag}
                    onPress={() =>
                      setPastRaces(prev => prev.filter(r => r !== race))
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={s.customTagText}>{race}</Text>
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
                value={raceInput}
                onChangeText={setRaceInput}
                onSubmitEditing={addRace}
                placeholder="Add a race..."
                placeholderTextColor={colors.textTertiary}
                keyboardAppearance="dark"
                selectionColor={colors.accent}
                returnKeyType="done"
                blurOnSubmit={false}
                autoCorrect={false}
              />
              {raceInput.trim().length > 0 && (
                <TouchableOpacity onPress={addRace} style={s.goalInputAdd}>
                  <Text style={s.goalInputAddText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={s.stepperDivider} />
            {runClubs.length > 0 && (
              <View style={[s.chipGrid, { marginTop: 12, marginBottom: 10 }]}>
                {runClubs.map(club => (
                  <TouchableOpacity
                    key={club}
                    style={s.customTag}
                    onPress={() =>
                      setRunClubs(prev => prev.filter(c => c !== club))
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={s.customTagText}>{club}</Text>
                    <Ionicons
                      name="close"
                      size={12}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View
              style={[
                s.goalInputRow,
                { marginTop: runClubs.length > 0 ? 0 : 12 },
              ]}
            >
              <TextInput
                style={s.goalInput}
                value={clubInput}
                onChangeText={setClubInput}
                onSubmitEditing={addClub}
                placeholder="Add a run club..."
                placeholderTextColor={colors.textTertiary}
                keyboardAppearance="dark"
                selectionColor={colors.accent}
                returnKeyType="done"
                blurOnSubmit={false}
                autoCorrect={false}
              />
              {clubInput.trim().length > 0 && (
                <TouchableOpacity onPress={addClub} style={s.goalInputAdd}>
                  <Text style={s.goalInputAddText}>Add</Text>
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

          {/* Strava */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>STRAVA</Text>
            <Text style={s.fieldLabel}>Username</Text>
            <TextInput
              style={[s.input, { marginBottom: 16 }]}
              value={strava}
              onChangeText={setStrava}
              placeholder="your-strava-username"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.accent}
              keyboardAppearance="dark"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={s.toggleRow}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.toggleLabel}>Share Strava profile</Text>
                <Text style={s.toggleDescription}>
                  Let other runners see your Strava activity insights
                </Text>
              </View>
              <Switch
                value={stravaPublic}
                onValueChange={setStravaPublic}
                trackColor={{
                  false: colors.elevated,
                  true: colors.accent + 'AA',
                }}
                thumbColor={stravaPublic ? colors.accent : colors.textTertiary}
                ios_backgroundColor={colors.elevated}
              />
            </View>
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: keyboardVisible ? 16 : insets.bottom + 8 }]}>
          {isSaving ? (
            <View
              style={{
                height: 54,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Host matchContents>
                <ProgressView
                  modifiers={[
                    progressViewStyle('circular'),
                    tint(colors.accent),
                  ]}
                />
              </Host>
            </View>
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
    backgroundColor: colors.elevatedPlus,
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
    backgroundColor: colors.borderSubtle,
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
    borderColor: colors.borderSubtle,
  },
  chipSelected: {
    backgroundColor: colors.accentSubtle,
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
    borderColor: colors.borderSubtle,
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
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  goalInputAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 16,
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
