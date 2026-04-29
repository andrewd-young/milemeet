import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/api/supabase'
import type { Tables } from '../types/supabase'

type Runner = Tables<'runners'>

type MyRunnerContextValue = {
  myRunner: Runner | null
  isLoading: boolean
  refreshRunner: () => Promise<void>
}

const MyRunnerContext = createContext<MyRunnerContextValue>({
  myRunner: null,
  isLoading: true,
  refreshRunner: async () => {},
})

export const MyRunnerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [myRunner, setMyRunner] = useState<Runner | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshRunner = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) {
        setMyRunner(null)
        return
      }
      const { data } = await supabase
        .from('runners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      setMyRunner(data ?? null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshRunner()
  }, [refreshRunner])

  return (
    <MyRunnerContext.Provider value={{ myRunner, isLoading, refreshRunner }}>
      {children}
    </MyRunnerContext.Provider>
  )
}

export const useMyRunner = () => useContext(MyRunnerContext)
