/**
 * SAVE-002 — Hand a route centroid + name to the platform native maps app.
 *
 * - iOS     → Apple Maps  (`https://maps.apple.com/?ll=…&q=…`)
 * - Android → Google Maps (`google.navigation:q=lat,lng`)
 * - Fallback → maps.google.com web URL when the native scheme is unavailable
 *   (`Linking.canOpenURL` returns false).
 * - Null centroid → graceful no-op (no openURL, no crash, returns null).
 *
 * No new dependency: uses `expo-linking` (~8.0.x) + RN `Platform.OS`.
 */

import * as Linking from 'expo-linking'
import { Platform } from 'react-native'

export type MapsDeeplinkArgs = {
  lat: number | null
  lng: number | null
  name?: string
}

/**
 * Build the platform-native maps URL for a centroid.
 *
 * iOS → Apple Maps; Android (and any other platform) → Google Maps
 * navigation scheme.
 */
function buildNativeUrl(lat: number, lng: number, name: string): string {
  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`
  }
  return `google.navigation:q=${lat},${lng}`
}

/**
 * Build the universal web fallback URL (works on any platform with a
 * browser).
 */
function buildWebUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`
}

/**
 * Open the route centroid in the platform's native maps app, falling back to
 * a web URL if no native maps scheme is available. Returns the URL that was
 * opened, or `null` if the centroid was null (graceful no-op).
 *
 * @see .spec/prds/mvp/tasks/sprint-02-route-detail-close-the-loop/SAVE-002-*.md
 */
export async function openRouteInMaps(args: MapsDeeplinkArgs): Promise<string | null> {
  const { lat, lng, name } = args
  // AC-4: graceful no-op on null centroid.
  if (lat == null || lng == null) return null

  const nativeUrl = buildNativeUrl(lat, lng, name ?? '')

  // AC-3: fall back to web maps when the native scheme can't be opened.
  if (await Linking.canOpenURL(nativeUrl)) {
    await Linking.openURL(nativeUrl)
    return nativeUrl
  }

  const webUrl = buildWebUrl(lat, lng)
  await Linking.openURL(webUrl)
  return webUrl
}
