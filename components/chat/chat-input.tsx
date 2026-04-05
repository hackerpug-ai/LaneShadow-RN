/**
 * ChatInput - Primary conversational interface for ride planning
 *
 * Always-visible input bar at bottom of map screen.
 * Shows suggestion chips when idle. Per-message status is surfaced inline
 * by the transcript (running/streaming rows render their own indicators);
 * this component no longer renders a global planning loader.
 *
 * States:
 * - IDLE: Shows suggestion chips above input
 * - PLANNING: Send button becomes a cancel button (×)
 * - ROUTE_RESULTS: Shows input for follow-up questions
 *
 * Note: This component manages its own input text state. The parent manages
 * the ride flow state (planning, error, success) but not the text input value.
 *
 * `isPlanning` is derived by the parent from the live session_messages query
 * (e.g. "any message with status running|streaming") and passed in as a prop,
 * so the cancel affordance stays in sync with actual agent activity.
 */

import { useState, useCallback } from 'react'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { ErrorMessage } from './error-message'
import type { RideFlowState } from '../../hooks/use-ride-flow'

type ChatInputProps = {
  onSend: (message: string) => void
  onCancel: () => void
  state: RideFlowState
  /**
   * Whether an assistant message is currently running or streaming. When
   * true, the send button becomes a cancel (×) button. Derived by the parent
   * from the Convex `session_messages` query.
   */
  isPlanning: boolean
  suggestions?: string[]
  testID?: string
}

/**
 * Suggestion chips for idle state
 */
const SuggestionChips = ({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}) => {
  const { semantic } = useSemanticTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.chipsContainer,
        { gap: semantic.space.sm },
      ]}
    >
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelect(suggestion)}
          style={[
            styles.chip,
            {
              backgroundColor: semantic.color.surfaceVariant.default,
              paddingHorizontal: semantic.space.md,
              paddingVertical: semantic.space.sm,
              borderRadius: semantic.radius.full,
            },
          ]}
          accessibilityLabel={`Suggestion: ${suggestion}`}
          accessibilityRole="button"
        >
          <Text
            style={[
              semantic.type.body.sm,
              { color: semantic.color.primary.default },
            ]}
          >
            {suggestion}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

/**
 * Main ChatInput component
 */
export const ChatInput = ({
  onSend,
  onCancel,
  state,
  isPlanning,
  suggestions = [],
  testID = 'chat-input',
}: ChatInputProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (trimmed.length > 0) {
      onSend(trimmed)
      setText('')
    }
  }, [text, onSend])

  const isIdle = state.phase === 'IDLE'
  const isError = state.phase === 'ERROR'

  // In ERROR state, sessionId might be null - handle gracefully
  const errorMessage = isError ? state.errorMessage : null

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      // Send the suggestion directly without using setTimeout
      // This avoids potential memory leaks from uncleaned timeouts
      onSend(suggestion)
    },
    [onSend]
  )

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + semantic.space.md,
          paddingHorizontal: semantic.space.md,
        },
      ]}
      testID={testID}
    >
      {/* Error message when in ERROR state */}
      {isError && errorMessage && (
        <ErrorMessage message={errorMessage} testID="chat-error-message" />
      )}

      {/* Suggestion chips when idle */}
      {isIdle && suggestions.length > 0 && !isPlanning && (
        <SuggestionChips
          suggestions={suggestions}
          onSelect={handleSelectSuggestion}
        />
      )}

      {/* Input bar */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: semantic.color.surface.default,
            borderRadius: semantic.radius.xl,
            borderWidth: 1,
            borderColor: semantic.color.border.default,
          },
        ]}
      >
        {/* Text input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              semantic.type.body.md,
              styles.textInput,
              {
                color: semantic.color.onSurface.default,
              },
            ]}
            placeholder="Where would you like to ride?"
            placeholderTextColor={semantic.color.onSurface.muted}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            blurOnSubmit={false}
            testID="chat-input-text-field"
            accessibilityLabel="Chat input field"
            accessibilityHint="Type your ride request and tap send"
          />
        </View>

        {/* Action button */}
        <TouchableOpacity
          onPress={isPlanning ? onCancel : handleSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: isPlanning
                ? semantic.color.danger.default
                : semantic.color.primary.default,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
          testID="chat-input-send-button"
          accessibilityLabel={isPlanning ? 'Cancel planning' : 'Send message'}
          accessibilityHint={
            isPlanning
              ? 'Cancels the current ride planning operation'
              : 'Sends your ride request to the planning assistant'
          }
          accessibilityRole="button"
        >
          <Text
            style={[
              semantic.type.body.md,
              { color: semantic.color.onPrimary.default },
            ]}
          >
            {isPlanning ? '✕' : '↑'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    alignItems: 'center',
    gap: 8,
  },
  chipsContainer: {
    width: '100%',
    maxWidth: 780,
    paddingHorizontal: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    maxWidth: 780,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 24,
    justifyContent: 'center',
    paddingBottom: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 24,
    maxHeight: 140,
    padding: 0,
  },
  sendButton: {
    marginLeft: 'auto',
  },
})
