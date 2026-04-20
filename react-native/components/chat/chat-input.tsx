/**
 * ChatInput — bottom-anchored glass-panel query interface (UC-MOL-06)
 *
 * Three stacked layers: suggestion chips → input bar.
 * Input bar uses glass backing (semi-transparent surface), 54pt height, radius.xl.
 * Leading: 36pt collapse button. Trailing: filter icon when empty,
 * copper send button when non-empty, spinner when thinking.
 *
 * Authority: .spec/prds/v2/concepts/uc-mol-06-chatinput.html
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Icon } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { RideFlowState } from '../../hooks/use-ride-flow'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { ErrorMessage } from './error-message'

type ChatInputProps = {
  onSend: (message: string) => void
  onCancel: () => void
  state: RideFlowState
  /** Whether an assistant message is currently running or streaming */
  isPlanning: boolean
  suggestions?: string[]
  testID?: string
  /** Whether chat mode is currently active (transcript visible) */
  chatMode?: boolean
  /** Handler for the mode-toggle button */
  onToggleChatMode?: () => void
  /** Handler for manual planning mode icon */
  onManualModePress?: () => void
  /** Whether the session has any messages */
  hasMessages?: boolean
  /** Extra bottom padding for temporary elements above */
  extraBottomOffset?: number
  /** Dispatch function for clearing error state */
  dispatch?: (action: { type: string }) => void
}

/**
 * Suggestion chips — glass-backed pills matching UC-MOL-06 spec
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
        { gap: semantic.space.sm, paddingHorizontal: semantic.space.sm },
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
              borderRadius: semantic.radius.full,
            },
          ]}
          accessibilityLabel={`Suggestion: ${suggestion}`}
          accessibilityRole="button"
        >
          <Text
            style={[
              semantic.type.body.sm,
              {
                color: semantic.color.onSurface.default,
                fontWeight: '500',
                fontSize: 11.5,
              },
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
 * Thinking spinner — replaces trailing send/filter button
 */
const ThinkingSpinner = ({ size }: { size: number }) => {
  const { semantic } = useSemanticTheme()

  return (
    <View style={[styles.spinnerContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.spinnerRing,
          {
            width: size * 0.48,
            height: size * 0.48,
            borderColor: semantic.color.border.default,
            borderTopColor: semantic.color.primary.default,
          },
        ]}
      />
    </View>
  )
}

/**
 * Main ChatInput component — UC-MOL-06
 */
export const ChatInput = ({
  onSend,
  onCancel,
  state,
  isPlanning,
  suggestions = [],
  testID = 'chat-input',
  onToggleChatMode,
  onManualModePress,
  hasMessages = false,
  extraBottomOffset = 0,
  dispatch,
}: ChatInputProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  // Auto-dismiss error after 6 seconds
  useEffect(() => {
    if (state.phase === 'ERROR' && 'errorTimestamp' in state && state.errorTimestamp) {
      const timer = setTimeout(() => {
        dispatch?.({ type: 'CLEAR_ERROR' })
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [state.phase, dispatch, state])

  const handleSend = useCallback(() => {
    if (isPlanning) return
    const trimmed = text.trim()
    if (trimmed.length > 0) {
      onSend(trimmed)
      setText('')
    }
  }, [text, onSend, isPlanning])

  const isIdle = state.phase === 'IDLE'
  const isError = state.phase === 'ERROR'
  const hasText = text.length > 0
  const errorMessage = isError ? state.errorMessage : null

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      onSend(suggestion)
    },
    [onSend],
  )

  // Dimensions from mock: 54pt height, 18pt radius, 14pt left pad, 6pt right pad
  const inputHeight = 54
  const leadingBtnSize = 36
  const trailingBtnSize = 42
  const iconSize = 18

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      pointerEvents="box-none"
      style={styles.container}
      testID={testID}
    >
      <Pressable
        style={{
          paddingBottom:
            (keyboardVisible ? 0 : insets.bottom) + semantic.space.md + extraBottomOffset,
        }}
        onPress={Keyboard.dismiss}
      >
        {/* Error message */}
        {isError && errorMessage && (
          <View style={{ paddingHorizontal: semantic.space.md }}>
            <ErrorMessage message={errorMessage} testID="chat-error-message" />
          </View>
        )}

        {/* Suggestion chips when idle AND no messages */}
        {isIdle && !hasMessages && suggestions.length > 0 && !isPlanning && (
          <SuggestionChips suggestions={suggestions} onSelect={handleSelectSuggestion} />
        )}

        {/* Input bar — glass panel backing */}
        <View style={[styles.inputRow, { paddingHorizontal: semantic.space.md }]}>
          <View
            style={[
              styles.inputGlassPanel,
              {
                height: inputHeight,
                borderRadius: 18,
                backgroundColor: semantic.color.surface.default,
                borderColor: semantic.color.border.default,
                ...semantic.elevation[3],
              },
            ]}
          >
            {/* Leading: collapse/manual-mode button — 36pt ghost */}
            {onManualModePress && (
              <TouchableOpacity
                onPress={onManualModePress}
                style={[
                  styles.leadingButton,
                  {
                    width: leadingBtnSize,
                    height: leadingBtnSize,
                    borderRadius: leadingBtnSize / 2,
                  },
                ]}
                testID="chat-input-manual-mode-button"
                accessibilityLabel="Switch to manual planning"
                accessibilityHint="Opens the manual ride planning sheet"
                accessibilityRole="button"
              >
                <Icon
                  source="chat-outline"
                  size={iconSize}
                  color={semantic.color.onSurface.muted}
                />
              </TouchableOpacity>
            )}

            {/* Text field */}
            <TextInput
              style={[
                semantic.type.body.md,
                styles.textInput,
                { color: semantic.color.onSurface.default },
                isPlanning && styles.inputDisabled,
              ]}
              placeholder="Plan a ride…"
              placeholderTextColor={semantic.color.onSurface.muted}
              value={text}
              onChangeText={setText}
              multiline={false}
              textAlignVertical="center"
              blurOnSubmit={false}
              editable={!isPlanning}
              testID="chat-input-text-field"
              accessibilityLabel="Chat input field"
              accessibilityHint={
                isPlanning
                  ? 'Input is disabled while planning'
                  : 'Type your ride request and tap send'
              }
            />

            {/* Trailing slot: spinner | send | filter */}
            {isPlanning ? (
              <TouchableOpacity
                onPress={onCancel}
                style={[
                  styles.trailingButton,
                  {
                    width: trailingBtnSize,
                    height: trailingBtnSize,
                    borderRadius: trailingBtnSize / 2,
                  },
                ]}
                testID="chat-input-cancel-button"
                accessibilityLabel="Cancel planning"
                accessibilityRole="button"
              >
                <ThinkingSpinner size={trailingBtnSize} />
              </TouchableOpacity>
            ) : hasText ? (
              <TouchableOpacity
                onPress={handleSend}
                style={[
                  styles.sendButton,
                  {
                    width: trailingBtnSize,
                    height: trailingBtnSize,
                    borderRadius: trailingBtnSize / 2,
                    backgroundColor: semantic.color.primary.default,
                  },
                ]}
                testID="chat-input-send-button"
                accessibilityLabel="Send message"
                accessibilityHint="Sends your ride request to the planning assistant"
                accessibilityRole="button"
              >
                <Icon
                  source="arrow-right"
                  size={iconSize}
                  color={semantic.color.onPrimary.default}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={onToggleChatMode}
                style={[
                  styles.trailingButton,
                  {
                    width: trailingBtnSize,
                    height: trailingBtnSize,
                    borderRadius: trailingBtnSize / 2,
                  },
                ]}
                testID="chat-input-filter-button"
                accessibilityLabel="Filter options"
                accessibilityRole="button"
              >
                <Icon source="tune" size={iconSize} color={semantic.color.onSurface.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Pressable>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: 20,
    alignItems: 'center',
  },
  chipsContainer: {
    maxWidth: 780,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  inputGlassPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 780,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 10,
    borderWidth: 1,
  },
  leadingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '400',
    padding: 0,
    height: 24,
  },
  inputDisabled: {
    opacity: 0.38,
  },
  trailingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  spinnerRing: {
    borderWidth: 2,
    borderRadius: 50,
  },
})
