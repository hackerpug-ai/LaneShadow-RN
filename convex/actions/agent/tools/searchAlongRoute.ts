'use node'

import { traceableToolAsync } from '../lib/tracing'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'
const PLACES_FIELD_MASK = 'places.displayName,places.formattedAddress,places.types,routingSummaries'
const MAX_RESULT_COUNT = 5

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlaceResult = {
  name: string
  address: string
  types?: string[]
  detourMinutes?: number
  distanceFromRouteMeters?: number
}

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
// Internal types for Google Places API response
// ---------------------------------------------------------------------------

type PlacesApiPlace = {
  displayName?: { text: string }
  formattedAddress?: string
  types?: string[]
}

type RoutingSummaryLeg = {
  duration?: string
  distanceMeters?: number
}

type RoutingSummary = {
  legs?: RoutingSummaryLeg[]
}

type PlacesApiResponse = {
  places?: PlacesApiPlace[]
  routingSummaries?: RoutingSummary[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a duration string like "180s" or "3m" into minutes.
 * Google Places API returns duration as a string like "180s".
 */
const parseDurationToMinutes = (duration: string | undefined): number | undefined => {
  if (!duration) return undefined

  const secondsMatch = duration.match(/^(\d+(?:\.\d+)?)s$/)
  if (secondsMatch) {
    return Math.round(parseFloat(secondsMatch[1]) / 60)
  }

  const minutesMatch = duration.match(/^(\d+(?:\.\d+)?)m$/)
  if (minutesMatch) {
    return Math.round(parseFloat(minutesMatch[1]))
  }

  return undefined
}

/**
 * Decode a Google Maps encoded polyline string into an array of lat/lng points.
 * Implements the standard Google encoded polyline algorithm:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
const decodePolyline = (encoded: string): Array<{ lat: number; lng: number }> => {
  const points: Array<{ lat: number; lng: number }> = []
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
 * Compute the haversine distance in kilometers between two lat/lng points.
 */
const haversineKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number => {
  const R = 6371 // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const a_ =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(a_), Math.sqrt(1 - a_))
}

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
): { latitude: number; longitude: number } => {
  const points = decodePolyline(routePolyline)

  if (points.length === 0) {
    // Fallback: no points could be decoded
    return { latitude: 0, longitude: 0 }
  }

  if (points.length === 1) {
    return { latitude: points[0].lat, longitude: points[0].lng }
  }

  // Build cumulative distance array (in km)
  const cumulative: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + haversineKm(points[i - 1], points[i]))
  }

  const totalDistanceKm = cumulative[cumulative.length - 1]

  if (totalDistanceKm === 0) {
    return { latitude: points[0].lat, longitude: points[0].lng }
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
      return { latitude: lat, longitude: lng }
    }
  }

  // Should not reach here, but return last point as fallback
  const last = points[points.length - 1]
  return { latitude: last.lat, longitude: last.lng }
}

// ---------------------------------------------------------------------------
// Core implementation
// ---------------------------------------------------------------------------

const searchAlongRouteImpl = async (
  params: SearchAlongRouteParams
): Promise<SearchAlongRouteResult> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? ''

  const body: Record<string, unknown> = {
    textQuery: params.query,
    searchAlongRouteParameters: {
      polyline: { encodedPolyline: params.routePolyline },
    },
    maxResultCount: MAX_RESULT_COUNT,
  }

  if (params.originOffset !== undefined) {
    const origin = estimateOriginPoint(params.routePolyline, params.originOffset)
    body.routingParameters = { origin }
  }

  try {
    const response = await fetch(PLACES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': PLACES_FIELD_MASK,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.warn(`searchAlongRoute: Places API returned HTTP ${response.status}`)
      return { status: 'error', reason: 'places_api_error' }
    }

    const data = (await response.json()) as PlacesApiResponse

    const places = data.places ?? []
    const routingSummaries = data.routingSummaries ?? []

    if (places.length === 0) {
      return []
    }

    const results: PlaceResult[] = places.map((place, index) => {
      const summary = routingSummaries[index]
      const leg = summary?.legs?.[0]
      const detourMinutes = parseDurationToMinutes(leg?.duration)

      return {
        name: place.displayName?.text ?? '',
        address: place.formattedAddress ?? '',
        types: place.types,
        ...(detourMinutes !== undefined ? { detourMinutes } : {}),
        ...(leg?.distanceMeters !== undefined ? { distanceFromRouteMeters: leg.distanceMeters } : {}),
      }
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
