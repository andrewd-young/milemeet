import React, { useState } from 'react'

import { Button, Text, TouchableOpacity, View } from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import { globalStyles } from '../../styles'

const OnboardingDaysAndTimesScreen = () => {
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const { setRunSchedule } = useOnboarding()
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'OnboardingDaysAndTimes'>
    >()

  const toggleSelection = (
    item: string,
    list: string[],
    setList: (list: string[]) => void,
  ) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const timesOfDay = ['Morning', 'Afternoon', 'Evening']

  const handleNext = () => {
    if (!selectedDays.length || !selectedTimes.length) return
    setRunSchedule(selectedDays, selectedTimes)
    navigation.navigate('OnboardingGoals')
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.label}>Typical run days 🗓</Text>
      <View style={globalStyles.inlineButtons}>
        {daysOfWeek.map(day => (
          <TouchableOpacity
            key={day}
            style={[
              globalStyles.inlineButton,
              selectedDays.includes(day) && globalStyles.inlineButtonSelected,
            ]}
            onPress={() => toggleSelection(day, selectedDays, setSelectedDays)}
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
      <Text style={globalStyles.label}>Typical run times ⏰</Text>
      <View style={globalStyles.inlineButtons}>
        {timesOfDay.map(time => (
          <TouchableOpacity
            key={time}
            style={[
              globalStyles.inlineButton,
              selectedTimes.includes(time) && globalStyles.inlineButtonSelected,
            ]}
            onPress={() =>
              toggleSelection(time, selectedTimes, setSelectedTimes)
            }
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
      <Button
        title="Next"
        onPress={handleNext}
        disabled={selectedDays.length === 0 || selectedTimes.length === 0}
      />
    </View>
  )
}

export default OnboardingDaysAndTimesScreen
