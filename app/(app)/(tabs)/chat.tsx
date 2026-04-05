/**
 * Chat Screen
 *
 * Full-screen agent chat interface — the map-less counterpart to the home
 * screen's chat flow. Renders the transcript above and the shared ChatInput
 * at the bottom so the rider can continue the conversation without the map.
 *
 * Layout note: the ChatInput is rendered as a sibling of SubpageLayout (not
 * inside its padded content area) so its bottom-safe-area math matches the
 * map screen exactly. This prevents a visible "hop" when navigating between
 * map → chat where the input would otherwise shift up by one safe-area inset.
 *
 * Entry is animated with a soft fade + slide-up so the interface resolves in
 * place instead of snapping.
 *
 * Following components/CLAUDE.md: non-map screens use SubpageLayout.
 */

import { useMutation, useQuery } from 'convex/react'
import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { Text } from 'react-native-paper'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { ChatInput } from '../../../components/chat'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { ChatTranscript } from '../../../components/ui/chat-transcript'
import type { ChatMessage } from '../../../components/ui/chat-transcript'
import { useChatPlanning } from '../../../hooks/use-chat-planning'
import { useRideFlow } from '../../../hooks/use-ride-flow'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'

const CHAT_SUGGESTIONS = [
  'Plan a scenic ride',
  'Ride to the coast',
  'Find coffee nearby',
  'Avoid highways',
]

export default function ChatScreen() {
  const { semantic } = useSemanticTheme()
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId?: string }>()

  // Local flow state for composing/sending from the chat screen
  const { state: flowState, dispatch: flowDispatch } = useRideFlow()
  const { sendPlanningMessage, cancel: cancelChatPlanning } = useChatPlanning(flowDispatch)
  const createSession = useMutation(api.db.planningSessions.createSession)

  // Fetch all sessions to find the target session
  const sessions = useQuery(api.db.planningSessions.listSessions)

  // Resolve which session to display in the transcript
  const resolvedSessionId: Id<'planning_sessions'> | null = (() => {
    if (sessionIdParam) {
      return sessionIdParam as Id<'planning_sessions'>
    }
    if (sessions && sessions.length > 0) {
      return sessions[0]._id
    }
    return null
  })()

  // Fetch messages for the resolved session (skip when no session)
  const rawMessages = useQuery(
    api.db.sessionMessages.list,
    resolvedSessionId ? { sessionId: resolvedSessionId } : 'skip'
  )

  // Map session_messages (role: 'rider' | 'system') to ChatMessage
  const messages: ChatMessage[] =
    rawMessages?.map((msg) => ({
      id: msg._id,
      role: msg.role === 'system' ? 'agent' : 'rider',
      content: msg.content,
      timestamp: new Date(msg.createdAt),
    })) ?? []

  const isLoading = sessions === undefined
  const hasNoSessions = sessions !== undefined && sessions.length === 0

  const handleNewSession = async () => {
    await createSession({ firstMessage: '' })
    flowDispatch({ type: 'NEW_SESSION' })
  }

  return (
    <View style={styles.root}>
      <SubpageLayout
        title="Chat"
        testID="chat-screen"
        rightAction={{
          icon: 'plus',
          onPress: handleNewSession,
          testID: 'chat-screen-new-session',
        }}
      >
        {/* Staggered fade so the transcript resolves in place, not snapping */}
        <Animated.View
          entering={FadeIn.duration(260).delay(40)}
          style={styles.body}
        >
          {isLoading ? (
            <View style={styles.centeredState}>
              <Text
                variant="bodyMedium"
                style={{ color: semantic.color.onSurface.muted }}
              >
                Loading…
              </Text>
            </View>
          ) : hasNoSessions && messages.length === 0 ? (
            <View style={styles.centeredState}>
              <Text
                variant="bodyMedium"
                style={[styles.emptyText, { color: semantic.color.onSurface.muted }]}
                testID="chat-screen-empty-state"
              >
                Start a conversation below — describe the ride you want.
              </Text>
            </View>
          ) : (
            <ChatTranscript messages={messages} bottomInset={140} />
          )}
        </Animated.View>
      </SubpageLayout>

      {/* ChatInput lives at the root level so its bottom-safe-area math
          matches the map screen — no position "hop" on navigation. A pure
          fade (no translate) lets the input resolve in place. */}
      <Animated.View
        entering={FadeIn.duration(220)}
        style={styles.inputSlot}
        pointerEvents="box-none"
      >
        <ChatInput
          onSend={sendPlanningMessage}
          onCancel={cancelChatPlanning}
          state={flowState}
          suggestions={messages.length === 0 ? CHAT_SUGGESTIONS : []}
          testID="chat-screen-input"
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  inputSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
  },
})
