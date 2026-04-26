import React, { useState } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import OnboardingLayout from '../../../components/OnboardingLayout'
import { colors, radii } from '../../theme'

export default function OnboardingNameScreen() {
  const [name, setName] = useState('')
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnboardingName'>>()
  const { setName: setOnboardingName } = useOnboarding()

  const handleNext = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setOnboardingName(trimmed)
    navigation.navigate('OnboardingNeighborhood')
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
