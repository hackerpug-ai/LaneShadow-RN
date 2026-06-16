/**
 * IntentSummaryPill Component
 *
 * Compact pill showing the active search intent.
 * Appears above search results when a cache hit or search completes.
 *
 * Following styles/RULES.md:
 * - useSemanticTheme() for all styling
 * - Copper accent for interactive elements
 * - Pressable for interactive states
 * - Glassmorphic overlay pattern
 */

import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'

export type IntentSummaryPillProps = {
  /** The search intent text to display (e.g., "Twisty mountain roads near you") */
  text: string
  /** Callback when user taps the dismiss button */
  onDismiss: () => void
  /** Optional test ID for testing */
  testID?: string
}

/**
 * IntentSummaryPill - Shows active search intent with dismiss button
 *
 * Visual treatment:
 * - Glassmorphic background with copper accent
 * - Compact pill shape
 * - Dismissible via X button
 * - Semi-transparent so map remains visible
 */
export const IntentSummaryPill = ({
  text,
  onDismiss,
  testID = 'intent-summary-pill',
}: IntentSummaryPillProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: `${semantic.color.primary.default}1A`, // 10% opacity
          borderRadius: semantic.radius.full,
          borderWidth: 1,
          borderColor: `${semantic.color.primary.default}4D`, // 30% opacity
        },
      ]}
      testID={testID}
    >
      {/* Copper accent dot */}
      <View
        style={[
          styles.accentDot,
          {
            backgroundColor: semantic.color.primary.default,
          },
        ]}
      />

      {/* Intent text */}
      <Text
        variant="labelMedium"
        style={[
          styles.text,
          {
            color: semantic.color.primary.default,
          },
        ]}
        numberOfLines={1}
      >
        {text}
      </Text>

      {/* Dismiss button */}
      <View
        style={[
          styles.dismissButton,
          {
            backgroundColor: `${semantic.color.primary.default}33`, // 20% opacity
            borderRadius: semantic.radius.full,
          },
        ]}
      >
        <IconSymbol
          name="close"
          size={16}
          color={semantic.color.primary.default}
          testID={`${testID}-dismiss`}
          // In production, this would be a Pressable
          // For design mock, we're just showing the visual
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    flex: 1,
  },
  dismissButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
