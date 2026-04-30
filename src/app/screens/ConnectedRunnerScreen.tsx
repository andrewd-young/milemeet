import React, { useEffect, useRef, useState } from 'react'

import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useLocalSearchParams, useRouter } from 'expo-router'

import {
  Host,
  Picker,
  ProgressView,
  Text as SwiftText,
} from '@expo/ui/swift-ui'
import {
  pickerStyle,
  progressViewStyle,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers'
import { FontAwesome5 } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GlassIconButton from '../../components/GlassIconButton'
import RunnerActivityCard from '../../components/RunnerActivityCard'
import RunnerHero from '../../components/RunnerHero'
import { useMyRunner } from '../../context/MyRunnerContext'
import { supabase } from '../../lib/api/supabase'
import {
  extractMessage,
  formatTime,
  openInstagram,
  openLinkedIn,
} from '../../lib/helpers/connectedRunnerHelpers'
import { buildScheduleChips } from '../../lib/helpers/formatters'
import { useKeyboardVisible } from '../../lib/hooks/useKeyboardVisible'
import { useRunnerActions } from '../../lib/hooks/useRunnerActions'
import type { Tables } from '../../types/supabase'
import { globalStyles } from '../styles'
import { colors, radii } from '../theme'

type Runner = Tables<'runners'>
type Connection = Tables<'run_connections'>
type Message = Tables<'runner_messages'>

type Tab = 'chat' | 'profile'

const URL_REGEX = /https?:\/\/\S+|www\.\S+/gi

const ConnectedRunnerScreen = () => {
  const { id: partnerId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { myRunner } = useMyRunner()

  const [tab, setTab] = useState<Tab>('chat')
  const [runner, setRunner] = useState<Runner | null>(null)
  const [connection, setConnection] = useState<Connection | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isActing, setIsActing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { blockRunner, reportRunner } = useRunnerActions()
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const keyboardVisible = useKeyboardVisible()

  const listRef = useRef<FlatList<Message>>(null)

  useEffect(() => {
    load()
  }, [partnerId])

  const load = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data: runnerData, error: runnerErr } = await supabase
        .from('runners')
        .select('*')
        .eq('id', partnerId)
        .maybeSingle()
      if (runnerErr) throw runnerErr
      if (!runnerData) throw new Error('Runner not found')
      setRunner(runnerData)

      if (!myRunner) return

      const { data: conn, error: connErr } = await supabase
        .from('run_connections')
        .select('*')
        .or(
          `and(owner_runner_id.eq.${myRunner.id},partner_runner_id.eq.${partnerId}),` +
            `and(owner_runner_id.eq.${partnerId},partner_runner_id.eq.${myRunner.id})`,
        )
        .maybeSingle()
      if (connErr) throw connErr
      if (!conn) return
      setConnection(conn)

      const { data: msgs, error: msgsErr } = await supabase
        .from('runner_messages')
        .select('*')
        .eq('connection_id', conn.id)
        .order('sent_at', { ascending: true })
      if (msgsErr) throw msgsErr
      setMessages(msgs ?? [])

      const channel = supabase
        .channel(`messages:${conn.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'runner_messages',
            filter: `connection_id=eq.${conn.id}`,
          },
          payload => {
            setMessages(prev => {
              if (prev.some(m => m.id === (payload.new as Message).id))
                return prev
              return [...prev, payload.new as Message]
            })
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (err) {
      if (__DEV__) console.error('[ConnectedRunner] load error:', err)
      setErrorMessage(extractMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!myRunner || !connection) return
    const body = inputText.replace(URL_REGEX, '').trim()
    if (!body) return
    setIsSending(true)
    setInputText('')
    try {
      const { data, error } = await supabase
        .from('runner_messages')
        .insert({
          connection_id: connection.id,
          sender_runner_id: myRunner.id,
          body,
        })
        .select()
        .single()
      if (error) throw error
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev
        return [...prev, data]
      })
    } catch (err) {
      if (__DEV__) console.error('[ConnectedRunner] send error:', err)
      setErrorMessage(extractMessage(err))
    } finally {
      setIsSending(false)
    }
  }

  const handleMenu = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          'Cancel',
          'Remove Connection',
          'Block Runner',
          'Report Runner',
        ],
        destructiveButtonIndex: [2, 3],
        cancelButtonIndex: 0,
      },
      index => {
        if (index === 1) confirmRemove()
        if (index === 2) confirmBlock()
        if (index === 3) confirmReport()
      },
    )
  }

  const confirmRemove = () => {
    Alert.alert(
      'Remove Connection',
      `Remove ${runner?.name ?? 'this runner'} from your connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: removeConnection,
        },
      ],
    )
  }

  const confirmBlock = () => {
    Alert.alert(
      'Block Runner',
      `Block ${runner?.name ?? 'this runner'}? They will be removed from your connections and hidden from your feed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: handleBlock },
      ],
    )
  }

  const handleBlock = async () => {
    if (!runner) return
    setIsActing(true)
    try {
      await blockRunner(runner, connection)
      router.back()
    } catch (err) {
      if (__DEV__) console.error('[ConnectedRunner] block error:', err)
      setErrorMessage(extractMessage(err))
      setIsActing(false)
    }
  }

  const REPORT_REASONS = [
    'Inappropriate behavior',
    'Harassment',
    'Spam or fake profile',
    'Safety concern',
    'Other',
  ]

  const confirmReport = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: `Why are you reporting ${runner?.name ?? 'this runner'}?`,
        options: ['Cancel', ...REPORT_REASONS],
        cancelButtonIndex: 0,
        destructiveButtonIndex: [],
      },
      index => {
        if (index === 0) return
        const reason = REPORT_REASONS[index - 1]
        Alert.alert(
          'Report Runner',
          `Report ${runner?.name ?? 'this runner'} for "${reason}"? They will be removed from your connections.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Report',
              style: 'destructive',
              onPress: () => handleReport(reason),
            },
          ],
        )
      },
    )
  }

  const handleReport = async (reason: string) => {
    if (!runner) return
    await reportRunner(runner, connection, reason)
    Alert.alert('Report submitted', "Thank you. We'll review this shortly.")
    router.back()
  }

  const removeConnection = async () => {
    if (!connection) return
    setIsActing(true)
    try {
      const { error } = await supabase
        .from('run_connections')
        .delete()
        .eq('id', connection.id)
      if (error) throw error
      router.back()
    } catch (err) {
      if (__DEV__) console.error('[ConnectedRunner] remove error:', err)
      setErrorMessage(extractMessage(err))
      setIsActing(false)
    }
  }

  if (isLoading) {
    return (
      <View style={globalStyles.containerCentered}>
        <Host matchContents>
          <ProgressView
            modifiers={[progressViewStyle('circular'), tint(colors.accent)]}
          />
        </Host>
      </View>
    )
  }

  if (!runner) {
    return (
      <View style={globalStyles.containerCentered}>
        <Text style={globalStyles.subtitle}>
          {errorMessage ?? 'Runner not found.'}
        </Text>
      </View>
    )
  }

  const mySentCount = myRunner
    ? messages.filter(m => m.sender_runner_id === myRunner.id).length
    : 0
  const theirSentCount = messages.filter(
    m => m.sender_runner_id !== myRunner?.id,
  ).length
  const showSocialBanner =
    !bannerDismissed &&
    mySentCount >= 1 &&
    theirSentCount >= 1 &&
    !!runner.instagram

  const charCount = inputText.length
  const canSend =
    inputText.replace(URL_REGEX, '').trim().length > 0 && charCount <= 280

  const scheduleChips = buildScheduleChips(
    runner.run_days ?? [],
    runner.run_times ?? [],
  )
  const goalChips = runner.goals
    ? runner.goals
        .split(',')
        .map(g => g.trim())
        .filter(Boolean)
    : []
  const racesAndClubs = [
    ...(runner.past_races ?? []),
    ...(runner.run_clubs ?? []),
  ]

  const hasSocials = !!(runner.instagram || runner.linkedin)

  const socialMeta = hasSocials ? (
    <View style={s.socialTagRow}>
      {runner.instagram ? (
        <TouchableOpacity
          style={s.socialTag}
          onPress={() => openInstagram(runner.instagram!)}
          activeOpacity={0.75}
        >
          <FontAwesome5 name="instagram" size={13} color={colors.instagram} />
          <Text style={s.socialTagText}>
            @{runner.instagram.replace('@', '')}
          </Text>
        </TouchableOpacity>
      ) : null}
      {runner.linkedin ? (
        <TouchableOpacity
          style={s.socialTag}
          onPress={() => openLinkedIn(runner.linkedin!)}
          activeOpacity={0.75}
        >
          <FontAwesome5 name="linkedin" size={13} color={colors.linkedin} />
          <Text style={s.socialTagText}>LinkedIn</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  ) : undefined

  const segmentFooter = (
    <Host style={s.segmentControl}>
      <Picker
        selection={tab}
        onSelectionChange={val => setTab(val as Tab)}
        modifiers={[pickerStyle('segmented')]}
      >
        <SwiftText modifiers={[tag('chat')]}>Chat</SwiftText>
        <SwiftText modifiers={[tag('profile')]}>Profile</SwiftText>
      </Picker>
    </Host>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <RunnerHero
        runner={runner}
        paddingTop={insets.top + 16}
        minHeight={286}
        metaContent={socialMeta}
        footer={segmentFooter}
      />

      {tab === 'chat' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={s.messageList}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View style={s.emptyChat}>
                <FontAwesome5
                  name="running"
                  size={32}
                  color={colors.textTertiary}
                />
                <Text style={s.emptyChatText}>
                  Send a message to start coordinating a run
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMine = item.sender_runner_id === myRunner?.id
              return (
                <View
                  style={[
                    s.bubbleRow,
                    isMine ? s.bubbleRowMine : s.bubbleRowTheirs,
                  ]}
                >
                  <View
                    style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}
                  >
                    <Text
                      style={[
                        s.bubbleText,
                        isMine ? s.bubbleTextMine : s.bubbleTextTheirs,
                      ]}
                    >
                      {item.body}
                    </Text>
                  </View>
                  <Text style={s.bubbleTime}>{formatTime(item.sent_at)}</Text>
                </View>
              )
            }}
          />

          {showSocialBanner ? (
            <View style={s.socialBanner}>
              <View style={s.socialBannerInner}>
                <FontAwesome5
                  name="instagram"
                  size={16}
                  color={colors.instagram}
                />
                <Text style={s.socialBannerText}>
                  Continue on Instagram
                  <Text style={s.socialBannerHandle}>
                    {' '}
                    @{runner.instagram?.replace('@', '')}
                  </Text>
                </Text>
                <TouchableOpacity
                  onPress={() => openInstagram(runner.instagram!)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={s.socialBannerCta}>Open →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setBannerDismissed(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={s.socialBannerDismiss}
              >
                <FontAwesome5
                  name="times"
                  size={12}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          ) : null}

          <View
            style={[
              s.inputBar,
              { paddingBottom: keyboardVisible ? 16 : insets.bottom + 8 },
            ]}
          >
            {errorMessage ? (
              <Text style={s.errorMsg}>{errorMessage}</Text>
            ) : null}
            <View style={s.inputRow}>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Coordinate a run…"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={300}
                  returnKeyType="send"
                  onSubmitEditing={
                    canSend && !isSending ? handleSend : undefined
                  }
                  blurOnSubmit={false}
                />
                {charCount > 200 ? (
                  <Text
                    style={[s.charCount, charCount > 280 && s.charCountOver]}
                  >
                    {charCount}/280
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={[
                  s.sendBtn,
                  (!canSend || isSending) && s.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!canSend || isSending}
                activeOpacity={0.8}
              >
                {isSending ? (
                  <Host matchContents>
                    <ProgressView
                      modifiers={[
                        progressViewStyle('circular'),
                        tint(colors.bg),
                      ]}
                    />
                  </Host>
                ) : (
                  <FontAwesome5 name="arrow-up" size={14} color={colors.bg} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.profileContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          {runner.bio ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>About</Text>
              <Text style={s.bodyText}>{runner.bio}</Text>
            </View>
          ) : null}

          <View style={s.section}>
            <Text style={s.sectionHeading}>Activity</Text>
            <RunnerActivityCard runner={runner} />
          </View>

          {scheduleChips.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Schedule</Text>
              <View style={s.chipsRow}>
                {scheduleChips.map((chip, i) => (
                  <View key={i} style={s.chip}>
                    {chip.icon ? (
                      <FontAwesome5
                        name={chip.icon as any}
                        size={12}
                        color={colors.accent}
                        solid
                      />
                    ) : null}
                    <Text style={s.chipText}>{chip.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {goalChips.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Goals</Text>
              <View style={s.chipsRow}>
                {goalChips.map(goal => (
                  <View key={goal} style={s.chip}>
                    <Text style={s.chipText}>{goal}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {racesAndClubs.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Races & Clubs</Text>
              <View style={s.chipsRow}>
                {racesAndClubs.map(tag => (
                  <View key={tag} style={s.chip}>
                    <Text style={s.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={s.safetyRow}>
            <FontAwesome5
              name="shield-alt"
              size={13}
              color={colors.textTertiary}
            />
            <Text style={s.safetyText}>
              Choose a public route and let someone know where you're going.
            </Text>
          </View>
        </ScrollView>
      )}

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, left: 16 }}
      >
        <GlassIconButton
          systemName="chevron.left"
          onPress={() => router.back()}
        />
      </View>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + 8, right: 16 }}
      >
        <GlassIconButton
          systemName="ellipsis"
          onPress={handleMenu}
          disabled={isActing}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  segmentControl: {
    height: 36,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 4,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    gap: 12,
  },
  emptyChatText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 20,
  },
  bubbleRow: {
    maxWidth: '78%',
    marginVertical: 3,
  },
  bubbleRowMine: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleRowTheirs: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.elevated,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMine: {
    color: colors.bg,
    fontWeight: '500',
  },
  bubbleTextTheirs: {
    color: colors.textPrimary,
  },
  bubbleTime: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 3,
    marginHorizontal: 4,
  },
  socialBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.instagram + '40',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialBannerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  socialBannerHandle: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  socialBannerCta: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.instagram,
  },
  socialBannerDismiss: {
    padding: 4,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 88,
  },
  charCount: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 2,
  },
  charCountOver: {
    color: colors.error,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  errorMsg: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  profileContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 23,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  socialTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.elevated,
    borderRadius: radii.full,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  socialTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textTertiary,
    lineHeight: 18,
  },
})

export default ConnectedRunnerScreen
