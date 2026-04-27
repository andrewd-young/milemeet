import React, { useState } from 'react'

import {
  InputAccessoryView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native'

import { useRouter } from 'expo-router'

import OnboardingLayout from '../../../components/OnboardingLayout'
import { supabase } from '../../../lib/api/supabase'
import { useOnboarding } from '../../context/OnboardingContext'
import { colors, radii } from '../../theme'

const INPUT_ID = 'otp-input'

export default function OnboardingVerifyScreen() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const {
    data: { email },
  } = useOnboarding()

  const handleNext = async () => {
    if (!email || code.length < 6) return
    setIsLoading(true)
    setError(null)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      if (verifyError) throw verifyError

      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (userId) {
        const { data: existing } = await supabase
          .from('runners')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        if (existing) {
          router.replace('/(tabs)')
          return
        }
      }

      router.push('/onboarding/name')
    } catch (err: any) {
      setError(err.message ?? 'Invalid code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    setCode('')
    setError(null)
    await supabase.auth.signInWithOtp({ email })
  }

  return (
    <>
      <OnboardingLayout
        step={1}
        title="Check your email"
        subtitle={`Enter the 6-digit code sent to ${email ?? 'your email'}.`}
        onNext={handleNext}
        nextDisabled={code.length < 6}
        isLoading={isLoading}
      >
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={text => {
            setCode(text.replace(/\D/g, '').slice(0, 6))
            setError(null)
          }}
          placeholder="000000"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          keyboardAppearance="dark"
          selectionColor={colors.accent}
          inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ID : undefined}
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
          <Text style={styles.resendText}>Resend code</Text>
        </TouchableOpacity>
      </OnboardingLayout>
      {Platform.OS === 'ios' && <InputAccessoryView nativeID={INPUT_ID} />}
    </>
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    height: 54,
    paddingHorizontal: 18,
    fontSize: 26,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    letterSpacing: 8,
    textAlign: 'center',
  },
  error: {
    marginTop: 10,
    color: '#FF6B6B',
    fontSize: 13,
  },
  resendButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  resendText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
})
