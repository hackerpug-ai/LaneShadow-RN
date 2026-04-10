/**
 * RouteMiniMap - Non-interactive route preview thumbnail
 *
 * A small, read-only Mapbox MapView that renders a route polyline as a
 * preview thumbnail. Used inside route attachment cards to give users a
 * visual preview of the route shape.
 *
 * Key features:
 * - Fixed height: 120pt
 * - Full width of parent container
 * - All interaction disabled (no scroll, zoom, rotate, pitch)
 * - pointerEvents="none" on wrapping View - taps pass through to parent
 * - Theme-aware styling (dark/light mode) via MAP_STYLES
 * - Returns null when no overviewGeometry provided
 *
 * Following components/CLAUDE.md: uses useSemanticTheme() exclusively.
 * Following react-rules.md: named export, displayName, useMemo for decode.
 */

import React, { useMemo } from 'react'
import { StyleSheet, View, Platform } from 'react-native'
import { MapView as MapboxMapView, Camera, ShapeSource, LineLayer } from '@rnmapbox/maps'
import type { FeatureCollection, LineString, Position } from 'geojson'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { MAP_STYLES } from '../../../lib/mapbox/styles'
import { convertCoordinateArray } from '../../../lib/mapbox/coordinate-converter'
import { decodePolylineGeometry } from '../../../lib/polyline'
import type { MapLatLng } from '../../../lib/polyline'
import type { PolylineGeometry } from '../../../models/saved-routes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RouteMiniMapProps = {
  /** Encoded polyline geometry (Google format) */
  overviewGeometry: PolylineGeometry
  /** Southwest + northeast bounds for fitting the map */
  bounds: {
    southwest: { lat: number; lng: number }
    northeast: { lat: number; lng: number }
  }
  testID?: string
}

// ---------------------------------------------------------------------------
// RouteMiniMap Component
// ---------------------------------------------------------------------------

export const RouteMiniMap = ({
  overviewGeometry,
  bounds,
  testID = 'route-mini-map',
}: RouteMiniMapProps) => {
  const { semantic, dark } = useSemanticTheme()

  // Decode the polyline to coordinates
  // useMemo justified: decode is O(n) and input (overviewGeometry) is stable
  const coordinates = useMemo((): MapLatLng[] => {
    try {
      return decodePolylineGeometry(overviewGeometry)
    } catch (error) {
      console.error('[RouteMiniMap] Failed to decode polyline', error)
      return []
    }
  }, [overviewGeometry])

  // No geometry to render - return null
  // (must be after all hooks per Rules of Hooks)
  if (coordinates.length === 0) {
    return null
  }

  // Web fallback - Mapbox is native-only, maps unavailable in web builds
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          styles.webFallback,
          {
            backgroundColor: semantic.color.surface.default,
            borderRadius: semantic.radius.md,
          },
        ]}
        testID={testID}
      />
    )
  }

  // Convert coordinates from Google [lat, lng] to Mapbox [lng, lat] format
  const googleCoords = coordinates.map(
    (c): [number, number] => [c.latitude, c.longitude]
  )
  const mapboxCoords: Position[] = convertCoordinateArray(googleCoords)

  // Build GeoJSON FeatureCollection for the route polyline
  const feature: FeatureCollection<LineString> = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: mapboxCoords,
        },
      },
    ],
  }

  // Calculate camera center from bounds (Mapbox format: [lng, lat])
  const center: [number, number] = [
    (bounds.southwest.lng + bounds.northeast.lng) / 2,
    (bounds.southwest.lat + bounds.northeast.lat) / 2,
  ]

  // Calculate zoom level from latitude span with padding
  // The -0.5 offset provides visual padding (equivalent to the old 1.3x multiplier)
  const latSpan = Math.abs(bounds.northeast.lat - bounds.southwest.lat)
  const zoom = Math.log2(360 / latSpan) - 0.5

  // Select theme-appropriate style URL
  const styleURL = MAP_STYLES[dark ? 'dark' : 'light']

  return (
    <View
      style={styles.container}
      pointerEvents="none"
      testID={testID}
    >
      <MapboxMapView
        style={styles.map}
        styleURL={styleURL}
        // Completely disable all interaction
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <Camera centerCoordinate={center} zoomLevel={zoom} />
        <ShapeSource id="mini-map-route" shape={feature}>
          <LineLayer
            id="mini-map-route-layer"
            style={{
              lineColor: semantic.color.primary.default,
              lineWidth: 3,
              lineOpacity: 1.0,
            }}
          />
        </ShapeSource>
      </MapboxMapView>
    </View>
  )
}

RouteMiniMap.displayName = 'RouteMiniMap'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    height: 120,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
