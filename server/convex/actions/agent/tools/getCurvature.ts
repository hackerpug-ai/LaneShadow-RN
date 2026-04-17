'use node'

import type { LatLng } from '../lib/geo'
import { circumcircleRadius, haversineDistance } from '../lib/geo'
import { traceableToolAsync } from '../lib/tracing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CurvatureRating = 'very_twisty' | 'twisty' | 'moderate' | 'mild' | 'straight'

export type CurvatureResult = {
  score: number
  rating: CurvatureRating
  kmCornering: number
  segmentCount: number
  surface: string | null
  status: 'ok' | 'unavailable'
}

// ---------------------------------------------------------------------------
// Constants — roadcurvature.com thresholds and radius buckets
// ---------------------------------------------------------------------------

/** Weight by circumcircle radius in meters */
const curvatureWeight = (radiusMeters: number): number => {
  if (radiusMeters < 60) return 4 // hairpin
  if (radiusMeters < 100) return 2 // tight
  if (radiusMeters < 175) return 1 // sweeping
  return 0 // straight
}

const ratingFromScore = (score: number): CurvatureRating => {
  if (score >= 1000) return 'very_twisty'
  if (score >= 600) return 'twisty'
  if (score >= 300) return 'moderate'
  if (score >= 100) return 'mild'
  return 'straight'
}

// ---------------------------------------------------------------------------
// Core algorithm
// ---------------------------------------------------------------------------

/**
 * Calculate curvature score for an array of lat/lng coordinates using the
 * circumcircle-radius method from roadcurvature.com.
 *
 * For every 3-point window: compute the radius of the circumscribed circle,
 * weight by tightness, multiply by the segment length, and sum.
 */
export const calculateCurvatureScore = (
  coords: { lat: number; lng: number }[],
): Omit<CurvatureResult, 'surface' | 'status' | 'segmentCount'> => {
  if (coords.length < 3) {
    return { score: 0, rating: 'straight', kmCornering: 0 }
  }

  let totalWeightedLength = 0

  for (let i = 0; i < coords.length - 2; i++) {
    const p1: LatLng = coords[i]
    const p2: LatLng = coords[i + 1]
    const p3: LatLng = coords[i + 2]

    const radius = circumcircleRadius(p1, p2, p3)
    const segmentLength = haversineDistance(p1, p2) // meters
    const weight = curvatureWeight(radius)

    totalWeightedLength += segmentLength * weight
  }

  const score = Math.round(totalWeightedLength)
  const rating = ratingFromScore(score)
  const kmCornering = totalWeightedLength / 1000

  return { score, rating, kmCornering }
}

// ---------------------------------------------------------------------------
// Tool implementation
// ---------------------------------------------------------------------------

export type GetCurvatureParams = {
  geometry: { lat: number; lng: number }[]
  roadName: string
  surface: string | null
}

const getCurvatureImpl = async (params: GetCurvatureParams): Promise<CurvatureResult> => {
  const { geometry, surface } = params

  try {
    const { score, rating, kmCornering } = calculateCurvatureScore(geometry)
    const segmentCount = Math.max(0, geometry.length - 2)

    return {
      score,
      rating,
      kmCornering,
      segmentCount,
      surface,
      status: 'ok',
    }
  } catch (_error) {
    return {
      score: 0,
      rating: 'straight',
      kmCornering: 0,
      segmentCount: 0,
      surface,
      status: 'unavailable',
    }
  }
}

// ---------------------------------------------------------------------------
// Exported tool
// ---------------------------------------------------------------------------

export const getCurvature = traceableToolAsync(getCurvatureImpl, {
  name: 'getCurvature',
  runType: 'tool',
  tags: ['planRide', 'routing', 'curvature', 'osm'],
})
