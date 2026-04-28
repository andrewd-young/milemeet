import React, { useCallback, useEffect, useState } from 'react'

import {
  SectionList,
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

type SectionItem =
  | { type: 'request'; payload: PendingRequest }
  | { type: 'sent'; payload: SentRequest }
  | { type: 'connection'; payload: AcceptedConnection }

type Section = {
  key: string
  title: string
  count: number
  isAccent: boolean
  data: SectionItem[]
}

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

  const renderRequestCard = (req: PendingRequest) => (
    <View style={s.requestCard}>
      <View style={s.cardHeader}>
        <View style={globalStyles.runnerAvatarRinged}>
          <FontAwesome5 name="running" size={20} color={colors.accent} />
        </View>
        <View style={globalStyles.runnerHeaderText}>
          <Text style={globalStyles.runnerName}>{req.requester.name}</Text>
          <Text style={globalStyles.runnerNeighborhood}>
            {req.requester.neighborhood}
          </Text>
        </View>
      </View>

      <View style={s.statsBar}>
        <View style={s.statItem}>
          <Text style={s.statLabel}>PACE</Text>
          <Text style={s.statValueAccent}>
            {formatPace(req.requester.pace)}
          </Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statLabel}>DISTANCE</Text>
          <Text style={s.statValue}>
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
          <FontAwesome5 name="check" size={13} color={colors.bg} />
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
  )

  const renderSentCard = (req: SentRequest) => (
    <View style={[globalStyles.runnerCard, s.sentCard]}>
      <View style={s.cardHeader}>
        <View style={s.avatarMuted}>
          <FontAwesome5 name="running" size={18} color={colors.textSecondary} />
        </View>
        <View style={globalStyles.runnerHeaderText}>
          <Text style={globalStyles.runnerName}>{req.partner.name}</Text>
          <Text style={globalStyles.runnerNeighborhood}>
            {req.partner.neighborhood}
          </Text>
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
  )

  const renderConnectionCard = (conn: AcceptedConnection) => {
    const partner = conn.partner
    const scheduleChips = [
      ...(partner.run_days ?? []),
      ...(partner.run_times ?? []),
    ]

    return (
      <TouchableOpacity
        style={s.connectionCard}
        onPress={() => router.push(`/connected-runner/${partner.id}`)}
        activeOpacity={0.85}
      >
        <View style={s.cardHeader}>
          <View style={globalStyles.runnerAvatarRinged}>
            <FontAwesome5 name="running" size={20} color={colors.accent} />
          </View>
          <View style={globalStyles.runnerHeaderText}>
            <Text style={globalStyles.runnerName}>{partner.name}</Text>
            <Text style={globalStyles.runnerNeighborhood}>
              {partner.neighborhood}
            </Text>
          </View>
          <View style={s.connectedBadge}>
            <FontAwesome5 name="users" size={10} color={colors.accent} />
            <Text style={s.connectedBadgeText}>Connected</Text>
          </View>
        </View>

        <View style={s.statsBar}>
          <View style={s.statItem}>
            <Text style={s.statLabel}>PACE</Text>
            <Text style={s.statValueAccent}>{formatPace(partner.pace)}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statLabel}>DISTANCE</Text>
            <Text style={s.statValue}>
              {partner.distance_min}–{partner.distance_max} mi
            </Text>
          </View>
        </View>

        {scheduleChips.length > 0 ? (
          <View style={globalStyles.runnerMetaRow}>
            {scheduleChips.map(chip => (
              <View key={chip} style={globalStyles.runnerChip}>
                <Text style={globalStyles.runnerChipText}>{chip}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {partner.instagram ? (
          <View style={s.instagramRow}>
            <FontAwesome5 name="instagram" size={13} color="#E1306C" />
            <Text style={s.instagramText}>{partner.instagram}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    )
  }

  const renderItem = ({ item }: { item: SectionItem }) => {
    if (item.type === 'request') return renderRequestCard(item.payload)
    if (item.type === 'sent') return renderSentCard(item.payload)
    return renderConnectionCard(item.payload)
  }

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={globalStyles.sectionRow}>
      <Text style={globalStyles.sectionTitle}>{section.title}</Text>
      <View
        style={
          section.isAccent
            ? globalStyles.countPillAccent
            : globalStyles.countPill
        }
      >
        <Text
          style={
            section.isAccent
              ? globalStyles.countPillTextAccent
              : globalStyles.countPillText
          }
        >
          {section.count}
        </Text>
      </View>
    </View>
  )

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
        <Text style={[globalStyles.subtitle, { textAlign: 'center' }]}>
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

  const sections: Section[] = [
    pendingRequests.length
      ? {
          key: 'requests',
          title: 'REQUESTS',
          count: pendingRequests.length,
          isAccent: true,
          data: pendingRequests.map(r => ({
            type: 'request' as const,
            payload: r,
          })),
        }
      : null,
    sentRequests.length
      ? {
          key: 'sent',
          title: 'SENT',
          count: sentRequests.length,
          isAccent: false,
          data: sentRequests.map(r => ({ type: 'sent' as const, payload: r })),
        }
      : null,
    accepted.length
      ? {
          key: 'connections',
          title: 'CONNECTIONS',
          count: accepted.length,
          isAccent: false,
          data: accepted.map(r => ({
            type: 'connection' as const,
            payload: r,
          })),
        }
      : null,
  ].filter(Boolean) as Section[]

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        s.listContent,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 90 },
      ]}
      sections={sections}
      keyExtractor={item =>
        item.type === 'request'
          ? item.payload.id
          : item.type === 'sent'
            ? item.payload.id
            : item.payload.id
      }
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={
        <Text style={[globalStyles.title, { marginBottom: 4 }]}>
          Your Running Circle
        </Text>
      }
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  )
}

const s = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    gap: 10,
  },
  sentCard: {
    opacity: 0.8,
    gap: 10,
  },
  connectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  avatarMuted: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.elevated,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statValueAccent: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
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
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent + '18',
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  connectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
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
