import React, { useState } from 'react'

import { Button, Text, TextInput, View } from 'react-native'

import Slider from '@react-native-community/slider'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import { globalStyles } from '../../styles'

const OnboardingPaceAndDistanceScreen = () => {
  const [pace, setPace] = useState('')
  const [distanceRange, setDistanceRange] = useState<[number, number]>([3, 6])
  const { setPaceAndDistance } = useOnboarding()
  const navigation =
    useNavigation<
      StackNavigationProp<RootStackParamList, 'OnboardingPaceAndDistance'>
    >()

  const handleMinDistanceChange = (val: number) => {
    setDistanceRange([val, Math.max(val + 1, distanceRange[1])])
  }

  const handleMaxDistanceChange = (val: number) => {
    setDistanceRange([distanceRange[0], Math.max(val, distanceRange[0] + 1)])
  }

  // Convert pace string (e.g., "8:00") to minutes per mile as a number
  const parsePace = (paceStr: string): number | null => {
    const match = paceStr.match(/^(\d+):(\d{2})$/)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      return minutes + seconds / 60
    }
    return null
  }

  const isValidPace = pace.trim() !== '' && parsePace(pace) !== null

  const handleNext = () => {
    const parsed = parsePace(pace)
    if (parsed == null) return
    setPaceAndDistance(parsed, distanceRange[0], distanceRange[1])
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
      />
      <Text style={globalStyles.label}>Distance range (miles)</Text>
      <View style={globalStyles.sliderRow}>
        <Text style={globalStyles.sliderValue}>{distanceRange[0]}</Text>
        <Slider
          style={globalStyles.slider}
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={distanceRange[0]}
          onValueChange={handleMinDistanceChange}
          minimumTrackTintColor="#1fb28a"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#1fb28a"
        />
        <Text style={globalStyles.sliderValue}>{distanceRange[1]}</Text>
        <Slider
          style={globalStyles.slider}
          minimumValue={distanceRange[0] + 1}
          maximumValue={20}
          step={1}
          value={distanceRange[1]}
          onValueChange={handleMaxDistanceChange}
          minimumTrackTintColor="#1fb28a"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#1fb28a"
        />
      </View>
      <Text style={globalStyles.sliderLabel}>
        {distanceRange[0]} - {distanceRange[1]} miles
      </Text>
      <Button title="Next" onPress={handleNext} disabled={!isValidPace} />
    </View>
  )
}

export default OnboardingPaceAndDistanceScreen
