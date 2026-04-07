'use node'

import { traceableToolAsync } from '../lib/tracing'
import { decodePolyline, haversineKm } from '../lib/geo'
import { createPlacesProvider } from '../providers/placesProvider'
import type { PlaceResult } from '../providers/placesProvider'

// ---------------------------------------------------------------------------
// Re-export PlaceResult for external consumers
// ---------------------------------------------------------------------------

export type { PlaceResult }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SearchAlongRouteError = {
  status: 'error'
  reason: 'places_api_error'
}

export type SearchAlongRouteResult = PlaceResult[] | SearchAlongRouteError

type SearchAlongRouteParams = {
  routePolyline: string
  query: string
  /** Optional offset in hours into the trip for biasing results toward that point */
  originOffset?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute a lat/lng point that is approximately `offsetHours` hours into the
 * route. Decodes the encoded polyline, computes cumulative distances using
 * haversine, estimates total route duration at average motorcycle speed
 * (~60 km/h), then linearly interpolates to the point at `offsetHours`.
 */
const AVERAGE_SPEED_KMH = 60

const estimateOriginPoint = (
  routePolyline: string,
  offsetHours: number
): { lat: number; lng: number } => {
  const points = decodePolyline(routePolyline)

  if (points.length === 0) {
    return { lat: 0, lng: 0 }
  }

  if (points.length === 1) {
    return { lat: points[0].lat, lng: points[0].lng }
  }

  // Build cumulative distance array (in km)
  const cumulative: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + haversineKm(points[i - 1], points[i]))
  }

  const totalDistanceKm = cumulative[cumulative.length - 1]

  if (totalDistanceKm === 0) {
    return { lat: points[0].lat, lng: points[0].lng }
  }

  // Target distance = offsetHours * averageSpeed
  const targetDistanceKm = offsetHours * AVERAGE_SPEED_KMH

  // Clamp to the route range
  const clampedTarget = Math.min(Math.max(targetDistanceKm, 0), totalDistanceKm)

  // Find the segment containing the target distance
  for (let i = 1; i < points.length; i++) {
    if (cumulative[i] >= clampedTarget || i === points.length - 1) {
      const segStart = cumulative[i - 1]
      const segEnd = cumulative[i]
      const segLen = segEnd - segStart

      // Linear interpolation within the segment
      const t = segLen === 0 ? 0 : (clampedTarget - segStart) / segLen
      const lat = points[i - 1].lat + t * (points[i].lat - points[i - 1].lat)
      const lng = points[i - 1].lng + t * (points[i].lng - points[i - 1].lng)
      return { lat, lng }
    }
  }

  // Should not reach here, but return last point as fallback
  const last = points[points.length - 1]
  return { lat: last.lat, lng: last.lng }
}

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

const searchAlongRouteImpl = async (
  params: SearchAlongRouteParams
): Promise<SearchAlongRouteResult> => {
  const provider = createPlacesProvider()

  const origin =
    params.originOffset !== undefined
      ? estimateOriginPoint(params.routePolyline, params.originOffset)
      : undefined

  try {
    const results = await provider.searchAlongRoute({
      polyline: params.routePolyline,
      query: params.query,
      origin,
    })
    return results
  } catch (error) {
    console.warn('searchAlongRoute: Places API call failed', error)
    return { status: 'error', reason: 'places_api_error' }
  }
}

// ---------------------------------------------------------------------------
// Exported tool
// ---------------------------------------------------------------------------

export const searchAlongRoute = traceableToolAsync(searchAlongRouteImpl, {
  name: 'searchAlongRoute',
  runType: 'tool',
  tags: ['planRide', 'places', 'searchAlongRoute'],
})
