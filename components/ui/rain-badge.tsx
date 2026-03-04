/**
 * RainBadge Component
 *
 * Badge for rain intensity indicators with semantic colors
 * Follows the design system badge patterns
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type RainSummary = 'none' | 'light' | 'moderate' | 'heavy' | 'unavailable'

export type RainBadgeProps = {
  /** Rain intensity level */
  rainSummary: RainSummary
  /** Test ID for testing */
  testID?: string
}

const RAIN_CONFIGS = {
  none: {
    icon: 'check-circle-outline' as const,
    label: 'No rain',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    textColor: '#22c55e',
  },
  light: {
    icon: 'water-outline' as const,
    label: 'Light rain',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    textColor: '#60a5fa',
  },
  moderate: {
    icon: 'water' as const,
    label: 'Moderate rain',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    textColor: '#3b82f6',
  },
  heavy: {
    icon: 'weather-pouring' as const,
    label: 'Heavy rain',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#ef4444',
  },
  unavailable: {
    icon: 'help-circle-outline' as const,
    label: 'Unknown',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    textColor: 'rgba(255, 255, 255, 0.55)',
  },
}

/**
 * RainBadge component for rain intensity indicators
 * Displays badges with rain icons and intensity labels
 */
export const RainBadge = ({ rainSummary, testID }: RainBadgeProps) => {
  const theme = useTheme<ExtendedTheme>()
  const config = RAIN_CONFIGS[rainSummary]

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor },
      ]}
      testID={testID}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={14}
        color={config.textColor}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: config.textColor }]}>
        {config.label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: -2,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
})
