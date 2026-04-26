import React, { useEffect, useState } from 'react'

import { ActivityIndicator, View } from 'react-native'

import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { supabase } from '../lib/api/supabase'
import type { RootStackParamList } from '../types/navigation'
import { OnboardingProvider } from './context/OnboardingContext'
import MainTabNavigator from './navigation/MainTabNavigator'
import EditProfileScreen from './screens/EditProfileScreen'
import RunnerDetailScreen from './screens/RunnerDetailScreen'
import OnboardingDaysAndTimesScreen from './screens/onboarding/OnboardingDaysAndTimesScreen'
import OnboardingEmailScreen from './screens/onboarding/OnboardingEmailScreen'
import OnboardingGoalsScreen from './screens/onboarding/OnboardingGoalsScreen'
import OnboardingNameScreen from './screens/onboarding/OnboardingNameScreen'
import OnboardingNeighborhoodScreen from './screens/onboarding/OnboardingNeighborhoodScreen'
import OnboardingPaceAndDistanceScreen from './screens/onboarding/OnboardingPaceAndDistanceScreen'
import OnboardingPhoneScreen from './screens/onboarding/OnboardingPhoneScreen'
import OnboardingVerifyScreen from './screens/onboarding/OnboardingVerifyScreen'
import StravaConnectScreen from './screens/onboarding/StravaConnectScreen'
import { colors } from './theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

type InitialRoute = 'OnboardingEmail' | 'OnboardingName' | 'MainTabs'

export default function App() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null)

  useEffect(() => {
    async function resolveInitialRoute() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setInitialRoute('OnboardingEmail')
        return
      }
      const { data: runner } = await supabase
        .from('runners')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      setInitialRoute(runner ? 'MainTabs' : 'OnboardingName')
    }
    resolveInitialRoute()
  }, [])

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <OnboardingProvider>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen
              name="OnboardingEmail"
              component={OnboardingEmailScreen}
            />
            <Stack.Screen
              name="OnboardingVerify"
              component={OnboardingVerifyScreen}
            />
            <Stack.Screen
              name="OnboardingName"
              component={OnboardingNameScreen}
            />
            <Stack.Screen
              name="OnboardingPhone"
              component={OnboardingPhoneScreen}
            />
            <Stack.Screen
              name="OnboardingNeighborhood"
              component={OnboardingNeighborhoodScreen}
            />
            <Stack.Screen
              name="OnboardingPaceAndDistance"
              component={OnboardingPaceAndDistanceScreen}
            />
            <Stack.Screen
              name="OnboardingDaysAndTimes"
              component={OnboardingDaysAndTimesScreen}
            />
            <Stack.Screen
              name="OnboardingGoals"
              component={OnboardingGoalsScreen}
            />
            <Stack.Screen
              name="StravaConnect"
              component={StravaConnectScreen}
            />
            <Stack.Screen name="RunnerDetail" component={RunnerDetailScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          </Stack.Navigator>
        </OnboardingProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
