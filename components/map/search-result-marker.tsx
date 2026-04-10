/**
 * SearchResultMarker
 *
 * Circular numbered marker for location search results on the map.
 * Visually distinct from pin-shaped WaypointMarker:
 *   - Circle shape (no stem)
 *   - Blue/info color family
 *   - Numbered center matching chat card ordering
 *   - Dashed border → solid when selected
 */

import { MarkerView } from '@rnmapbox/maps'
import * as Haptics from 'expo-haptics'
import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import Svg, { Circle } from 'react-native-svg'

import { latLngToMapbox } from '../../lib/mapbox/coordinate-converter'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SearchResultMarkerProps = {
  id: string
  coordinate: { latitude: number; longitude: number }
  /** 1-based index matching the chat card ordering */
  index: number
  name: string
  placeType?: string
  isSelected?: boolean
  onPress?: (id: string) => void
  testID?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MARKER_SIZE = 36

export const SearchResultMarker = ({
  id,
  coordinate,
  index,
  name,
  isSelected = false,
  onPress,
  testID,
}: SearchResultMarkerProps) => {
  const { semantic } = useSemanticTheme()

  const infoColor = semantic.color.info.default
  const surfaceColor = semantic.color.surface.default
  const textColor = isSelected ? semantic.color.onPrimary.default : infoColor

  const handlePress = useMemo(() => {
    if (!onPress) return undefined
    return () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress(id)
    }
  }, [id, onPress])

  const radius = MARKER_SIZE / 2
  const innerRadius = radius - 3

  const mapboxCoords = latLngToMapbox(coordinate)

  return (
    <MarkerView coordinate={mapboxCoords}>
      <Pressable
        onPress={handlePress}
        testID={testID ?? `search-result-marker-${id}`}
      >
        <View
          style={[
            styles.container,
            {
              width: MARKER_SIZE,
              height: MARKER_SIZE,
              transform: isSelected ? [{ scale: 1.15 }] : [],
            },
          ]}
        >
          <Svg width={MARKER_SIZE} height={MARKER_SIZE} viewBox={`0 0 ${MARKER_SIZE} ${MARKER_SIZE}`}>
            {/* Outer ring: dashed when default, solid when selected */}
            <Circle
              cx={radius}
              cy={radius}
              r={radius - 1.5}
              fill={isSelected ? infoColor : `${infoColor}26`}
              stroke={infoColor}
              strokeWidth={isSelected ? 2 : 1.5}
              strokeDasharray={isSelected ? undefined : '4 3'}
            />

            {/* Inner white circle */}
            <Circle
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill={isSelected ? infoColor : surfaceColor}
            />
          </Svg>

          {/* Index number overlay */}
          <View style={styles.labelOverlay}>
            <Text
              style={[
                styles.indexText,
                {
                  color: textColor,
                  fontSize: 13,
                  fontWeight: '700',
                },
              ]}
            >
              {index}
            </Text>
          </View>
        </View>
      </Pressable>
    </MarkerView>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    textAlign: 'center',
  },
})
