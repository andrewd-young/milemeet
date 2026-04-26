import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import OnboardingLayout from '../../../components/OnboardingLayout'
import { colors, radii } from '../../theme'

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

export default function OnboardingGoalsScreen() {
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')
  const [customGoals, setCustomGoals] = useState<string[]>([])
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnboardingGoals'>>()
  const { setGoals } = useOnboarding()

  const togglePreset = (goal: string) => {
    setSelectedPresets(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal],
    )
  }

  const addCustomGoal = () => {
    const trimmed = customInput.trim()
    if (trimmed && !customGoals.includes(trimmed) && !selectedPresets.includes(trimmed)) {
      setCustomGoals(prev => [...prev, trimmed])
    }
    setCustomInput('')
  }

  const removeCustomGoal = (goal: string) => {
    setCustomGoals(prev => prev.filter(g => g !== goal))
  }

  const handleNext = () => {
    const finalCustom = customInput.trim()
      ? [...customGoals, customInput.trim()]
      : customGoals
    setGoals([...selectedPresets, ...finalCustom])
    navigation.navigate('StravaConnect')
  }

  const hasCustomGoals = customGoals.length > 0

  return (
    <OnboardingLayout
      step={6}
      title="What are your goals?"
      subtitle="Optional — helps match you with runners who share your ambitions."
      onNext={handleNext}
    >
      <Text style={styles.sectionLabel}>SUGGESTED</Text>
      <View style={styles.presetGrid}>
        {PRESET_GOALS.map(goal => {
          const selected = selectedPresets.includes(goal)
          return (
            <TouchableOpacity
              key={goal}
              style={[styles.presetChip, selected && styles.presetChipSelected]}
              onPress={() => togglePreset(goal)}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetChipText, selected && styles.presetChipTextSelected]}>
                {goal}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>CUSTOM</Text>

      {hasCustomGoals && (
        <View style={styles.customTagsRow}>
          {customGoals.map(goal => (
            <TouchableOpacity
              key={goal}
              style={styles.customTag}
              onPress={() => removeCustomGoal(goal)}
              activeOpacity={0.7}
            >
              <Text style={styles.customTagText}>{goal}</Text>
              <Ionicons name="close" size={12} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.customInputRow}>
        <TextInput
          style={styles.customInput}
          value={customInput}
          onChangeText={setCustomInput}
          onSubmitEditing={addCustomGoal}
          placeholder="Add your own goal..."
          placeholderTextColor={colors.textTertiary}
          keyboardAppearance="dark"
          selectionColor={colors.accent}
          returnKeyType="done"
          blurOnSubmit={false}
          autoCorrect={false}
        />
        {customInput.trim().length > 0 && (
          <TouchableOpacity onPress={addCustomGoal} style={styles.addButton}>
            <Ionicons name="return-down-back" size={18} color={colors.accent} />
          </TouchableOpacity>
        )}
      </View>
    </OnboardingLayout>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipSelected: {
    backgroundColor: '#1C2010',
    borderColor: colors.accent,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  presetChipTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  customTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
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
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 50,
  },
  customInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: '100%',
  },
  addButton: {
    paddingLeft: 10,
  },
})
