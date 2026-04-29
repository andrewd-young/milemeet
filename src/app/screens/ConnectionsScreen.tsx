import React, { useCallback, useState } from 'react'

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

import ConnectionCard from '../../components/ConnectionCard'
import { useMyRunner } from '../../context/MyRunnerContext'
import { supabase } from '../../lib/api/supabase'
import type { Tables } from '../../types/supabase'
import { useConnections } from '../context/ConnectionsContext'
import { globalStyles } from '../styles'
import { colors } from '../theme'

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
  data: SectionItem[]
}

const ConnectionsScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { myRunner } = useMyRunner()
  const { refreshPendingCount } = useConnections()

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
  const [accepted, setAccepted] = useState<AcceptedConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      if (!myRunner) {
        setPendingRequests([])
        setSentRequests([])
        setAccepted([])
        return
      }

      const me = myRunner

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
  }, [myRunner])

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [fetchData]),
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

  const renderRequestRow = (req: PendingRequest) => (
    <ConnectionCard
      runner={req.requester}
      variant="request"
      busy={actingId === req.id}
      onAccept={() => handleAccept(req)}
      onDecline={() => handleDecline(req)}
    />
  )

  const renderSentRow = (req: SentRequest) => (
    <ConnectionCard
      runner={req.partner}
      variant="sent"
      busy={actingId === req.id}
      onCancel={() => handleCancelSent(req)}
    />
  )

  const renderConnectionRow = (conn: AcceptedConnection) => (
    <ConnectionCard
      runner={conn.partner}
      variant="connection"
      onPress={() => router.push(`/connected-runner/${conn.partner.id}`)}
    />
  )

  const renderItem = ({ item }: { item: SectionItem }) => {
    if (item.type === 'request') return renderRequestRow(item.payload)
    if (item.type === 'sent') return renderSentRow(item.payload)
    return renderConnectionRow(item.payload)
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
          data: sentRequests.map(r => ({
            type: 'sent' as const,
            payload: r,
          })),
        }
      : null,
    accepted.length
      ? {
          key: 'connections',
          title: 'CONNECTIONS',
          count: accepted.length,
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
    gap: 2,
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
