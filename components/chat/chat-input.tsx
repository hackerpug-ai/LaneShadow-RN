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
 * This is a controlled component - all state managed by parent.
 */

import React, { useState } from 'react'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RideFlowState } from '../../hooks/use-ride-flow'

type ChatInputProps = {
  onSend: (message: string) => void
  onCancel: () => void
  state: RideFlowState
  suggestions?: string[]
  testID?: string
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

  return (
    <View
      style={[
        styles.progressContainer,
        {
          backgroundColor: semantic.color.surface.secondary,
          padding: semantic.space.md,
          borderRadius: semantic.radius.md,
        },
      ]}
    >
      <Text
        style={[
          semantic.type.body.sm,
          { color: semantic.color.onSurface.secondary },
        ]}
      >
        {currentIndex >= 0 ? phases[currentIndex].label : 'Planning...'}
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
              backgroundColor: semantic.color.surface.secondary,
              paddingHorizontal: semantic.space.md,
              paddingVertical: semantic.space.sm,
              borderRadius: semantic.radius.full,
            },
          ]}
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
}: ChatInputProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')

  const handleSend = () => {
    const trimmed = text.trim()
    if (trimmed.length > 0) {
      onSend(trimmed)
      setText('')
    }
  }

  const isPlanning = state.phase === 'PLANNING'
  const isIdle = state.phase === 'IDLE'

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

      {/* Suggestion chips when idle */}
      {isIdle && suggestions.length > 0 && !isPlanning && (
        <SuggestionChips
          suggestions={suggestions}
          onSelect={(suggestion) => {
            setText(suggestion)
            setTimeout(() => handleSend(), 100)
          }}
        />
      )}

      {/* Input bar */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: semantic.color.surface.primary,
            borderRadius: semantic.radius.full,
            borderWidth: 1,
            borderColor: semantic.color.outline.default,
          },
        ]}
      >
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
            placeholderTextColor={semantic.color.onSurface.variant}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            testID="chat-input-text-field"
          />
        </View>

        {/* Action button */}
        <TouchableOpacity
          onPress={isPlanning ? onCancel : handleSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: isPlanning
                ? semantic.color.error.default
                : semantic.color.primary.default,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
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
})
