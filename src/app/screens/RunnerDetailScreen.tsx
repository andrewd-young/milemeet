import React, { useEffect, useState } from 'react'

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useLocalSearchParams, useRouter } from 'expo-router'

import { Host, ProgressView } from '@expo/ui/swift-ui'
import { progressViewStyle, tint } from '@expo/ui/swift-ui/modifiers'
import { FontAwesome5 } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GlassIconButton from '../../components/GlassIconButton'
import RunnerActivityCard from '../../components/RunnerActivityCard'
import RunnerHero from '../../components/RunnerHero'
import { useMyRunner } from '../../context/MyRunnerContext'
import { supabase } from '../../lib/api/supabase'
import { buildScheduleChips } from '../../lib/helpers/formatters'
import {
  isGoalMatch,
  isScheduleChipMatch,
} from '../../lib/helpers/matchHelpers'
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

const RunnerDetailScreen = () => {
  const { id: runnerId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { myRunner } = useMyRunner()
  const [runner, setRunner] = useState<Runner | null>(null)
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
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .eq('id', runnerId)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Runner not found')
      setRunner(data)

      if (!myRunner || myRunner.id === runnerId) return

      const { data: conn } = await supabase
        .from('run_connections')
        .select('*')
        .or(
          `and(owner_runner_id.eq.${myRunner.id},partner_runner_id.eq.${runnerId}),` +
            `and(owner_runner_id.eq.${runnerId},partner_runner_id.eq.${myRunner.id})`,
        )
        .maybeSingle()

      setConnection(conn ?? null)
      setConnectionStatus(deriveStatus(conn ?? null, myRunner.id))
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
    if (conn.status === 'pending')
      return conn.owner_runner_id === myId ? 'pending_sent' : 'pending_received'
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
        contentContainerStyle={{ paddingBottom: isOwnProfile ? 40 : 120 }}
      >
        <RunnerHero
          runner={runner}
          myRunner={isOwnProfile ? undefined : (myRunner ?? undefined)}
          paddingTop={insets.top + 16}
          minHeight={360}
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
                {scheduleChips.map((chip, i) => {
                  const matched =
                    !isOwnProfile &&
                    !!myRunner &&
                    isScheduleChipMatch(myRunner, chip.day, chip.time)
                  return (
                    <View key={i} style={[s.chip, matched && s.chipMatch]}>
                      {chip.icon ? (
                        <FontAwesome5
                          name={chip.icon as any}
                          size={12}
                          color={matched ? colors.accentDim : colors.accent}
                          solid
                        />
                      ) : null}
                      <Text style={[s.chipText, matched && s.chipTextMatch]}>
                        {chip.label}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          ) : null}

          {goalChips.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Goals</Text>
              <View style={s.chipsRow}>
                {goalChips.map(goal => {
                  const matched =
                    !isOwnProfile && !!myRunner && isGoalMatch(myRunner, goal)
                  return (
                    <View key={goal} style={[s.chip, matched && s.chipMatch]}>
                      <Text style={[s.chipText, matched && s.chipTextMatch]}>
                        {goal}
                      </Text>
                    </View>
                  )
                })}
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

          {connectionStatus === 'accepted' && runner.instagram ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Coordinate</Text>
              <View style={s.contactRow}>
                <FontAwesome5
                  name="instagram"
                  size={18}
                  color={colors.instagram}
                />
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipMatch: {
    backgroundColor: colors.accentSubtle,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  chipTextMatch: {
    color: colors.accentDim,
    fontWeight: '700',
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
