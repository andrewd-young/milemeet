import React, { useEffect, useState } from 'react'

import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radii } from '../app/theme'

interface Props {
  step: number
  totalSteps?: number
  title: string
  subtitle?: string
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  isLoading?: boolean
  showBack?: boolean
  children: React.ReactNode
}

export default function OnboardingLayout({
  step,
  totalSteps = 8,
  title,
  subtitle,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  isLoading = false,
  showBack = true,
  children,
}: Props) {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    )
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    )
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Fixed header — never scrolls */}
        <View style={styles.header}>
          <View style={styles.nav}>
            {showBack ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.navSpacer} />
            )}
            <Text style={styles.stepText}>
              STEP {step} OF {totalSteps}
            </Text>
            <View style={styles.navSpacer} />
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(step / totalSteps) * 100}%` },
              ]}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {/* Scrollable content area */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>

        {/* Fixed CTA — sits just above keyboard */}
        <View
          style={[
            styles.footer,
            { paddingBottom: keyboardVisible ? 16 : insets.bottom + 8 },
          ]}
        >
          <TouchableOpacity
            style={[styles.cta, nextDisabled && styles.ctaDisabled]}
            onPress={onNext}
            disabled={nextDisabled || isLoading}
            activeOpacity={0.82}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textSecondary} />
            ) : (
              <Text
                style={[styles.ctaText, nextDisabled && styles.ctaTextDisabled]}
              >
                {nextLabel}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 14,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSpacer: {
    width: 34,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.4,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.elevated,
    borderRadius: 1,
    marginBottom: 36,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.bg,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    backgroundColor: colors.elevated,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bg,
    letterSpacing: -0.1,
  },
  ctaTextDisabled: {
    color: colors.textTertiary,
  },
})
