/**
 * Toggle Component
 * Toggle button with semantic theme styling
 *
 * Specs from README 7.12:
 * - Heights: 36px (sm), 40px (default), 44px (lg)
 * - Padding: px-3, rounded-md
 * - Variants: default, outline
 * - Active state: data-[state=on]:bg-accent
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { TextStyle, ViewStyle } from 'react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

/**
 * Toggle size variants
 */
export type ToggleSize = 'sm' | 'default' | 'lg'

/**
 * Toggle style variants
 */
export type ToggleVariant = 'default' | 'outline'

/**
 * Toggle component props
 */
export type ToggleProps = {
  pressed: boolean
  onPressedChange?: (pressed: boolean) => void
  variant?: ToggleVariant
  size?: ToggleSize
  disabled?: boolean
  children?: React.ReactNode
  icon?: React.ReactNode
  style?: ViewStyle
  textStyle?: TextStyle
  accessibilityLabel?: string
}

/**
 * Toggle component using semantic theme
 * Button that can be toggled on/off
 */
export const Toggle = ({
  pressed,
  onPressedChange,
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
  icon,
  style,
  textStyle,
  accessibilityLabel,
}: ToggleProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Get height based on size
  const getHeight = (): number => {
    switch (size) {
      case 'sm':
        return 36
      case 'lg':
        return 44
      default:
        return 40
    }
  }

  // Get padding based on size
  const getPaddingHorizontal = (): number => {
    return semantic.space.md
  }

  const handlePress = () => {
    if (disabled) return
    onPressedChange?.(!pressed)
  }

  // Get background color based on variant and state
  const getBackgroundColor = (isPressed: boolean): string => {
    if (variant === 'outline') {
      if (pressed) {
        return semantic.color.accent.default
      }
      return 'transparent'
    }

    if (pressed) {
      return semantic.color.accent.default
    }

    return isPressed ? semantic.color.muted.pressed || semantic.color.muted.default : 'transparent'
  }

  // Get text color based on variant and state
  const getTextColor = (isPressed: boolean): string => {
    if (disabled) {
      return semantic.color.onSurface.disabled || semantic.color.onSurface.default
    }

    if (pressed) {
      return semantic.color.onSurface.default
    }

    return isPressed
      ? semantic.color.onSurface.default
      : semantic.color.onSurface.muted || semantic.color.onSurface.default
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
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: pressed }}
    >
      {({ pressed: isPressed }) => (
        <View
          style={[
            styles.container,
            {
              height: getHeight(),
              paddingHorizontal: getPaddingHorizontal(),
              backgroundColor: getBackgroundColor(isPressed),
              borderRadius: semantic.radius.md,
              opacity: disabled ? 0.5 : 1,
            },
            getBorderStyle(),
            style,
          ]}
        >
          {icon && (
            <View style={[styles.iconContainer, { marginRight: semantic.space.sm }]}>{icon}</View>
          )}
          {children && (
            <Text
              style={[
                semantic.type.label.md,
                {
                  color: getTextColor(isPressed),
                },
                textStyle,
              ]}
            >
              {children}
            </Text>
          )}
        </View>
      )}
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
