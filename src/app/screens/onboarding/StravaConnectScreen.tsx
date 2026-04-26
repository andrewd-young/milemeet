import React, { useState } from 'react'

import { ActivityIndicator, Button, Text, View } from 'react-native'

import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import { globalStyles } from '../../styles'

const StravaConnectScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { completeOnboarding } = useOnboarding()
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleContinue = async () => {
    try {
      setIsSaving(true)
      setErrorMessage(null)
      await completeOnboarding()
      navigation.navigate({
        name: 'MainTabs',
        params: { screen: 'NearbyRunners' },
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={globalStyles.containerCentered}>
      <Text style={globalStyles.title}>Connect your running apps (optional)</Text>
      <Text style={globalStyles.subtitle}>
        Strava and other integrations are coming soon. For now, we’ll just save
        your running preferences.
      </Text>
      {errorMessage && (
        <Text style={[globalStyles.subtitle, { color: '#ef4444' }]}>
          {errorMessage}
        </Text>
      )}
      {isSaving ? (
        <ActivityIndicator size="large" color="#22c55e" />
      ) : (
        <Button title="Continue to runners 🏃‍♀️" onPress={handleContinue} />
      )}
    </View>
  )
}

export default StravaConnectScreen
