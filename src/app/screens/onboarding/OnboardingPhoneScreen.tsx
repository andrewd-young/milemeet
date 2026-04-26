import React, { useState } from 'react'

import { Button, Text, TextInput, View } from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import { globalStyles } from '../../styles'

const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

const OnboardingPhoneScreen = () => {
  const [phone, setPhone] = useState('')
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnboardingPhone'>>()
  const { setPhone: setOnboardingPhone } = useOnboarding()

  const handleNext = () => {
    setOnboardingPhone(phone.trim(), 'US')
    navigation.navigate('OnboardingName')
  }

  return (
    <View style={globalStyles.containerCentered}>
      <Text style={globalStyles.title}>What's your phone number?</Text>
      <Text style={globalStyles.subtitle}>
        We'll use this to reconnect you to your running circle.
      </Text>
      <TextInput
        style={globalStyles.inputCentered}
        value={phone}
        onChangeText={setPhone}
        placeholder="+1 (555) 000-0000"
        placeholderTextColor="#888"
        keyboardType="phone-pad"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleNext}
      />
      <Button
        title="Next"
        onPress={handleNext}
        disabled={!isValidPhone(phone)}
      />
    </View>
  )
}

export default OnboardingPhoneScreen
