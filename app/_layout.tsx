import { Stack } from 'expo-router'

import { SafeAreaProvider } from 'react-native-safe-area-context'

import { ConnectionsProvider } from '../src/app/context/ConnectionsContext'
import { OnboardingProvider } from '../src/app/context/OnboardingContext'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <ConnectionsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ConnectionsProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  )
}
