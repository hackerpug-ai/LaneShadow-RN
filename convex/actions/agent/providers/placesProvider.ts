'use node'

import type { LatLng } from '../lib/geo'

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
    radiusMeters?: number
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
  apiKey: string
): Promise<PlaceResult[]> => {
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
    throw new Error(`Places API returned HTTP ${response.status}`)
  }

  const data = (await response.json()) as PlacesApiResponse
  const places = data.places ?? []
  const routingSummaries = data.routingSummaries ?? []

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
    const body: Record<string, unknown> = {
      textQuery: query,
      searchAlongRouteParameters: {
        polyline: { encodedPolyline: polyline },
      },
      maxResultCount: MAX_RESULT_COUNT,
    }

    if (origin !== undefined) {
      body.routingParameters = { origin: { latitude: origin.lat, longitude: origin.lng } }
    }

    return fetchPlaces(body, apiKey)
  }

  const searchNearby: PlacesProvider['searchNearby'] = async ({
    query,
    location,
    radiusMeters = 5000,
  }) => {
    const body: Record<string, unknown> = {
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: location.lat, longitude: location.lng },
          radius: radiusMeters,
        },
      },
      maxResultCount: MAX_RESULT_COUNT,
    }

    return fetchPlaces(body, apiKey)
  }

  return { searchAlongRoute, searchNearby }
}
