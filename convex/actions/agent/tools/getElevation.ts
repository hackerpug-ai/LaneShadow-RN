'use node'

import type { LatLng } from '../lib/geo'
import { haversineDistance, samplePolyline } from '../lib/geo'
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

export type { LatLng }

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

// Re-export samplePolyline for backwards compatibility with existing test imports
export { samplePolyline }

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
  elevationsM: number[],
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
    const distM = haversineDistance(points[i - 1], points[i])

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
