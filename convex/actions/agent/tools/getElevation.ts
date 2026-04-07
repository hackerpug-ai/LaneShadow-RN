'use node'

import { traceableToolAsync } from '../lib/tracing'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup'
const MAX_POINTS = 100
const METERS_TO_FEET = 3.281
const STEEP_GRADE_THRESHOLD_PCT = 8

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LatLng = {
  lat: number
  lng: number
}

export type SteepSegment = {
  fromIndex: number
  toIndex: number
  grade: number
}

export type ElevationResult =
  | {
      status: 'ok'
      totalGainFt: number
      totalLossFt: number
      maxElevationFt: number
      maxGradePct: number
      steepSegments: SteepSegment[]
    }
  | { status: 'unavailable' }

// ---------------------------------------------------------------------------
// Haversine distance (meters)
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_000

export const haversineMeters = (a: LatLng, b: LatLng): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const c = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(c))
}

// ---------------------------------------------------------------------------
// Polyline sampling
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Open-Elevation API call
// ---------------------------------------------------------------------------

type ElevationApiResult = {
  latitude: number
  longitude: number
  elevation: number
}

const queryElevationApi = async (points: LatLng[]): Promise<ElevationApiResult[]> => {
  const response = await fetch(OPEN_ELEVATION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
    }),
  })

  if (!response.ok) {
    throw new Error(`Open-Elevation HTTP ${response.status}`)
  }

  const data = (await response.json()) as { results: ElevationApiResult[] }
  return data.results
}

// ---------------------------------------------------------------------------
// Elevation profile computation
// ---------------------------------------------------------------------------

const computeProfile = (
  points: LatLng[],
  elevationsM: number[]
): Omit<Extract<ElevationResult, { status: 'ok' }>, 'status'> => {
  let totalGainM = 0
  let totalLossM = 0
  let maxElevationM = -Infinity
  let maxGradePct = 0
  const steepSegments: SteepSegment[] = []

  for (let i = 0; i < elevationsM.length; i++) {
    const elev = elevationsM[i]
    if (elev > maxElevationM) maxElevationM = elev

    if (i === 0) continue

    const deltaElev = elevationsM[i] - elevationsM[i - 1]
    const distM = haversineMeters(points[i - 1], points[i])

    if (deltaElev > 0) {
      totalGainM += deltaElev
    } else {
      totalLossM += Math.abs(deltaElev)
    }

    if (distM > 0) {
      const gradePct = Math.abs((deltaElev / distM) * 100)
      if (gradePct > maxGradePct) maxGradePct = gradePct
      if (gradePct >= STEEP_GRADE_THRESHOLD_PCT) {
        steepSegments.push({ fromIndex: i - 1, toIndex: i, grade: gradePct })
      }
    }
  }

  return {
    totalGainFt: totalGainM * METERS_TO_FEET,
    totalLossFt: totalLossM * METERS_TO_FEET,
    maxElevationFt: maxElevationM * METERS_TO_FEET,
    maxGradePct,
    steepSegments,
  }
}

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

const getElevationImpl = async (params: { polyline: LatLng[] }): Promise<ElevationResult> => {
  try {
    const sampled = samplePolyline(params.polyline, MAX_POINTS)
    const apiResults = await queryElevationApi(sampled)
    const elevationsM = apiResults.map((r) => r.elevation)
    const profile = computeProfile(sampled, elevationsM)
    return { status: 'ok', ...profile }
  } catch (_error) {
    console.warn('getElevation: Open-Elevation API failed, returning unavailable')
    return { status: 'unavailable' }
  }
}

// ---------------------------------------------------------------------------
// Exported tool
// ---------------------------------------------------------------------------

export const getElevation = traceableToolAsync(getElevationImpl, {
  name: 'getElevation',
  runType: 'tool',
  tags: ['planRide', 'elevation', 'terrain'],
})
