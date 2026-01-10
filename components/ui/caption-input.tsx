/**
 * Caption Input Component
 *
 * Reusable multi-line input with action buttons (mentions, AI assist, send)
 * Following theme_rules.mdc - semantic theme usage throughout
 */

import { IconSymbol } from '../ui/icon-symbol'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

export type CaptionInputProps = {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  placeholder?: string
  testID?: string
}

export const CaptionInput = ({
  value,
  onChangeText,
  onSend,
  placeholder = 'Add a caption...',
  testID,
}: CaptionInputProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.surface.default,
          borderRadius: semantic.radius.xl,
          padding: semantic.space.md,
        },
      ]}
      testID={testID}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={semantic.color.onSurface.subtle}
        multiline
        numberOfLines={3}
        style={[
          semantic.type.body.md,
          styles.input,
          {
            color: semantic.color.onSurface.default,
          },
        ]}
        testID={testID ? `${testID}-input` : undefined}
      />

      {/* Action Buttons */}
      <View
        style={[
          styles.actionButtons,
          {
            gap: semantic.space.xs,
          },
        ]}
      >
        {/* @ Mentions Button - Disabled for now */}
        <Pressable
          disabled
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed
                ? semantic.color.surface.pressed
                : semantic.color.surface.default,
              borderRadius: semantic.radius.full,
              padding: semantic.space.sm,
              opacity: 0.4,
            },
          ]}
          testID={testID ? `${testID}-mention-button` : undefined}
        >
          <IconSymbol
            name="at"
            size={20}
            color={semantic.color.onSurface.muted || semantic.color.onSurface.default}
          />
        </Pressable>

        {/* AI Assist Button - Disabled for now */}
        <Pressable
          disabled
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed
                ? semantic.color.surface.pressed
                : semantic.color.surface.default,
              borderRadius: semantic.radius.full,
              padding: semantic.space.sm,
              opacity: 0.4,
            },
          ]}
          testID={testID ? `${testID}-ai-button` : undefined}
        >
          <IconSymbol
            name="auto-fix"
            size={20}
            color={semantic.color.onSurface.muted || semantic.color.onSurface.default}
          />
        </Pressable>

        {/* Send Button */}
        <Pressable
          onPress={onSend}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed
                ? semantic.color.primary.pressed
                : semantic.color.primary.default,
              borderRadius: semantic.radius.full,
              padding: semantic.space.sm,
            },
          ]}
          testID={testID ? `${testID}-send-button` : undefined}
        >
          <IconSymbol name="send" size={20} color={semantic.color.onPrimary.default} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    minHeight: 80,
    maxHeight: 120,
    paddingRight: 120, // Space for action buttons
    textAlignVertical: 'top',
  },
  actionButtons: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
