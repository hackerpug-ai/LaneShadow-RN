/**
 * Input Component
 * Text input field with semantic theme styling
 *
 * IMPORTANT: Keyboard handling for different container types:
 *
 * 1. GORHOM BOTTOM SHEETS - Use native keyboard handling:
 *   <BottomSheetWrapper hasTextInput={true}>
 *     <Input ... />
 *   </BottomSheetWrapper>
 *   Do NOT wrap in KeyboardAvoidingView — causes "double avoidance" conflicts.
 *
 * 2. REGULAR MODALS/FIXED CONTAINERS - Wrap with KeyboardAvoidingInput:
 *   import { KeyboardAvoidingInput } from './keyboard-avoiding-input'
 *   <KeyboardAvoidingInput>
 *     <Input ... />
 *   </KeyboardAvoidingInput>
 *
 * 3. SCROLLABLE FORMS - No wrapper needed, use ScrollView with keyboardShouldPersistTaps.
 *
 * Design specs from placesearch.designs.html:
 * - Container: bg-surface-elevated, rounded-xl, h-12 (48px)
 * - Icon: Left-aligned with primary color, pl-4 pr-2 spacing
 * - Input: Transparent bg, no border, flex-1, px-2
 * - Focus: ring-1 with ring-primary (on container)
 * - Font: text-base (16px), normal weight
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useState } from 'react'
import type { TextInputProps, TextStyle, ViewStyle } from 'react-native'
import { StyleSheet, TextInput, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { type IconName, IconSymbol } from './icon-symbol'

/**
 * Input component props
 */
export type InputProps = Omit<TextInputProps, 'style'> & {
  /** Optional label rendered above the input (uppercase, subtle color) */
  label?: string
  style?: ViewStyle
  inputStyle?: TextStyle
  error?: boolean
  /** Optional left icon name to render inside the input container */
  leftIcon?: IconName
  /** Optional right icon name to render inside the input container */
  rightIcon?: IconName
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
  leftIcon,
  rightIcon,
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

  // Use ring effect for focus state instead of border color
  const getRingStyle = (): any => {
    if (error) {
      return {
        borderWidth: 1,
        borderColor: semantic.color.danger.default,
      }
    }
    if (isFocused) {
      return {
        borderWidth: 1,
        borderColor: semantic.color.primary.default,
      }
    }
    return {}
  }

  // Get icon color based on state
  const getIconColor = (): string => {
    if (error) {
      return semantic.color.danger.default
    }
    if (!editable) {
      return semantic.color.onSurface.disabled ?? semantic.color.onSurface.muted ?? ''
    }
    // Design: muted when idle, primary on focus.
    return (isFocused ? semantic.color.primary.default : semantic.color.onSurface.muted) ?? ''
  }

  // Render an icon by name
  const renderIcon = (iconName?: IconName): React.ReactNode => {
    if (!iconName) return null
    return <IconSymbol name={iconName} size={20} color={getIconColor()} />
  }

  const inputField = (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: semantic.color.surface.default,
          borderRadius: semantic.radius.xl,
          height: 48, // h-12 from design
          opacity: editable ? 1 : 0.5,
          overflow: 'hidden',
        },
        getRingStyle(),
        style,
      ]}
    >
      <View style={styles.inputContent}>
        {/* Left icon container */}
        {leftIcon && <View style={styles.leftIconContainer}>{renderIcon(leftIcon)}</View>}

        {/* Text input */}
        <TextInput
          {...props}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={semantic.color.onSurface.subtle}
          style={[
            styles.textInput,
            {
              color: semantic.color.onSurface.default,
            },
            inputStyle,
          ]}
        />

        {/* Right icon container */}
        {rightIcon && <View style={styles.rightIconContainer}>{renderIcon(rightIcon)}</View>}
      </View>
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
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    height: '100%',
  },
  leftIconContainer: {
    paddingLeft: 16, // pl-4 from design
    paddingRight: 8, // pr-2 from design
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    paddingLeft: 8, // pr-2 from design (mirrored)
    paddingRight: 16, // pl-4 from design (mirrored)
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 8, // px-2 from design
    paddingVertical: 12, // Centered vertically in 48px container
    fontSize: 16, // text-base from design
    fontWeight: '400', // font-normal from design
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
})
