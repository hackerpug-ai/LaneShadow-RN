/**
 * SectionHeader Component
 *
 * Section title with optional action button
 * Follows the design system header patterns
 */

import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type SectionHeaderProps = {
  /** Section title */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** Optional action button text */
  action?: string
  /** Action button press handler */
  onActionPress?: () => void
}

/**
 * SectionHeader component for section titles
 * Displays title with optional subtitle and action button
 */
export const SectionHeader = ({ title, subtitle, action, onActionPress }: SectionHeaderProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: semantic.color.onSurface.default }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: semantic.color.onSurface.subtle }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {action && (
        <Text
          style={[styles.action, { color: semantic.color.primary.default }]}
          onPress={onActionPress}
        >
          {action}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  action: {
    fontSize: 16,
    fontWeight: '500',
  },
})
