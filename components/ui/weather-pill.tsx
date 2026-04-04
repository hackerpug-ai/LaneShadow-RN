/**
 * WeatherPill Component
 *
 * Weather condition pill with icon and description
 * Follows the design system pill patterns
 */

import { IconSymbol } from './icon-symbol'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type WeatherPillProps = {
  /** Icon name from MaterialCommunityIcons */
  icon: string
  /** Weather description text */
  description: string
  /** Icon size */
  iconSize?: number
  /** Background color override (for warning colors) */
  backgroundColor?: string
  /** Text color override */
  textColor?: string
}

/**
 * WeatherPill component for weather condition indicators
 * Displays pills with weather icons and descriptions
 */
export const WeatherPill = ({
  icon,
  description,
  iconSize = 16,
  backgroundColor,
  textColor,
}: WeatherPillProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  const bgColor = backgroundColor || semantic.color.warning.default + '26' // Add 15% alpha
  const color = textColor || semantic.color.warning.default

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: bgColor,
        },
      ]}
    >
      <IconSymbol name={icon} size={iconSize} color={color} />
      <Text style={[styles.description, { color }]}>{description}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  description: {
    fontSize: 13,
  },
})
