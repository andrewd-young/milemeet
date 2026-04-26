import React, { useState } from 'react'

import { Button, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import { globalStyles } from '../../styles'

const OnboardingPaceAndDistanceScreen = () => {
  const [pace, setPace] = useState('')
  const [distanceMin, setDistanceMin] = useState(3)
  const [distanceMax, setDistanceMax] = useState(6)
  const { setPaceAndDistance } = useOnboarding()
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'OnboardingPaceAndDistance'>
    >()

  const parsePace = (paceStr: string): number | null => {
    const match = paceStr.match(/^(\d+):(\d{2})$/)
    if (match) {
      return parseInt(match[1], 10) + parseInt(match[2], 10) / 60
    }
    return null
  }

  const isValidPace = pace.trim() !== '' && parsePace(pace) !== null

  const handleNext = () => {
    const parsed = parsePace(pace)
    if (parsed == null) return
    setPaceAndDistance(parsed, distanceMin, distanceMax)
    navigation.navigate('OnboardingDaysAndTimes')
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.label}>
        Preferred running pace (min:sec per mile)
      </Text>
      <TextInput
        style={globalStyles.input}
        placeholder="e.g. 8:00"
        value={pace}
        onChangeText={setPace}
        placeholderTextColor="#888"
        keyboardType="numbers-and-punctuation"
      />
      <Text style={globalStyles.label}>Distance range (miles)</Text>
      <View style={globalStyles.stepperRow}>
        <Text style={globalStyles.stepperLabel}>Min</Text>
        <TouchableOpacity
          style={globalStyles.stepperButton}
          onPress={() => setDistanceMin(Math.max(1, distanceMin - 1))}
        >
          <Text style={globalStyles.stepperButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={globalStyles.stepperValue}>{distanceMin}</Text>
        <TouchableOpacity
          style={globalStyles.stepperButton}
          onPress={() => setDistanceMin(Math.min(distanceMin + 1, distanceMax - 1))}
        >
          <Text style={globalStyles.stepperButtonText}>+</Text>
        </TouchableOpacity>
        <Text style={[globalStyles.stepperLabel, { marginLeft: 16 }]}>Max</Text>
        <TouchableOpacity
          style={globalStyles.stepperButton}
          onPress={() => setDistanceMax(Math.max(distanceMax - 1, distanceMin + 1))}
        >
          <Text style={globalStyles.stepperButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={globalStyles.stepperValue}>{distanceMax}</Text>
        <TouchableOpacity
          style={globalStyles.stepperButton}
          onPress={() => setDistanceMax(Math.min(26, distanceMax + 1))}
        >
          <Text style={globalStyles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={globalStyles.sliderLabel}>
        {distanceMin} – {distanceMax} miles
      </Text>
      <Button title="Next" onPress={handleNext} disabled={!isValidPace} />
    </View>
  )
}

export default OnboardingPaceAndDistanceScreen
