import React, { useEffect, useState } from 'react'

import {
  ActionSheetIOS,
  Alert,
  Linking,
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

const ConnectedRunnerScreen = () => {
  const { id: runnerId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [runner, setRunner] = useState<Runner | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    load()
  }, [runnerId])

  const load = async () => {
    setIsLoading(true)
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
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!me) return

      const { data: conn } = await supabase
        .from('run_connections')
        .select('*')
        .or(
          `and(owner_runner_id.eq.${me.id},partner_runner_id.eq.${runnerId}),` +
            `and(owner_runner_id.eq.${runnerId},partner_runner_id.eq.${me.id})`,
        )
        .eq('status', 'accepted')
        .maybeSingle()

      setConnection(conn ?? null)
    } catch (error) {
      if (__DEV__) console.error('[ConnectedRunner] load error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openInstagram = async (handle: string) => {
    const username = handle.replace('@', '')
    const appUrl = `instagram://user?username=${username}`
    const webUrl = `https://instagram.com/${username}`
    const canOpen = await Linking.canOpenURL(appUrl)
    Linking.openURL(canOpen ? appUrl : webUrl)
  }

  const handleMenu = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Remove Connection'],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      async buttonIndex => {
        if (buttonIndex === 1) confirmRemove()
      },
    )
  }

  const confirmRemove = () => {
    Alert.alert(
      'Remove Connection',
      `Remove ${runner?.name ?? 'this runner'} from your running circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: removeConnection },
      ],
    )
  }

  const removeConnection = async () => {
    if (!connection) return
    setIsRemoving(true)
    try {
      const { error } = await supabase
        .from('run_connections')
        .delete()
        .eq('id', connection.id)

      if (error) throw error
      router.back()
    } catch (error) {
      if (__DEV__) console.error('[ConnectedRunner] remove error:', error)
      Alert.alert('Error', extractMessage(error))
    } finally {
      setIsRemoving(false)
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
      </View>
    )
  }

  if (!runner) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.subtitle}>Runner not found.</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: insets.top + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={s.header}>
          <View style={s.avatar}>
            <FontAwesome5 name="running" size={36} color={colors.accent} />
          </View>
          <Text style={s.name}>{runner.name}</Text>
          <View style={s.locationRow}>
            <FontAwesome5
              name="map-marker-alt"
              size={12}
              color={colors.textSecondary}
            />
            <Text style={s.locationText}>{runner.neighborhood}</Text>
          </View>
        </View>

        {/* Coordinate card — prominent */}
        <View style={s.coordinateCard}>
          <View style={s.coordinateHeader}>
            <FontAwesome5 name="users" size={14} color={colors.accent} />
            <Text style={s.coordinateTitle}>You're connected</Text>
          </View>
          {runner.instagram ? (
            <TouchableOpacity
              style={s.instagramButton}
              onPress={() => openInstagram(runner.instagram!)}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="instagram" size={18} color="#fff" />
              <View>
                <Text style={s.instagramButtonLabel}>Message on Instagram</Text>
                <Text style={s.instagramButtonHandle}>
                  {runner.instagram.startsWith('@')
                    ? runner.instagram
                    : `@${runner.instagram}`}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={s.noContactText}>
              {runner.name.split(' ')[0]} hasn't added Instagram yet.
            </Text>
          )}
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

        {/* About / Goals */}
        {runner.bio || runner.goals ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>ABOUT</Text>
            <Text style={s.bodyText}>{runner.bio || runner.goals}</Text>
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

        {/* Goals (if bio was shown above) */}
        {runner.bio && runner.goals ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>GOALS</Text>
            <Text style={s.bodyText}>{runner.goals}</Text>
          </View>
        ) : null}

        {/* Safety note */}
        <View style={s.safetyNote}>
          <FontAwesome5
            name="shield-alt"
            size={14}
            color={colors.textTertiary}
          />
          <Text style={s.safetyText}>
            Choose a public route and let someone know where you're going.
          </Text>
        </View>
      </ScrollView>

      {/* Back button */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, left: 16 }}
      >
        <GlassIconButton
          systemName="chevron.left"
          onPress={() => router.back()}
        />
      </View>

      {/* 3-dot menu */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, right: 16 }}
      >
        <GlassIconButton
          systemName="ellipsis"
          onPress={handleMenu}
          disabled={isRemoving}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    gap: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  name: {
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
  coordinateCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.accent + '55',
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  coordinateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordinateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.2,
  },
  instagramButton: {
    backgroundColor: '#E1306C',
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  instagramButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  instagramButtonHandle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  noContactText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic',
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
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  safetyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 18,
  },
})

export default ConnectedRunnerScreen
