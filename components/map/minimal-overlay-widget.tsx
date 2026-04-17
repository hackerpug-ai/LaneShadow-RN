/**
 * Minimal Overlay Widget
 *
 * A compact, single-icon weather overlay control that expands into a radial menu.
 * Inspired by motorcycle instrument dials and compass navigation.
 *
 * States:
 * - Collapsed: Single icon showing active overlay (or stack icon when none)
 * - Expanded: Three icons arc outward (wind, rain, temp)
 * - Selected: Active overlay glows with copper accent
 */

import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'

const AnimatedIcon = Animated.createAnimatedComponent(IconSymbol)

export type OverlayType = 'wind' | 'rain' | 'temperature'

export type OverlayAvailability = {
  wind: boolean
  rain: boolean
  temperature: boolean
}

export type MinimalOverlayWidgetProps = {
  value: OverlayType | ''
  onValueChange: (value: OverlayType | '') => void
  availability: OverlayAvailability
  testID?: string
}

// Icon configurations
const OVERLAY_CONFIG: Record<OverlayType, { icon: string; label: string }> = {
  wind: { icon: 'weather-windy', label: 'Wind' },
  rain: { icon: 'water-outline', label: 'Rain' },
  temperature: { icon: 'thermometer', label: 'Temperature' },
}

// Radial positions (angles in degrees)
const RADIAL_POSITIONS = [
  { angle: -30, overlay: 'wind' as OverlayType },
  { angle: 0, overlay: 'rain' as OverlayType },
  { angle: 30, overlay: 'temperature' as OverlayType },
]

const RADIUS = 36 // Distance from center to expanded icons

export const MinimalOverlayWidget = ({
  value,
  onValueChange,
  availability,
  testID = 'overlay-widget',
}: MinimalOverlayWidgetProps) => {
  const { semantic } = useSemanticTheme()

  const expanded = useSharedValue(false)
  const rotation = useSharedValue(0)

  const toggleExpanded = () => {
    'worklet'
    expanded.value = !expanded.value
    rotation.value = withSpring(expanded.value ? 180 : 0, {
      damping: 15,
      stiffness: 150,
    })
  }

  const selectOverlay = (overlay: OverlayType) => {
    'worklet'
    if (availability[overlay]) {
      const newValue = value === overlay ? '' : overlay
      runOnJS(onValueChange)(newValue)
      // Collapse after selection
      expanded.value = false
      rotation.value = withSpring(0)
    }
  }

  // Get current icon to display
  const getCurrentIcon = (): string => {
    if (value) return OVERLAY_CONFIG[value].icon
    return 'layers' // Stack icon when nothing selected
  }

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  // Create animated styles for each overlay type at component level
  const windIconStyle = useAnimatedStyle(() => {
    const shouldShow = expanded.value
    const isAvailable = availability.wind
    const angle = -30
    const radians = (angle * Math.PI) / 180
    const x = Math.sin(radians) * RADIUS
    const y = -Math.cos(radians) * RADIUS
    const targetOpacity = shouldShow ? (isAvailable ? 1 : 0.3) : 0
    const targetScale = shouldShow ? 1 : 0

    return {
      transform: [
        { translateX: withTiming(x * targetScale, { duration: 200 }) },
        { translateY: withTiming(y * targetScale, { duration: 200 }) },
        { scale: withTiming(targetScale, { duration: 200 }) },
      ] as any,
      opacity: withTiming(targetOpacity, { duration: 150 }) as any,
    }
  })

  const rainIconStyle = useAnimatedStyle(() => {
    const shouldShow = expanded.value
    const isAvailable = availability.rain
    const angle = 0
    const radians = (angle * Math.PI) / 180
    const x = Math.sin(radians) * RADIUS
    const y = -Math.cos(radians) * RADIUS
    const targetOpacity = shouldShow ? (isAvailable ? 1 : 0.3) : 0
    const targetScale = shouldShow ? 1 : 0

    return {
      transform: [
        { translateX: withTiming(x * targetScale, { duration: 200 }) },
        { translateY: withTiming(y * targetScale, { duration: 200 }) },
        { scale: withTiming(targetScale, { duration: 200 }) },
      ] as any,
      opacity: withTiming(targetOpacity, { duration: 150 }) as any,
    }
  })

  const temperatureIconStyle = useAnimatedStyle(() => {
    const shouldShow = expanded.value
    const isAvailable = availability.temperature
    const angle = 30
    const radians = (angle * Math.PI) / 180
    const x = Math.sin(radians) * RADIUS
    const y = -Math.cos(radians) * RADIUS
    const targetOpacity = shouldShow ? (isAvailable ? 1 : 0.3) : 0
    const targetScale = shouldShow ? 1 : 0

    return {
      transform: [
        { translateX: withTiming(x * targetScale, { duration: 200 }) },
        { translateY: withTiming(y * targetScale, { duration: 200 }) },
        { scale: withTiming(targetScale, { duration: 200 }) },
      ] as any,
      opacity: withTiming(targetOpacity, { duration: 150 }) as any,
    }
  })

  // Map overlay types to their animated styles
  const overlayStyles: Record<OverlayType, any> = {
    wind: windIconStyle,
    rain: rainIconStyle,
    temperature: temperatureIconStyle,
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Expanded radial icons */}
      {RADIAL_POSITIONS.map(({ angle, overlay }) => {
        const isAvailable = availability[overlay]
        const isActive = value === overlay
        const iconStyle = overlayStyles[overlay]

        return (
          <Animated.View
            key={overlay}
            style={[styles.radialIcon, iconStyle]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => selectOverlay(overlay)}
              disabled={!isAvailable}
              style={({ pressed }) =>
                [
                  styles.iconButton,
                  {
                    backgroundColor: isActive
                      ? semantic.color.primary.default + '33'
                      : pressed
                        ? semantic.color.surfaceVariant.pressed
                        : semantic.color.surfaceVariant.default,
                    borderColor: isActive
                      ? semantic.color.primary.default
                      : semantic.color.border.default,
                    opacity: isAvailable ? 1 : 0.4,
                  },
                ] as any
              }
              hitSlop={8}
            >
              <IconSymbol
                name={OVERLAY_CONFIG[overlay].icon as any}
                size={18}
                color={
                  isActive
                    ? semantic.color.primary.default
                    : (semantic.color.onSurface.muted ?? 'transparent')
                }
              />
            </Pressable>
          </Animated.View>
        )
      })}

      {/* Center toggle button */}
      <Animated.View style={containerStyle}>
        <Pressable
          onPress={toggleExpanded}
          style={({ pressed }) => [
            styles.centerButton,
            {
              backgroundColor: pressed
                ? semantic.color.surfaceVariant.pressed
                : semantic.color.surfaceVariant.default,
              borderColor: value ? semantic.color.primary.default : semantic.color.border.default,
            },
          ]}
          hitSlop={12}
          accessibilityLabel="Weather overlays"
          accessibilityRole="button"
        >
          {/* Active indicator ring */}
          {value ? (
            <View style={[styles.activeRing, { borderColor: semantic.color.primary.default }]} />
          ) : null}

          <IconSymbol
            name={getCurrentIcon() as any}
            size={20}
            color={value ? semantic.color.primary.default : semantic.color.onSurface.default}
          />
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  activeRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  radialIcon: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
