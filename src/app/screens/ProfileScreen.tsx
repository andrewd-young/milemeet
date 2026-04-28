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
import { FontAwesome5 } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GlassIconButton from '../../components/GlassIconButton'
import NeighborhoodMap from '../../components/NeighborhoodMap'
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
    activeColor: '#E1306C',
  },
  {
    key: 'linkedin' as const,
    icon: 'linkedin',
    label: 'LinkedIn',
    activeColor: '#0A66C2',
  },
]

const formatPace = (pace: number) => {
  const m = Math.floor(pace)
  const sec = Math.round((pace - m) * 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const paceTier = (pace: number): string => {
  if (pace < 7) return 'ELITE PACER'
  if (pace < 9) return 'STRONG PACER'
  if (pace < 11) return 'STEADY PACER'
  return 'EASY PACER'
}

const timeMeta = (time: string): { abbrev: string; icon: string } => {
  const t = time.toLowerCase().trim()
  if (t === 'morning' || t.includes('morning') || t.includes('am') || t.includes('early'))
    return { abbrev: 'MORNING', icon: 'coffee' }
  if (t === 'noon' || t.includes('noon') || t.includes('afternoon') || t.includes('midday'))
    return { abbrev: 'NOON', icon: 'sun' }
  return { abbrev: 'NIGHT', icon: 'moon' }
}

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

  const days = runner.run_days ?? []
  const times = runner.run_times ?? []
  const scheduleChips =
    days.length && times.length
      ? days.flatMap(day =>
          times.map(time => {
            const meta = timeMeta(time)
            return {
              label: `${day.toUpperCase()} ${meta.abbrev}`,
              icon: meta.icon,
            }
          }),
        )
      : days.map(day => ({ label: day.toUpperCase(), icon: '' }))

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Hero — full bleed, paddingTop = safe area */}
        <View style={[s.hero, { paddingTop: insets.top + 16 }]}>
          <FontAwesome5
            name="running"
            size={160}
            color={colors.accent}
            style={s.heroWatermark}
          />
          <View style={s.heroBottom}>
            <Text style={s.heroName}>{runner.name}</Text>
            <View style={s.heroMeta}>
              <View style={s.paceBadge}>
                <FontAwesome5 name="bolt" size={10} color={colors.bg} />
                <Text style={s.paceBadgeText}>{paceTier(runner.pace)}</Text>
              </View>
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
          </View>
        </View>

        <View style={s.content}>
          {/* About */}
          {runner.bio ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>About</Text>
              <Text style={s.bodyText}>{runner.bio}</Text>
            </View>
          ) : null}

          {/* Recent Activity */}
          <View style={s.section}>
            <Text style={s.sectionHeading}>Recent Activity</Text>
            <View style={s.activityCard}>
              <NeighborhoodMap
                neighborhood={runner.neighborhood ?? ''}
                height={180}
              />
              <View style={s.activityStats}>
                <View style={s.activityStat}>
                  <Text style={s.activityStatLabel}>DISTANCE</Text>
                  <View style={s.activityStatRow}>
                    <Text style={s.activityStatValueAccent}>
                      {runner.distance_max}
                    </Text>
                    <Text style={s.activityStatUnit}>mi</Text>
                  </View>
                </View>
                <View style={s.activityStat}>
                  <Text style={s.activityStatLabel}>AVG PACE</Text>
                  <View style={s.activityStatRow}>
                    <Text style={s.activityStatValue}>
                      {formatPace(runner.pace)}
                    </Text>
                    <Text style={s.activityStatUnit}>/mi</Text>
                  </View>
                </View>
                <View style={s.activityStat}>
                  <Text style={s.activityStatLabel}>DAYS/WK</Text>
                  <View style={s.activityStatRow}>
                    <Text style={s.activityStatValue}>
                      {runner.run_days?.length ?? '—'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Schedule */}
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

          {/* Goals */}
          {runner.goals ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Goals</Text>
              <View style={s.chipsRow}>
                {runner.goals
                  .split(',')
                  .map(g => g.trim())
                  .filter(Boolean)
                  .map((goal, i) => (
                    <View key={i} style={s.goalChip}>
                      <Text style={s.goalChipText}>{goal}</Text>
                    </View>
                  ))}
              </View>
            </View>
          ) : null}

          {/* Races & Clubs */}
          {runner.past_races?.length || runner.run_clubs?.length ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Races & Clubs</Text>
              <View style={s.chipsRow}>
                {[
                  ...(runner.past_races ?? []),
                  ...(runner.run_clubs ?? []),
                ].map(tag => (
                  <View key={tag} style={s.tagChip}>
                    <Text style={s.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Connected Apps */}
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
  hero: {
    backgroundColor: colors.surface,
    minHeight: 280,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroWatermark: {
    position: 'absolute',
    right: -20,
    bottom: 10,
    opacity: 0.07,
  },
  heroBottom: {
    gap: 10,
  },
  heroName: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1.2,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  paceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.bg,
    letterSpacing: 0.3,
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

  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activityStat: {
    flex: 1,
    gap: 4,
  },
  activityStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  activityStatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  activityStatValueAccent: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  activityStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  activityStatUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    paddingBottom: 2,
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
  goalChip: {
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  goalChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  tagChip: {
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
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
