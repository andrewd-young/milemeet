import React, { useState } from 'react'

import { Button, Text, TextInput, View } from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import { globalStyles } from '../../styles'

const OnboardingNameScreen = () => {
  const [name, setName] = useState('')
  const { setName: setOnboardingName } = useOnboarding()
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, 'OnboardingName'>>()

  const handleNext = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setOnboardingName(trimmed)
    navigation.navigate('OnboardingNeighborhood')
  }

  return (
    <View style={globalStyles.containerCentered}>
      <Text style={globalStyles.title}>What should we call you? 🏃</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <Button title="Next" onPress={handleNext} disabled={!name.trim()} />
    </View>
  )
}

export default OnboardingNameScreen
