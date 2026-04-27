import React, { useState } from 'react'

import {
  InputAccessoryView,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native'

import { useRouter } from 'expo-router'

import OnboardingLayout from '../../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'
import { colors, radii } from '../../theme'

const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

const INPUT_ID = 'phone-input'

export default function OnboardingPhoneScreen() {
  const [phone, setPhone] = useState('')
  const router = useRouter()
  const { setPhone: setOnboardingPhone } = useOnboarding()

  const handleNext = () => {
    setOnboardingPhone(phone.trim(), 'US')
    router.push('/onboarding/neighborhood')
  }

  return (
    <>
      <OnboardingLayout
        step={3}
        title="What's your phone number?"
        subtitle="So your running circle can reach you."
        onNext={handleNext}
        nextDisabled={!isValidPhone(phone)}
      >
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor={colors.textTertiary}
          keyboardType="phone-pad"
          keyboardAppearance="dark"
          selectionColor={colors.accent}
          inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ID : undefined}
          autoFocus
        />
      </OnboardingLayout>
      {Platform.OS === 'ios' && <InputAccessoryView nativeID={INPUT_ID} />}
    </>
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
