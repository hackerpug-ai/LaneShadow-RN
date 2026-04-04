/**
 * ChatInput - Primary conversational interface for ride planning
 *
 * Always-visible input bar at bottom of map screen.
 * Shows suggestion chips when idle, progress indicator when planning.
 *
 * States:
 * - IDLE: Shows suggestion chips above input
 * - PLANNING: Shows progress indicator with current phase
 * - ROUTE_RESULTS: Shows input for follow-up questions
 *
 * Note: This component manages its own input text state. The parent manages
 * the ride flow state (planning, error, success) but not the text input value.
 */

import React, { useState, useCallback } from 'react'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { ErrorMessage } from './error-message'
import { MotorcyclePlusIcon } from '../ui/motorcycle-plus-icon'
import type { RideFlowState } from '../../hooks/use-ride-flow'

type ChatInputProps = {
  onSend: (message: string) => void
  onCancel: () => void
  state: RideFlowState
  suggestions?: string[]
  testID?: string
  onNewSession?: () => void
}

/**
 * Planning progress indicator
 */
const PlanningProgress = ({ currentPhase }: { currentPhase: string | null }) => {
  const { semantic } = useSemanticTheme()

  const phases = [
    { key: 'analyzing', label: 'Analyzing request...' },
    { key: 'routing', label: 'Computing routes...' },
    { key: 'enriching', label: 'Adding weather data...' },
  ]

  const currentIndex = phases.findIndex((p) => p.key === currentPhase)
  const phaseLabel = currentIndex >= 0 ? phases[currentIndex].label : 'Planning...'

  return (
    <View
      style={[
        styles.progressContainer,
        {
          backgroundColor: semantic.color.surfaceVariant.default,
          padding: semantic.space.md,
          borderRadius: semantic.radius.md,
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Planning progress: ${phaseLabel}`}
    >
      <Text
        style={[
          semantic.type.body.sm,
          { color: semantic.color.onSurface.muted },
        ]}
      >
        {phaseLabel}
      </Text>
    </View>
  )
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
  suggestions = [],
  testID = 'chat-input',
  onNewSession,
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

  const isPlanning = state.phase === 'PLANNING'
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
      {/* Progress indicator when planning */}
      {isPlanning && (
        <PlanningProgress
          currentPhase={
            state.phase === 'PLANNING' ? state.currentPhase : null
          }
        />
      )}

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
            borderRadius: semantic.radius.full,
            borderWidth: 1,
            borderColor: semantic.color.border.default,
          },
        ]}
      >
        {/* New session button (left of input) */}
        {onNewSession && (
          <TouchableOpacity
            onPress={onNewSession}
            style={[
              styles.newSessionButton,
              {
                backgroundColor: semantic.color.surfaceVariant.default,
              },
            ]}
            testID="chat-input-new-session-button"
            accessibilityLabel="Start new ride session"
            accessibilityRole="button"
            accessibilityHint="Creates a new planning session"
          >
            <MotorcyclePlusIcon size={22} color={semantic.color.primary.default} />
          </TouchableOpacity>
        )}

        {/* Text input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              semantic.type.body.md,
              {
                color: semantic.color.onSurface.default,
                flex: 1,
              },
            ]}
            placeholder="Where would you like to ride?"
            placeholderTextColor={semantic.color.onSurface.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
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
  progressContainer: {
    width: '100%',
    maxWidth: 780,
    alignItems: 'center',
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
    alignItems: 'center',
    width: '100%',
    maxWidth: 780,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 24,
    justifyContent: 'center',
  },
  sendButton: {
    marginLeft: 'auto',
  },
  newSessionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
