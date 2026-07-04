/**
 * Pure, testable camera computation logic for the home map screen.
 * This is extracted from index.tsx so it can be unit tested in isolation.
 */

import type { MapboxCamera } from '../../../components/map/mapbox-map-view'

// Continental fallback used only when device location is denied/unavailable AND
// there is no saved camera — keeps the map from rendering blank or at a wrong
// "max zoom" view on a fresh login. Live location always wins at the
// CURRENT_LOCATION_OPEN_ZOOM level.
const DEFAULT_MAPBOX_CAMERA: MapboxCamera = {
  center: [-98.5, 39.8],
  zoom: 3.5,
}

// Open zoom level for current location on cold open: about a 1 mile visible radius.
// At ~37°N, a phone-width viewport shows roughly a 2 mi diameter at z12.5.
export const CURRENT_LOCATION_OPEN_ZOOM = 12.5

/**
 * Derives initialCamera from session state, current location, and persisted defaults.
 * Applies strict precedence order:
 *   1. Active session slot (explicit resume)
 *   2. Current location (cold open with live location)
 *   3. Default slot (cold open fallback)
 *   4. Continental default (location denied/unavailable)
 *
 * TESTABLE: This is a pure function that can be tested in isolation without React hooks.
 *
 * @param args.sessionSlot - Active session camera (if resuming a saved session)
 * @param args.currentLocation - Device location {lat, lng} (if available)
 * @param args.defaultCameraSlot - Persisted default camera
 * @param args.locationLoading - Whether device location is still resolving
 * @param args.cameraStoreHydrated - Whether the camera store has loaded from AsyncStorage
 * @returns MapboxCamera | undefined
 */
export function computeInitialCamera(args: {
  sessionSlot: any
  currentLocation: { lat: number; lng: number } | null
  defaultCameraSlot: any
  locationLoading: boolean
  cameraStoreHydrated: boolean
}): MapboxCamera | undefined {
  const { sessionSlot, currentLocation, defaultCameraSlot, locationLoading, cameraStoreHydrated } =
    args

  if (!cameraStoreHydrated) return undefined

  // Priority 1: active session slot wins (explicit resume)
  if (sessionSlot) {
    return {
      center: [sessionSlot.center.longitude, sessionSlot.center.latitude],
      zoom: sessionSlot.zoom,
    }
  }

  // Priority 2: current location wins on cold open (live location with correct zoom)
  if (currentLocation) {
    return {
      center: [currentLocation.lng, currentLocation.lat],
      zoom: CURRENT_LOCATION_OPEN_ZOOM,
    }
  }

  // On a no-route cold open, do not let a stale persisted default mount the map
  // before live location has had a chance to resolve. The screen passes
  // locationLoading=false after its hard timeout so denied/stuck permissions
  // still fall through to saved/default camera below.
  if (locationLoading) return undefined

  // Priority 3: default slot (cold open, no live location)
  if (defaultCameraSlot) {
    return {
      center: [defaultCameraSlot.center.longitude, defaultCameraSlot.center.latitude],
      zoom: defaultCameraSlot.zoom,
    }
  }

  // Priority 4: continental default (location denied/unavailable)
  // No saved camera and no live location. Once location has settled
  // (denied/unavailable), fall back to the continental default so the map
  // isn't blank.
  if (!locationLoading) return DEFAULT_MAPBOX_CAMERA
  return undefined
}
