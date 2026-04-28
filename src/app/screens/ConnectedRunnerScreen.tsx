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

import { LinearGradient } from 'expo-linear-gradient'
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

const formatPace = (pace: number) => {
  const m = Math.floor(pace)
  const sec = Math.round((pace - m) * 60)
  return `${m}:${sec.toString().padStart(2, '0')}/mi`
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

  const scheduleChips = [
    ...(runner.run_days ?? []),
    ...(runner.run_times ?? []),
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero — full-bleed, same language as NearbyRunnerCard */}
        <View style={s.heroCard}>
          <FontAwesome5
            name="running"
            size={220}
            color={colors.accent}
            style={s.heroWatermark}
          />
          <LinearGradient
            colors={['transparent', 'rgba(13,13,13,0.7)', colors.bg]}
            locations={[0, 0.4, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[s.heroContent, { paddingTop: insets.top + 64 }]}>
            <View style={s.connectedBadge}>
              <FontAwesome5 name="users" size={10} color={colors.accent} />
              <Text style={s.connectedBadgeText}>Connected</Text>
            </View>
            <Text style={s.heroName}>{runner.name}</Text>
            <View style={s.heroMeta}>
              <View style={s.paceBadge}>
                <FontAwesome5 name="bolt" size={9} color={colors.bg} />
                <Text style={s.paceBadgeText}>{formatPace(runner.pace)}</Text>
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
          {/* Coordinate — messages cue */}
          <View style={s.coordinateCard}>
            <View style={s.coordinateHeader}>
              <FontAwesome5
                name="paper-plane"
                size={13}
                color={colors.accent}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.coordinateTitle}>Coordinate a run</Text>
                <Text style={s.coordinateSubtitle}>
                  Reach out to plan your next run together
                </Text>
              </View>
            </View>

            {runner.instagram ? (
              <TouchableOpacity
                style={s.messageButton}
                onPress={() => openInstagram(runner.instagram!)}
                activeOpacity={0.8}
              >
                <View style={s.messageIconWrap}>
                  <FontAwesome5 name="instagram" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.messageTitle}>Message on Instagram</Text>
                  <Text style={s.messageHandle}>
                    {runner.instagram.startsWith('@')
                      ? runner.instagram
                      : `@${runner.instagram}`}
                  </Text>
                </View>
                <FontAwesome5
                  name="chevron-right"
                  size={12}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            ) : (
              <View style={s.noContactRow}>
                <FontAwesome5
                  name="comment-slash"
                  size={14}
                  color={colors.textTertiary}
                />
                <Text style={s.noContactText}>
                  {runner.name.split(' ')[0]} hasn't added Instagram yet.
                </Text>
              </View>
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

          {/* Schedule */}
          {scheduleChips.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>SCHEDULE</Text>
              <View style={s.chipsWrap}>
                {scheduleChips.map(chip => (
                  <View key={chip} style={s.chip}>
                    <Text style={s.chipText}>{chip}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* About */}
          {runner.bio ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>ABOUT</Text>
              <Text style={s.bodyText}>{runner.bio}</Text>
            </View>
          ) : null}

          {/* Goals */}
          {runner.goals ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>GOALS</Text>
              <Text style={s.bodyText}>{runner.goals}</Text>
            </View>
          ) : null}

          <View style={s.safetyNote}>
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
  heroCard: {
    backgroundColor: colors.surface,
    minHeight: 320,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroWatermark: {
    position: 'absolute',
    right: -24,
    top: -16,
    opacity: 0.07,
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
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
  heroName: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1,
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
    paddingHorizontal: 11,
  },
  paceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: -0.2,
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
    padding: 20,
    gap: 12,
    paddingBottom: 60,
  },

  coordinateCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.accent + '40',
    padding: 16,
    gap: 14,
  },
  coordinateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  coordinateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  coordinateSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  messageButton: {
    backgroundColor: colors.elevated,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E1306C33',
  },
  messageIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E1306C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  messageHandle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  noContactText: {
    flex: 1,
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
  chip: {
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
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
