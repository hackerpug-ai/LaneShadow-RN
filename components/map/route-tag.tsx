/**
 * RouteTag
 *
 * A tappable on-map pill showing route archetype + distance.
 * Anchored to the route polyline midpoint. Tap opens RouteDetailsSheet.
 *
 * Modeled on SearchResultMarker pattern:
 * - MarkerView for coordinate-anchored placement (gated on mapboxAvailable)
 * - Pressable for haptics + touch handling
 * - useSemanticTheme() for all visual tokens
 * - testID for E2E verification
 */

import { NativeModules } from 'react-native'

// Optional chaining so importing this module never throws when NativeModules is
// absent (e.g. the jsdom test harness) — the pure buildRouteTagText export stays testable.
const mapboxAvailable = NativeModules?.RNMBXModule != null
let MarkerView: any = null
if (mapboxAvailable) {
  try {
    ;({ MarkerView } = require('@rnmapbox/maps'))
  } catch {}
}

import * as Haptics from 'expo-haptics'
import { useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { latLngToMapbox } from '../../lib/mapbox/coordinate-converter'

// ---------------------------------------------------------------------------
// Pure-function helper: build tag text from route option
// ---------------------------------------------------------------------------

export type RouteTagTextInput = {
  archetype: string
  distanceMeters: number
}

/**
 * Build the tag text label: "Archetype · Distance"
 * Pure function — no I/O, no theme dependency.
 * Discriminates: would fail if returning generic/hardcoded string or '--mi'.
 *
 * @param option Route option with archetype and distance
 * @returns Tag text, e.g. "Scenic · 78mi"
 */
export const buildRouteTagText = (option: RouteTagTextInput): string => {
  // Capitalize archetype: 'scenic' → 'Scenic'
  const archetypeLabel = option.archetype.charAt(0).toUpperCase() + option.archetype.slice(1)

  // Convert meters to miles and round
  const distanceMi = Math.round(option.distanceMeters / 1609.34)

  return `${archetypeLabel} · ${distanceMi}mi`
}

// ---------------------------------------------------------------------------
// Component types
// ---------------------------------------------------------------------------

export type RouteTagProps = {
  /**
   * Unique route option identifier — used in testID.
   */
  routeId: string

  /**
   * Coordinate ON the route polyline where the tag anchors.
   * Caller computes the midpoint; see design spec §3.
   */
  coordinate: { latitude: number; longitude: number }

  /**
   * UI archetype label drawn from the UiArchetype enum.
   * Values: 'twisties' | 'scenic' | 'technical' | 'cruising' | 'sport' | 'adventure'
   * Displayed with sentence-case capitalisation: 'Scenic', 'Twisties', etc.
   */
  archetype: string

  /**
   * Route distance in metres. Displayed as rounded miles.
   * Sourced from PlannedRouteOptionView.stats.distanceMeters.
   */
  distanceMeters: number

  /**
   * Whether this route is the currently selected route.
   * Controls the selected vs unselected visual state.
   */
  isSelected?: boolean

  /**
   * Called when the rider taps the tag. Caller opens RouteDetailsSheet.
   */
  onPress?: (routeId: string) => void

  /**
   * Override testID. Defaults to `route-tag-{routeId}`.
   */
  testID?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RouteTag = ({
  routeId,
  coordinate,
  archetype,
  distanceMeters,
  isSelected = false,
  onPress,
  testID,
}: RouteTagProps) => {
  const { semantic } = useSemanticTheme()

  // Build tag text: "Scenic · 78mi"
  const tagText = buildRouteTagText({ archetype, distanceMeters })

  // Press handler with haptics
  const handlePress = useMemo(() => {
    if (!onPress) return undefined
    return () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress(routeId)
    }
  }, [routeId, onPress])

  // Convert to Mapbox format
  const mapboxCoords = latLngToMapbox(coordinate)

  // Guard: only render if Mapbox is available (mirror SearchResultMarker pattern)
  if (!mapboxAvailable || !MarkerView) {
    return null
  }

  // Unselected state: glass scrim with copper text
  // Selected state: copper fill with white text
  const backgroundColor = isSelected ? semantic.color.primary.default : semantic.color.surface.glass
  const textColor = isSelected ? semantic.color.onPrimary.default : semantic.color.primary.default
  const borderColor = isSelected ? semantic.color.primary.default : semantic.color.border.glass

  return (
    <MarkerView coordinate={mapboxCoords} anchor={{ x: 0.5, y: 1.0 }}>
      <Pressable
        onPress={handlePress}
        testID={testID ?? `route-tag-${routeId}`}
        accessibilityRole="button"
        accessibilityLabel={`${archetype.charAt(0).toUpperCase() + archetype.slice(1)} route, ${Math.round(distanceMeters / 1609.34)} miles`}
        accessibilityHint="Tap to view route details"
        accessibilityState={{ selected: isSelected }}
        style={({ pressed }) => ({
          minWidth: semantic.control.minTouchTarget,
          minHeight: semantic.control.minTouchTarget,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? semantic.opacity.pressed : 1,
        })}
      >
        {/* Visible pill child */}
        <View
          testID={`route-tag-pill-${routeId}`}
          style={{
            backgroundColor,
            borderColor,
            borderWidth: semantic.borderWidth.thin,
            borderRadius: semantic.radius.full,
            paddingHorizontal: semantic.space.sm,
            paddingVertical: semantic.space.xs,
            transform: isSelected ? [{ scale: 1.1 }] : [],
            ...semantic.elevation[2],
          }}
        >
          <Text
            testID={`route-tag-label-${routeId}`}
            style={{
              ...semantic.type.label.sm,
              color: textColor,
            }}
            numberOfLines={1}
          >
            {tagText}
          </Text>
        </View>
      </Pressable>
    </MarkerView>
  )
}
