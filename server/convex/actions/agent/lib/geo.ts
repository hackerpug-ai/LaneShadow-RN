'use node'

// ---------------------------------------------------------------------------
// Shared geometry utilities for road curvature and distance calculations
// ---------------------------------------------------------------------------

export type LatLng = {
  lat: number
  lng: number
}

const EARTH_RADIUS_METERS = 6_371_000

/**
 * Haversine formula: distance in meters between two lat/lng points.
 */
export const haversineDistance = (a: LatLng, b: LatLng): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)

  const x =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(x))
}

/**
 * Haversine distance in kilometers between two lat/lng points.
 * Thin wrapper over haversineDistance.
 */
export const haversineKm = (a: LatLng, b: LatLng): number =>
  haversineDistance(a, b) / 1000

/**
 * Circumcircle radius of the triangle formed by three lat/lng points.
 *
 * Algorithm: R = (a * b * c) / (4 * Area)
 * where a, b, c are the side lengths and Area is the triangle area.
 *
 * Returns Infinity when points are collinear (straight road → no curve).
 */
export const circumcircleRadius = (p1: LatLng, p2: LatLng, p3: LatLng): number => {
  const a = haversineDistance(p1, p2)
  const b = haversineDistance(p2, p3)
  const c = haversineDistance(p1, p3)

  // Area via Heron's formula
  const s = (a + b + c) / 2
  const areaSq = s * (s - a) * (s - b) * (s - c)

  if (areaSq <= 0) {
    // Degenerate / collinear — treat as straight (infinite radius)
    return Infinity
  }

  const area = Math.sqrt(areaSq)
  return (a * b * c) / (4 * area)
}

/**
 * Decode a Google Maps encoded polyline string into an array of lat/lng points.
 * Implements the standard Google encoded polyline algorithm:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export const decodePolyline = (encoded: string): LatLng[] => {
  const points: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let result = 0
    let shift = 0
    let b: number

    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)

    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    result = 0
    shift = 0

    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)

    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return points
}

/**
 * Encode a signed integer using the Google polyline encoding scheme.
 *
 * Algorithm:
 * 1. Convert signed to unsigned: (value << 1) ^ (value >> 31)
 * 2. Encode in chunks of 5 bits (0x1F mask)
 * 3. Set continuation bit (0x20) on all but the last chunk
 * 4. Add 63 to each chunk (ASCII offset for printable characters)
 */
const encodeSignedValue = (value: number): string => {
  // Convert signed to unsigned using sign-magnitude encoding
  let unsigned = (value << 1) ^ (value >> 31)
  let encoded = ''

  while (unsigned >= 0x20) {
    // Encode chunk with continuation bit
    encoded += String.fromCharCode((0x20 | (unsigned & 0x1f)) + 63)
    unsigned >>>= 5
  }

  // Final chunk without continuation bit
  encoded += String.fromCharCode(unsigned + 63)

  return encoded
}

/**
 * Encode an array of LatLng points into a Google Maps encoded polyline string.
 * Implements the standard Google encoded polyline algorithm:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 *
 * This is the inverse of decodePolyline. It encodes latitude/longitude pairs
 * into a compact ASCII string format suitable for URL parameters or storage.
 *
 * @param points - Array of lat/lng objects to encode
 * @returns Encoded polyline string, or empty string if input is empty
 */
export const encodePolyline = (points: LatLng[]): string => {
  if (points.length === 0) return ''

  let output = ''
  let prevLat = 0
  let prevLng = 0

  for (const { lat, lng } of points) {
    // Convert to E5 (multiply by 1e5 and round)
    const latE5 = Math.round(lat * 1e5)
    const lngE5 = Math.round(lng * 1e5)

    // Encode deltas from previous point
    output += encodeSignedValue(latE5 - prevLat)
    output += encodeSignedValue(lngE5 - prevLng)

    prevLat = latE5
    prevLng = lngE5
  }

  return output
}

/**
 * Sample a polyline down to at most `maxPoints` points using uniform stride.
 * Always includes first and last points.
 */
export const samplePolyline = (polyline: LatLng[], maxPoints: number): LatLng[] => {
  if (polyline.length <= maxPoints) return polyline

  const result: LatLng[] = []
  const stride = (polyline.length - 1) / (maxPoints - 1)

  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * stride)
    result.push(polyline[Math.min(idx, polyline.length - 1)])
  }

  // Ensure last point is exact
  result[result.length - 1] = polyline[polyline.length - 1]

  return result
}
