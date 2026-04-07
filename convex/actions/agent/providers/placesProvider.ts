'use node'

import { GOOGLE_MAPS_API_KEY } from '../../../lib/env'
import { haversineDistance } from '../lib/geo'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'
const PLACES_FIELD_MASK_ROUTE = 'places.displayName,places.formattedAddress,places.types,routingSummaries'
const PLACES_FIELD_MASK_NEARBY = 'places.displayName,places.formattedAddress,places.types,places.location'
const MAX_RESULT_COUNT = 5
const DEFAULT_RADIUS_METERS = 5000

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type PlaceResult = {
  name: string
  address: string
  types?: string[]
  distanceMeters?: number
}

export type SearchAlongRouteResult =
  | Array<PlaceResult & { detourMinutes?: number; distanceFromRouteMeters?: number }>
  | { status: 'error'; reason: string }

export type SearchNearbyResult = PlaceResult[] | { status: 'error'; reason: string }

// ---------------------------------------------------------------------------
// Internal types for Google Places API response
// ---------------------------------------------------------------------------

type PlacesApiPlace = {
  displayName?: { text: string }
  formattedAddress?: string
  types?: string[]
  location?: { latitude: number; longitude: number }
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
// Internal helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

export const createPlacesProvider = (apiKeyParam?: string) => {
  const apiKey = apiKeyParam !== undefined ? apiKeyParam : GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Missing required environment variable: GOOGLE_MAPS_API_KEY')
  }

  const searchAlongRoute = async (params: {
    routePolyline: string
    query: string
    originOffset?: number
  }): Promise<SearchAlongRouteResult> => {
    const body: Record<string, unknown> = {
      textQuery: params.query,
      searchAlongRouteParameters: {
        polyline: { encodedPolyline: params.routePolyline },
      },
      maxResultCount: MAX_RESULT_COUNT,
    }

    if (params.originOffset !== undefined) {
      // Origin is left as-is — callers that need origin computation handle it
      // (kept for API shape compatibility)
    }

    try {
      const response = await fetch(PLACES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': PLACES_FIELD_MASK_ROUTE,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        console.warn(`placesProvider.searchAlongRoute: Places API returned HTTP ${response.status}`)
        return { status: 'error', reason: 'places_api_error' }
      }

      const data = (await response.json()) as PlacesApiResponse

      const places = data.places ?? []
      const routingSummaries = data.routingSummaries ?? []

      if (places.length === 0) {
        return []
      }

      return places.map((place, index) => {
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
    } catch (error) {
      console.warn('placesProvider.searchAlongRoute: Places API call failed', error)
      return { status: 'error', reason: 'places_api_error' }
    }
  }

  const searchNearby = async (params: {
    query: string
    location: { lat: number; lng: number }
    radiusMeters?: number | null
  }): Promise<SearchNearbyResult> => {
    const radius = params.radiusMeters ?? DEFAULT_RADIUS_METERS

    const body: Record<string, unknown> = {
      textQuery: params.query,
      locationBias: {
        circle: {
          center: {
            latitude: params.location.lat,
            longitude: params.location.lng,
          },
          radius,
        },
      },
      maxResultCount: MAX_RESULT_COUNT,
    }

    try {
      const response = await fetch(PLACES_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': PLACES_FIELD_MASK_NEARBY,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        console.warn(`placesProvider.searchNearby: Places API returned HTTP ${response.status}`)
        return { status: 'error', reason: 'places_api_error' }
      }

      const data = (await response.json()) as PlacesApiResponse

      const places = data.places ?? []

      if (places.length === 0) {
        return []
      }

      return places.map((place) => {
        const distanceMeters =
          place.location !== undefined
            ? Math.round(
                haversineDistance(
                  { lat: params.location.lat, lng: params.location.lng },
                  { lat: place.location.latitude, lng: place.location.longitude }
                )
              )
            : undefined

        return {
          name: place.displayName?.text ?? '',
          address: place.formattedAddress ?? '',
          types: place.types,
          ...(distanceMeters !== undefined ? { distanceMeters } : {}),
        }
      })
    } catch (error) {
      console.warn('placesProvider.searchNearby: Places API call failed', error)
      return { status: 'error', reason: 'places_api_error' }
    }
  }

  return { searchAlongRoute, searchNearby }
}
