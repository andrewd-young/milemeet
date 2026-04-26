import React, { useState } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import OnboardingLayout from '../../../components/OnboardingLayout'
import { colors, radii } from '../../theme'

export default function OnboardingNeighborhoodScreen() {
  const [neighborhood, setNeighborhood] = useState('')
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnboardingNeighborhood'>>()
  const { setNeighborhood: setOnboardingNeighborhood } = useOnboarding()

  const handleNext = () => {
    const trimmed = neighborhood.trim()
    if (!trimmed) return
    setOnboardingNeighborhood(trimmed)
    navigation.navigate('OnboardingPaceAndDistance')
  }

  return (
    <OnboardingLayout
      step={3}
      title="Where do you usually run?"
      subtitle="We'll find pace partners close to your neighborhood."
      onNext={handleNext}
      nextDisabled={!neighborhood.trim()}
    >
      <TextInput
        style={styles.input}
        value={neighborhood}
        onChangeText={setNeighborhood}
        placeholder="e.g. Brooklyn Heights"
        placeholderTextColor={colors.textTertiary}
        keyboardAppearance="dark"
        selectionColor={colors.accent}
        autoFocus
        autoCapitalize="words"
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
