import { View } from 'react-native'

import { Button, Host, Image } from '@expo/ui/swift-ui'
import { frame, glassEffect } from '@expo/ui/swift-ui/modifiers'
import type { SFSymbol } from 'sf-symbols-typescript'

interface Props {
  systemName: SFSymbol
  onPress: () => void
  disabled?: boolean
}

export default function GlassIconButton({
  systemName,
  onPress,
  disabled,
}: Props) {
  return (
    <View
      pointerEvents={disabled ? 'none' : 'auto'}
      style={disabled ? { opacity: 0.4 } : undefined}
    >
      <Host matchContents>
        <Button
          onPress={onPress}
          modifiers={[
            frame({ width: 44, height: 44 }),
            glassEffect({
              shape: 'circle',
              glass: { variant: 'regular', interactive: true },
            }),
          ]}
        >
          <Image systemName={systemName} size={16} color="white" />
        </Button>
      </Host>
    </View>
  )
}
