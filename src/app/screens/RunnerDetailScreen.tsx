import React, { useEffect, useState } from 'react'

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { FontAwesome5 } from '@expo/vector-icons'

import { supabase } from '../../lib/api/supabase'
import type { RootStackParamList } from '../../types/navigation'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'
import { colors, radii } from '../theme'

type Runner = Tables<'runners'>
type Connection = Tables<'run_connections'>

type RunnerDetailRoute = RouteProp<RootStackParamList, 'RunnerDetail'>
type RunnerDetailNav = NativeStackNavigationProp<RootStackParamList, 'RunnerDetail'>

const RunnerDetailScreen = () => {
  const route = useRoute<RunnerDetailRoute>()
  const navigation = useNavigation<RunnerDetailNav>()
  const { runnerId } = route.params

  const [runner, setRunner] = useState<Runner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPlanning, setIsPlanning] = useState(false)
  const [planMessage, setPlanMessage] = useState<string | null>(null)

  useEffect(() => {
    loadRunner()
  }, [runnerId])

  const loadRunner = async () => {
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
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlanRun = async () => {
    if (!runner) return
    setIsPlanning(true)
    setPlanMessage(null)
    setErrorMessage(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      const userId = authData.user?.id
      if (!userId) throw new Error('Sign in to plan a run.')

      const { data: me, error: meError } = await supabase
        .from('runners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (meError) throw meError
      if (!me) throw new Error('Finish onboarding so we can match runs.')

      const payload: Omit<Connection, 'id'> = {
        owner_runner_id: me.id,
        partner_runner_id: runner.id,
        status: 'planned',
        note: null,
        next_run_at: null,
        inserted_at: null,
        updated_at: null,
      }

      const { error } = await supabase.from('run_connections').insert({
        owner_runner_id: payload.owner_runner_id,
        partner_runner_id: payload.partner_runner_id,
        status: payload.status,
        note: payload.note,
        next_run_at: payload.next_run_at,
      })

      if (error) throw error
      setPlanMessage('Saved to your running circle.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not plan this run',
      )
    } finally {
      setIsPlanning(false)
    }
  }

  if (isLoading) {
    return (
      <View style={globalStyles.containerCentered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[globalStyles.subtitle, { marginTop: 16 }]}>
          Loading runner…
        </Text>
      </View>
    )
  }

  if (errorMessage && !runner) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.subtitle}>{errorMessage}</Text>
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

  const formatPace = (pace: number) => {
    const m = Math.floor(pace)
    const sec = Math.round((pace - m) * 60)
    return `${m}:${sec.toString().padStart(2, '0')}/mi`
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
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
            <Text style={s.bodyText}>
              {runner.bio || runner.goals}
            </Text>
          </View>
        ) : null}

        {/* Schedule */}
        {(runner.run_days?.length || runner.run_times?.length) ? (
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

      {/* Fixed CTA */}
      <View style={s.footer}>
        {planMessage ? (
          <Text style={s.successMessage}>{planMessage}</Text>
        ) : null}
        {errorMessage ? (
          <Text style={s.errorMessage}>{errorMessage}</Text>
        ) : null}
        <TouchableOpacity
          style={[s.ctaButton, (isPlanning || !!planMessage) && s.ctaButtonDim]}
          onPress={handlePlanRun}
          disabled={isPlanning || !!planMessage}
          activeOpacity={0.85}
        >
          {isPlanning ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <>
              <FontAwesome5 name="running" size={18} color={colors.bg} />
              <Text style={s.ctaText}>
                {planMessage ? 'Saved to Circle' : 'Save to Running Circle'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 8,
  },
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.xl,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaButtonDim: {
    opacity: 0.6,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: -0.2,
  },
  successMessage: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
})

export default RunnerDetailScreen
