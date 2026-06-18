/**
 * One-shot device location resolver.
 *
 * Used by `useCurrentLocation` (reactive, mount-time) and by the chat send
 * path to guarantee a location before the FIRST planning message of a session
 * — so the agent always has an origin and never asks "where are you starting
 * from?" when the device location simply hadn't resolved yet.
 *
 * Returns `null` for permission denied, timeout, or any failure (fail closed;
 * callers fall back to the session's last-known location server-side).
 */

import * as Location from 'expo-location'
import type { RouteStop } from '../shared/types/routes'

const DEFAULT_TIMEOUT_MS = 2000

export async function getCurrentLocation(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<RouteStop | null> {
  const task = (async (): Promise<RouteStop | null> => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return null

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    })

    const [geo] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    })

    const label = geo?.city ?? geo?.region ?? 'Current Location'

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      label,
    }
  })()

  const timeout = new Promise<RouteStop | null>((resolve) => {
    setTimeout(() => resolve(null), timeoutMs)
  })

  try {
    return await Promise.race([task, timeout])
  } catch {
    return null
  }
}
