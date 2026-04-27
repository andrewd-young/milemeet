import React, { useState } from 'react'

import { StyleSheet, TextInput } from 'react-native'

import { useRouter } from 'expo-router'

import OnboardingLayout from '../../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'
import { colors, radii } from '../../theme'

export default function OnboardingNameScreen() {
  const [name, setName] = useState('')
  const router = useRouter()
  const { setName: setOnboardingName } = useOnboarding()

  const handleNext = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setOnboardingName(trimmed)
    router.push('/onboarding/phone')
  }

  return (
    <OnboardingLayout
      step={2}
      title="What should we call you?"
      subtitle="This is how other runners will see you."
      onNext={handleNext}
      nextDisabled={!name.trim()}
    >
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={colors.textTertiary}
        keyboardAppearance="dark"
        selectionColor={colors.accent}
        autoFocus
        autoCapitalize="words"
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
