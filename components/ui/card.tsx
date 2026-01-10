/**
 * Card Component
 * Container component with semantic theme styling
 *
 * Specs from README 7.5:
 * - Background: bg-card with border-border
 * - Border radius: rounded-lg
 * - Shadow: semantic.elevation[2] with hover elevation[3]
 * - Layout patterns: standard, compact, image card
 * - Compound components: CardHeader, CardContent, CardTitle
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PressableProps, TextStyle, ViewStyle } from 'react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

/**
 * Card variant types
 */
export type CardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'

/**
 * Card component props
 */
export type CardProps = {
  variant?: CardVariant
  children?: React.ReactNode
  onPress?: PressableProps['onPress']
  disabled?: boolean
  showBorder?: boolean
  style?: ViewStyle
}

/**
 * Card component using semantic theme
 * Main container for grouped content
 */
export const Card = ({
  variant = 'default',
  children,
  onPress,
  disabled = false,
  showBorder = true,
  style,
}: CardProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Get background color based on variant and state
  const getBackgroundColor = (pressed: boolean): string => {
    if (disabled) {
      return semantic.color.card.disabled || semantic.color.card.default
    }
    if (pressed) {
      return semantic.color.card.pressed || semantic.color.card.default
    }

    switch (variant) {
      case 'primary':
        return pressed
          ? semantic.color.primary.pressed || semantic.color.primary.default
          : semantic.color.primary.default
      case 'success':
        return pressed
          ? semantic.color.success.pressed || semantic.color.success.default
          : semantic.color.success.default
      case 'warning':
        return pressed
          ? semantic.color.warning.pressed || semantic.color.warning.default
          : semantic.color.warning.default
      case 'danger':
        return pressed
          ? semantic.color.danger.pressed || semantic.color.danger.default
          : semantic.color.danger.default
      default:
        return semantic.color.card.default
    }
  }

  const content = (pressed: boolean): React.ReactNode => (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderRadius: semantic.radius.lg,
          padding: semantic.space.lg,
          ...semantic.elevation[pressed ? 3 : 2],
        },
        showBorder && {
          borderWidth: 1,
          borderColor: semantic.color.border.default,
        },
        style,
      ]}
    >
      {children}
    </View>
  )

  // If onPress provided, make it pressable
  if (onPress && !disabled) {
    return (
      <Pressable onPress={onPress} disabled={disabled}>
        {({ pressed }) => content(pressed)}
      </Pressable>
    )
  }

  // Otherwise just render the content
  return content(false)
}

/**
 * Card Header component props
 */
export type CardHeaderProps = {
  children?: React.ReactNode
  style?: ViewStyle
}

/**
 * Card Header component
 * Container for card title and actions
 */
export const CardHeader = ({ children, style }: CardHeaderProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      style={[
        styles.header,
        {
          marginBottom: semantic.space.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

/**
 * Card Title component props
 */
export type CardTitleProps = {
  children?: React.ReactNode
  variant?: CardVariant
  style?: TextStyle
}

/**
 * Card Title component
 * Title text for cards
 */
export const CardTitle = ({
  children,
  variant = 'default',
  style,
}: CardTitleProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'success':
      case 'warning':
      case 'danger':
        return semantic.color.onPrimary.default
      default:
        return semantic.color.onSurface.default
    }
  }

  return (
    <Text
      style={[
        semantic.type.title.md,
        {
          color: getTextColor(),
        },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

/**
 * Card Content component props
 */
export type CardContentProps = {
  children?: React.ReactNode
  style?: ViewStyle
}

/**
 * Card Content component
 * Main content area of card
 */
export const CardContent = ({ children, style }: CardContentProps): React.ReactNode => {
  return <View style={[styles.content, style]}>{children}</View>
}

/**
 * Card Description component props
 */
export type CardDescriptionProps = {
  children?: React.ReactNode
  variant?: CardVariant
  style?: TextStyle
}

/**
 * Card Description component
 * Secondary text for cards
 */
export const CardDescription = ({
  children,
  variant = 'default',
  style,
}: CardDescriptionProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'success':
      case 'warning':
      case 'danger':
        return semantic.color.onPrimary.default
      default:
        return semantic.color.onSurface.muted || semantic.color.onSurface.default
    }
  }

  return (
    <Text
      style={[
        semantic.type.body.sm,
        {
          color: getTextColor(),
        },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
})
