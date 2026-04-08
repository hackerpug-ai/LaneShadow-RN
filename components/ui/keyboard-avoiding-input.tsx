/**
 * KeyboardAvoidingInput Component
 *
 * Global wrapper for any input that needs keyboard avoidance in bottom sheets or modals.
 * Prevents the keyboard from hiding the input field by wrapping it with KeyboardAvoidingView.
 *
 * IMPORTANT: Use this component for ALL text inputs in bottom sheets, modals, or any
 * container where the keyboard might obscure the input field.
 *
 * Usage:
 *   <KeyboardAvoidingInput>
 *     <Input ... />
 *   </KeyboardAvoidingInput>
 *
 * Or with custom behavior:
 *   <KeyboardAvoidingInput behavior="position" offset={20}>
 *     <Textarea ... />
 *   </KeyboardAvoidingInput>
 *
 * Following coding standards: composition over inheritance, named exports
 */

import type { ReactNode } from 'react'
import { StyleSheet, View, Platform, KeyboardAvoidingView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type KeyboardAvoidingInputProps = {
  children: ReactNode
  /**
   * How the keyboard avoidance should behave.
   * - 'padding': The default - adds padding to bottom of container
   * - 'position': Repositions the container (useful for fixed positioning)
   * - 'height': Adjusts container height (Android only)
   */
  behavior?: 'padding' | 'position' | 'height'
  /**
   * Extra vertical offset to add beyond keyboard avoidance.
   * Useful when you need additional spacing above the keyboard.
   */
  offset?: number
  /**
   * Whether to add safe area bottom padding.
   * Defaults to true for bottom sheets/modals.
   */
  includeSafeAreaBottom?: boolean
  /**
   * Optional custom style for the wrapper container
   */
  style?: any
  /**
   * Test ID for testing
   */
  testID?: string
}

/**
 * KeyboardAvoidingInput wrapper component
 *
 * Provides consistent keyboard avoidance behavior across all input fields
 * in bottom sheets, modals, and other containers where keyboard might hide inputs.
 */
export const KeyboardAvoidingInput = ({
  children,
  behavior,
  offset = 0,
  includeSafeAreaBottom = true,
  style,
  testID,
}: KeyboardAvoidingInputProps): React.ReactNode => {
  const insets = useSafeAreaInsets()

  // Default behavior based on platform
  const defaultBehavior = Platform.OS === 'ios' ? 'padding' : undefined

  return (
    <KeyboardAvoidingView
      behavior={behavior ?? defaultBehavior}
      keyboardVerticalOffset={offset}
      style={[styles.container, style]}
      testID={testID}
    >
      <View
        style={[
          styles.content,
          includeSafeAreaBottom && {
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {children}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    width: '100%',
  },
})
