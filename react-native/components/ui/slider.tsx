/**
 * Slider Component
 * Range slider control with semantic theme styling
 *
 * Specs from README 7.8:
 * - Track height: 8px (h-2), rounded-full
 * - Track background: bg-secondary
 * - Range fill: bg-primary
 * - Thumb: 20×20px (h-5 w-5), rounded-full with border-2
 * - Focus ring on thumb
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useState } from 'react'
import type { ViewStyle } from 'react-native'
import { PanResponder, StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

/**
 * Slider component props
 */
export type SliderProps = {
  value: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  style?: ViewStyle
  accessibilityLabel?: string
}

/**
 * Slider component using semantic theme
 * Range input control with draggable thumb
 */
export const Slider = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  style,
  accessibilityLabel,
}: SliderProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()
  const [trackWidth, setTrackWidth] = useState(0)

  // Calculate thumb position as percentage
  const getThumbPosition = (): number => {
    const percentage = ((value - min) / (max - min)) * 100
    return Math.max(0, Math.min(100, percentage))
  }

  // Convert x position to value
  const getValueFromPosition = (x: number): number => {
    const percentage = Math.max(0, Math.min(100, (x / trackWidth) * 100))
    const rawValue = min + (percentage / 100) * (max - min)
    const steppedValue = Math.round(rawValue / step) * step
    return Math.max(min, Math.min(max, steppedValue))
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (evt) => {
      const newValue = getValueFromPosition(evt.nativeEvent.locationX)
      onValueChange?.(newValue)
    },
    onPanResponderMove: (evt) => {
      const newValue = getValueFromPosition(evt.nativeEvent.locationX)
      onValueChange?.(newValue)
    },
  })

  const thumbPosition = getThumbPosition()

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
    >
      <View
        style={[
          styles.track,
          {
            height: 8,
            borderRadius: semantic.radius.full,
            backgroundColor: semantic.color.secondary.default,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.range,
            {
              width: `${thumbPosition}%`,
              height: 8,
              borderRadius: semantic.radius.full,
              backgroundColor: semantic.color.primary.default,
            },
          ]}
        />
        <View
          style={[
            styles.thumb,
            {
              left: `${thumbPosition}%`,
              width: 20,
              height: 20,
              borderRadius: semantic.radius.full,
              borderWidth: 2,
              borderColor: semantic.color.primary.default,
              backgroundColor: semantic.color.background.default,
              ...semantic.elevation[2],
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 20,
    justifyContent: 'center',
  },
  track: {
    position: 'relative',
    width: '100%',
  },
  range: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    top: -6, // Center the thumb on the track (20px thumb - 8px track) / 2
    marginLeft: -10, // Half of thumb width to center it
  },
})
