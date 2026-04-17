/**
 * Skeleton Component
 * Loading placeholder with semantic theme styling
 *
 * Specs from README 7.11:
 * - Background: bg-muted
 * - Animation: animate-pulse (Animated API in RN)
 * - Border radius: rounded-md (or match target element)
 * - Sizing: match target element dimensions
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useEffect, useRef } from 'react'
import { Animated, type StyleProp, StyleSheet, type ViewStyle } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

/**
 * Skeleton shape variants
 */
export type SkeletonShape = 'rectangle' | 'circle' | 'rounded'

/**
 * Skeleton component props
 */
export type SkeletonProps = {
  width?: number | `${number}%`
  height?: number
  shape?: SkeletonShape
  style?: StyleProp<ViewStyle>
}

/**
 * Skeleton component using semantic theme
 * Loading placeholder with pulse animation
 */
export const Skeleton = ({
  width = '100%',
  height = 16,
  shape = 'rounded',
  style,
}: SkeletonProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Pulse animation - continuous loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [opacity])

  // Get border radius based on shape
  const getBorderRadius = (): number => {
    switch (shape) {
      case 'circle':
        return semantic.radius.full
      case 'rectangle':
        return semantic.radius.none
      default:
        return semantic.radius.md
    }
  }

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: getBorderRadius(),
          backgroundColor: semantic.color.muted.default,
          opacity,
        },
        style,
      ]}
    />
  )
}

/**
 * Skeleton Avatar component
 * Pre-configured skeleton for avatar placeholders
 */
export type SkeletonAvatarProps = {
  size?: 'default' | 'lg' | 'xl'
  style?: StyleProp<ViewStyle>
}

export const SkeletonAvatar = ({
  size = 'default',
  style,
}: SkeletonAvatarProps): React.ReactNode => {
  const dimensions = size === 'xl' ? 96 : size === 'lg' ? 64 : 40

  return <Skeleton width={dimensions} height={dimensions} shape="circle" style={style} />
}

/**
 * Skeleton Text component
 * Pre-configured skeleton for text placeholders
 */
export type SkeletonTextProps = {
  width?: number | `${number}%`
  lines?: number
  style?: StyleProp<ViewStyle>
}

export const SkeletonText = ({
  width = '100%',
  lines = 1,
  style,
}: SkeletonTextProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  if (lines === 1) {
    return <Skeleton width={width} height={16} style={style} />
  }

  return (
    <>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '75%' : width}
          height={16}
          style={[index > 0 ? { marginTop: semantic.space.sm } : null, style]}
        />
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  skeleton: {
    // Animation styles applied inline
  },
})
