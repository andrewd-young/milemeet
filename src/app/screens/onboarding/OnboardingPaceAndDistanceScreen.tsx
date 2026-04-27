import React, { useState } from 'react'

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useRouter } from 'expo-router'

import { Ionicons } from '@expo/vector-icons'

import OnboardingLayout from '../../../components/OnboardingLayout'
import { useOnboarding } from '../../context/OnboardingContext'
import { colors, radii } from '../../theme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

interface PaceOption {
  label: string
  sublabel: string
  icon: IoniconName
  value: number
}

const PACE_OPTIONS: PaceOption[] = [
  { label: 'Under 7:00', sublabel: 'Elite · Fast', icon: 'flash', value: 6.5 },
  {
    label: '7:00 – 8:30',
    sublabel: 'Tempo · Steady',
    icon: 'timer-outline',
    value: 7.75,
  },
  {
    label: '8:30 – 10:00',
    sublabel: 'Conversational · Relaxed',
    icon: 'walk-outline',
    value: 9.25,
  },
  {
    label: '10:00+',
    sublabel: 'Jog · Run-Walk',
    icon: 'accessibility-outline',
    value: 11,
  },
]

export default function OnboardingPaceAndDistanceScreen() {
  const [selectedPace, setSelectedPace] = useState<number | null>(null)
  const [distanceMin, setDistanceMin] = useState(3)
  const [distanceMax, setDistanceMax] = useState(6)
  const router = useRouter()
  const { setPaceAndDistance } = useOnboarding()

  const handleNext = () => {
    if (selectedPace === null) return
    setPaceAndDistance(selectedPace, distanceMin, distanceMax)
    router.push('/onboarding/days-times')
  }

  return (
    <OnboardingLayout
      step={5}
      title="What's your typical pace?"
      subtitle="Select your average comfortable running pace per mile."
      onNext={handleNext}
      nextDisabled={selectedPace === null}
    >
      <View style={styles.paceList}>
        {PACE_OPTIONS.map(option => {
          const selected = selectedPace === option.value
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.paceRow, selected && styles.paceRowSelected]}
              onPress={() => setSelectedPace(option.value)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.paceIconWrap,
                  selected && styles.paceIconWrapSelected,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={selected ? colors.bg : colors.textSecondary}
                />
              </View>
              <View style={styles.paceText}>
                <Text
                  style={[
                    styles.paceLabel,
                    selected && styles.paceLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.paceSublabel}>{option.sublabel}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.distanceSection}>
        <Text style={styles.sectionLabel}>DISTANCE RANGE</Text>
        <View style={styles.distanceCard}>
          <DistanceStepper
            label="Min"
            value={distanceMin}
            onDecrement={() => setDistanceMin(v => Math.max(1, v - 1))}
            onIncrement={() =>
              setDistanceMin(v => Math.min(v + 1, distanceMax - 1))
            }
          />
          <View style={styles.distanceDivider} />
          <DistanceStepper
            label="Max"
            value={distanceMax}
            onDecrement={() =>
              setDistanceMax(v => Math.max(v - 1, distanceMin + 1))
            }
            onIncrement={() => setDistanceMax(v => Math.min(26, v + 1))}
          />
        </View>
        <Text style={styles.distanceRange}>
          {distanceMin} – {distanceMax} miles per run
        </Text>
      </View>
    </OnboardingLayout>
  )
}

function DistanceStepper({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string
  value: number
  onDecrement: () => void
  onIncrement: () => void
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={onDecrement}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={onIncrement}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  paceList: {
    gap: 6,
    marginBottom: 20,
  },
  paceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 11,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  paceRowSelected: {
    borderColor: colors.accent,
    backgroundColor: '#1C2010',
  },
  paceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paceIconWrapSelected: {
    backgroundColor: colors.accent,
  },
  paceText: {
    flex: 1,
  },
  paceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  paceLabelSelected: {
    color: colors.accent,
  },
  paceSublabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },

  distanceSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },
  distanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  distanceDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  distanceRange: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
