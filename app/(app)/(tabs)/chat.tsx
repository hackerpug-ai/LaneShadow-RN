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

import { useQuery } from 'convex/react'
import { useLocalSearchParams, useRouter } from 'expo-router'
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
import { useCurrentLocation } from '../../../hooks/use-current-location'
import { useRideFlow } from '../../../hooks/use-ride-flow'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { useSelectedRoute } from '../../../contexts/selected-route'
import React, { useState, useEffect } from 'react'

// Set up global error handler for uncaught errors
if (typeof console !== 'undefined') {
  const originalError = console.error
  console.error = (...args) => {
    originalError('[ChatScreen Global Error]', ...args)
    console.info('[ChatScreen] Error stack trace', new Error().stack)
  }
}

const CHAT_SUGGESTIONS = [
  'Plan a scenic ride',
  'Ride to the coast',
  'Find coffee nearby',
  'Avoid highways',
]

export default function ChatScreen() {
  console.info('[ChatScreen] Component mounting')

  const { semantic } = useSemanticTheme()
  const router = useRouter()
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId?: string }>()

  // Local flow state for composing/sending from the chat screen
  const { state: flowState, dispatch: flowDispatch } = useRideFlow()
  const { sendPlanningMessage, cancel: cancelChatPlanning, resetSession, sessionId, optimisticMessages } = useChatPlanning(flowDispatch)
  const { location: currentLocation } = useCurrentLocation()

  console.info('[ChatScreen] Hooks initialized', {
    hasFlowState: !!flowState,
    hasCurrentLocation: !!currentLocation,
    sessionIdParam,
  })

  // Wrap send to forward device location (when available) to the agent.
  const handleSendMessage = (text: string) =>
    sendPlanningMessage(
      text,
      currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined
    )

  // Fetch all sessions to find the target session
  const sessions = useQuery(api.db.planningSessions.listSessions)

  // Track when we've explicitly started a new session (to prevent falling back to old session)
  const [explicitlyNewSession, setExplicitlyNewSession] = useState(false)

  console.info('[ChatScreen] Sessions query result', {
    sessionsCount: sessions?.length ?? 0,
    isLoading: sessions === undefined,
  })

  // Get the top (most recent) session ID for message count check
  const topSessionId = sessions && sessions.length > 0 ? sessions[0]._id : null

  // Fetch messages for the top session to check if it has 0 visible messages
  const topSessionMessages = useQuery(
    api.db.sessionMessages.list,
    topSessionId ? { sessionId: topSessionId } : 'skip'
  )

  // Count visible messages (non-hidden) in the top session
  const topSessionVisibleMessageCount = React.useMemo(() => {
    if (!topSessionMessages) return 0
    return topSessionMessages.filter(
      (msg) =>
        msg.kind !== 'agent_turn' &&
        msg.kind !== 'tool_result_hidden' &&
        !(
          msg.role === 'system' &&
          (msg.kind === 'text' || !msg.kind) &&
          !msg.content?.trim() &&
          msg.status !== 'streaming'
        )
    ).length
  }, [topSessionMessages])

  // Resolve which session to display in the transcript
  const resolvedSessionId: Id<'planning_sessions'> | null = (() => {
    if (sessionIdParam) {
      return sessionIdParam as Id<'planning_sessions'>
    }
    // Only fall back to most recent session if we haven't explicitly started a new one
    if (!explicitlyNewSession && sessions && sessions.length > 0) {
      return sessions[0]._id
    }
    return null
  })()

  console.info('[ChatScreen] Resolved session ID', {
    resolvedSessionId,
    sessionIdParam,
    firstSessionId: sessions?.[0]?._id,
  })

  // Fetch messages for the resolved session (skip when no session)
  const rawMessages = useQuery(
    api.db.sessionMessages.list,
    resolvedSessionId ? { sessionId: resolvedSessionId } : 'skip'
  )

  console.info('[ChatScreen] Messages query result', {
    rawMessagesCount: rawMessages?.length ?? 0,
    isLoadingMessages: rawMessages === undefined,
  })

  // Map session_messages (role: 'rider' | 'system') to ChatMessage.
  // Hidden agent bookkeeping rows (agent_turn, tool_result_hidden) carry
  // pi-ai Message payloads for the ReAct loop and never render. The
  // 'reasoning' kind is surfaced inline via ReasoningCard (US-313).
  // Agent text messages with empty content (intermediate streaming artifacts)
  // are also filtered to avoid rendering avatar-only placeholder rows.
  const messages: ChatMessage[] =
    rawMessages
      ?.filter(
        (msg) =>
          msg.kind !== 'agent_turn' &&
          msg.kind !== 'tool_result_hidden' &&
          // Filter empty agent text messages unless still actively streaming
          !(
            msg.role === 'system' &&
            (msg.kind === 'text' || !msg.kind) &&
            !msg.content?.trim() &&
            msg.status !== 'streaming'
          )
      )
      .map((msg) => ({
        id: msg._id,
        role: msg.role === 'system' ? 'agent' : 'rider',
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        kind: msg.kind as ChatMessage['kind'],
        status: msg.status,
        attachments: msg.attachments,
      })) ?? []

  console.info('[ChatScreen] Filtered and mapped messages', {
    filteredCount: messages.length,
    rawCount: rawMessages?.length ?? 0,
  })

  // Derive isPlanning from live message statuses: if any assistant row is
  // still running or streaming, the agent is working.
  const isPlanning =
    rawMessages?.some(
      (msg) => msg.status === 'running' || msg.status === 'streaming'
    ) ?? false

  const isLoading = sessions === undefined
  const hasNoSessions = sessions !== undefined && sessions.length === 0

  console.info('[ChatScreen] Render state', {
    isLoading,
    hasNoSessions,
    messagesCount: messages.length,
    isPlanning,
  })

  // Combine optimistic messages with regular messages
  const allMessages: ChatMessage[] = React.useMemo(() => {
    // If we have optimistic messages, map them to ChatMessage format
    const optimisticChatMessages: ChatMessage[] = optimisticMessages.map((msg) => ({
      id: msg.id,
      role: msg.role === 'agent' ? 'agent' : 'rider',
      content: msg.content,
      timestamp: msg.timestamp,
    }))

    // If we have a session, combine with server messages
    if (resolvedSessionId) {
      return [...messages, ...optimisticChatMessages]
    }

    // No session yet, only show optimistic messages
    return optimisticChatMessages
  }, [messages, optimisticMessages, resolvedSessionId])

  // Clear the explicitly-new-session flag when a new session is actually created
  useEffect(() => {
    if (sessionId && explicitlyNewSession) {
      setExplicitlyNewSession(false)
    }
  }, [sessionId, explicitlyNewSession])

  const { setSelectedRouteId, setDisplayedRoutePlanId } = useSelectedRoute()

  const handleNewSession = () => {
    console.info('[ChatScreen] New session button pressed')

    // Clear session ID to stay on chat view with no session
    console.info('[ChatScreen] Clearing session ID, staying on chat view')
    setSelectedRouteId(null)
    setDisplayedRoutePlanId(null)
    resetSession()
    // Mark that we've explicitly started a new session (prevent falling back to old session)
    setExplicitlyNewSession(true)
    router.replace('/(app)/(tabs)?chat=1' as any)
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
        <View style={styles.body}>
          <Animated.View
            entering={FadeIn.duration(260).delay(40)}
            style={styles.fadingContent}
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
            ) : allMessages.length === 0 ? (
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
              <ChatTranscript
                messages={allMessages}
                bottomInset={140}
                onViewOnMap={() => router.push('/(app)/(tabs)')}
              />
            )}
          </Animated.View>
        </View>
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
          onSend={handleSendMessage}
          onCancel={cancelChatPlanning}
          state={flowState}
          isPlanning={isPlanning}
          suggestions={allMessages.length === 0 ? CHAT_SUGGESTIONS : []}
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
  fadingContent: {
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
