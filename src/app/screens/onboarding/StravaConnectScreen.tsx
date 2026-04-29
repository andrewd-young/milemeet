import React, { useState } from 'react'

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useRouter } from 'expo-router'

import { FontAwesome5 } from '@expo/vector-icons'

import OnboardingLayout from '../../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'
import { colors, radii } from '../../theme'

export default function StravaConnectScreen() {
  const router = useRouter()
  const { completeOnboarding } = useOnboarding()
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleContinue = async () => {
    try {
      setIsSaving(true)
      setErrorMessage(null)
      await completeOnboarding()
      router.replace('/(tabs)')
    } catch (error) {
      console.error('[StravaConnectScreen] completeOnboarding threw:', error)
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: unknown }).message)
            : JSON.stringify(error)
      setErrorMessage(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <OnboardingLayout
      step={8}
      title="Almost there"
      subtitle="Connect Strava to auto-fill your pace, or continue and set it manually."
      onNext={handleContinue}
      nextLabel="Find My Runners"
      isLoading={isSaving}
    >
      <TouchableOpacity style={styles.stravaCard} activeOpacity={0.75}>
        <View style={styles.stravaIconWrap}>
          <FontAwesome5 name="strava" size={22} color={colors.strava} />
        </View>
        <View style={styles.stravaText}>
          <Text style={styles.stravaTitle}>Connect Strava</Text>
          <Text style={styles.stravaDesc}>
            We'll analyze your past runs to set your default pace.
          </Text>
        </View>
        <View style={styles.connectBadge}>
          <Text style={styles.connectBadgeText}>Connect</Text>
        </View>
      </TouchableOpacity>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </OnboardingLayout>
  )
}

const styles = StyleSheet.create({
  stravaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  stravaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.stravaSubtle,
    borderWidth: 1,
    borderColor: colors.stravaBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stravaText: {
    flex: 1,
    gap: 2,
  },
  stravaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stravaDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  connectBadge: {
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  connectBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  error: {
    fontSize: 13,
    color: colors.error,
    marginTop: 16,
    textAlign: 'center',
  },
})
