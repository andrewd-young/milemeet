import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react'

import { useMyRunner } from '../../context/MyRunnerContext'
import { supabase } from '../../lib/api/supabase'

type ConnectionsContextValue = {
  pendingCount: number
  refreshPendingCount: () => Promise<void>
}

const ConnectionsContext = createContext<ConnectionsContextValue>({
  pendingCount: 0,
  refreshPendingCount: async () => {},
})

export const ConnectionsProvider = ({ children }: { children: ReactNode }) => {
  const { myRunner } = useMyRunner()
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    if (!myRunner) {
      setPendingCount(0)
      return
    }
    try {
      const { count } = await supabase
        .from('run_connections')
        .select('id', { count: 'exact', head: true })
        .eq('partner_runner_id', myRunner.id)
        .eq('status', 'pending')
      setPendingCount(count ?? 0)
    } catch {
      // non-critical — badge just won't update
    }
  }, [myRunner])

  return (
    <ConnectionsContext.Provider value={{ pendingCount, refreshPendingCount }}>
      {children}
    </ConnectionsContext.Provider>
  )
}

export const useConnections = () => useContext(ConnectionsContext)
