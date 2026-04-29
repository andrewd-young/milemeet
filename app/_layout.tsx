import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { SafeAreaProvider } from 'react-native-safe-area-context'

import { ConnectionsProvider } from '../src/app/context/ConnectionsContext'
import { OnboardingProvider } from '../src/app/context/OnboardingContext'
import { MyRunnerProvider } from '../src/context/MyRunnerContext'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <MyRunnerProvider>
        <OnboardingProvider>
          <ConnectionsProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ConnectionsProvider>
        </OnboardingProvider>
      </MyRunnerProvider>
    </SafeAreaProvider>
  )
}
