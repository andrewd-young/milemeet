import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react'

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
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) {
        setPendingCount(0)
        return
      }

      const { data: me } = await supabase
        .from('runners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!me) {
        setPendingCount(0)
        return
      }

      const { count } = await supabase
        .from('run_connections')
        .select('id', { count: 'exact', head: true })
        .eq('partner_runner_id', me.id)
        .eq('status', 'pending')

      setPendingCount(count ?? 0)
    } catch {
      // non-critical — badge just won't update
    }
  }, [])

  return (
    <ConnectionsContext.Provider value={{ pendingCount, refreshPendingCount }}>
      {children}
    </ConnectionsContext.Provider>
  )
}

export const useConnections = () => useContext(ConnectionsContext)
