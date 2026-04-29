import React, { useState } from 'react'

import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { FontAwesome5 } from '@expo/vector-icons'

import { colors, radii } from '../app/theme'
import { supabase } from '../lib/api/supabase'
import type { Tables } from '../types/supabase'

type Runner = Tables<'runners'>

type Props = {
  runner: Runner
  variant: 'request' | 'sent' | 'connection'
  busy?: boolean
  onPress?: () => void
  onAccept?: () => void
  onDecline?: () => void
  onCancel?: () => void
}

const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const getAvatarUrl = (imageName: string | null): string | null => {
  if (!imageName) return null
  const { data } = supabase.storage.from('avatars').getPublicUrl(imageName)
  return data.publicUrl
}

const openInstagram = async (handle: string) => {
  const username = handle.replace('@', '')
  const appUrl = `instagram://user?username=${username}`
  const webUrl = `https://instagram.com/${username}`
  const canOpen = await Linking.canOpenURL(appUrl)
  Linking.openURL(canOpen ? appUrl : webUrl)
}

const openLinkedIn = (url: string) => {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  Linking.openURL(fullUrl)
}

const Avatar = ({ runner, size = 52 }: { runner: Runner; size?: number }) => {
  const [imgFailed, setImgFailed] = useState(false)
  const url = getAvatarUrl(runner.image_name)

  if (url && !imgFailed) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          s.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <View
      style={[
        s.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[s.avatarInitials, { fontSize: size * 0.32 }]}>
        {getInitials(runner.name)}
      </Text>
    </View>
  )
}

const SocialPills = ({
  runner,
  compact = false,
}: {
  runner: Runner
  compact?: boolean
}) => (
  <View style={s.socialPills}>
    {runner.instagram ? (
      <TouchableOpacity
        style={s.socialPill}
        onPress={() => openInstagram(runner.instagram!)}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <FontAwesome5
          name="instagram"
          size={compact ? 12 : 13}
          color={colors.instagram}
        />
        {!compact && (
          <Text style={s.socialPillText} numberOfLines={1}>
            {runner.instagram.startsWith('@')
              ? runner.instagram
              : `@${runner.instagram}`}
          </Text>
        )}
      </TouchableOpacity>
    ) : null}
    {runner.linkedin ? (
      <TouchableOpacity
        style={s.socialPill}
        onPress={() => openLinkedIn(runner.linkedin!)}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <FontAwesome5
          name="linkedin"
          size={compact ? 12 : 13}
          color={colors.linkedin}
        />
      </TouchableOpacity>
    ) : null}
  </View>
)

const SecondaryLine = ({ runner }: { runner: Runner }) => {
  const handle = runner.instagram
    ? runner.instagram.startsWith('@')
      ? runner.instagram
      : `@${runner.instagram}`
    : null

  if (handle) {
    return (
      <Text style={s.secondaryText} numberOfLines={1}>
        {handle}
        {runner.neighborhood ? (
          <Text style={s.secondaryMuted}> · {runner.neighborhood}</Text>
        ) : null}
      </Text>
    )
  }

  if (runner.neighborhood) {
    return (
      <View style={s.locationLine}>
        <FontAwesome5 name="map-marker-alt" size={10} color={colors.accent} />
        <Text style={s.secondaryText}>{runner.neighborhood}</Text>
      </View>
    )
  }

  return null
}

const ConnectionCard = ({
  runner,
  variant,
  busy = false,
  onPress,
  onAccept,
  onDecline,
  onCancel,
}: Props) => {
  const rowContent = (
    <>
      <Avatar runner={runner} />
      <View style={s.rowBody}>
        <View style={s.rowNameLine}>
          <Text style={s.rowName} numberOfLines={1}>
            {runner.name}
          </Text>
          {variant === 'sent' ? (
            <Text style={s.pendingLabel}>Pending</Text>
          ) : (
            <SocialPills runner={runner} compact={variant === 'request'} />
          )}
        </View>
        <SecondaryLine runner={runner} />
        {variant === 'request' ? (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={s.acceptBtn}
              onPress={onAccept}
              disabled={busy}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="check" size={11} color={colors.bg} />
              <Text style={s.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDecline}
              disabled={busy}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {variant === 'sent' ? (
          <TouchableOpacity
            onPress={onCancel}
            disabled={busy}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.cancelText}>Cancel request</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </>
  )

  if (variant === 'connection') {
    return (
      <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.75}>
        {rowContent}
      </TouchableOpacity>
    )
  }

  return (
    <View
      style={[
        s.row,
        variant === 'request' && s.rowRequest,
        variant === 'sent' && s.rowDim,
      ]}
    >
      {rowContent}
    </View>
  )
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowRequest: {
    borderBottomColor: colors.accent + '30',
  },
  rowDim: {
    opacity: 0.65,
  },
  avatar: {
    backgroundColor: colors.elevated,
  },
  avatarFallback: {
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  rowBody: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  secondaryText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  secondaryMuted: {
    color: colors.textTertiary,
  },
  locationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    backgroundColor: colors.elevated,
  },
  socialPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    maxWidth: 100,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bg,
  },
  declineText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  pendingLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  cancelText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
})

export default ConnectionCard
