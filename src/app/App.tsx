import React from 'react'

import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import type { RootStackParamList } from '../types/navigation'
import MainTabNavigator from './navigation/MainTabNavigator'
import { OnboardingProvider } from './context/OnboardingContext'
import EditProfileScreen from './screens/EditProfileScreen'
import RunnerDetailScreen from './screens/RunnerDetailScreen'
import OnboardingDaysAndTimesScreen from './screens/onboarding/OnboardingDaysAndTimesScreen'
import OnboardingGoalsScreen from './screens/onboarding/OnboardingGoalsScreen'
import OnboardingNameScreen from './screens/onboarding/OnboardingNameScreen'
import OnboardingNeighborhoodScreen from './screens/onboarding/OnboardingNeighborhoodScreen'
import OnboardingPaceAndDistanceScreen from './screens/onboarding/OnboardingPaceAndDistanceScreen'
import OnboardingPhoneScreen from './screens/onboarding/OnboardingPhoneScreen'
import StravaConnectScreen from './screens/onboarding/StravaConnectScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <OnboardingProvider>
        <Stack.Navigator
          initialRouteName="OnboardingPhone"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen
            name="OnboardingPhone"
            component={OnboardingPhoneScreen}
          />
          <Stack.Screen
            name="OnboardingName"
            component={OnboardingNameScreen}
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
          <Stack.Screen name="StravaConnect" component={StravaConnectScreen} />
          <Stack.Screen name="RunnerDetail" component={RunnerDetailScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        </Stack.Navigator>
      </OnboardingProvider>
    </NavigationContainer>
    </SafeAreaProvider>
  )
}
