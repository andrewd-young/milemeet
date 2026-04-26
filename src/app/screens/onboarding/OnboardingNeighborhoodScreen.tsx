import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { RootStackParamList } from '../../../types/navigation'
import { useOnboarding } from '../../context/OnboardingContext'
import OnboardingLayout from '../../../components/OnboardingLayout'
import { NEIGHBORHOODS, CITY_SHORT, type Neighborhood } from '../../../data/neighborhoods'
import { colors, radii } from '../../theme'

export default function OnboardingNeighborhoodScreen() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Neighborhood[]>([])
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'OnboardingNeighborhood'>>()
  const { setNeighborhoods } = useOnboarding()

  const selectedKeys = new Set(selected.map(n => `${n.name}-${n.city}`))

  const suggestions =
    query.length > 0
      ? NEIGHBORHOODS.filter(
          n =>
            !selectedKeys.has(`${n.name}-${n.city}`) &&
            (n.name.toLowerCase().includes(query.toLowerCase()) ||
              n.city.toLowerCase().includes(query.toLowerCase())),
        ).slice(0, 2)
      : []

  const handleSelect = (n: Neighborhood) => {
    const next = [...selected, n]
    setSelected(next)
    setNeighborhoods(next.map(x => `${x.name}, ${x.city}`))
    setQuery('')
  }

  const handleRemove = (n: Neighborhood) => {
    const next = selected.filter(x => !(x.name === n.name && x.city === n.city))
    setSelected(next)
    setNeighborhoods(next.map(x => `${x.name}, ${x.city}`))
  }

  const handleNext = () => {
    if (selected.length === 0) return
    navigation.navigate('OnboardingPaceAndDistance')
  }

  return (
    <OnboardingLayout
      step={4}
      title="Where do you usually run?"
      subtitle="Add one or more neighborhoods — we'll find pace partners nearby."
      onNext={handleNext}
      nextDisabled={selected.length === 0}
    >
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search neighborhoods…"
        placeholderTextColor={colors.textTertiary}
        keyboardAppearance="dark"
        selectionColor={colors.accent}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="search"
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionList}>
          {suggestions.map((n, i) => (
            <TouchableOpacity
              key={`${n.name}-${n.city}`}
              style={[
                styles.suggestionRow,
                i < suggestions.length - 1 && styles.suggestionRowBorder,
              ]}
              onPress={() => handleSelect(n)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionName}>{n.name}</Text>
              <Text style={styles.cityBadge}>{CITY_SHORT[n.city]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selected.length > 0 && (
        <View style={styles.chipRow}>
          {selected.map(n => (
            <TouchableOpacity
              key={`${n.name}-${n.city}`}
              style={styles.chip}
              onPress={() => handleRemove(n)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{n.name}</Text>
              <Text style={styles.chipCity}>{CITY_SHORT[n.city]}</Text>
              <Ionicons name="close" size={13} color={colors.accent} style={styles.chipClose} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </OnboardingLayout>
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    height: 54,
    paddingHorizontal: 18,
    fontSize: 18,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionList: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  suggestionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  cityBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1C2010',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  chipCity: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  chipClose: {
    marginLeft: 2,
  },
})
