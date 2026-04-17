/**
 * Coordinate conversion utilities for Mapbox integration.
 *
 * CRITICAL: Google Maps uses [lat, lng] while Mapbox uses [lng, lat].
 * Always use these utilities when converting between coordinate systems.
 *
 * @see https://docs.mapbox.com/help/glossary/coordinate-systems/
 */

/**
 * Convert Google Maps coordinates to Mapbox coordinates.
 *
 * Google Maps format: [latitude, longitude]
 * Mapbox format: [longitude, latitude]
 *
 * @param coords - Coordinates in Google Maps format [lat, lng]
 * @returns Coordinates in Mapbox format [lng, lat]
 *
 * @example
 * ```ts
 * const googleCoords: [number, number] = [37.7749, -122.4194] // San Francisco
 * const mapboxCoords = googleToMapbox(googleCoords)
 * // mapboxCoords = [-122.4194, 37.7749]
 * ```
 */
export const googleToMapbox = (coords: [number, number]): [number, number] => {
  const [lat, lng] = coords
  return [lng, lat]
}

/**
 * Convert Mapbox coordinates to Google Maps coordinates.
 *
 * Mapbox format: [longitude, latitude]
 * Google Maps format: [latitude, longitude]
 *
 * @param coords - Coordinates in Mapbox format [lng, lat]
 * @returns Coordinates in Google Maps format [lat, lng]
 *
 * @example
 * ```ts
 * const mapboxCoords: [number, number] = [-122.4194, 37.7749] // San Francisco
 * const googleCoords = mapboxToGoogle(mapboxCoords)
 * // googleCoords = [37.7749, -122.4194]
 * ```
 */
export const mapboxToGoogle = (coords: [number, number]): [number, number] => {
  const [lng, lat] = coords
  return [lat, lng]
}

/**
 * Convert an array of Google Maps coordinates to Mapbox format.
 *
 * @param coords - Array of coordinates in Google Maps format [lat, lng][]
 * @returns Array of coordinates in Mapbox format [lng, lat][]
 *
 * @example
 * ```ts
 * const googlePath: [number, number][] = [
 *   [37.7749, -122.4194],
 *   [34.0522, -118.2437],
 * ]
 * const mapboxPath = convertCoordinateArray(googlePath)
 * ```
 */
export const convertCoordinateArray = (coords: [number, number][]): [number, number][] => {
  return coords.map(googleToMapbox)
}

/**
 * Convert an array of Mapbox coordinates to Google Maps format.
 *
 * @param coords - Array of coordinates in Mapbox format [lng, lat][]
 * @returns Array of coordinates in Google Maps format [lat, lng][]
 */
export const convertCoordinateArrayToGoogle = (coords: [number, number][]): [number, number][] => {
  return coords.map(mapboxToGoogle)
}

/**
 * Convert a coordinate object with lat/lng properties to Mapbox format.
 *
 * @param coord - Object with latitude and longitude properties
 * @returns Coordinates in Mapbox format [lng, lat]
 */
export const latLngToMapbox = (coord: {
  latitude: number
  longitude: number
}): [number, number] => {
  return googleToMapbox([coord.latitude, coord.longitude])
}

/**
 * Convert Mapbox coordinates to an object with lat/lng properties.
 *
 * @param coords - Coordinates in Mapbox format [lng, lat]
 * @returns Object with latitude and longitude properties
 */
export const mapboxToLatLng = (
  coords: [number, number],
): { latitude: number; longitude: number } => {
  const [lat, lng] = mapboxToGoogle(coords)
  return { latitude: lat, longitude: lng }
}
