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
