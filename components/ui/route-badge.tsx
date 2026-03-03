/**
 * RouteBadge Component
 *
 * Badge for route attributes (scenic, distance, time)
 * Follows the design system badge patterns
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type RouteBadgeVariant = 'primary' | 'neutral'

export type RouteBadgeProps = {
  /** Badge content */
  children: string
  /** Visual variant */
  variant?: RouteBadgeVariant
  /** Optional icon name from MaterialCommunityIcons */
  icon?: string
  /** Icon size */
  iconSize?: number
}

/**
 * RouteBadge component for route attributes
 * Displays badges with optional icons for route characteristics
 */
export const RouteBadge = ({
  children,
  variant = 'neutral',
  icon,
  iconSize = 14,
}: RouteBadgeProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  const isPrimary = variant === 'primary'

  const backgroundColor = isPrimary
    ? 'rgba(184, 115, 51, 0.2)'
    : 'rgba(255, 255, 255, 0.05)'

  const color = isPrimary
    ? semantic.color.primary.default
    : semantic.color.onSurface.subtle

  const borderColor = isPrimary
    ? 'rgba(184, 115, 51, 0.3)'
    : 'rgba(255, 255, 255, 0.1)'

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={color}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color }]}>{children}</Text>
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
    borderWidth: 1,
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
