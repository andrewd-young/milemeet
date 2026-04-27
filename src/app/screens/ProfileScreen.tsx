import React, { useEffect, useState } from 'react'

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
import GlassIconButton from '../../components/GlassIconButton'
import { FontAwesome5 } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '../../lib/api/supabase'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'
import { colors, radii } from '../theme'

type Runner = Tables<'runners'>

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
    activeColor: colors.accent,
  },
  {
    key: 'linkedin' as const,
    icon: 'linkedin',
    label: 'LinkedIn',
    activeColor: colors.accent,
  },
]

const ProfileScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [runner, setRunner] = useState<Runner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchRunner()
  }, [])

  const fetchRunner = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id ?? null
      let data: Runner | null = null

      if (userId) {
        const { data: byUser, error: byUserError } = await supabase
          .from('runners')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        if (byUserError) throw byUserError
        data = byUser
      }

      if (!data) {
        const { data: fallback, error: fallbackError } = await supabase
          .from('runners')
          .select('*')
          .order('inserted_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (fallbackError) throw fallbackError
        data = fallback
      }

      setRunner(data)
    } catch (error) {
      setErrorMessage(
        `Failed to load profile: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const formatPace = (pace: number) => {
    const m = Math.floor(pace)
    const sec = Math.round((pace - m) * 60)
    return `${m}:${sec.toString().padStart(2, '0')}/mi`
  }

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

  if (errorMessage) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={[globalStyles.subtitle, { color: colors.error }]}>
          {errorMessage}
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={[globalStyles.container, { paddingTop: insets.top + 60 }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.avatarLg}>
            <FontAwesome5 name="user-circle" size={52} color={colors.accent} />
          </View>
          <Text style={s.profileName}>{runner.name}</Text>
          {runner.neighborhood ? (
            <View style={s.locationRow}>
              <FontAwesome5
                name="map-marker-alt"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={s.locationText}>{runner.neighborhood}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBlock}>
            <Text style={s.statLabel}>PACE</Text>
            <Text style={s.statValue}>{formatPace(runner.pace)}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={s.statLabel}>DISTANCE</Text>
            <Text style={s.statValue}>
              {runner.distance_min}–{runner.distance_max} mi
            </Text>
          </View>
        </View>

        {/* About */}
        {runner.bio ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>ABOUT</Text>
            <Text style={s.bioText}>{runner.bio}</Text>
          </View>
        ) : null}

        {/* Schedule */}
        {runner.run_days?.length || runner.run_times?.length ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>SCHEDULE</Text>
            {runner.run_days?.length ? (
              <View style={s.chipsWrap}>
                {runner.run_days.map(day => (
                  <View key={day} style={s.dayChip}>
                    <Text style={s.dayChipText}>{day}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {runner.run_times?.length ? (
              <View style={[s.chipsWrap, { marginTop: 6 }]}>
                {runner.run_times.map(time => (
                  <View key={time} style={s.timeChip}>
                    <Text style={s.timeChipText}>{time}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Goals */}
        {runner.goals ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>GOALS</Text>
            <Text style={s.bodyText}>{runner.goals}</Text>
          </View>
        ) : null}

        {/* Races & Clubs */}
        {runner.past_races?.length || runner.run_clubs?.length ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>RACES & CLUBS</Text>
            {runner.past_races?.length ? (
              <View style={s.chipsWrap}>
                {runner.past_races.map(race => (
                  <View key={race} style={s.tagChip}>
                    <Text style={s.tagChipText}>{race}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {runner.run_clubs?.length ? (
              <View style={[s.chipsWrap, { marginTop: 6 }]}>
                {runner.run_clubs.map(club => (
                  <View key={club} style={s.tagChip}>
                    <Text style={s.tagChipText}>{club}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Connected Apps */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>CONNECTED APPS</Text>
          {CONNECTED_APPS.map((app, i) => {
            const value = runner[app.key]
            const isLast = i === CONNECTED_APPS.length - 1
            return (
              <View key={app.key} style={[s.appRow, isLast && s.appRowLast]}>
                <FontAwesome5
                  name={app.icon as any}
                  size={16}
                  color={value ? app.activeColor : colors.textTertiary}
                  style={{ width: 20 }}
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
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, right: 16 }}
      >
        <GlassIconButton systemName="pencil" onPress={() => router.push('/edit-profile')} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
    gap: 8,
  },
  avatarLg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  bioText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodyText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tagChip: {
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  tagChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  appRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
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
