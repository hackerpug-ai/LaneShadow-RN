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

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Platform, StyleSheet, View } from 'react-native'
import Mapbox, {
  MapView,
  Camera,
  MarkerView,
  ShapeSource,
  LineLayer,
  UserLocation,
} from '@rnmapbox/maps'
import type { FeatureCollection, LineString, Position } from 'geojson'
import { Text } from 'react-native-paper'
import { MAP_STYLES } from '../../lib/mapbox/styles'
import {
  latLngToMapbox,
  convertCoordinateArray,
  mapboxToLatLng,
} from '../../lib/mapbox/coordinate-converter'

// Set Mapbox access token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '')

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
  /** Callback when camera position changes (Mapbox-native format) */
  onCameraChange?: (camera: MapboxCamera) => void
  /**
   * Callback when camera position changes (Google Maps parity format).
   * Used by screens migrating from Google Maps MapViewWrapper.
   */
  onCameraMove?: (event: {
    coordinates: { latitude: number; longitude: number }
    zoom: number
  }) => void
  /** Callback when map is pressed (Mapbox-native format) */
  onPress?: (feature: GeoJSON.Feature) => void
  /**
   * Callback when map is pressed (Google Maps parity format).
   * Used by screens migrating from Google Maps MapViewWrapper.
   */
  onMapClick?: (event: {
    coordinates?: { latitude: number; longitude: number }
  }) => void
  /** Whether to show the user location indicator (default: true) */
  showsUserLocation?: boolean
  /** Optional style prop for the map container */
  style?: StyleProp<ViewStyle>
  /** Optional children to render overlays */
  children?: ReactNode
}

/**
 * Imperative handle for MapboxMapView.
 *
 * Provides methods to programmatically control the map camera.
 * Includes parity with the Google Maps MapViewHandle API for drop-in replacement.
 */
export interface MapboxMapViewHandle {
  /** Set camera position with Mapbox-native coordinates */
  setCamera: (camera: MapboxCamera, duration?: number) => void
  /** Zoom in by the specified delta */
  zoomIn: (delta?: number) => void
  /** Zoom out by the specified delta */
  zoomOut: (delta?: number) => void
  /** Fit map to show all specified coordinates (Google Maps format {lat, lng}) */
  fitToCoordinates: (
    coordinates: { latitude: number; longitude: number }[],
    padding?: { top: number; right: number; bottom: number; left: number }
  ) => void

  // --- Google Maps parity methods ---

  /**
   * Set camera position using Google Maps coordinate format.
   * Convenience wrapper that converts {latitude, longitude} to [lng, lat].
   */
  setCameraPosition: (input: {
    coordinates?: { latitude: number; longitude: number }
    zoom?: number
    duration?: number
  }) => void

  /**
   * Zoom by delta. Positive zooms in, negative zooms out.
   * Routes to zoomIn (positive) or zoomOut (negative).
   */
  zoomBy: (delta: number) => void

  /**
   * Animate camera back to the user's last known location.
   * Requires user location tracking to be enabled (showsUserLocation prop).
   */
  recenterToUser: () => void

  /**
   * Animate to a region defined by center + deltas.
   * Converts Google Maps region to Mapbox camera position.
   */
  animateToRegion: (
    region: {
      latitude: number
      longitude: number
      latitudeDelta: number
      longitudeDelta: number
    },
    duration?: number
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
  ({ theme, camera, markers, polylines, onCameraChange, onCameraMove, onPress, onMapClick, showsUserLocation = true, style, children }, ref) => {
    const cameraRef = useRef<any>(null)
    const mapViewRef = useRef<any>(null)
    const isWeb = Platform.OS === 'web'

    // Track last known camera state for zoomBy calculations
    const [lastCameraState, setLastCameraState] = useState<{
      center: [number, number] | undefined
      zoom: number
    }>({ center: undefined, zoom: 12 })

    // Track user location for recenterToUser
    const lastUserLocationRef = useRef<{ latitude: number; longitude: number } | null>(null)
    const [didCenterOnUser, setDidCenterOnUser] = useState(false)

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
        setLastCameraState({ center: cameraConfig.center, zoom: cameraConfig.zoom })
      },

      zoomIn: (delta = 1) => {
        if (!cameraRef.current) return
        const currentZoom = lastCameraState.zoom
        cameraRef.current.zoomTo(currentZoom + delta, 300)
        setLastCameraState((prev) => ({ ...prev, zoom: currentZoom + delta }))
      },

      zoomOut: (delta = 1) => {
        if (!cameraRef.current) return
        const currentZoom = lastCameraState.zoom
        const newZoom = Math.max(0, currentZoom - delta)
        cameraRef.current.zoomTo(newZoom, 300)
        setLastCameraState((prev) => ({ ...prev, zoom: newZoom }))
      },

      fitToCoordinates: (coordinates, padding = { top: 80, right: 40, bottom: 80, left: 40 }) => {
        if (!cameraRef.current || coordinates.length === 0) return

        // Convert coordinates to Mapbox format
        const mapboxCoords = coordinates.map(latLngToMapbox)

        // Calculate proper bounding box (not just first/last)
        const lats = mapboxCoords.map((c) => c[1])
        const lngs = mapboxCoords.map((c) => c[0])
        const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)]
        const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)]

        // Mapbox fitBounds expects padding as [top, right, bottom, left] array
        const paddingArray: [number, number, number, number] = [
          padding.top,
          padding.right,
          padding.bottom,
          padding.left,
        ]
        cameraRef.current.fitBounds(ne, sw, paddingArray, 500)
      },

      // --- Google Maps parity methods ---

      setCameraPosition: (input) => {
        const { coordinates, zoom, duration = 500 } = input
        if (!cameraRef.current) return

        if (coordinates) {
          const center: [number, number] = latLngToMapbox(coordinates)
          cameraRef.current.setCamera({
            centerCoordinate: center,
            zoom: zoom ?? lastCameraState.zoom,
            pitch: 0,
            heading: 0,
            duration,
          })
          setLastCameraState({ center, zoom: zoom ?? lastCameraState.zoom })
        } else if (zoom !== undefined) {
          // Zoom only, keep current center
          cameraRef.current.zoomTo(zoom, duration)
          setLastCameraState((prev) => ({ ...prev, zoom }))
        }
      },

      zoomBy: (delta: number) => {
        if (delta >= 0) {
          // Positive delta = zoom in
          const zoomDelta = delta === 0 ? 0 : delta
          const currentZoom = lastCameraState.zoom
          const newZoom = currentZoom + zoomDelta
          if (cameraRef.current) {
            cameraRef.current.zoomTo(newZoom, 300)
          }
          setLastCameraState((prev) => ({ ...prev, zoom: newZoom }))
        } else {
          // Negative delta = zoom out
          const currentZoom = lastCameraState.zoom
          const newZoom = Math.max(0, currentZoom + delta) // delta is negative
          if (cameraRef.current) {
            cameraRef.current.zoomTo(newZoom, 300)
          }
          setLastCameraState((prev) => ({ ...prev, zoom: newZoom }))
        }
      },

      recenterToUser: () => {
        if (!cameraRef.current || !lastUserLocationRef.current) return
        const userLoc = lastUserLocationRef.current
        const center: [number, number] = latLngToMapbox(userLoc)
        cameraRef.current.setCamera({
          centerCoordinate: center,
          zoom: lastCameraState.zoom,
          pitch: 0,
          heading: 0,
          duration: 300,
        })
        setLastCameraState((prev) => ({ ...prev, center }))
      },

      animateToRegion: (region, duration = 500) => {
        if (!cameraRef.current) return
        const center: [number, number] = [region.longitude, region.latitude]
        const zoom = Math.log2(360 / region.latitudeDelta)
        cameraRef.current.setCamera({
          centerCoordinate: center,
          zoom,
          pitch: 0,
          heading: 0,
          duration,
        })
        setLastCameraState({ center, zoom })
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

    // Handle map press, routing to either onPress or onMapClick callback
    const handlePress = useCallback(
      (feature: GeoJSON.Feature) => {
        if (onPress) {
          onPress(feature)
        }
        if (onMapClick) {
          // Extract coordinates from the pressed feature
          const geometry = feature.geometry as any
          const coords = geometry?.coordinates as [number, number] | undefined
          onMapClick({
            coordinates: coords ? mapboxToLatLng(coords) : undefined,
          })
        }
      },
      [onPress, onMapClick]
    )

    // Handle camera change, routing to both onCameraChange and onCameraMove
    const handleCameraChanged = useCallback(
      (state: any) => {
        if (!state?.properties) return
        const center = state.properties.center as [number, number] | undefined
        const zoom = state.properties.zoom as number | undefined

        if (center && zoom !== undefined) {
          setLastCameraState({ center, zoom })

          if (onCameraChange) {
            onCameraChange({
              center,
              zoom,
              pitch: state.properties.pitch ?? 0,
              heading: state.properties.heading ?? 0,
            })
          }

          if (onCameraMove) {
            const googleCenter = mapboxToLatLng(center)
            onCameraMove({
              coordinates: googleCenter,
              zoom,
            })
          }
        }
      },
      [onCameraChange, onCameraMove]
    )

    // Handle user location updates
    const handleUserLocationUpdate = useCallback(
      (location: any) => {
        const coords = location?.coords
        if (coords?.latitude && coords?.longitude) {
          const userCoord = { latitude: coords.latitude, longitude: coords.longitude }
          lastUserLocationRef.current = userCoord

          // Auto-center on user location on first update (if no initial camera set)
          if (!didCenterOnUser && !camera?.center && cameraRef.current) {
            const center: [number, number] = latLngToMapbox(userCoord)
            cameraRef.current.setCamera({
              centerCoordinate: center,
              zoom: lastCameraState.zoom,
              duration: 300,
            })
            setLastCameraState((prev) => ({ ...prev, center }))
            setDidCenterOnUser(true)
          }
        }
      },
      [camera?.center, didCenterOnUser, lastCameraState.zoom]
    )

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

    // Validate camera center — Mapbox throws "coordinates must contain numbers" for NaN/undefined
    const validCenter = camera?.center
    const isValidCenter = validCenter &&
      Array.isArray(validCenter) &&
      validCenter.length === 2 &&
      isFinite(validCenter[0]) &&
      isFinite(validCenter[1])

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
        ref={mapViewRef}
        style={[styles.map, style]}
        styleURL={styleURL}
        onPress={handlePress}
        onCameraChanged={handleCameraChanged}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={isValidCenter ? validCenter : undefined}
          zoomLevel={camera?.zoom ?? 12}
          pitch={camera?.pitch ?? 0}
          heading={camera?.heading ?? 0}
        />

        {showsUserLocation && (
          <UserLocation
            visible={true}
            onUpdate={handleUserLocationUpdate}
          />
        )}

        {markerElements}
        {polylineElements}
        {children}
      </MapView>
    )
  }
)

MapboxMapView.displayName = 'MapboxMapView'
