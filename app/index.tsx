import { useEffect, useState } from 'react'

import { View } from 'react-native'

import { type Href, Redirect } from 'expo-router'

import { Host, ProgressView } from '@expo/ui/swift-ui'
import { progressViewStyle, tint } from '@expo/ui/swift-ui/modifiers'

import { colors } from '../src/app/theme'
import { supabase } from '../src/lib/api/supabase'

export default function Index() {
  const [route, setRoute] = useState<Href | null>(null)

  useEffect(() => {
    async function resolveRoute() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setRoute('/onboarding')
        return
      }
      const { data: runner } = await supabase
        .from('runners')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      setRoute(runner ? '/(tabs)' : '/onboarding/name')
    }
    resolveRoute()
  }, [])

  if (!route) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Host matchContents>
          <ProgressView
            modifiers={[progressViewStyle('circular'), tint(colors.accent)]}
          />
        </Host>
      </View>
    )
  }

  return <Redirect href={route} />
}
