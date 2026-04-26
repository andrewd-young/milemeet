import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

import { supabase } from '../../lib/api/supabase'

type OnboardingData = {
  phone: string | null
  countryCode: string | null
  name: string | null
  neighborhood: string | null
  pace: number | null
  distanceMin: number | null
  distanceMax: number | null
  runDays: string[]
  runTimes: string[]
  goals: string[]
}

type OnboardingContextValue = {
  data: OnboardingData
  setPhone: (phone: string, countryCode: string) => void
  setName: (name: string) => void
  setNeighborhood: (neighborhood: string) => void
  setPaceAndDistance: (pace: number, distanceMin: number, distanceMax: number) => void
  setRunSchedule: (days: string[], times: string[]) => void
  setGoals: (goals: string[]) => void
  completeOnboarding: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
)

const defaultState: OnboardingData = {
  phone: null,
  countryCode: null,
  name: null,
  neighborhood: null,
  pace: null,
  distanceMin: null,
  distanceMax: null,
  runDays: [],
  runTimes: [],
  goals: [],
}

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>(defaultState)

  const setPhone = (phone: string, countryCode: string) => {
    setData(prev => ({ ...prev, phone, countryCode }))
  }

  const setName = (name: string) => {
    setData(prev => ({ ...prev, name }))
  }

  const setNeighborhood = (neighborhood: string) => {
    setData(prev => ({ ...prev, neighborhood }))
  }

  const setPaceAndDistance = (
    pace: number,
    distanceMin: number,
    distanceMax: number,
  ) => {
    setData(prev => ({ ...prev, pace, distanceMin, distanceMax }))
  }

  const setRunSchedule = (days: string[], times: string[]) => {
    setData(prev => ({ ...prev, runDays: days, runTimes: times }))
  }

  const setGoals = (goals: string[]) => {
    setData(prev => ({ ...prev, goals }))
  }

  const completeOnboarding = useCallback(async () => {
    const { name, neighborhood, pace, distanceMin, distanceMax, runDays, runTimes, goals } =
      data

    if (
      !name ||
      !neighborhood ||
      pace == null ||
      distanceMin == null ||
      distanceMax == null
    ) {
      throw new Error('Missing required onboarding fields.')
    }

    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id ?? null

    const payload = {
      name,
      neighborhood,
      pace,
      distance_min: distanceMin,
      distance_max: distanceMax,
      run_days: runDays.length ? runDays : null,
      run_times: runTimes.length ? runTimes : null,
      run_neighborhoods: [neighborhood],
      goals: goals.length ? goals.join(', ') : null,
      user_id: userId,
    }

    if (userId) {
      const { data: existing } = await supabase
        .from('runners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('runners')
          .update(payload)
          .eq('id', existing.id)

        if (error) {
          console.error('[completeOnboarding] update error:', error)
          throw new Error(error.message ?? 'Failed to update profile')
        }
        return
      }
    }

    console.log('[completeOnboarding] inserting payload:', JSON.stringify(payload, null, 2))
    const { error } = await supabase.from('runners').insert(payload)
    if (error) {
      console.error('[completeOnboarding] insert error:', error)
      throw new Error(error.message ?? 'Failed to save profile')
    }
  }, [data])

  return (
    <OnboardingContext.Provider
      value={{
        data,
        setPhone,
        setName,
        setNeighborhood,
        setPaceAndDistance,
        setRunSchedule,
        setGoals,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return ctx
}

