/**
 * OverlayPill Component
 *
 * Toggle pill for weather overlays (wind, rain, temp)
 * Follows the design system toggle patterns
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type OverlayPillProps = {
  /** Icon name from MaterialCommunityIcons */
  icon: string
  /** Label text */
  label: string
  /** Active state */
  active?: boolean
  /** Press handler */
  onPress?: () => void
  /** Icon size */
  iconSize?: number
}

/**
 * OverlayPill component for weather overlay toggles
 * Displays interactive pills for wind, rain, and temperature overlays
 */
export const OverlayPill = ({
  icon,
  label,
  active = false,
  onPress,
  iconSize = 16,
}: OverlayPillProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  const backgroundColor = active
    ? 'rgba(184, 115, 51, 0.2)'
    : 'rgba(255, 255, 255, 0.05)'

  const color = active
    ? semantic.color.primary.default
    : semantic.color.onSurface.subtle

  const borderColor = active
    ? 'rgba(184, 115, 51, 0.3)'
    : 'transparent'

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={iconSize}
        color={color}
      />
      <Text style={[styles.label, { color }]}>{label}</Text>
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
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
})
