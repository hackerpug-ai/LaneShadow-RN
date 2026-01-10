/**
 * Progress Component
 * Progress bar with semantic theme styling
 *
 * Specs from README 7.9:
 * - Container: 16px (h-4), bg-secondary, rounded-full
 * - Indicator: bg-primary with smooth animation
 * - Percentage-based width transform
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useEffect, useRef } from 'react'
import type { ViewStyle } from 'react-native'
import { Animated, StyleSheet, View } from 'react-native'

/**
 * Progress component props
 */
export type ProgressProps = {
  value: number // 0-100
  max?: number
  indeterminate?: boolean
  style?: ViewStyle
  accessibilityLabel?: string
}

/**
 * Progress component using semantic theme
 * Visual indicator of completion or activity
 */
export const Progress = ({
  value,
  max = 100,
  indeterminate = false,
  style,
  accessibilityLabel,
}: ProgressProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()
  const animatedValue = useRef(new Animated.Value(0)).current
  const indeterminateAnim = useRef(new Animated.Value(0)).current

  // Calculate percentage
  const percentage = Math.max(0, Math.min(100, (value / max) * 100))

  useEffect(() => {
    if (indeterminate) {
      // Indeterminate animation - continuous loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(indeterminateAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(indeterminateAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      // Determinate animation - smooth transition
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 300,
        useNativeDriver: false,
      }).start()
    }
  }, [percentage, indeterminate, animatedValue, indeterminateAnim])

  const width = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  })

  const translateX = indeterminateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  })

  return (
    <View
      style={[
        styles.container,
        {
          height: 16,
          borderRadius: semantic.radius.full,
          backgroundColor: semantic.color.secondary.default,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
    >
      {indeterminate ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: '30%',
              height: 16,
              borderRadius: semantic.radius.full,
              backgroundColor: semantic.color.primary.default,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : (
        <Animated.View
          style={[
            styles.indicator,
            {
              width,
              height: 16,
              borderRadius: semantic.radius.full,
              backgroundColor: semantic.color.primary.default,
            },
          ]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
})
