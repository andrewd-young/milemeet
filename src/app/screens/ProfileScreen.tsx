import React from 'react'

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useRouter } from 'expo-router'

import { Host, ProgressView } from '@expo/ui/swift-ui'
import { progressViewStyle, tint } from '@expo/ui/swift-ui/modifiers'
import { FontAwesome5 } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GlassIconButton from '../../components/GlassIconButton'
import RunnerActivityCard from '../../components/RunnerActivityCard'
import RunnerHero from '../../components/RunnerHero'
import { useMyRunner } from '../../context/MyRunnerContext'
import { buildScheduleChips } from '../../lib/helpers/formatters'
import { globalStyles } from '../styles'
import { colors, radii } from '../theme'

const CONNECTED_APPS = [
  {
    key: 'strava' as const,
    icon: 'strava',
    label: 'Strava',
    activeColor: colors.strava,
  },
  {
    key: 'instagram' as const,
    icon: 'instagram',
    label: 'Instagram',
    activeColor: '#E1306C',
  },
  {
    key: 'linkedin' as const,
    icon: 'linkedin',
    label: 'LinkedIn',
    activeColor: '#0A66C2',
  },
]

const ProfileScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { myRunner: runner, isLoading } = useMyRunner()

  if (isLoading) {
    return (
      <View style={globalStyles.containerCentered}>
        <Host matchContents>
          <ProgressView
            modifiers={[progressViewStyle('circular'), tint(colors.accent)]}
          />
        </Host>
        <Text style={[globalStyles.subtitle, { marginTop: 16 }]}>
          Loading profile…
        </Text>
      </View>
    )
  }

  if (!runner) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.subtitle}>No profile found.</Text>
      </View>
    )
  }

  const scheduleChips = buildScheduleChips(
    runner.run_days ?? [],
    runner.run_times ?? [],
  )
  const goalChips = runner.goals
    ? runner.goals
        .split(',')
        .map(g => g.trim())
        .filter(Boolean)
    : []
  const racesAndClubs = [
    ...(runner.past_races ?? []),
    ...(runner.run_clubs ?? []),
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <RunnerHero
          runner={runner}
          paddingTop={insets.top + 16}
          minHeight={280}
        />

        <View style={s.content}>
          {runner.bio ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>About</Text>
              <Text style={s.bodyText}>{runner.bio}</Text>
            </View>
          ) : null}

          <View style={s.section}>
            <Text style={s.sectionHeading}>Activity</Text>
            <RunnerActivityCard runner={runner} />
          </View>

          {scheduleChips.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Schedule</Text>
              <View style={s.chipsRow}>
                {scheduleChips.map((chip, i) => (
                  <View key={i} style={s.scheduleChip}>
                    {chip.icon ? (
                      <FontAwesome5
                        name={chip.icon as any}
                        size={12}
                        color={colors.accent}
                        solid
                      />
                    ) : null}
                    <Text style={s.scheduleChipText}>{chip.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {goalChips.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Goals</Text>
              <View style={s.chipsRow}>
                {goalChips.map((goal, i) => (
                  <View key={i} style={s.chip}>
                    <Text style={s.chipText}>{goal}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {racesAndClubs.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Races & Clubs</Text>
              <View style={s.chipsRow}>
                {racesAndClubs.map(tag => (
                  <View key={tag} style={s.chip}>
                    <Text style={s.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={s.section}>
            <Text style={s.sectionHeading}>Connected Apps</Text>
            {CONNECTED_APPS.map((app, i) => {
              const value = runner[app.key]
              const isLast = i === CONNECTED_APPS.length - 1
              return (
                <View
                  key={app.key}
                  style={[s.appRow, isLast && { borderBottomWidth: 0 }]}
                >
                  <FontAwesome5
                    name={app.icon as any}
                    size={18}
                    color={value ? app.activeColor : colors.textTertiary}
                    style={{ width: 24 }}
                  />
                  <Text
                    style={[
                      s.appRowLabel,
                      !value && { color: colors.textTertiary },
                    ]}
                  >
                    {app.label}
                  </Text>
                  <Text style={s.appRowValue}>{value ?? 'Not connected'}</Text>
                </View>
              )
            })}
          </View>

          {__DEV__ && (
            <TouchableOpacity
              onPress={() => router.push('/onboarding/name')}
              style={s.devButton}
            >
              <Text style={s.devButtonText}>DEV — Restart onboarding</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, right: 16 }}
      >
        <GlassIconButton
          systemName="pencil"
          onPress={() => router.push('/edit-profile')}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 23,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  scheduleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chip: {
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  appRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  appRowValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  devButton: {
    marginTop: 8,
    padding: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  devButtonText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
})

export default ProfileScreen
