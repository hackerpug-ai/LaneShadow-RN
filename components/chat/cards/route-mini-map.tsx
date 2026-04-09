/**
 * RouteMiniMap - Non-interactive route preview thumbnail
 *
 * A small, read-only MapView component that renders a route polyline as a
 * preview thumbnail. Used inside route attachment cards to give users a
 * visual preview of the route shape.
 *
 * Key features:
 * - Fixed height: 120pt
 * - Full width of parent container
 * - All interaction disabled (no scroll, zoom, rotate, pitch)
 * - pointerEvents="none" on wrapping View - taps pass through to parent
 * - Theme-aware styling (dark/light mode)
 * - Returns null when no overviewGeometry provided
 *
 * Following components/CLAUDE.md: uses useSemanticTheme() exclusively.
 * Following react-rules.md: named export, displayName, useMemo for decode.
 */

import React, { useMemo } from 'react'
import { StyleSheet, View, Platform } from 'react-native'
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { buildMapStyleFromTheme } from '../../map/map-style'
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

  // Build map style for theme-aware dark/light mode
  // useMemo justified: style object creation is non-trivial
  const mapStyle = useMemo(() => {
    return buildMapStyleFromTheme({ semantic, dark } as any)
  }, [semantic, dark])

  // No geometry to render - return null
  // (must be after all hooks per Rules of Hooks)
  if (coordinates.length === 0) {
    return null
  }

  // Web fallback - maps unavailable in web builds
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

  // Calculate region from bounds with padding
  // 1.3 multiplier provides visual padding around the route
  const region = {
    latitude: (bounds.southwest.lat + bounds.northeast.lat) / 2,
    longitude: (bounds.southwest.lng + bounds.northeast.lng) / 2,
    latitudeDelta: Math.abs(bounds.northeast.lat - bounds.southwest.lat) * 1.3,
    longitudeDelta: Math.abs(bounds.northeast.lng - bounds.southwest.lng) * 1.3,
  }

  return (
    <View
      style={styles.container}
      pointerEvents="none"
      testID={testID}
    >
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        customMapStyle={mapStyle}
        // Completely disable all interaction
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        // Hide all UI chrome
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        loadingEnabled={false}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor={semantic.color.primary.default}
          strokeWidth={3}
        />
      </MapView>
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
