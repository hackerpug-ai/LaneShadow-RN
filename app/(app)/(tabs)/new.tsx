/**
 * New Chat Screen
 *
 * Lazy session creation screen — shows a ready-to-use chat interface without
 * requiring a session ID. The session is created only when the user sends their
 * first message.
 *
 * This screen uses the same UI as chat.tsx but with sessionId={undefined}.
 * Messages appear optimistically for instant feedback.
 */

import { StyleSheet, View, Pressable, Keyboard } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { Text } from 'react-native-paper'
import { ChatInput } from '../../../components/chat'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { ChatTranscript } from '../../../components/ui/chat-transcript'
import type { ChatMessage } from '../../../components/ui/chat-transcript'
import { useChatPlanning } from '../../../hooks/use-chat-planning'
import { useCurrentLocation } from '../../../hooks/use-current-location'
import { useRideFlow } from '../../../hooks/use-ride-flow'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import React from 'react'

const CHAT_SUGGESTIONS = [
  'Plan a scenic ride',
  'Ride to the coast',
  'Find coffee nearby',
  'Avoid highways',
]

export default function NewChatScreen() {
  console.info('[NewChatScreen] Component mounting')

  const { semantic } = useSemanticTheme()

  // Local flow state for composing/sending from the chat screen
  const { state: flowState, dispatch: flowDispatch } = useRideFlow()
  const { sendPlanningMessage, cancel: cancelChatPlanning, sessionId, isSending, optimisticMessages } = useChatPlanning(flowDispatch)
  const { location: currentLocation } = useCurrentLocation()

  console.info('[NewChatScreen] Hooks initialized', {
    hasFlowState: !!flowState,
    hasCurrentLocation: !!currentLocation,
    sessionId,
    optimisticMessagesCount: optimisticMessages.length,
  })

  // Map optimistic messages to ChatMessage format
  const chatMessages: ChatMessage[] = optimisticMessages.map((msg) => ({
    id: msg.id,
    role: msg.role === 'agent' ? 'agent' : 'rider',
    content: msg.content,
    timestamp: msg.timestamp,
  }))

  // Wrap send to forward device location (when available) to the agent.
  const handleSendMessage = (text: string) =>
    sendPlanningMessage(
      text,
      currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined
    )

  // Dismiss keyboard when tapping outside the input
  const handleDismissKeyboard = () => {
    Keyboard.dismiss()
  }

  console.info('[NewChatScreen] Render state', {
    sessionId,
    isSending,
    messagesCount: chatMessages.length,
  })

  return (
    <View style={styles.root}>
      <SubpageLayout
        title="Chat"
        testID="new-chat-screen"
      >
        {/* Staggered fade so the transcript resolves in place, not snapping */}
        <Pressable
          style={styles.body}
          onPress={handleDismissKeyboard}
          testID="new-chat-screen-dismiss-keyboard-pressable"
        >
          <Animated.View
            entering={FadeIn.duration(260).delay(40)}
            style={StyleSheet.absoluteFill}
          >
            {chatMessages.length === 0 ? (
              /* Empty state for new chat - no messages yet */
              <View style={styles.centeredState}>
                <Text
                  variant="bodyMedium"
                  style={[styles.emptyText, { color: semantic.color.onSurface.muted }]}
                  testID="new-chat-screen-empty-state"
                >
                  Start a conversation below — describe the ride you want.
                </Text>
              </View>
            ) : (
              /* Show optimistic messages */
              <ChatTranscript
                messages={chatMessages}
                bottomInset={140}
              />
            )}
          </Animated.View>
        </Pressable>
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
          isPlanning={isSending ?? false}
          suggestions={CHAT_SUGGESTIONS}
          testID="new-chat-screen-input"
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
