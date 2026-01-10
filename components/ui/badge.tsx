/**
 * Badge Component
 * Small label or tag with semantic theme styling
 *
 * Specs from README 7.4:
 * - Shape: rounded-full (pill) with px-2.5 py-0.5
 * - Font: text-xs font-semibold (12px, weight 500)
 * - Variants: default (primary), secondary, destructive, outline
 * - Icon/emoji integration with natural spacing
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { TextStyle, ViewStyle } from 'react-native'
import { StyleSheet, Text, View } from 'react-native'

/**
 * Badge variant types
 */
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'

/**
 * Badge component props
 */
export type BadgeProps = {
  variant?: BadgeVariant
  children?: React.ReactNode
  icon?: React.ReactNode
  style?: ViewStyle
  textStyle?: TextStyle
}

/**
 * Badge component using semantic theme
 * Small status indicator or label
 */
export const Badge = ({
  variant = 'default',
  children,
  icon,
  style,
  textStyle,
}: BadgeProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Get background color based on variant
  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'secondary':
        return semantic.color.secondary.default
      case 'destructive':
        return semantic.color.danger.default
      case 'success':
        return semantic.color.success.default
      case 'warning':
        return semantic.color.warning.default
      case 'outline':
        return 'transparent'
      default:
        return semantic.color.primary.default
    }
  }

  // Get text color based on variant
  const getTextColor = (): string => {
    switch (variant) {
      case 'secondary':
        return semantic.color.onSecondary.default
      case 'outline':
        return semantic.color.onSurface.default
      default:
        return semantic.color.onPrimary.default
    }
  }

  // Get border style for outline variant
  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: semantic.color.border.default,
      }
    }
    return {}
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: semantic.radius.full,
          paddingHorizontal: 10,
          paddingVertical: 2,
        },
        getBorderStyle(),
        style,
      ]}
    >
      {icon && <View style={[styles.icon, { marginRight: semantic.space.xs }]}>{icon}</View>}
      {children && (
        <Text
          style={[
            semantic.type.label.sm,
            {
              color: getTextColor(),
              fontWeight: '600',
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
