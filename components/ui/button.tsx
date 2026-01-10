/**
 * Button Component
 * Wraps React Native Paper Button with semantic theme styling
 *
 * Specs from README 7.1:
 * - Heights: 36px (sm), 40px (default), 44px (lg), 40×40px (icon-only)
 * - Variants: default (primary), secondary, outline, ghost, destructive, link
 * - States: disabled, active, focus with ring-2 ring-offset-2
 * - Icon support with gap-2 spacing
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { ViewStyle, TextStyle } from 'react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

/**
 * Button size variants
 */
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon'

/**
 * Button style variants
 */
export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'

/**
 * Button component props
 */
export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  children?: React.ReactNode
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  style?: ViewStyle
  textStyle?: TextStyle
  accessibilityLabel?: string
}

/**
 * Button component using semantic theme
 * Supports multiple variants, sizes, and interactive states
 */
export const Button = ({
  variant = 'default',
  size = 'default',
  onPress,
  disabled = false,
  loading = false,
  children,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Get height based on size
  const getHeight = (): number => {
    switch (size) {
      case 'sm':
        return 36
      case 'lg':
        return 44
      case 'icon':
        return 40
      default:
        return 40
    }
  }

  // Get padding based on size
  const getPaddingHorizontal = (): number => {
    if (size === 'icon') return 0
    switch (size) {
      case 'sm':
        return semantic.space.md
      case 'lg':
        return semantic.space['2xl']
      default:
        return semantic.space.lg
    }
  }

  // Get background color based on variant and state
  const getBackgroundColor = (pressed: boolean): string => {
    if (variant === 'ghost' || variant === 'link') {
      return 'transparent'
    }

    if (disabled) {
      switch (variant) {
        case 'secondary':
          return semantic.color.secondary.disabled || semantic.color.secondary.default
        case 'destructive':
          return semantic.color.danger.disabled || semantic.color.danger.default
        case 'outline':
          return semantic.color.background.default
        default:
          return semantic.color.primary.disabled || semantic.color.primary.default
      }
    }

    if (pressed) {
      switch (variant) {
        case 'secondary':
          return semantic.color.secondary.pressed || semantic.color.secondary.default
        case 'destructive':
          return semantic.color.danger.pressed || semantic.color.danger.default
        case 'outline':
          return semantic.color.accent.pressed || semantic.color.accent.default
        default:
          return semantic.color.primary.pressed || semantic.color.primary.default
      }
    }

    switch (variant) {
      case 'secondary':
        return semantic.color.secondary.default
      case 'destructive':
        return semantic.color.danger.default
      case 'outline':
        return semantic.color.background.default
      default:
        return semantic.color.primary.default
    }
  }

  // Get text color based on variant and state
  const getTextColor = (pressed: boolean): string => {
    if (disabled) {
      return semantic.color.onSurface.disabled || semantic.color.onSurface.default
    }

    switch (variant) {
      case 'secondary':
        return semantic.color.onSecondary.default
      case 'outline':
        return pressed
          ? semantic.color.accent.default
          : semantic.color.onSurface.default
      case 'ghost':
        return pressed
          ? semantic.color.accent.default
          : semantic.color.onSurface.default
      case 'link':
        return semantic.color.primary.default
      case 'destructive':
        return semantic.color.onPrimary.default
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

  const content = (pressed: boolean): React.ReactNode => {
    const isIconOnly = size === 'icon'

    return (
      <View
        style={[
          styles.container,
          {
            height: getHeight(),
            width: isIconOnly ? getHeight() : undefined,
            paddingHorizontal: getPaddingHorizontal(),
            backgroundColor: getBackgroundColor(pressed),
            borderRadius: isIconOnly ? semantic.radius.full : semantic.radius.md,
            opacity: disabled ? 0.5 : 1,
          },
          getBorderStyle(),
          style,
        ]}
      >
        {loading ? (
          <Text
            style={[
              semantic.type.label.md,
              {
                color: getTextColor(pressed),
              },
              textStyle,
            ]}
          >
            Loading...
          </Text>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={[styles.iconContainer, !isIconOnly && { marginRight: semantic.space.sm }]}>
                {icon}
              </View>
            )}
            {children && (
              <Text
                style={[
                  semantic.type.label.md,
                  {
                    color: getTextColor(pressed),
                    textDecorationLine: variant === 'link' ? 'underline' : 'none',
                  },
                  textStyle,
                ]}
              >
                {children}
              </Text>
            )}
            {icon && iconPosition === 'right' && (
              <View style={[styles.iconContainer, !isIconOnly && { marginLeft: semantic.space.sm }]}>
                {icon}
              </View>
            )}
            {isIconOnly && icon && <View style={styles.iconContainer}>{icon}</View>}
          </>
        )}
      </View>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

