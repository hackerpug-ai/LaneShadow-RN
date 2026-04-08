'use node'

import type { LatLng } from '../lib/geo'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'

// Base fields always included
const BASE_FIELD_MASK = 'places.displayName,places.formattedAddress,places.types'

// Fields only included when routing is enabled
const ROUTING_FIELD_MASK = 'routingSummaries'

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
  distanceMeters?: number
}

export type SearchNearbyResult = PlaceResult[] | { status: 'error'; reason: string }

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

export type PlacesProvider = {
  searchAlongRoute(params: {
    polyline: string
    query: string
    origin?: LatLng
  }): Promise<PlaceResult[]>
  searchNearby(params: {
    query: string
    location: LatLng
    radiusMeters?: number | null
  }): Promise<PlaceResult[]>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a duration string like "180s" or "3m" into minutes.
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

const mapPlaces = (
  places: PlacesApiPlace[],
  routingSummaries: RoutingSummary[]
): PlaceResult[] =>
  places.map((place, index) => {
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

const fetchPlaces = async (
  body: Record<string, unknown>,
  apiKey: string,
  includeRouting: boolean = false
): Promise<PlaceResult[]> => {
  // Validate API key presence
  if (!apiKey) {
    console.error('fetchPlaces: GOOGLE_MAPS_API_KEY is missing or empty')
    throw new Error('Places API key is missing')
  }

  // Build field mask based on whether routing is included
  const fieldMask = includeRouting
    ? `${BASE_FIELD_MASK},${ROUTING_FIELD_MASK}`
    : BASE_FIELD_MASK

  console.log('fetchPlaces: Request body:', JSON.stringify(body, null, 2))
  console.log('fetchPlaces: Field mask:', fieldMask)

  const response = await fetch(PLACES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`fetchPlaces: HTTP ${response.status} - ${errorText}`)
    throw new Error(`Places API returned HTTP ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as PlacesApiResponse
  const places = data.places ?? []
  const routingSummaries = includeRouting ? (data.routingSummaries ?? []) : []

  if (places.length === 0) return []
  return mapPlaces(places, routingSummaries)
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPlacesProvider(): PlacesProvider {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? ''

  const searchAlongRoute: PlacesProvider['searchAlongRoute'] = async ({
    polyline,
    query,
    origin,
  }) => {
    // Validate and sanitize query
    if (!query || query.trim().length === 0) {
      console.warn('searchAlongRoute: Empty query provided')
      return []
    }

    // Clean up the query
    const cleanedQuery = query.trim().replace(/\s+/g, ' ')

    const body: Record<string, unknown> = {
      textQuery: cleanedQuery,
      searchAlongRouteParameters: {
        polyline: { encodedPolyline: polyline },
      },
      maxResultCount: MAX_RESULT_COUNT,
    }

    if (origin !== undefined) {
      body.routingParameters = { origin: { latitude: origin.lat, longitude: origin.lng } }
    }

    // searchAlongRoute uses routing, so request routing summaries
    return fetchPlaces(body, apiKey, true)
  }

  const searchNearby: PlacesProvider['searchNearby'] = async ({
    query,
    location,
    radiusMeters = 5000,
  }) => {
    // Validate and sanitize query
    if (!query || query.trim().length === 0) {
      console.warn('searchNearby: Empty query provided')
      return []
    }

    // Clean up the query - remove excessive whitespace and special characters
    // that might cause API issues, but keep meaningful content
    const cleanedQuery = query.trim().replace(/\s+/g, ' ')

    const body: Record<string, unknown> = {
      textQuery: cleanedQuery,
      locationBias: {
        circle: {
          center: { latitude: location.lat, longitude: location.lng },
          radius: radiusMeters,
        },
      },
      maxResultCount: MAX_RESULT_COUNT,
    }

    // searchNearby doesn't use routing, so don't request routing summaries
    return fetchPlaces(body, apiKey, false)
  }

  return { searchAlongRoute, searchNearby }
}
