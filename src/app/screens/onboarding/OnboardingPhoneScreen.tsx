import React, { useState } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import OnboardingLayout from '../../../components/OnboardingLayout'
import { colors, radii } from '../../theme'

const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export default function OnboardingPhoneScreen() {
  const [phone, setPhone] = useState('')
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnboardingPhone'>>()
  const { setPhone: setOnboardingPhone } = useOnboarding()

  const handleNext = () => {
    setOnboardingPhone(phone.trim(), 'US')
    navigation.navigate('OnboardingName')
  }

  return (
    <OnboardingLayout
      step={1}
      title="What's your phone number?"
      subtitle="We'll use this to reconnect you to your running circle."
      onNext={handleNext}
      nextDisabled={!isValidPhone(phone)}
      showBack={false}
    >
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="+1 (555) 000-0000"
        placeholderTextColor={colors.textTertiary}
        keyboardType="numbers-and-punctuation"
        keyboardAppearance="dark"
        selectionColor={colors.accent}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleNext}
      />
    </OnboardingLayout>
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    height: 54,
    paddingHorizontal: 18,
    fontSize: 20,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    letterSpacing: 1,
  },
})
