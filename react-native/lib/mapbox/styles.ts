/**
 * Mapbox map style URLs for LaneShadow.
 *
 * These URLs are used by the MapboxMapView to switch between dark and light themes.
 * The styles are hosted by Mapbox and require a valid access token.
 *
 * @see https://docs.mapbox.com/android/maps/guides/styles/
 * @see https://docs.mapbox.com/ios/maps/guides/styles/
 */

export const MAP_STYLES = {
  /**
   * Dark theme map style.
   * Used when the app is in dark mode (default for LaneShadow).
   */
  dark: 'mapbox://styles/justincrich/cmnsyn5ox005z01sr8wsh3syj',

  /**
   * Light theme map style.
   * Used when the app is in light mode.
   */
  light: 'mapbox://styles/justincrich/cmnsyu0or006001sr5ljn6gg2',
} as const

/**
 * Map theme type corresponding to LaneShadow's theme system.
 */
export type MapTheme = keyof typeof MAP_STYLES

/**
 * Get the appropriate map style URL for the current color scheme.
 *
 * @param colorScheme - The current color scheme ('light' or 'dark')
 * @returns The Mapbox style URL for the given scheme
 */
export function getMapStyleUrl(colorScheme: 'light' | 'dark'): string {
  return MAP_STYLES[colorScheme]
}
