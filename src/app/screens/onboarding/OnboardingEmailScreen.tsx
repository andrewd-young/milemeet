import React, { useState } from 'react'

import { StyleSheet, TextInput } from 'react-native'

import { useRouter } from 'expo-router'

import OnboardingLayout from '../../../components/OnboardingLayout'
import { supabase } from '../../../lib/api/supabase'
import { useOnboarding } from '../../context/OnboardingContext'
import { colors, radii } from '../../theme'

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function OnboardingEmailScreen() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setEmail: setOnboardingEmail } = useOnboarding()

  const handleNext = async () => {
    const trimmed = email.trim().toLowerCase()
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: trimmed })
      if (error) throw error
      setOnboardingEmail(trimmed)
      router.push('/onboarding/verify')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardingLayout
      step={1}
      title="What's your email?"
      subtitle="We'll send you a verification code to get started."
      onNext={handleNext}
      nextDisabled={!isValidEmail(email.trim())}
      isLoading={isLoading}
      showBack={false}
    >
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={colors.textTertiary}
        keyboardType="email-address"
        keyboardAppearance="dark"
        selectionColor={colors.accent}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
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
    fontSize: 18,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
})
