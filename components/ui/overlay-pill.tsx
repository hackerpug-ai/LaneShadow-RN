/**
 * OverlayPill Component
 *
 * Toggle pill for weather overlays (wind, rain, temp)
 * Follows the design system toggle patterns
 */

import { IconSymbol, type IconName } from './icon-symbol'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type OverlayPillProps = {
  /** Icon name from MaterialCommunityIcons */
  icon: IconName
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
    ? semantic.color.primary.default + '33' // Add 20% alpha
    : semantic.color.divider.default

  const color = active
    ? semantic.color.primary.default
    : semantic.color.onSurface.subtle

  const borderColor = active
    ? semantic.color.primary.default + '4D' // Add 30% alpha
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
      <IconSymbol
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
