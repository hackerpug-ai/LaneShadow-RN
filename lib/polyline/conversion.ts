/**
 * CLR-019: Polyline Coordinate Conversion
 *
 * Conversion utilities between Google [lat, lng] and Mapbox [lng, lat] formats.
 * Preserves weather segment data, handles edge cases, and supports format detection.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Google coordinate format: [latitude, longitude] */
export type GoogleCoord = [number, number]

/** Mapbox coordinate format: [longitude, latitude] */
export type MapboxCoord = [number, number]

/**
 * A weather segment with coordinate data and arbitrary weather metadata.
 * The `coords` field contains coordinate pairs in either Google or Mapbox format.
 */
export interface WeatherSegment {
  startIndex: number
  endIndex: number
  weather: Record<string, unknown>
  coords: GoogleCoord[] | MapboxCoord[]
}

/** Direction for batch weather segment conversion */
export type ConversionDirection = 'googleToMapbox' | 'mapboxToGoogle'

/** Result of format detection */
export type CoordFormat = 'google' | 'mapbox' | 'unknown'

// ---------------------------------------------------------------------------
// Single coordinate conversion
// ---------------------------------------------------------------------------

/** Convert a Google [lat, lng] coordinate to Mapbox [lng, lat]. */
export function googleToMapbox(coord: GoogleCoord): MapboxCoord {
  return [coord[1], coord[0]]
}

/** Convert a Mapbox [lng, lat] coordinate to Google [lat, lng]. */
export function mapboxToGoogle(coord: MapboxCoord): GoogleCoord {
  return [coord[1], coord[0]]
}

// ---------------------------------------------------------------------------
// Array conversion
// ---------------------------------------------------------------------------

/** Convert an array of Google [lat, lng] coordinates to Mapbox [lng, lat]. */
export function googleCoordsToMapbox(coords: GoogleCoord[]): MapboxCoord[] {
  return coords.map(([lat, lng]) => [lng, lat])
}

/** Convert an array of Mapbox [lng, lat] coordinates to Google [lat, lng]. */
export function mapboxCoordsToGoogle(coords: MapboxCoord[]): GoogleCoord[] {
  return coords.map(([lng, lat]) => [lat, lng])
}

// ---------------------------------------------------------------------------
// Weather segment conversion
// ---------------------------------------------------------------------------

/**
 * Convert weather segments between Google and Mapbox coordinate formats.
 * Preserves all weather metadata, startIndex, and endIndex without mutation.
 */
export function convertWeatherSegments(
  segments: WeatherSegment[],
  direction: ConversionDirection,
): WeatherSegment[] {
  const converter = direction === 'googleToMapbox'
    ? googleCoordsToMapbox
    : mapboxCoordsToGoogle

  return segments.map((segment) => ({
    startIndex: segment.startIndex,
    endIndex: segment.endIndex,
    weather: segment.weather,
    coords: converter(segment.coords as GoogleCoord[] & MapboxCoord[]),
  }))
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Validate a coordinate pair.
 * For Google format: lat in [-90, 90], lng in [-180, 180].
 * For Mapbox format: lng in [-180, 180], lat in [-90, 90].
 */
export function isValidCoord(
  coord: [number, number],
  format: 'google' | 'mapbox' = 'google',
): boolean {
  if (!Array.isArray(coord) || coord.length < 2) return false

  const [first, second] = coord
  if (!isValidNumber(first) || !isValidNumber(second)) return false

  if (format === 'google') {
    return first >= -90 && first <= 90 && second >= -180 && second <= 180
  }
  return first >= -180 && first <= 180 && second >= -90 && second <= 90
}

// ---------------------------------------------------------------------------
// Clamping
// ---------------------------------------------------------------------------

/** Clamp a [lat, lng] coordinate to valid ranges. */
export function clampCoord(coord: [number, number]): [number, number] {
  return [
    Math.max(-90, Math.min(90, coord[0])),
    Math.max(-180, Math.min(180, coord[1])),
  ]
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

/** Check if a coordinate appears to be in Google [lat, lng] format. */
export function isGoogleCoord(coord: [number, number]): boolean {
  return isValidCoord(coord, 'google')
}

/** Check if a coordinate appears to be in Mapbox [lng, lat] format. */
export function isMapboxCoord(coord: [number, number]): boolean {
  return isValidCoord(coord, 'mapbox')
}

/**
 * Detect the coordinate format of an array of coordinates using heuristics.
 * Returns 'unknown' for empty arrays or when detection is inconclusive.
 */
export function detectCoordFormat(coords: [number, number][]): CoordFormat {
  if (coords.length === 0) return 'unknown'

  let googleScore = 0
  let mapboxScore = 0

  for (const [first, second] of coords) {
    if (!isValidNumber(first) || !isValidNumber(second)) continue

    if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
      googleScore++
    } else if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
      mapboxScore++
    } else if (Math.abs(first) <= Math.abs(second)) {
      googleScore++
    } else {
      mapboxScore++
    }
  }

  if (googleScore > mapboxScore) return 'google'
  if (mapboxScore > googleScore) return 'mapbox'
  return 'unknown'
}
