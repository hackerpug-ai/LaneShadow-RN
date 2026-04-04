/**
 * ErrorMessage - Conversational error display for chat interface
 *
 * Shows errors as chat bubbles with helpful messaging.
 * Matches chat bubble styling for consistency.
 *
 * Error types:
 * - Rate limit: Upsell message
 * - Parse failure: Suggests better phrasing
 * - Generation failure: Recommends different destination
 * - Timeout: Asks to retry
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

export type ErrorMessageProps = {
  message: string
  testID?: string
}

/**
 * ErrorMessage component
 *
 * Displays error messages in a conversational format.
 * Uses warning color scheme to distinguish from regular messages.
 */
export const ErrorMessage = ({ message, testID = 'error-message' }: ErrorMessageProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.errorContainer,
        {
          backgroundColor: semantic.color.surfaceVariant.default,
          borderColor: semantic.color.warning.default,
          borderRadius: semantic.radius.lg,
          borderWidth: 1,
          padding: semantic.space.md,
        },
      ]}
      testID={testID}
    >
      <Text
        variant="bodyMedium"
        style={{ color: semantic.color.onSurface.default }}
      >
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    marginVertical: 4,
  },
})
