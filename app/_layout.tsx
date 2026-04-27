import { Stack } from 'expo-router'

import { SafeAreaProvider } from 'react-native-safe-area-context'

import { OnboardingProvider } from '../src/app/context/OnboardingContext'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </OnboardingProvider>
    </SafeAreaProvider>
  )
}
