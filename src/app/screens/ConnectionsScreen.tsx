import React, { useCallback, useEffect, useState } from 'react'

import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { LinearGradient } from 'expo-linear-gradient'
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

const formatPace = (pace: number) => {
  const m = Math.floor(pace)
  const sec = Math.round((pace - m) * 60)
  return `${m}:${sec.toString().padStart(2, '0')}/mi`
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

  const renderRequestCard = (req: PendingRequest) => (
    <View style={[s.card, s.requestCardBorder]}>
      <FontAwesome5
        name="running"
        size={220}
        color={colors.accent}
        style={s.cardWatermark}
      />
      <LinearGradient
        colors={['transparent', `${colors.accent}18`, colors.bg]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.cardContent}>
        <View style={s.requestBadge}>
          <FontAwesome5 name="running" size={10} color={colors.accent} />
          <Text style={s.requestBadgeText}>RUN REQUEST</Text>
        </View>
        <View style={s.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardName}>{req.requester.name}</Text>
            {req.requester.neighborhood ? (
              <View style={s.locationRow}>
                <FontAwesome5
                  name="map-marker-alt"
                  size={11}
                  color={colors.textSecondary}
                />
                <Text style={s.locationText}>{req.requester.neighborhood}</Text>
              </View>
            ) : null}
          </View>
          <View style={s.paceBadge}>
            <FontAwesome5 name="bolt" size={9} color={colors.bg} />
            <Text style={s.paceBadgeText}>
              {formatPace(req.requester.pace)}
            </Text>
          </View>
        </View>
        <Text style={s.distanceText}>
          {req.requester.distance_min}–{req.requester.distance_max}{' '}
          <Text style={s.distanceUnit}>mi range</Text>
        </Text>
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
    </View>
  )

  const renderSentCard = (req: SentRequest) => (
    <View style={[s.card, s.sentCardDim]}>
      <FontAwesome5
        name="running"
        size={220}
        color={colors.textTertiary}
        style={s.cardWatermark}
      />
      <LinearGradient
        colors={['transparent', 'rgba(13,13,13,0.55)', colors.bg]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.cardContent}>
        <View style={s.pendingBadge}>
          <Text style={s.pendingBadgeText}>Pending</Text>
        </View>
        <View style={s.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardName}>{req.partner.name}</Text>
            {req.partner.neighborhood ? (
              <View style={s.locationRow}>
                <FontAwesome5
                  name="map-marker-alt"
                  size={11}
                  color={colors.textSecondary}
                />
                <Text style={s.locationText}>{req.partner.neighborhood}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={s.distanceText}>
          {req.partner.distance_min}–{req.partner.distance_max}{' '}
          <Text style={s.distanceUnit}>mi range</Text>
        </Text>
        <TouchableOpacity
          style={s.cancelBar}
          onPress={() => handleCancelSent(req)}
          disabled={actingId === req.id}
          activeOpacity={0.7}
        >
          <Text style={s.cancelBtnText}>Cancel request</Text>
        </TouchableOpacity>
      </View>
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
        style={s.card}
        onPress={() => router.push(`/connected-runner/${partner.id}`)}
        activeOpacity={0.85}
      >
        <FontAwesome5
          name="running"
          size={220}
          color={colors.accent}
          style={s.cardWatermark}
        />
        <LinearGradient
          colors={['transparent', 'rgba(13,13,13,0.7)', colors.bg]}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.cardContent}>
          <View style={s.connectedBadge}>
            <FontAwesome5 name="users" size={10} color={colors.accent} />
            <Text style={s.connectedBadgeText}>Connected</Text>
          </View>
          <View style={s.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardName}>{partner.name}</Text>
              {partner.neighborhood ? (
                <View style={s.locationRow}>
                  <FontAwesome5
                    name="map-marker-alt"
                    size={11}
                    color={colors.textSecondary}
                  />
                  <Text style={s.locationText}>{partner.neighborhood}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.paceBadge}>
              <FontAwesome5 name="bolt" size={9} color={colors.bg} />
              <Text style={s.paceBadgeText}>{formatPace(partner.pace)}</Text>
            </View>
          </View>
          <Text style={s.distanceText}>
            {partner.distance_min}–{partner.distance_max}{' '}
            <Text style={s.distanceUnit}>mi range</Text>
          </Text>
          {scheduleChips.length > 0 ? (
            <View style={s.chipsRow}>
              {scheduleChips.slice(0, 5).map(chip => (
                <View key={chip} style={s.chip}>
                  <Text style={s.chipText}>{chip}</Text>
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
          <View style={s.ctaBar}>
            <FontAwesome5 name="running" size={15} color={colors.bg} />
            <Text style={s.ctaBarText}>View Profile</Text>
          </View>
        </View>
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
      <Text style={[globalStyles.sectionTitle, { marginBottom: 0 }]}>
        {section.title}
      </Text>
      <View style={globalStyles.countPillAccent}>
        <Text style={globalStyles.countPillTextAccent}>{section.count}</Text>
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
      keyExtractor={item => item.payload.id}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    minHeight: 280,
    marginBottom: 14,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestCardBorder: {
    borderColor: colors.accent + '33',
  },
  sentCardDim: {
    opacity: 0.8,
  },
  cardWatermark: {
    position: 'absolute',
    right: -24,
    top: -16,
    opacity: 0.07,
  },
  cardContent: {
    padding: 18,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  paceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 11,
    marginTop: 2,
  },
  paceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: -0.2,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  distanceUnit: {
    fontWeight: '400',
    color: colors.textSecondary,
  },
  requestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent + '20',
    borderRadius: radii.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  requestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
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
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radii.full,
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
  cancelBar: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: colors.elevated,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  instagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instagramText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 13,
    marginTop: 4,
  },
  ctaBarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: -0.2,
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
