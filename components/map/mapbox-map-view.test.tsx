import { act, render } from '@testing-library/react-native'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MapboxMapView, type MapboxMapViewHandle } from './mapbox-map-view'

const SAMPLE_POLYLINE = [
  { latitude: 34.8, longitude: -120.1 },
  { latitude: 34.9, longitude: -120.0 },
  { latitude: 35.0, longitude: -119.9 },
]

describe('MapboxMapView', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('renders an app-resolved current-location fallback marker until Mapbox reports user location', () => {
    const { getByTestId } = render(
      <MapboxMapView
        theme="light"
        initialCamera={{ center: [-122.4194, 37.7749], zoom: 12.5 }}
        userLocation={{ latitude: 37.7749, longitude: -122.4194 }}
      />,
    )

    expect(getByTestId('map-user-location-fallback')).toBeTruthy()
  })

  it('does not render the fallback marker when user location display is disabled', () => {
    const { queryByTestId } = render(
      <MapboxMapView
        theme="light"
        initialCamera={{ center: [-122.4194, 37.7749], zoom: 12.5 }}
        showsUserLocation={false}
        userLocation={{ latitude: 37.7749, longitude: -122.4194 }}
      />,
    )

    expect(queryByTestId('map-user-location-fallback')).toBeNull()
  })

  it('AC-2: defers fitToCoordinates until Mapbox style/map load completes', () => {
    const onMapReady = vi.fn()
    const mapRef = createRef<MapboxMapViewHandle | null>()

    render(
      <MapboxMapView
        ref={mapRef}
        theme="light"
        polylines={[
          {
            id: 'route-line',
            coordinates: SAMPLE_POLYLINE,
            strokeColor: '#B87333',
            strokeWidth: 4,
          },
        ]}
        onMapReady={onMapReady}
      />,
    )

    const simulateLoad = mapRef.current?.__simulateMapStyleLoadForTests
    expect(simulateLoad).toBeTypeOf('function')

    act(() => {
      mapRef.current?.fitToCoordinates(SAMPLE_POLYLINE)
    })

    expect(onMapReady).not.toHaveBeenCalled()

    act(() => {
      simulateLoad?.()
    })

    expect(onMapReady).toHaveBeenCalledTimes(1)
  })

  it('AC-2: exposes mapbox-road-polyline-layer oracle only after map-ready with ≥2-point polylines', () => {
    const mapRef = createRef<MapboxMapViewHandle | null>()
    const { queryByTestId, rerender } = render(
      <MapboxMapView
        ref={mapRef}
        theme="light"
        polylines={[
          {
            id: 'route-line',
            coordinates: SAMPLE_POLYLINE,
            strokeColor: '#B87333',
            strokeWidth: 4,
          },
        ]}
      />,
    )

    expect(queryByTestId('mapbox-road-polyline-layer')).toBeNull()

    act(() => {
      mapRef.current?.__simulateMapStyleLoadForTests?.()
    })

    expect(queryByTestId('mapbox-road-polyline-layer')).toBeTruthy()

    rerender(
      <MapboxMapView
        ref={mapRef}
        theme="light"
        polylines={[
          {
            id: 'degenerate',
            coordinates: [{ latitude: 34.8, longitude: -120.1 }],
            strokeWidth: 4,
          },
        ]}
      />,
    )

    expect(queryByTestId('mapbox-road-polyline-layer')).toBeNull()
  })
})
