import * as Location from 'expo-location'
import { useEffect, useState } from 'react'
import type { RouteStop } from '../server/types/routes'

type CurrentLocationState = {
  location: RouteStop | null
  loading: boolean
  error: string | null
}

export function useCurrentLocation() {
  const [state, setState] = useState<CurrentLocationState>({
    location: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          if (!cancelled) setState({ location: null, loading: false, error: 'Permission denied' })
          return
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        })

        const [geo] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })

        const label = geo?.city ?? geo?.region ?? 'Current Location'

        if (!cancelled) {
          setState({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              label,
            },
            loading: false,
            error: null,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            location: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to get location',
          })
        }
      }
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
