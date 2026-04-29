import { useEffect } from 'react'

import { NativeTabs } from 'expo-router/unstable-native-tabs'

import { useConnections } from '../../src/app/context/ConnectionsContext'
import { colors } from '../../src/app/theme'

export default function TabsLayout() {
  const { pendingCount, refreshPendingCount } = useConnections()

  useEffect(() => {
    refreshPendingCount()
  }, [])

  const badgeValue = pendingCount > 0 ? String(pendingCount) : undefined

  return (
    <NativeTabs
      tintColor={colors.accent}
      disableTransparentOnScrollEdge
      blurEffect="systemUltraThinMaterialDark"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="figure.run" />
        <NativeTabs.Trigger.Label>Runners</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="connections">
        <NativeTabs.Trigger.Icon sf="person.2.fill" />
        <NativeTabs.Trigger.Label>Circle</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge hidden={!badgeValue}>
          {badgeValue}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
