import { render } from '@testing-library/react-native'
import { describe, expect, it } from 'vitest'
import { MapboxMapView } from './mapbox-map-view'

describe('MapboxMapView', () => {
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
})
