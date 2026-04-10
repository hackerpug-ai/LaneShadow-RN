/**
 * MapboxMapView wrapper component with LaneShadow theme integration.
 *
 * This component wraps @rnmapbox/maps's MapView with:
 * - Theme-aware style URL selection (dark/light)
 * - Camera positioning and controls
 * - Marker rendering with coordinate conversion
 * - Polyline rendering with coordinate conversion
 *
 * @see https://github.com/rnmapbox/maps
 */

import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Platform, StyleSheet, View } from 'react-native'
import Mapbox, {
  MapView,
  Camera,
  MarkerView,
  ShapeSource,
  LineLayer,
} from '@rnmapbox/maps'
import type { FeatureCollection, LineString, Position } from 'geojson'
import { Text } from 'react-native-paper'
import { MAP_STYLES } from '../../lib/mapbox/styles'
import {
  googleToMapbox,
  latLngToMapbox,
  convertCoordinateArray,
} from '../../lib/mapbox/coordinate-converter'

// Set Mapbox access token
Mapbox.setAccessToken(
  Platform.select({
    ios: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN_IOS,
    android: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN_ANDROID,
  }) ?? process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''
)

/**
 * Marker interface for MapboxMapView.
 *
 * Coordinates are in Google Maps format [lat, lng] for consistency
 * with the existing codebase. They will be converted to Mapbox format [lng, lat].
 */
export interface MapboxMarker {
  /** Unique identifier for the marker */
  id?: string
  /** Title displayed when marker is tapped */
  title?: string
  /** Coordinates in Google Maps format [lat, lng] */
  coordinates: { latitude: number; longitude: number }
}

/**
 * Polyline interface for MapboxMapView.
 *
 * Coordinates are in Google Maps format [lat, lng] for consistency
 * with the existing codebase. They will be converted to Mapbox format [lng, lat].
 */
export interface MapboxPolyline {
  /** Unique identifier for the polyline */
  id?: string
  /** Array of coordinates in Google Maps format [lat, lng] */
  coordinates: { latitude: number; longitude: number }[]
  /** Stroke color in hex format (e.g., '#B87333') */
  strokeColor?: string
  /** Stroke width in points */
  strokeWidth?: number
}

/**
 * Camera interface for MapboxMapView.
 *
 * Center coordinates are in Mapbox format [lng, lat] for direct
 * compatibility with Mapbox SDK.
 */
export interface MapboxCamera {
  /** Center coordinates in Mapbox format [lng, lat] */
  center: [number, number]
  /** Zoom level (0-22) */
  zoom: number
  /** Pitch angle in degrees (0-60, where 0 is vertical) */
  pitch?: number
  /** Heading angle in degrees (0-360, where 0 is north) */
  heading?: number
}

/**
 * Props for MapboxMapView component.
 */
export interface MapboxMapViewProps {
  /** Theme mode for map style selection */
  theme: 'dark' | 'light'
  /** Camera position settings */
  camera?: MapboxCamera
  /** Array of markers to display */
  markers?: MapboxMarker[]
  /** Array of polylines to display */
  polylines?: MapboxPolyline[]
  /** Callback when camera position changes */
  onCameraChange?: (camera: MapboxCamera) => void
  /** Callback when map is pressed */
  onPress?: (feature: GeoJSON.Feature) => void
  /** Optional style prop for the map container */
  style?: StyleProp<ViewStyle>
  /** Optional children to render overlays */
  children?: ReactNode
}

/**
 * Imperative handle for MapboxMapView.
 *
 * Provides methods to programmatically control the map camera.
 */
export interface MapboxMapViewHandle {
  /** Set camera position with optional animation */
  setCamera: (camera: MapboxCamera, duration?: number) => void
  /** Zoom in by the specified delta */
  zoomIn: (delta?: number) => void
  /** Zoom out by the specified delta */
  zoomOut: (delta?: number) => void
  /** Fit map to show all specified coordinates */
  fitToCoordinates: (
    coordinates: { latitude: number; longitude: number }[],
    padding?: { top: number; right: number; bottom: number; left: number }
  ) => void
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 24,
    height: 24,
    backgroundColor: '#B87333',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
})

/**
 * MapboxMapView wrapper component.
 *
 * Wraps @rnmapbox/maps's MapView with LaneShadow theme integration
 * and coordinate conversion utilities.
 *
 * @example
 * ```tsx
 * <MapboxMapView
 *   theme="dark"
 *   camera={{
 *     center: [-122.4194, 37.7749],
 *     zoom: 12,
 *     pitch: 0,
 *     heading: 0,
 *   }}
 *   markers={[
 *     { id: '1', title: 'San Francisco', coordinates: { latitude: 37.7749, longitude: -122.4194 } }
 *   ]}
 *   polylines={[
 *     {
 *       id: 'route1',
 *       coordinates: [{ latitude: 37.7749, longitude: -122.4194 }],
 *       strokeColor: '#B87333',
 *       strokeWidth: 4
 *     }
 *   ]}
 * />
 * ```
 */
export const MapboxMapView = forwardRef<MapboxMapViewHandle | null, MapboxMapViewProps>(
  ({ theme, camera, markers, polylines, onCameraChange, onPress, style, children }, ref) => {
    const cameraRef = useRef<any>(null)
    const isWeb = Platform.OS === 'web'

    // Get the appropriate style URL based on theme
    const styleURL = useMemo(() => {
      return MAP_STYLES[theme]
    }, [theme])

    // Imperative handle for camera controls
    useImperativeHandle(ref, () => ({
      setCamera: (cameraConfig, duration = 500) => {
        if (!cameraRef.current) return

        cameraRef.current.setCamera({
          centerCoordinate: cameraConfig.center,
          zoom: cameraConfig.zoom,
          pitch: cameraConfig.pitch ?? 0,
          heading: cameraConfig.heading ?? 0,
          duration: duration,
        })
      },

      zoomIn: (delta = 1) => {
        if (!cameraRef.current) return
        cameraRef.current.zoomTo(delta + 1)
      },

      zoomOut: (delta = 1) => {
        if (!cameraRef.current) return
        const newZoom = Math.max(0, 1 - delta)
        cameraRef.current.zoomTo(newZoom)
      },

      fitToCoordinates: (coordinates, padding = { top: 80, right: 40, bottom: 80, left: 40 }) => {
        if (!cameraRef.current || coordinates.length === 0) return

        // Convert coordinates to Mapbox format
        const mapboxCoords = coordinates.map(latLngToMapbox)

        cameraRef.current.fitBounds(
          {
            ne: mapboxCoords[0],
            sw: mapboxCoords[mapboxCoords.length - 1],
          },
          padding,
          500
        )
      },
    }))

    // Convert markers to Mapbox format
    const markerElements = useMemo(() => {
      if (!markers) return null

      return markers.map((marker) => {
        const mapboxCoords = latLngToMapbox(marker.coordinates)
        return (
          <MarkerView
            key={marker.id ?? `${marker.coordinates.latitude}-${marker.coordinates.longitude}`}
            coordinate={mapboxCoords}
          >
            <View style={styles.marker}>
              <Text style={{ fontSize: 10, color: '#FFFFFF', textAlign: 'center' }}>
                {marker.title?.charAt(0)}
              </Text>
            </View>
          </MarkerView>
        )
      })
    }, [markers])

    // Convert polylines to Mapbox format
    const polylineElements = useMemo(() => {
      if (!polylines) return null

      return polylines.map((polyline) => {
        // Convert coordinates from Google format to Mapbox format
        const googleCoords = polyline.coordinates.map((c) => [c.latitude, c.longitude] as [number, number])
        const mapboxCoords: Position[] = convertCoordinateArray(googleCoords)

        // Create GeoJSON LineString feature
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

        return (
          <ShapeSource
            key={polyline.id ?? `polyline-${polyline.coordinates[0]?.latitude}`}
            id={polyline.id ?? `polyline-${polyline.coordinates[0]?.latitude}`}
            shape={feature}
          >
            <LineLayer
              id={`${polyline.id ?? 'polyline'}-layer`}
              style={{
                lineColor: polyline.strokeColor ?? '#B87333',
                lineWidth: polyline.strokeWidth ?? 4,
                lineOpacity: 1.0,
              }}
            />
          </ShapeSource>
        )
      })
    }, [polylines])

    // Web fallback
    if (isWeb) {
      return (
        <View style={[styles.map, styles.webFallback, style]}>
          <Text variant="bodyMedium">Mapbox maps are unavailable in web builds.</Text>
        </View>
      )
    }

    return (
      <MapView
        style={[styles.map, style]}
        styleURL={styleURL}
        onPress={onPress}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={camera?.center}
          zoomLevel={camera?.zoom}
          pitch={camera?.pitch ?? 0}
          heading={camera?.heading ?? 0}
        />

        {markerElements}
        {polylineElements}
        {children}
      </MapView>
    )
  }
)

MapboxMapView.displayName = 'MapboxMapView'
