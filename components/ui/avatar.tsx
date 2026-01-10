/**
 * Avatar Component
 * User avatar with semantic theme styling
 *
 * Specs from README 7.3:
 * - Sizes: 40×40px (default), 64×64px (lg), 96×96px (xl)
 * - Always rounded-full with overflow-hidden
 * - Fallback: bg-muted with centered initials
 * - Optional border-2 and status indicators
 * - Alert badge positioning: absolute -top-1 -right-1
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { ImageSourcePropType, ViewStyle } from 'react-native'
import { Image, StyleSheet, Text, View } from 'react-native'

/**
 * Avatar size variants
 */
export type AvatarSize = 'default' | 'lg' | 'xl'

/**
 * Avatar component props
 */
export type AvatarProps = {
  size?: AvatarSize
  source?: ImageSourcePropType
  initials?: string
  alt?: string
  showBorder?: boolean
  showRing?: boolean
  badge?: React.ReactNode
  style?: ViewStyle
}

/**
 * Avatar component using semantic theme
 * Supports image, initials fallback, and status indicators
 */
export const Avatar = ({
  size = 'default',
  source,
  initials,
  alt,
  showBorder = false,
  showRing = false,
  badge,
  style,
}: AvatarProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Get avatar dimensions based on size
  const getDimensions = (): number => {
    switch (size) {
      case 'lg':
        return 64
      case 'xl':
        return 96
      default:
        return 40
    }
  }

  const dimensions = getDimensions()

  // Get initials font size based on avatar size
  const getInitialsFontSize = (): number => {
    switch (size) {
      case 'lg':
        return 24
      case 'xl':
        return 36
      default:
        return 16
    }
  }

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatarContainer,
          {
            width: dimensions,
            height: dimensions,
            borderRadius: semantic.radius.full,
            backgroundColor: semantic.color.muted.default,
          },
          showBorder && {
            borderWidth: 2,
            borderColor: semantic.color.border.default,
          },
          showRing && {
            borderWidth: 2,
            borderColor: semantic.color.primary.default,
          },
        ]}
      >
        {source ? (
          <Image
            source={source}
            style={[
              styles.image,
              {
                width: dimensions,
                height: dimensions,
                borderRadius: semantic.radius.full,
              },
            ]}
            accessibilityLabel={alt}
          />
        ) : initials ? (
          <Text
            style={[
              {
                fontSize: getInitialsFontSize(),
                fontWeight: '500' as const,
                color: semantic.color.onSurface.default,
              },
            ]}
          >
            {initials}
          </Text>
        ) : null}
      </View>

      {badge && (
        <View
          style={[
            styles.badge,
            {
              top: -4,
              right: -4,
            },
          ]}
        >
          {badge}
        </View>
      )}
    </View>
  )
}

/**
 * Avatar Badge Component
 * For status indicators on avatars
 */
export type AvatarBadgeProps = {
  children?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  style?: ViewStyle
}

export const AvatarBadge = ({
  children,
  variant = 'default',
  style,
}: AvatarBadgeProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'success':
        return semantic.color.success.default
      case 'warning':
        return semantic.color.warning.default
      case 'danger':
        return semantic.color.danger.default
      default:
        return semantic.color.primary.default
    }
  }

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: semantic.radius.full,
          minWidth: 20,
          minHeight: 20,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
})
