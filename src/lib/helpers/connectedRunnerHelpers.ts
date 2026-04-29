import { Linking } from 'react-native'

export const formatTime = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export const extractMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err)
    return String((err as { message: unknown }).message)
  return 'Something went wrong'
}

export const openInstagram = async (handle: string) => {
  const username = handle.replace('@', '')
  const appUrl = `instagram://user?username=${username}`
  const webUrl = `https://instagram.com/${username}`
  const canOpen = await Linking.canOpenURL(appUrl)
  Linking.openURL(canOpen ? appUrl : webUrl)
}

export const openLinkedIn = (url: string) => {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  Linking.openURL(fullUrl)
}
