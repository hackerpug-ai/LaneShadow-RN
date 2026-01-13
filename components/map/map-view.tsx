import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Platform, StyleSheet, View } from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { buildMapStyleFromTheme } from './map-style'

type BaseProps = {
  style?: StyleProp<ViewStyle>
  cameraPosition?: {
    coordinates?: { latitude: number; longitude: number }
    zoom?: number
    duration?: number
  }
  markers?: Array<{
    id?: string
    title?: string
    coordinates: { latitude: number; longitude: number }
  }>
  polylines?: Array<{
    id?: string
    coordinates: Array<{ latitude: number; longitude: number }>
    strokeColor?: string
    strokeWidth?: number
  }>
  onMapClick?: (event: { coordinates?: { latitude: number; longitude: number } }) => void
  onCameraMove?: (event: {
    coordinates: { latitude: number; longitude: number }
    zoom: number
  }) => void
}

export type MapViewProps = BaseProps

export type MapViewHandle = {
  setCameraPosition: (input: {
    coordinates?: { latitude: number; longitude: number }
    zoom?: number
    duration?: number
  }) => void
  zoomBy: (delta: number) => void
  recenterToUser: () => void
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
})

export const MapViewWrapper = forwardRef<MapViewHandle | null, MapViewProps>(
  ({ style, cameraPosition, markers, polylines, onMapClick, onCameraMove }, ref) => {
    const { semantic, dark } = useSemanticTheme()
    const mapRef = useRef<any>(null)
    const isWeb = Platform.OS === 'web'
    const [lastCamera, setLastCamera] = useState<{
      center?: { latitude: number; longitude: number }
      zoom?: number
    }>({})
    const [lastUserLocation, setLastUserLocation] = useState<{
      latitude: number
      longitude: number
    }>()
    const [didCenterOnUser, setDidCenterOnUser] = useState(false)

    const mapStyle = useMemo(() => {
      return buildMapStyleFromTheme({ semantic, dark } as any)
    }, [semantic, dark])

    useImperativeHandle(ref, () => ({
      setCameraPosition: (input) => {
        const { coordinates, zoom, duration = 500 } = input
        if (!mapRef.current) return

        const centerToUse = coordinates ?? lastCamera.center
        if (!centerToUse && zoom === undefined) return

        mapRef.current.animateCamera(
          {
            center: centerToUse,
            zoom: zoom ?? lastCamera.zoom,
          },
          { duration }
        )
      },
      zoomBy: (delta: number) => {
        if (!mapRef.current) return
        const nextZoom = (lastCamera.zoom ?? 10) + delta
        const centerToUse = lastCamera.center
        if (!centerToUse) return
        mapRef.current.animateCamera(
          {
            center: centerToUse,
            zoom: nextZoom,
          },
          { duration: 300 }
        )
        setLastCamera((prev) => ({ ...prev, zoom: nextZoom }))
      },
      recenterToUser: () => {
        if (!mapRef.current || !lastUserLocation) return
        mapRef.current.animateCamera(
          {
            center: lastUserLocation,
            zoom: lastCamera.zoom ?? 14,
          },
          { duration: 300 }
        )
        setLastCamera((prev) => ({ ...prev, center: lastUserLocation }))
      },
    }))

    const onPress = useMemo(() => {
      if (!onMapClick) return undefined
      return (event: any) => {
        const coord: { latitude: number; longitude: number } | undefined =
          event?.nativeEvent?.coordinate
        onMapClick({ coordinates: coord })
      }
    }, [onMapClick])

    const onRegionChangeComplete = useMemo(() => {
      return (region: { latitude: number; longitude: number; latitudeDelta: number }) => {
        const zoom = Math.log2(360 / region.latitudeDelta)
        const center = { latitude: region.latitude, longitude: region.longitude }
        setLastCamera({ center, zoom })
        if (onCameraMove) {
          onCameraMove({
            coordinates: center,
            zoom,
          })
        }
      }
    }, [onCameraMove])

    if (isWeb) {
      return (
        <View
          style={[
            styles.map,
            style,
            {
              backgroundColor: semantic.color.surface.default,
              alignItems: 'center',
              justifyContent: 'center',
              padding: semantic.space.lg,
            },
          ]}
        >
          <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
            Maps are unavailable in this build.
          </Text>
        </View>
      )
    }

    const initialCamera = useMemo(() => {
      if (!cameraPosition?.coordinates) return undefined
      return {
        center: cameraPosition.coordinates,
        zoom: cameraPosition.zoom ?? 12,
        heading: 0,
        pitch: 0,
        altitude: 0,
      }
    }, [cameraPosition])

    return (
      <MapView
        ref={mapRef}
        style={[styles.map, style]}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        showsUserLocation
        showsMyLocationButton
        onMapReady={async () => {
          if (mapRef.current?.getCamera) {
            const cam: any = await mapRef.current.getCamera?.()
            if (cam?.center) {
              setLastCamera({ center: cam.center, zoom: cam.zoom ?? 12 })
            }
          }
        }}
        onPress={onPress}
        onRegionChangeComplete={onRegionChangeComplete}
        initialCamera={initialCamera}
        moveOnMarkerPress={false}
        onUserLocationChange={(event) => {
          const coord = event?.nativeEvent?.coordinate
          if (coord?.latitude && coord?.longitude) {
            const userCoord = { latitude: coord.latitude, longitude: coord.longitude }
            setLastUserLocation(userCoord)
            if (!didCenterOnUser && !cameraPosition?.coordinates) {
              mapRef.current?.animateCamera(
                {
                  center: userCoord,
                  zoom: lastCamera.zoom ?? 14,
                },
                { duration: 300 }
              )
              setLastCamera((prev) => ({ ...prev, center: userCoord }))
              setDidCenterOnUser(true)
            }
          }
        }}
      >
        {markers?.map((marker) => (
          <Marker
            key={marker.id ?? `${marker.coordinates.latitude}-${marker.coordinates.longitude}`}
            coordinate={marker.coordinates}
            title={marker.title}
          />
        ))}

        {polylines?.map((line) => (
          <Polyline
            key={line.id ?? `${line.coordinates[0]?.latitude}-${line.coordinates[0]?.longitude}`}
            coordinates={line.coordinates}
            strokeColor={line.strokeColor}
            strokeWidth={line.strokeWidth ?? 4}
          />
        ))}
      </MapView>
    )
  }
)

MapViewWrapper.displayName = 'MapViewWrapper'
