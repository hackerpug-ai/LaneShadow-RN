/**
 * ChatInput — bottom-anchored glass-panel query interface (UC-MOL-06)
 *
 * Two stacked layers: suggestion chips → input row.
 * The input row holds the glass field plus a standalone chat-view icon button
 * to its right (outside the field).
 *
 * Field: glass backing (semi-transparent surface), 54pt height, radius.xl.
 *   - No leading button.
 *   - Trailing: copper send button, disabled (muted) until there is text;
 *     swaps to a cancel/spinner while thinking.
 * Right of field: round glass chat-view toggle (separate tap target).
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
  /** Handler for the standalone chat-view toggle button (right of the field) */
  onToggleChatMode?: () => void
  /**
   * @deprecated The in-field manual-mode button was removed; manual planning now
   * lives in the Plan-a-ride drawer entry. Kept optional for call-site compatibility.
   */
  onManualModePress?: () => void
  /** Whether the session has any messages */
  hasMessages?: boolean
  /** @deprecated Use hasActiveRoute instead - whether there's an active route plan */
  hasActiveRoute?: boolean
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
  chatMode = false,
  onToggleChatMode,
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

  // Dimensions from mock: 54pt field, 18pt radius, 14pt left pad, 6pt right pad
  const inputHeight = 54
  const trailingBtnSize = 42
  const chatViewBtnSize = 48
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
        testID="chat-input-suggestion-chips"
      >
        {/* Error message */}
        {isError && errorMessage && (
          <View style={{ paddingHorizontal: semantic.space.md }}>
            <ErrorMessage message={errorMessage} testID="chat-error-message" />
          </View>
        )}

        {/* Suggestion chips when idle AND no active route */}
        {isIdle && !hasActiveRoute && suggestions.length > 0 && !isPlanning && !chatMode && (
          <SuggestionChips suggestions={suggestions} onSelect={handleSelectSuggestion} />
        )}

        {/* Input row — glass field + standalone chat-view toggle to its right */}
        <View
          style={[
            styles.inputRow,
            { paddingHorizontal: semantic.space.md, gap: semantic.space.sm },
          ]}
        >
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
              onSubmitEditing={handleSend}
              returnKeyType="send"
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

            {/* Trailing slot: cancel/spinner while thinking, else send (disabled until text) */}
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
            ) : (
              <TouchableOpacity
                onPress={handleSend}
                disabled={!hasText}
                style={[
                  styles.sendButton,
                  {
                    width: trailingBtnSize,
                    height: trailingBtnSize,
                    borderRadius: trailingBtnSize / 2,
                    backgroundColor: hasText
                      ? semantic.color.primary.default
                      : semantic.color.surfaceVariant.default,
                  },
                ]}
                testID="chat-input-send-button"
                accessibilityLabel="Send message"
                accessibilityHint="Sends your ride request to the planning assistant"
                accessibilityRole="button"
                accessibilityState={{ disabled: !hasText }}
              >
                <Icon
                  source="arrow-right"
                  size={iconSize}
                  color={
                    hasText
                      ? semantic.color.onPrimary.default
                      : semantic.color.onSurface.muted
                  }
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Standalone chat-view toggle — separate tap target outside the field */}
          {onToggleChatMode && (
            <TouchableOpacity
              onPress={onToggleChatMode}
              style={[
                styles.chatViewButton,
                {
                  width: chatViewBtnSize,
                  height: chatViewBtnSize,
                  borderRadius: chatViewBtnSize / 2,
                  backgroundColor: chatMode
                    ? semantic.color.primary.default
                    : semantic.color.surface.default,
                  borderColor: chatMode
                    ? semantic.color.primary.default
                    : semantic.color.border.default,
                  ...semantic.elevation[2],
                },
              ]}
              testID="chat-input-chat-view-button"
              accessibilityLabel={chatMode ? 'Hide chat' : 'Show chat'}
              accessibilityHint="Toggles the conversation transcript"
              accessibilityRole="button"
              accessibilityState={{ selected: chatMode }}
            >
              <Icon
                source={chatMode ? 'chat' : 'chat-outline'}
                size={iconSize + 2}
                color={
                  chatMode
                    ? semantic.color.onPrimary.default
                    : semantic.color.onSurface.muted
                }
              />
            </TouchableOpacity>
          )}
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
    paddingLeft: 18,
    paddingRight: 6,
    gap: 10,
    borderWidth: 1,
  },
  chatViewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    includeFontPadding: false,
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
