import React from 'react'

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useRouter } from 'expo-router'

import { Host, ProgressView } from '@expo/ui/swift-ui'
import { progressViewStyle, tint } from '@expo/ui/swift-ui/modifiers'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radii } from '../app/theme'
import { useKeyboardVisible } from '../lib/hooks/useKeyboardVisible'
import GlassIconButton from './GlassIconButton'

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
  const router = useRouter()
  const keyboardVisible = useKeyboardVisible()

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
              <GlassIconButton
                systemName="chevron.left"
                onPress={() => router.back()}
              />
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
              <Host matchContents>
                <ProgressView
                  modifiers={[
                    progressViewStyle('circular'),
                    tint(colors.textSecondary),
                  ]}
                />
              </Host>
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
