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

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useState } from 'react'
import type { TextInputProps, ViewStyle } from 'react-native'
import { StyleSheet, TextInput, View } from 'react-native'

/**
 * Input component props
 */
export type InputProps = Omit<TextInputProps, 'style'> & {
  style?: ViewStyle
  error?: boolean
}

/**
 * Input component using semantic theme
 * Supports focus states and disabled styling
 */
export const Input = ({
  style,
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

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.input.default,
          borderRadius: semantic.radius.md,
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
            height: 40,
            paddingHorizontal: semantic.space.md,
            paddingVertical: semantic.space.sm,
            color: semantic.color.onSurface.default,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
})

