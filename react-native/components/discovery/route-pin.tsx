/**
 * RoutePin Component
 *
 * Map pin for route discovery displaying archetype icon with optional rank badge or distance label.
 *
 * Specs from DESIGN-002:
 * - Pin size <= 44x44dp
 * - Copper circle body with archetype icon
 * - Rank badge (top-10 Best sort) in top-right corner
 * - Distance label (Nearest sort) below pin
 * - Press state feedback (scale animation)
 * - Uses semantic theme tokens (no hardcoded colors)
 *
 * Following coding standards:
 * - Named export
 * - useSemanticTheme() for all colors
 * - Pressable for interactive states
 * - data-testid attributes
 * - Mock props for design testing (no real data imports)
 */

import { useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'

/**
 * Route archetype types from UC-DISC-02
 */
export type RouteArchetype =
  | 'twisties'
  | 'mountain'
  | 'coastal'
  | 'adventure'
  | 'scenic_byway'
  | 'desert'

/**
 * Route pin props
 */
export interface RoutePinProps {
  /** Unique route identifier */
  routeId: string
  /** Route archetype for icon selection */
  archetype: RouteArchetype
  /** Pin coordinate on map */
  coordinate: {
    latitude: number
    longitude: number
  }
  /** Rank number (1-10) for Best sort mode */
  rank?: number
  /** Distance label (e.g., "3.2 mi") for Nearest sort mode */
  distance?: string
  /** Press callback - returns route ID */
  onPress: (routeId: string) => void
  /** Test ID for testing */
  testID?: string
}

/**
 * Map archetype to MaterialCommunityIcons icon names
 */
const ARCHETYPE_ICONS: Record<RouteArchetype, string> = {
  twisties: 'road-variant',
  mountain: 'image-filter-hdr', // Closest to mountain scenery
  coastal: 'waves',
  adventure: 'compass',
  scenic_byway: 'landscape',
  desert: 'sun',
}

/**
 * RoutePin component for map markers
 *
 * Displays a copper circle with archetype icon, optional rank badge,
 * and optional distance label. Provides press feedback via scale animation.
 */
export function RoutePin({
  routeId,
  archetype,
  coordinate,
  rank,
  distance,
  onPress,
  testID = 'route-pin',
}: RoutePinProps) {
  const { semantic } = useSemanticTheme()
  const [pressed, setPressed] = useState(false)

  // Animated scale value for press feedback
  const scaleAnim = useState(new Animated.Value(1))[0]

  const handlePressIn = () => {
    setPressed(true)
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start()
  }

  const handlePressOut = () => {
    setPressed(false)
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start()
  }

  const handlePress = () => {
    onPress(routeId)
  }

  const iconName = ARCHETYPE_ICONS[archetype]

  return (
    <Marker coordinate={coordinate} testID={testID}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.container}
        testID={`${testID}-pressable`}
      >
        <Animated.View
          style={[
            styles.pinWrapper,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Copper circle body with archetype icon */}
          <View
            style={[
              styles.pinBody,
              {
                backgroundColor: semantic.color.primary.default,
                width: 44,
                height: 44,
                borderRadius: 22, // full circle
              },
            ]}
            testID={`${testID}-body`}
          >
            <IconSymbol
              name={iconName as any}
              size={24}
              color={semantic.color.onPrimary.default}
              testID={`${testID}-icon`}
            />
          </View>

          {/* Rank badge (top-10 Best sort) */}
          {rank !== null && rank !== undefined && rank >= 1 && rank <= 10 && (
            <View
              style={[
                styles.rankBadge,
                {
                  backgroundColor: semantic.color.primary.default,
                  top: -4,
                  right: -4,
                },
              ]}
              testID={`${testID}-rank`}
            >
              <Text
                style={[
                  semantic.type.label.sm,
                  {
                    color: semantic.color.onPrimary.default,
                    fontWeight: '700',
                    fontSize: 10,
                    lineHeight: 12,
                  },
                ]}
              >
                {rank}
              </Text>
            </View>
          )}

          {/* Distance label (Nearest sort) */}
          {distance !== null && (
            <View
              style={[
                styles.distanceLabel,
                {
                  backgroundColor: `${semantic.color.surface.default}CC`, // 80% opacity
                  marginTop: semantic.space.xs,
                },
              ]}
              testID={`${testID}-distance`}
            >
              <Text
                style={[
                  semantic.type.label.sm,
                  {
                    color: semantic.color.onSurface.default,
                    fontSize: 10,
                    lineHeight: 12,
                  },
                ]}
              >
                {distance}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Marker>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  pinBody: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3, // Max allowed elevation per spec
  },
  rankBadge: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  distanceLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
})
