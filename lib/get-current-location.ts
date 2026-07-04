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
const LAST_KNOWN_LOCATION_MAX_AGE_MS = 10 * 60 * 1000
const LAST_KNOWN_LOCATION_REQUIRED_ACCURACY_M = 5000
const REVERSE_GEOCODE_TIMEOUT_MS = 500

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

async function getLastKnownPosition(): Promise<Location.LocationObject | null> {
  try {
    return await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_LOCATION_MAX_AGE_MS,
      requiredAccuracy: LAST_KNOWN_LOCATION_REQUIRED_ACCURACY_M,
    })
  } catch {
    return null
  }
}

async function resolveLocationLabel(
  coords: Pick<Location.LocationObjectCoords, 'latitude' | 'longitude'>,
  timeoutMs: number,
): Promise<string> {
  try {
    const reverseGeocode = await withTimeout(
      Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
      timeoutMs,
    )
    const [geo] = reverseGeocode ?? []
    return geo?.city ?? geo?.region ?? 'Current Location'
  } catch {
    return 'Current Location'
  }
}

export async function getCurrentLocation(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<RouteStop | null> {
  const task = (async (): Promise<RouteStop | null> => {
    const startedAt = Date.now()
    const remainingBudget = () => Math.max(0, timeoutMs - (Date.now() - startedAt))
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return null

    const currentPositionBudgetMs = Math.max(500, remainingBudget() - 750)
    const position =
      (await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        }),
        currentPositionBudgetMs,
      )) ?? (await withTimeout(getLastKnownPosition(), Math.min(750, remainingBudget())))

    if (!position) return null

    const { latitude, longitude } = position.coords
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
    const reverseGeocodeBudgetMs = Math.min(REVERSE_GEOCODE_TIMEOUT_MS, remainingBudget())
    const label =
      reverseGeocodeBudgetMs >= 100
        ? await resolveLocationLabel(position.coords, reverseGeocodeBudgetMs)
        : 'Current Location'
    return {
      lat: latitude,
      lng: longitude,
      label,
    }
  })()

  try {
    return await withTimeout(task, timeoutMs)
  } catch {
    return null
  }
}
