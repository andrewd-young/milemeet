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
import RunnerActivityCard from '../../components/RunnerActivityCard'
import RunnerHero from '../../components/RunnerHero'
import { useMyRunner } from '../../context/MyRunnerContext'
import { supabase } from '../../lib/api/supabase'
import { formatPace } from '../../lib/helpers/formatters'
import { isGoalMatch } from '../../lib/helpers/matchHelpers'
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

  const { myRunner } = useMyRunner()
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
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .eq('id', runnerId)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Runner not found')
      setRunner(data)

      if (!myRunner) return

      const { data: conn } = await supabase
        .from('run_connections')
        .select('*')
        .or(
          `and(owner_runner_id.eq.${myRunner.id},partner_runner_id.eq.${runnerId}),` +
            `and(owner_runner_id.eq.${runnerId},partner_runner_id.eq.${myRunner.id})`,
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

  const openLinkedIn = (url: string) => {
    Linking.openURL(url.startsWith('http') ? url : `https://${url}`)
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

  const myDays = new Set(myRunner?.run_days ?? [])
  const myTimes = new Set(myRunner?.run_times ?? [])
  const scheduleChipMatch = (chip: string) =>
    myDays.has(chip) || myTimes.has(chip)

  const connectedBadge = (
    <View style={s.connectedBadge}>
      <FontAwesome5 name="users" size={10} color={colors.accent} />
      <Text style={s.connectedBadgeText}>Connected</Text>
    </View>
  )

  const activityStats = [
    { label: 'PACE', value: `${formatPace(runner.pace)}/mi`, accent: true },
    {
      label: 'DISTANCE',
      value: `${runner.distance_min}–${runner.distance_max} mi`,
    },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <RunnerHero
          runner={runner}
          myRunner={myRunner ?? undefined}
          badge={connectedBadge}
          paddingTop={insets.top + 64}
          minHeight={320}
        />

        <View style={s.content}>
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
                <View
                  style={[
                    s.messageIconWrap,
                    { backgroundColor: colors.instagram },
                  ]}
                >
                  <FontAwesome5
                    name="instagram"
                    size={18}
                    color={colors.textPrimary}
                  />
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

            {runner.linkedin ? (
              <TouchableOpacity
                style={s.messageButton}
                onPress={() => openLinkedIn(runner.linkedin!)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    s.messageIconWrap,
                    { backgroundColor: colors.linkedin },
                  ]}
                >
                  <FontAwesome5
                    name="linkedin"
                    size={18}
                    color={colors.textPrimary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.messageTitle}>View on LinkedIn</Text>
                  <Text style={s.messageHandle}>{runner.linkedin}</Text>
                </View>
                <FontAwesome5
                  name="chevron-right"
                  size={12}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <RunnerActivityCard
            runner={runner}
            stats={activityStats}
            mapHeight={160}
          />

          {scheduleChips.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>SCHEDULE</Text>
              <View style={s.chipsWrap}>
                {scheduleChips.map(chip => {
                  const matched = !!myRunner && scheduleChipMatch(chip)
                  return (
                    <View key={chip} style={[s.chip, matched && s.chipMatchBg]}>
                      <Text style={[s.chipText, matched && s.chipTextMatch]}>
                        {chip}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          ) : null}

          {runner.bio ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>ABOUT</Text>
              <Text style={s.bodyText}>{runner.bio}</Text>
            </View>
          ) : null}

          {goalChips.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>GOALS</Text>
              <View style={s.chipsWrap}>
                {goalChips.map(goal => {
                  const matched = !!myRunner && isGoalMatch(myRunner, goal)
                  return (
                    <View key={goal} style={[s.chip, matched && s.chipMatchBg]}>
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
              <Text style={s.sectionLabel}>RACES & CLUBS</Text>
              <View style={s.chipsWrap}>
                {racesAndClubs.map(tag => (
                  <View key={tag} style={s.chip}>
                    <Text style={s.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
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
  content: {
    padding: 20,
    gap: 12,
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
    borderColor: colors.instagram + '33',
  },
  messageIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  chipMatchBg: {
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
