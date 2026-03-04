/**
 * TemperatureBadge Component
 *
 * Badge for temperature indicators with semantic colors
 * Follows the design system badge patterns
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type TemperatureSummary = 'cold' | 'mild' | 'warm' | 'hot' | 'unavailable'

export type TemperatureBadgeProps = {
  /** Temperature level */
  temperatureSummary: TemperatureSummary
  /** Optional temperature value in Fahrenheit */
  temperatureValue?: number
  /** Test ID for testing */
  testID?: string
}

const TEMPERATURE_CONFIGS = {
  cold: {
    icon: 'snowflake-thermometer' as const,
    label: 'Cold',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    textColor: '#60a5fa',
  },
  mild: {
    icon: 'thermometer' as const,
    label: 'Mild',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    textColor: '#22c55e',
  },
  warm: {
    icon: 'thermometer-low' as const,
    label: 'Warm',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    textColor: '#fb923c',
  },
  hot: {
    icon: 'thermometer-high' as const,
    label: 'Hot',
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
 * TemperatureBadge component for temperature indicators
 * Displays badges with temperature icons and labels
 */
export const TemperatureBadge = ({
  temperatureSummary,
  temperatureValue,
  testID,
}: TemperatureBadgeProps) => {
  const theme = useTheme<ExtendedTheme>()
  const config = TEMPERATURE_CONFIGS[temperatureSummary]

  const displayLabel = temperatureValue !== undefined
    ? `${temperatureValue}°`
    : config.label

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
        {displayLabel}
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
