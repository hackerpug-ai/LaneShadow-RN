/**
 * Input Component
 * Text input field with semantic theme styling
 *
 * Specs from README 7.2:
 * - Input height: 40px with px-3 py-2 padding
 * - Border: 1px with semantic.color.border
 * - Focus state: ring-2 with ring-offset-2
 * - Font: text-base (16px) on mobile, text-sm (14px) on desktop
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useState } from 'react'
import type { TextInputProps, TextStyle, ViewStyle } from 'react-native'
import { StyleSheet, TextInput, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

/**
 * Input component props
 */
export type InputProps = Omit<TextInputProps, 'style'> & {
  /** Optional label rendered above the input (uppercase, subtle color) */
  label?: string
  style?: ViewStyle
  inputStyle?: TextStyle
  error?: boolean
}

/**
 * Input component using semantic theme
 * Supports focus states, labels, and disabled styling
 */
export const Input = ({
  label,
  style,
  inputStyle,
  error = false,
  editable = true,
  onFocus,
  onBlur,
  ...props
}: InputProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = (e: any) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e: any) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  const getBorderColor = (): string => {
    if (error) {
      return semantic.color.danger.default
    }
    if (isFocused) {
      return semantic.color.ring.default
    }
    return semantic.color.border.default
  }

  const inputField = (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: semantic.color.input.default,
          borderRadius: semantic.radius.lg,
          borderWidth: 1,
          borderColor: getBorderColor(),
          opacity: editable ? 1 : 0.5,
        },
        isFocused && {
          borderWidth: 2,
          borderColor: semantic.color.ring.default,
        },
        style,
      ]}
    >
      <TextInput
        {...props}
        editable={editable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={semantic.color.onSurface.subtle}
        style={[
          semantic.type.body.md,
          {
            height: semantic.space['3xl'],
            paddingHorizontal: semantic.space.lg,
            paddingVertical: semantic.space.xs,
            color: semantic.color.onSurface.default,
          },
          inputStyle,
        ]}
      />
    </View>
  )

  if (!label) {
    return inputField
  }

  return (
    <View style={styles.wrapper}>
      <Text
        variant="labelSmall"
        style={{
          color: semantic.color.onSurface.subtle,
          textTransform: 'uppercase',
          paddingLeft: semantic.space.xs,
        }}
      >
        {label}
      </Text>
      {inputField}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 4,
  },
  inputContainer: {
    width: '100%',
  },
})
