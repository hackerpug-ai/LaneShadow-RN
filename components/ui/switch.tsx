/**
 * Switch Component
 * Toggle switch with semantic theme styling
 *
 * Specs from README 7.6:
 * - Track: 44×24px (w-11 h-6), rounded-full
 * - Thumb: 20×20px (h-5 w-5), rounded-full with shadow
 * - Unchecked: bg-input, Checked: bg-primary
 * - Thumb translation: translate-x-5 when checked
 * - Focus ring: ring-2 ring-offset-2
 *
 * Following coding standards: composition over inheritance, named exports
 */

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { useState } from 'react'
import type { ViewStyle } from 'react-native'
import { Animated, Pressable, StyleSheet } from 'react-native'

/**
 * Switch component props
 */
export type SwitchProps = {
  value: boolean
  onValueChange?: (value: boolean) => void
  disabled?: boolean
  style?: ViewStyle
  accessibilityLabel?: string
}

/**
 * Switch component using semantic theme
 * Toggle control for boolean states
 */
export const Switch = ({
  value,
  onValueChange,
  disabled = false,
  style,
  accessibilityLabel,
}: SwitchProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()
  const [animation] = useState(new Animated.Value(value ? 1 : 0))

  const handlePress = () => {
    if (disabled) return

    const newValue = !value
    onValueChange?.(newValue)

    Animated.timing(animation, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  const thumbTranslateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22], // 2px padding on left, moves to 22px when checked
  })

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={style}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: 44,
            height: 24,
            borderRadius: semantic.radius.full,
            backgroundColor: value ? semantic.color.primary.default : semantic.color.input.default,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: 20,
              height: 20,
              borderRadius: semantic.radius.full,
              backgroundColor: semantic.color.surface.default,
              transform: [{ translateX: thumbTranslateX }],
              ...semantic.elevation[2],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumb: {
    position: 'absolute',
  },
})
