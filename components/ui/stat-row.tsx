/**
 * StatRow Component
 *
 * Row showing stat with icon and value (duration, distance, wind level)
 * Follows the design system stat display patterns
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type StatRowProps = {
  /** Icon name from MaterialCommunityIcons */
  icon: string
  /** Value text */
  value: string
  /** Icon size */
  iconSize?: number
}

/**
 * StatRow component for displaying stat with icon and value
 * Used for duration, distance, wind level, etc.
 */
export const StatRow = ({ icon, value, iconSize = 18 }: StatRowProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons
        name={icon}
        size={iconSize}
        color={semantic.color.onSurface.subtle}
      />
      <Text style={[styles.value, { color: semantic.color.onSurface.default }]}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 14,
  },
})
