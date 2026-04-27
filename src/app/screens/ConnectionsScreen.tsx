import React, { useCallback, useEffect, useState } from 'react'

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
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { supabase } from '../../lib/api/supabase'
import type { Tables } from '../../types/supabase'
import { useConnections } from '../context/ConnectionsContext'
import { globalStyles } from '../styles'
import { colors, radii } from '../theme'

type Runner = Tables<'runners'>
type Connection = Tables<'run_connections'>

type PendingRequest = Connection & { requester: Runner }
type SentRequest = Connection & { partner: Runner }
type AcceptedConnection = Connection & { partner: Runner }

const ConnectionsScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { refreshPendingCount } = useConnections()

  const [myRunner, setMyRunner] = useState<Runner | null>(null)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
  const [accepted, setAccepted] = useState<AcceptedConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id ?? null

      let me: Runner | null = null
      if (userId) {
        const { data } = await supabase
          .from('runners')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        me = data
      }
      if (!me) {
        const { data } = await supabase
          .from('runners')
          .select('*')
          .order('inserted_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        me = data
      }

      setMyRunner(me)
      if (!me) {
        setPendingRequests([])
        setAccepted([])
        return
      }

      const [pendingRes, sentPendingRes, sentAcceptedRes, receivedAcceptedRes] =
        await Promise.all([
          supabase
            .from('run_connections')
            .select(
              '*, requester:runners!run_connections_owner_runner_id_fkey(*)',
            )
            .eq('partner_runner_id', me.id)
            .eq('status', 'pending')
            .order('inserted_at', { ascending: false }),

          supabase
            .from('run_connections')
            .select(
              '*, partner:runners!run_connections_partner_runner_id_fkey(*)',
            )
            .eq('owner_runner_id', me.id)
            .eq('status', 'pending')
            .order('inserted_at', { ascending: false }),

          supabase
            .from('run_connections')
            .select(
              '*, partner:runners!run_connections_partner_runner_id_fkey(*)',
            )
            .eq('owner_runner_id', me.id)
            .eq('status', 'accepted')
            .order('inserted_at', { ascending: false }),

          supabase
            .from('run_connections')
            .select(
              '*, partner:runners!run_connections_owner_runner_id_fkey(*)',
            )
            .eq('partner_runner_id', me.id)
            .eq('status', 'accepted')
            .order('inserted_at', { ascending: false }),
        ])

      if (pendingRes.error) throw pendingRes.error
      if (sentPendingRes.error) throw sentPendingRes.error
      if (sentAcceptedRes.error) throw sentAcceptedRes.error
      if (receivedAcceptedRes.error) throw receivedAcceptedRes.error

      setPendingRequests((pendingRes.data as PendingRequest[]) ?? [])
      setSentRequests((sentPendingRes.data as SentRequest[]) ?? [])
      setAccepted([
        ...((sentAcceptedRes.data as AcceptedConnection[]) ?? []),
        ...((receivedAcceptedRes.data as AcceptedConnection[]) ?? []),
      ])
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not load connections',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, []),
  )

  const handleAccept = async (conn: PendingRequest) => {
    setActingId(conn.id)
    try {
      const { error } = await supabase
        .from('run_connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', conn.id)

      if (error) throw error
      await fetchData()
      refreshPendingCount()
    } catch {
      await fetchData()
    } finally {
      setActingId(null)
    }
  }

  const handleCancelSent = async (conn: SentRequest) => {
    setActingId(conn.id)
    try {
      const { error } = await supabase
        .from('run_connections')
        .delete()
        .eq('id', conn.id)

      if (error) throw error
      setSentRequests(prev => prev.filter(r => r.id !== conn.id))
    } catch {
      await fetchData()
    } finally {
      setActingId(null)
    }
  }

  const handleDecline = async (conn: PendingRequest) => {
    setActingId(conn.id)
    try {
      const { error } = await supabase
        .from('run_connections')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', conn.id)

      if (error) throw error
      setPendingRequests(prev => prev.filter(r => r.id !== conn.id))
      refreshPendingCount()
    } catch {
      await fetchData()
    } finally {
      setActingId(null)
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
          Loading your running circle…
        </Text>
      </View>
    )
  }

  if (errorMessage) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={[globalStyles.subtitle, { marginBottom: 16 }]}>
          {errorMessage}
        </Text>
        <TouchableOpacity
          onPress={fetchData}
          style={[globalStyles.inlineButton, globalStyles.inlineButtonSelected]}
        >
          <Text style={globalStyles.inlineButtonTextSelected}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!pendingRequests.length && !sentRequests.length && !accepted.length) {
    return (
      <View style={globalStyles.containerCentered}>
        <View style={s.emptyIcon}>
          <FontAwesome5 name="running" size={32} color={colors.accent} />
        </View>
        <Text style={globalStyles.title}>Your Running Circle</Text>
        <Text style={globalStyles.subtitle}>
          Find runners with compatible pace and schedule, then add them to your
          circle.
        </Text>
        <TouchableOpacity
          onPress={() => router.navigate('/(tabs)')}
          style={[globalStyles.inlineButton, globalStyles.inlineButtonSelected]}
        >
          <Text style={globalStyles.inlineButtonTextSelected}>
            Browse runners
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        s.scrollContent,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={globalStyles.title}>Your Running Circle</Text>

      {/* Pending requests section */}
      {pendingRequests.length > 0 ? (
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeader}>
            REQUESTS · {pendingRequests.length}
          </Text>
          {pendingRequests.map(req => (
            <View key={req.id} style={[s.card, s.requestCard]}>
              <View style={s.cardHeader}>
                <View style={s.avatar}>
                  <FontAwesome5
                    name="running"
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{req.requester.name}</Text>
                  <Text style={s.neighborhood}>
                    {req.requester.neighborhood}
                  </Text>
                </View>
              </View>

              <View style={s.chipsRow}>
                <View style={s.chip}>
                  <Text style={s.chipLabel}>PACE</Text>
                  <Text style={s.chipValue}>
                    {formatPace(req.requester.pace)}
                  </Text>
                </View>
                <View style={s.chip}>
                  <Text style={s.chipLabel}>DISTANCE</Text>
                  <Text style={s.chipValue}>
                    {req.requester.distance_min}–{req.requester.distance_max} mi
                  </Text>
                </View>
              </View>

              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[s.actionBtn, s.acceptBtn]}
                  onPress={() => handleAccept(req)}
                  disabled={actingId === req.id}
                  activeOpacity={0.8}
                >
                  <Text style={s.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, s.declineBtn]}
                  onPress={() => handleDecline(req)}
                  disabled={actingId === req.id}
                  activeOpacity={0.8}
                >
                  <Text style={s.declineBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Sent pending requests */}
      {sentRequests.length > 0 ? (
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeader}>SENT · {sentRequests.length}</Text>
          {sentRequests.map(req => (
            <View key={req.id} style={[s.card, s.sentCard]}>
              <View style={s.cardHeader}>
                <View style={s.avatar}>
                  <FontAwesome5
                    name="running"
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{req.partner.name}</Text>
                  <Text style={s.neighborhood}>{req.partner.neighborhood}</Text>
                </View>
                <View style={s.pendingBadge}>
                  <Text style={s.pendingBadgeText}>Pending</Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => handleCancelSent(req)}
                disabled={actingId === req.id}
                activeOpacity={0.7}
              >
                <Text style={s.cancelBtnText}>Cancel request</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {/* Accepted connections */}
      {accepted.length > 0 ? (
        <View style={s.sectionBlock}>
          <Text style={s.sectionHeader}>CONNECTIONS · {accepted.length}</Text>
          {accepted.map(conn => {
            const partner = conn.partner
            const daysLabel = partner.run_days?.length
              ? partner.run_days.join(' · ')
              : 'Flexible'
            const timesLabel = partner.run_times?.length
              ? partner.run_times.join(', ')
              : 'Any time'

            return (
              <TouchableOpacity
                key={conn.id}
                style={s.card}
                onPress={() => router.push(`/connected-runner/${partner.id}`)}
                activeOpacity={0.85}
              >
                <View style={s.cardHeader}>
                  <View style={s.avatar}>
                    <FontAwesome5
                      name="running"
                      size={18}
                      color={colors.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{partner.name}</Text>
                    <Text style={s.neighborhood}>{partner.neighborhood}</Text>
                  </View>
                  <View style={s.connectedBadge}>
                    <FontAwesome5
                      name="users"
                      size={10}
                      color={colors.accent}
                    />
                    <Text style={s.connectedBadgeText}>Connected</Text>
                  </View>
                </View>

                <View style={s.chipsRow}>
                  <View style={s.chip}>
                    <Text style={s.chipLabel}>PACE</Text>
                    <Text style={s.chipValue}>{formatPace(partner.pace)}</Text>
                  </View>
                  <View style={s.chip}>
                    <Text style={s.chipLabel}>DISTANCE</Text>
                    <Text style={s.chipValue}>
                      {partner.distance_min}–{partner.distance_max} mi
                    </Text>
                  </View>
                </View>

                <View style={s.pillsRow}>
                  <View style={s.pill}>
                    <Text style={s.pillLabel}>DAYS</Text>
                    <Text style={s.pillValue}>{daysLabel}</Text>
                  </View>
                  <View style={s.pill}>
                    <Text style={s.pillLabel}>TIME</Text>
                    <Text style={s.pillValue}>{timesLabel}</Text>
                  </View>
                </View>

                {partner.instagram ? (
                  <View style={s.instagramRow}>
                    <FontAwesome5 name="instagram" size={13} color="#E1306C" />
                    <Text style={s.instagramText}>{partner.instagram}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            )
          })}
        </View>
      ) : null}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    gap: 4,
  },
  sectionBlock: {
    marginTop: 16,
    gap: 10,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  requestCard: {
    borderColor: colors.accent + '44',
  },
  sentCard: {
    borderColor: colors.border,
    opacity: 0.85,
  },
  pendingBadge: {
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  neighborhood: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  connectedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 2,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  chipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  instagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  instagramText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: colors.accent,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.bg,
  },
  declineBtn: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
})

export default ConnectionsScreen
