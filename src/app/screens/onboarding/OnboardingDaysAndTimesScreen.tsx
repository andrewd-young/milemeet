import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import OnboardingLayout from '../../../components/OnboardingLayout'
import { colors, radii } from '../../theme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TIME_OPTIONS: { label: string; icon: IoniconName }[] = [
  { label: 'Morning', icon: 'sunny-outline' },
  { label: 'Afternoon', icon: 'partly-sunny-outline' },
  { label: 'Evening', icon: 'moon-outline' },
]

function toggle(item: string, list: string[]): string[] {
  return list.includes(item) ? list.filter(i => i !== item) : [...list, item]
}

export default function OnboardingDaysAndTimesScreen() {
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnboardingDaysAndTimes'>>()
  const { setRunSchedule } = useOnboarding()

  const handleNext = () => {
    if (!selectedDays.length || !selectedTimes.length) return
    setRunSchedule(selectedDays, selectedTimes)
    navigation.navigate('OnboardingGoals')
  }

  return (
    <OnboardingLayout
      step={5}
      title="When do you run?"
      subtitle="Select the days and times you're usually available."
      onNext={handleNext}
      nextDisabled={!selectedDays.length || !selectedTimes.length}
    >
      <Text style={styles.sectionLabel}>DAYS</Text>
      <View style={styles.daysRow}>
        {DAYS.map(day => {
          const selected = selectedDays.includes(day)
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, selected && styles.dayChipSelected]}
              onPress={() => setSelectedDays(toggle(day, selectedDays))}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                {day[0]}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>TIME OF DAY</Text>
      <View style={styles.timeRow}>
        {TIME_OPTIONS.map(({ label, icon }) => {
          const selected = selectedTimes.includes(label)
          return (
            <TouchableOpacity
              key={label}
              style={[styles.timeChip, selected && styles.timeChipSelected]}
              onPress={() => setSelectedTimes(toggle(label, selectedTimes))}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icon}
                size={16}
                color={selected ? colors.bg : colors.textSecondary}
              />
              <Text style={[styles.timeChipText, selected && styles.timeChipTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          )
        })}
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
    marginBottom: 14,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayChipTextSelected: {
    color: colors.bg,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  timeChipTextSelected: {
    color: colors.bg,
    fontWeight: '600',
  },
})
