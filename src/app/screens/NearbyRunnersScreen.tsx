import React, { useCallback, useMemo, useState } from 'react'

import {
  FlatList,
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

import NearbyRunnerCard from '../../components/NearbyRunnerCard'
import { useMyRunner } from '../../context/MyRunnerContext'
import { supabase } from '../../lib/api/supabase'
import { totalScore } from '../../lib/matching logic/matchScore'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'
import { colors, radii } from '../theme'

type Runner = Tables<'runners'>

type Filters = {
  myPace: boolean
  days: string[]
  times: string[]
  myNeighborhood: boolean
}

const DEFAULT_FILTERS: Filters = {
  myPace: false,
  days: [],
  times: [],
  myNeighborhood: false,
}

const hasActiveFilters = (f: Filters) =>
  f.myPace || f.days.length > 0 || f.times.length > 0 || f.myNeighborhood

const NearbyRunnersScreen = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { myRunner } = useMyRunner()
  const [runners, setRunners] = useState<Runner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  useFocusEffect(
    useCallback(() => {
      fetchRunners()
    }, [myRunner]),
  )

  const fetchRunners = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const excludeIds: string[] = []

      if (myRunner) {
        excludeIds.push(myRunner.id)

        const [ownerConns, partnerConns] = await Promise.all([
          supabase
            .from('run_connections')
            .select('partner_runner_id')
            .eq('owner_runner_id', myRunner.id),
          supabase
            .from('run_connections')
            .select('owner_runner_id')
            .eq('partner_runner_id', myRunner.id),
        ])

        ownerConns.data?.forEach(c => excludeIds.push(c.partner_runner_id))
        partnerConns.data?.forEach(c => excludeIds.push(c.owner_runner_id))
      }

      let query = supabase
        .from('runners')
        .select('*')
        .order('inserted_at', { ascending: false })
        .limit(100)

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`)
      }

      const { data, error } = await query
      if (error) throw error
      setRunners(data || [])
    } catch (error) {
      setErrorMessage(
        `Couldn't load nearby runners: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAndRanked = useMemo(() => {
    let list = [...runners]

    if (filters.myPace && myRunner) {
      list = list.filter(r => Math.abs(r.pace - myRunner.pace) <= 1.0)
    }

    if (filters.days.length > 0) {
      list = list.filter(r =>
        filters.days.some(d => (r.run_days ?? []).includes(d)),
      )
    }

    if (filters.times.length > 0) {
      list = list.filter(r =>
        filters.times.some(t => (r.run_times ?? []).includes(t)),
      )
    }

    if (filters.myNeighborhood && myRunner) {
      const myZones = new Set([
        myRunner.neighborhood,
        ...(myRunner.run_neighborhoods ?? []),
      ])
      list = list.filter(r =>
        [r.neighborhood, ...(r.run_neighborhoods ?? [])].some(z =>
          myZones.has(z),
        ),
      )
    }

    if (myRunner) {
      list.sort((a, b) => totalScore(myRunner, b) - totalScore(myRunner, a))
    }

    return list
  }, [runners, myRunner, filters])

  const toggleDay = (day: string) => {
    setFilters(f => ({
      ...f,
      days: f.days.includes(day)
        ? f.days.filter(d => d !== day)
        : [...f.days, day],
    }))
  }

  const toggleTime = (time: string) => {
    setFilters(f => ({
      ...f,
      times: f.times.includes(time)
        ? f.times.filter(t => t !== time)
        : [...f.times, time],
    }))
  }

  const renderRunner = ({ item }: { item: Runner }) => (
    <NearbyRunnerCard
      runner={item}
      onPress={() => router.push(`/runner/${item.id}`)}
      score={myRunner ? totalScore(myRunner, item) : undefined}
      myRunner={myRunner ?? undefined}
      activeFilterDays={filters.days}
      activeFilterTimes={filters.times}
    />
  )

  const FilterBar = () => (
    <View style={s.filterSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterScroll}
      >
        <TouchableOpacity
          style={[s.filterPill, filters.myPace && s.filterPillActive]}
          onPress={() => setFilters(f => ({ ...f, myPace: !f.myPace }))}
        >
          <Text
            style={[s.filterPillText, filters.myPace && s.filterPillTextActive]}
          >
            My Pace
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.filterPill, filters.myNeighborhood && s.filterPillActive]}
          onPress={() =>
            setFilters(f => ({ ...f, myNeighborhood: !f.myNeighborhood }))
          }
        >
          <Text
            style={[
              s.filterPillText,
              filters.myNeighborhood && s.filterPillTextActive,
            ]}
          >
            My Area
          </Text>
        </TouchableOpacity>

        {(myRunner?.run_days ?? []).length > 0 ? (
          <>
            <View style={s.filterDivider} />
            {(myRunner?.run_days ?? []).map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  s.filterPill,
                  filters.days.includes(day) && s.filterPillActive,
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text
                  style={[
                    s.filterPillText,
                    filters.days.includes(day) && s.filterPillTextActive,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}

        {(myRunner?.run_times ?? []).length > 0 ? (
          <>
            <View style={s.filterDivider} />
            {(myRunner?.run_times ?? []).map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  s.filterPill,
                  filters.times.includes(time) && s.filterPillActive,
                ]}
                onPress={() => toggleTime(time)}
              >
                <Text
                  style={[
                    s.filterPillText,
                    filters.times.includes(time) && s.filterPillTextActive,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}

        {hasActiveFilters(filters) ? (
          <>
            <View style={s.filterDivider} />
            <TouchableOpacity
              style={s.clearPill}
              onPress={() => setFilters(DEFAULT_FILTERS)}
            >
              <Text style={s.clearPillText}>Clear</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
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
          Finding runners near you…
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
          onPress={fetchRunners}
          style={[globalStyles.inlineButton, globalStyles.inlineButtonSelected]}
        >
          <Text style={globalStyles.inlineButtonTextSelected}>Try again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!runners.length) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.title}>No nearby runners yet</Text>
        <Text style={globalStyles.subtitle}>
          As more people join, you'll see runners who share your pace and routes
          here.
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={filteredAndRanked}
        keyExtractor={item => item.id}
        renderItem={renderRunner}
        contentContainerStyle={[
          s.listContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 90 },
        ]}
        ListHeaderComponent={
          <View>
            <View style={s.pageHeader}>
              <Text style={globalStyles.title}>Nearby Runners</Text>
              {myRunner?.neighborhood ? (
                <View style={s.locationBadge}>
                  <FontAwesome5
                    name="map-marker-alt"
                    size={10}
                    color={colors.accent}
                  />
                  <Text style={s.locationText}>{myRunner.neighborhood}</Text>
                </View>
              ) : null}
            </View>
            <FilterBar />
            {hasActiveFilters(filters) && filteredAndRanked.length === 0 ? (
              <View style={s.noResults}>
                <Text style={globalStyles.subtitle}>
                  No runners match these filters.
                </Text>
                <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
                  <Text style={s.clearLink}>Clear filters</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const s = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  filterSection: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radii.full,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.bg,
    fontWeight: '700',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  clearPill: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearPillText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  clearLink: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
})

export default NearbyRunnersScreen
