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

import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

/**
 * Button size variants
 */
export type ButtonSize = 'sm' | 'default' | 'lg' | 'xl' | '2xl' | 'icon'

/**
 * Button style variants
 */
export type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'link'
  /**
   * Translucent “glass” look used by auth surfaces (bg-white/5 + border-white/10 in the mock).
   */
  | 'glass'

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
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  accessibilityLabel?: string
  testID?: string
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
  testID,
}: ButtonProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Get height based on size
  const getHeight = (): number => {
    switch (size) {
      case 'sm':
        // 24 + 12 = 36
        return semantic.space.xl + semantic.space.md
      case 'lg':
        // 32 + 12 = 44
        return semantic.space['2xl'] + semantic.space.md
      case 'xl':
        // Auth/social: 48
        return semantic.space['3xl']
      case '2xl':
        // Auth primary CTA: 56 (64 - 8)
        return semantic.space['4xl'] - semantic.space.sm
      case 'icon':
        // 32 + 8 = 40
        return semantic.space['2xl'] + semantic.space.sm
      default:
        // 32 + 8 = 40
        return semantic.space['2xl'] + semantic.space.sm
    }
  }

  const getRadius = (): number => {
    if (size === 'icon') return semantic.radius.full
    if (size === '2xl') return semantic.radius.xl
    if (size === 'xl') return semantic.radius.lg
    return semantic.radius.md
  }

  // Get padding based on size
  const getPaddingHorizontal = (): number => {
    if (size === 'icon') return 0
    switch (size) {
      case 'sm':
        return semantic.space.md
      case 'lg':
        return semantic.space['2xl']
      case 'xl':
      case '2xl':
        return semantic.space.lg
      default:
        return semantic.space.lg
    }
  }

  // Get background color based on variant and state
  const getBackgroundColor = (pressed: boolean): string => {
    if (variant === 'ghost' || variant === 'link') {
      return 'transparent'
    }

    if (variant === 'glass') {
      if (disabled)
        return semantic.color.surfaceVariant.disabled ?? semantic.color.surfaceVariant.default
      return pressed
        ? (semantic.color.surfaceVariant.pressed ?? semantic.color.surfaceVariant.default)
        : semantic.color.surfaceVariant.default
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
    const onPrimaryText = semantic.color.onSurface.default
    const onSurfaceText = semantic.color.onSurface.default
    const onSecondaryText = semantic.color.onSecondary?.default || onPrimaryText

    if (disabled) {
      return semantic.color.onSurface.disabled || onSurfaceText
    }

    switch (variant) {
      case 'glass':
        return onSurfaceText
      case 'secondary':
        return onSecondaryText
      case 'outline':
        return pressed ? semantic.color.accent.default : onSurfaceText
      case 'ghost':
        return pressed ? semantic.color.accent.default : onSurfaceText
      case 'link':
        return semantic.color.primary.default
      case 'destructive':
        return onPrimaryText
      default:
        return onPrimaryText
    }
  }

  // Get border style for outline variant
  const getBorderStyle = (pressed: boolean) => {
    if (variant === 'glass') {
      if (pressed) return {}
      return {
        borderWidth: 1,
        borderColor: semantic.color.border.default,
      }
    }
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
            borderRadius: getRadius(),
            opacity: disabled ? 0.5 : 1,
          },
          getBorderStyle(pressed),
          style,
        ]}
      >
        {loading ? (
          <Text
            variant="labelLarge"
            style={[
              {
                color: getTextColor(pressed),
              },
              textStyle,
            ]}
          >
            Loading…
          </Text>
        ) : (
          <>
            {icon && iconPosition === 'left' && !isIconOnly && (
              <View
                style={[styles.iconContainer, !isIconOnly && { marginRight: semantic.space.sm }]}
              >
                {icon}
              </View>
            )}
            {children && (
              <Text
                variant="labelLarge"
                style={[
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
              <View
                style={[styles.iconContainer, !isIconOnly && { marginLeft: semantic.space.sm }]}
              >
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
