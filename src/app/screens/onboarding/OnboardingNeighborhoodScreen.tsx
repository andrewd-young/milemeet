import React, { useState } from 'react'

import { Button, Text, TextInput, View } from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import { globalStyles } from '../../styles'

const OnboardingNeighborhoodScreen = () => {
  const [neighborhood, setNeighborhood] = useState('')
  const { setNeighborhood: setOnboardingNeighborhood } = useOnboarding()
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'OnboardingNeighborhood'>
    >()

  const handleNext = () => {
    const trimmed = neighborhood.trim()
    if (!trimmed) return
    setOnboardingNeighborhood(trimmed)
    navigation.navigate('OnboardingPaceAndDistance')
  }

  return (
    <View style={globalStyles.containerCentered}>
      <Text style={globalStyles.title}>Where do you usually start runs? 🏙️</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Neighborhood"
        value={neighborhood}
        onChangeText={setNeighborhood}
      />
      <Button title="Next" onPress={handleNext} disabled={!neighborhood.trim()} />
    </View>
  )
}

export default OnboardingNeighborhoodScreen
