import React, { useEffect, useState } from 'react'

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'

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
type Connection = Tables<'run_connections'>

const extractMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err)
    return String((err as { message: unknown }).message)
  return 'Something went wrong'
}

type ConnectionStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'accepted'
  | 'declined_sent'

const formatPace = (pace: number) => {
  const m = Math.floor(pace)
  const sec = Math.round((pace - m) * 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const timeMeta = (time: string): { abbrev: string; icon: string } => {
  const t = time.toLowerCase().trim()
  if (
    t === 'morning' ||
    t.includes('morning') ||
    t.includes('am') ||
    t.includes('early')
  )
    return { abbrev: 'MORNING', icon: 'coffee' }
  if (
    t === 'noon' ||
    t.includes('noon') ||
    t.includes('afternoon') ||
    t.includes('midday')
  )
    return { abbrev: 'NOON', icon: 'sun' }
  return { abbrev: 'NIGHT', icon: 'moon' }
}

const RunnerDetailScreen = () => {
  const { id: runnerId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [runner, setRunner] = useState<Runner | null>(null)
  const [myRunner, setMyRunner] = useState<Runner | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('none')
  const [isLoading, setIsLoading] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [runnerId])

  const load = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [runnerResult, authResult] = await Promise.all([
        supabase.from('runners').select('*').eq('id', runnerId).maybeSingle(),
        supabase.auth.getUser(),
      ])

      if (runnerResult.error) throw runnerResult.error
      if (!runnerResult.data) throw new Error('Runner not found')
      setRunner(runnerResult.data)

      const userId = authResult.data.user?.id
      if (!userId) return

      const { data: me } = await supabase
        .from('runners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!me) return
      setMyRunner(me)

      if (me.id === runnerId) return

      const { data: conn } = await supabase
        .from('run_connections')
        .select('*')
        .or(
          `and(owner_runner_id.eq.${me.id},partner_runner_id.eq.${runnerId}),` +
            `and(owner_runner_id.eq.${runnerId},partner_runner_id.eq.${me.id})`,
        )
        .maybeSingle()

      setConnection(conn ?? null)
      setConnectionStatus(deriveStatus(conn ?? null, me.id))
    } catch (error) {
      if (__DEV__) console.error('[RunnerDetail] load error:', error)
      setErrorMessage(extractMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const deriveStatus = (
    conn: Connection | null,
    myId: string,
  ): ConnectionStatus => {
    if (!conn) return 'none'
    if (conn.status === 'accepted') return 'accepted'
    if (conn.status === 'pending') {
      return conn.owner_runner_id === myId ? 'pending_sent' : 'pending_received'
    }
    if (conn.status === 'declined' && conn.owner_runner_id === myId)
      return 'declined_sent'
    return 'none'
  }

  const handleAction = async () => {
    if (!myRunner) {
      setErrorMessage(
        'Sign in and complete your profile to connect with runners.',
      )
      return
    }
    if (!runner) return
    setIsActing(true)
    setErrorMessage(null)

    try {
      if (connectionStatus === 'none' || connectionStatus === 'declined_sent') {
        const { data, error } = await supabase
          .from('run_connections')
          .insert({
            owner_runner_id: myRunner.id,
            partner_runner_id: runner.id,
            status: 'pending',
          })
          .select()
          .single()

        if (error) throw error
        setConnection(data)
        setConnectionStatus('pending_sent')
      } else if (connectionStatus === 'pending_received' && connection) {
        const { data, error } = await supabase
          .from('run_connections')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', connection.id)
          .select()
          .single()

        if (error) throw error
        setConnection(data)
        setConnectionStatus('accepted')
      }
    } catch (error) {
      if (__DEV__) console.error('[RunnerDetail] action error:', error)
      setErrorMessage(extractMessage(error))
    } finally {
      setIsActing(false)
    }
  }

  const ctaConfig = () => {
    switch (connectionStatus) {
      case 'none':
        return {
          label: 'Send Run Request',
          icon: 'running',
          disabled: false,
          accent: true,
        }
      case 'pending_sent':
        return {
          label: 'Request Sent',
          icon: 'clock',
          disabled: true,
          accent: false,
        }
      case 'pending_received':
        return {
          label: 'Accept Request',
          icon: 'check',
          disabled: false,
          accent: true,
        }
      case 'accepted':
        return {
          label: 'Connected',
          icon: 'users',
          disabled: true,
          accent: false,
        }
      case 'declined_sent':
        return {
          label: 'Request Again',
          icon: 'running',
          disabled: false,
          accent: true,
        }
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
          Loading runner…
        </Text>
      </View>
    )
  }

  if (!runner) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.subtitle}>
          {errorMessage ?? 'Runner not found.'}
        </Text>
      </View>
    )
  }

  const isOwnProfile = myRunner?.id === runnerId
  const cta = ctaConfig()

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
        contentContainerStyle={{ paddingBottom: isOwnProfile ? 40 : 120 }}
      >
        {/* Hero — full bleed, paddingTop = safe area inset */}
        <View style={[s.hero, { paddingTop: insets.top + 16 }]}>
          <FontAwesome5
            name="running"
            size={160}
            color={colors.accent}
            style={s.heroWatermark}
          />
          <LinearGradient
            colors={['transparent', 'rgba(13,13,13,0.35)', colors.bg]}
            locations={[0, 0.65, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.heroGradient}
          />
          <View style={s.heroBottom}>
            <Text style={s.heroName}>{runner.name}</Text>
            <View style={s.heroMeta}>
              <View style={s.paceBadge}>
                <FontAwesome5 name="bolt" size={10} color={colors.bg} />
                <Text style={s.paceBadgeText}>
                  {formatPace(runner.pace)}/mi
                </Text>
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
              <View>
                <NeighborhoodMap
                  neighborhood={runner.neighborhood ?? ''}
                  height={180}
                />
                <LinearGradient
                  colors={['transparent', colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={s.mapGradient}
                />
              </View>
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

          {/* Contact — only for accepted connections */}
          {connectionStatus === 'accepted' && runner.instagram ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Coordinate</Text>
              <View style={s.contactRow}>
                <FontAwesome5 name="instagram" size={18} color="#E1306C" />
                <Text style={s.contactText}>@{runner.instagram}</Text>
              </View>
            </View>
          ) : null}

          <View style={s.safetyRow}>
            <FontAwesome5
              name="shield-alt"
              size={13}
              color={colors.textTertiary}
            />
            <Text style={s.safetyText}>
              Choose a public route and let someone know where you're going.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, left: 16 }}
      >
        <GlassIconButton
          systemName="chevron.left"
          onPress={() => router.back()}
        />
      </View>

      {!isOwnProfile ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          {errorMessage ? <Text style={s.errorMsg}>{errorMessage}</Text> : null}
          <TouchableOpacity
            style={[
              s.ctaBtn,
              !cta.accent && s.ctaBtnMuted,
              (isActing || cta.disabled) && { opacity: 0.6 },
            ]}
            onPress={handleAction}
            disabled={isActing || cta.disabled}
            activeOpacity={0.85}
          >
            {isActing ? (
              <Host matchContents>
                <ProgressView
                  modifiers={[
                    progressViewStyle('circular'),
                    tint(cta.accent ? colors.bg : colors.textPrimary),
                  ]}
                />
              </Host>
            ) : (
              <>
                <FontAwesome5
                  name={cta.icon as any}
                  size={16}
                  color={cta.accent ? colors.bg : colors.textPrimary}
                />
                <Text style={[s.ctaText, !cta.accent && s.ctaTextMuted]}>
                  {cta.label}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    minHeight: 420,
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
  heroGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  mapGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
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

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  safetyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 8,
  },
  ctaBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaBtnMuted: {
    backgroundColor: colors.elevated,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: -0.2,
  },
  ctaTextMuted: {
    color: colors.textPrimary,
  },
  errorMsg: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
})

export default RunnerDetailScreen
