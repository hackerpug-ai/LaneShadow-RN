'use node'

import { ConvexError, v } from 'convex/values'
import { action } from '../_generated/server'
import { ERROR_CODES } from '../errors'
import { MAPBOX_ACCESS_TOKEN } from '../lib/env'
import { retryOnce, withTimeout } from './agent/lib/reliability'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReverseGeocodeResult = {
  city: string
  state: string
  label: string
}

export type PlaceSuggestion = {
  id: string
  name: string
  label: string
  secondaryText?: string
  featureType: string
  distanceMeters?: number
}

export type SelectedPlace = {
  id: string
  name: string
  label: string
  lat: number
  lng: number
  featureType: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAPBOX_GEOCODING_ENDPOINT = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
const MAPBOX_SEARCHBOX_ENDPOINT = 'https://api.mapbox.com/search/searchbox/v1'
const GEOCODING_TIMEOUT_MS = 5_000
const MAX_PLACE_SUGGESTIONS = 3

// WGS84 coordinate bounds
const MIN_LAT = -90
const MAX_LAT = 90
const MIN_LNG = -180
const MAX_LNG = 180

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

const reverseGeocodeArgsValidator = v.object({
  lat: v.number(),
  lng: v.number(),
})

const placeSuggestionValidator = v.object({
  id: v.string(),
  name: v.string(),
  label: v.string(),
  secondaryText: v.optional(v.string()),
  featureType: v.string(),
  distanceMeters: v.optional(v.number()),
})

const selectedPlaceValidator = v.object({
  id: v.string(),
  name: v.string(),
  label: v.string(),
  lat: v.number(),
  lng: v.number(),
  featureType: v.string(),
})

const suggestPlacesArgsValidator = v.object({
  query: v.string(),
  proximity: v.optional(
    v.object({
      lat: v.number(),
      lng: v.number(),
    }),
  ),
  sessionToken: v.string(),
})

const retrievePlaceArgsValidator = v.object({
  mapboxId: v.string(),
  sessionToken: v.string(),
})

const reverseGeocodeReturnsValidator = v.object({
  city: v.string(),
  state: v.string(),
  label: v.string(),
})

const markRetryable = (
  error: ConvexError<{ code: string; message: string }>,
  retryable: boolean,
) => {
  ;(error as ConvexError<{ code: string; message: string }> & { retryable?: boolean }).retryable =
    retryable
  return error
}

const mapboxUpstreamError = (message: string, retryable = false) =>
  markRetryable(
    new ConvexError({
      code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
      message,
    }),
    retryable,
  )

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validates that coordinates are within WGS84 bounds.
 * Throws ConvexError(GEOCODE_INVALID_COORDS) if invalid.
 */
const validateCoords = (lat: number, lng: number): void => {
  if (lat < MIN_LAT || lat > MAX_LAT || lng < MIN_LNG || lng > MAX_LNG) {
    throw new ConvexError({
      code: ERROR_CODES.GEOCODE_INVALID_COORDS,
      message: `Coordinates out of range: lat=${lat}, lng=${lng}. Valid ranges: lat [-90, 90], lng [-180, 180]`,
    })
  }
}

const normalizeQuery = (query: string): string => query.trim().replace(/\s+/g, ' ')

const getMapboxAccessToken = (): string => {
  if (!MAPBOX_ACCESS_TOKEN) {
    throw new ConvexError({
      code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
      message: 'Mapbox Search Box is not configured',
    })
  }

  return MAPBOX_ACCESS_TOKEN
}

const buildSuggestPlacesUrl = (
  query: string,
  sessionToken: string,
  proximity?: { lat: number; lng: number },
): string => {
  const url = new URL(`${MAPBOX_SEARCHBOX_ENDPOINT}/suggest`)
  url.searchParams.set('q', query)
  url.searchParams.set('session_token', sessionToken)
  url.searchParams.set('limit', String(MAX_PLACE_SUGGESTIONS))
  url.searchParams.set('country', 'US')
  url.searchParams.set('language', 'en')
  url.searchParams.set('access_token', getMapboxAccessToken())

  if (proximity) {
    validateCoords(proximity.lat, proximity.lng)
    url.searchParams.set('proximity', `${proximity.lng},${proximity.lat}`)
  }

  return url.toString()
}

const buildRetrievePlaceUrl = (mapboxId: string, sessionToken: string): string => {
  const url = new URL(`${MAPBOX_SEARCHBOX_ENDPOINT}/retrieve/${encodeURIComponent(mapboxId)}`)
  url.searchParams.set('session_token', sessionToken)
  url.searchParams.set('access_token', getMapboxAccessToken())
  return url.toString()
}

const mapPlaceSuggestion = (suggestion: any): PlaceSuggestion => {
  const id = typeof suggestion?.mapbox_id === 'string' ? suggestion.mapbox_id : null
  const name = typeof suggestion?.name === 'string' ? suggestion.name : null
  const label =
    typeof suggestion?.full_address === 'string'
      ? suggestion.full_address
      : typeof suggestion?.place_formatted === 'string'
        ? suggestion.place_formatted
        : name
  const featureType = typeof suggestion?.feature_type === 'string' ? suggestion.feature_type : null

  if (!id || !name || !label || !featureType) {
    throw new ConvexError({
      code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
      message: 'Mapbox Search Box suggest returned malformed data',
    })
  }

  const secondaryText =
    typeof suggestion.place_formatted === 'string' && suggestion.place_formatted !== label
      ? suggestion.place_formatted
      : undefined
  const distanceMeters =
    typeof suggestion.distance === 'number' && Number.isFinite(suggestion.distance)
      ? suggestion.distance
      : undefined

  return {
    id,
    name,
    label,
    secondaryText,
    featureType,
    distanceMeters,
  }
}

const parseSuggestPlacesResponse = (data: any): PlaceSuggestion[] => {
  const suggestions = data?.suggestions
  if (!Array.isArray(suggestions)) {
    throw new ConvexError({
      code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
      message: 'Mapbox Search Box suggest returned malformed data',
    })
  }

  return suggestions.slice(0, MAX_PLACE_SUGGESTIONS).map(mapPlaceSuggestion)
}

const parseRetrievePlaceResponse = (data: any): SelectedPlace => {
  const feature = Array.isArray(data?.features) ? data.features[0] : null
  const properties = feature?.properties
  const coordinates = feature?.geometry?.coordinates
  const id = typeof properties?.mapbox_id === 'string' ? properties.mapbox_id : null
  const name = typeof properties?.name === 'string' ? properties.name : null
  const label =
    typeof properties?.full_address === 'string'
      ? properties.full_address
      : typeof properties?.place_formatted === 'string'
        ? properties.place_formatted
        : name
  const featureType = typeof properties?.feature_type === 'string' ? properties.feature_type : null

  if (
    !id ||
    !name ||
    !label ||
    !featureType ||
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    typeof coordinates[0] !== 'number' ||
    typeof coordinates[1] !== 'number'
  ) {
    throw new ConvexError({
      code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
      message: 'Mapbox Search Box retrieve returned malformed data',
    })
  }

  return {
    id,
    name,
    label,
    lat: coordinates[1],
    lng: coordinates[0],
    featureType,
  }
}

const fetchMapboxJson = async <T>(
  url: string,
  operationName: 'suggest' | 'retrieve',
  parse: (data: any) => T,
): Promise<T> => {
  const fetchOnce = async () => {
    try {
      const response = await withTimeout(async (signal) => await fetch(url, { signal }), {
        ms: GEOCODING_TIMEOUT_MS,
        label: `mapbox-searchbox-${operationName}`,
      })

      if (!response.ok) {
        throw mapboxUpstreamError(
          `Mapbox Search Box ${operationName} failed with status ${response.status}`,
          response.status >= 500,
        )
      }

      return parse(await response.json())
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error
      }

      if (error instanceof Error && error.message.startsWith('TIMEOUT')) {
        throw mapboxUpstreamError(`Mapbox Search Box ${operationName} timed out`, true)
      }

      throw mapboxUpstreamError(`Mapbox Search Box ${operationName} failed`)
    }
  }

  return await retryOnce(fetchOnce, {
    shouldRetry: (error) => {
      if (error instanceof ConvexError && 'retryable' in error) {
        return Boolean((error as ConvexError<{ code: string }> & { retryable?: boolean }).retryable)
      }
      return false
    },
  })
}

/**
 * Parses Mapbox reverse-geocode response to extract city, state, and label.
 */
const parseMapboxResponse = (data: any): ReverseGeocodeResult => {
  const features = data?.features
  if (!features || !Array.isArray(features) || features.length === 0) {
    throw new ConvexError({
      code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
      message: 'No results found for the given coordinates',
    })
  }

  const feature = features[0]
  const placeName = feature.place_name || feature.text || ''
  const context = feature.context || []

  // Extract city and state from context
  let city = ''
  let state = ''

  for (const item of context) {
    const id = item.id || ''
    if (id.startsWith('place.')) {
      city = item.text || ''
    } else if (id.startsWith('region.')) {
      // Use short_code if available (e.g., 'CA' for California)
      state = item.short_code || item.text || ''
    }
  }

  // Fallback to place_name if we couldn't extract city/state
  if (!city && !state) {
    const parts = placeName.split(',').map((p: string) => p.trim())
    if (parts.length >= 2) {
      city = parts[0]
      state = parts[1]
    }
  }

  return {
    city,
    state,
    label: placeName,
  }
}

/**
 * Performs the actual Mapbox reverse-geocode HTTP request.
 */
const fetchReverseGeocode = async (
  lat: number,
  lng: number,
  accessToken: string,
): Promise<ReverseGeocodeResult> => {
  const url = `${MAPBOX_GEOCODING_ENDPOINT}${lng},${lat}.json`

  const fetchOnce = async () => {
    try {
      const response = await withTimeout(
        async (signal) => {
          const resp = await fetch(`${url}?access_token=${accessToken}`, {
            signal,
          })
          return resp
        },
        { ms: GEOCODING_TIMEOUT_MS, label: 'mapbox-geocode' },
      )

      if (!response.ok) {
        throw markRetryable(
          new ConvexError({
            code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
            message: `Mapbox API request failed: ${response.status} ${response.statusText}`,
          }),
          response.status >= 500,
        )
      }

      const data = await response.json()
      return parseMapboxResponse(data)
    } catch (error) {
      // Re-throw ConvexError instances (they're already typed)
      if (error instanceof ConvexError) {
        throw error
      }

      // Convert other errors to GEOCODE_UPSTREAM_ERROR
      throw new ConvexError({
        code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
        message: `Reverse geocode request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  // Use retryOnce for transient failures
  return await retryOnce(fetchOnce, {
    shouldRetry: (error) => {
      // Retry on network timeouts and 5xx errors
      if (error instanceof Error && error.message.startsWith('TIMEOUT')) {
        return true
      }
      if (error instanceof ConvexError && 'retryable' in error) {
        return Boolean((error as ConvexError<{ code: string }> & { retryable?: boolean }).retryable)
      }
      return false
    },
  })
}

// ---------------------------------------------------------------------------
// Exported handler (for testing without Convex runtime)
// ---------------------------------------------------------------------------

/**
 * Handler for reverse-geocoding coordinates to city, state, and label.
 * Extracted for testing purposes.
 *
 * AC-1: Returns {city, state, label} for valid coordinates
 * AC-2: Throws GEOCODE_UPSTREAM_ERROR on Mapbox API failures
 * AC-3: Throws GEOCODE_INVALID_COORDS for out-of-range coordinates
 */
export const getReverseGeocodeHandler = async (
  _ctx: any,
  args: { lat: number; lng: number },
): Promise<ReverseGeocodeResult> => {
  const { lat, lng } = args

  // AC-3: Validate coordinates BEFORE any HTTP call
  validateCoords(lat, lng)

  // Get Mapbox access token from environment (server-side only)
  const accessToken = MAPBOX_ACCESS_TOKEN
  if (!accessToken) {
    throw new ConvexError({
      code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
      message: 'Mapbox access token is not configured',
    })
  }

  // Perform the reverse geocode
  const result = await fetchReverseGeocode(lat, lng, accessToken)

  return result
}

export const getSuggestPlacesHandler = async (
  _ctx: any,
  args: {
    query: string
    proximity?: { lat: number; lng: number }
    sessionToken: string
  },
): Promise<PlaceSuggestion[]> => {
  const query = normalizeQuery(args.query)
  if (query.length < 2) {
    return []
  }

  const url = buildSuggestPlacesUrl(query, args.sessionToken, args.proximity)
  return await fetchMapboxJson(url, 'suggest', parseSuggestPlacesResponse)
}

export const getRetrievePlaceHandler = async (
  _ctx: any,
  args: { mapboxId: string; sessionToken: string },
): Promise<SelectedPlace> => {
  const url = buildRetrievePlaceUrl(args.mapboxId, args.sessionToken)
  return await fetchMapboxJson(url, 'retrieve', parseRetrievePlaceResponse)
}

// ---------------------------------------------------------------------------
// Exported Convex functions
// ---------------------------------------------------------------------------

/**
 * Reverse-geocode coordinates to city, state, and label.
 *
 * AC-1: Returns {city, state, label} for valid coordinates
 * AC-2: Throws GEOCODE_UPSTREAM_ERROR on Mapbox API failures
 * AC-3: Throws GEOCODE_INVALID_COORDS for out-of-range coordinates
 */
export const getReverseGeocode = action({
  args: reverseGeocodeArgsValidator,
  returns: reverseGeocodeReturnsValidator,
  handler: getReverseGeocodeHandler,
})

export const reverseGeocode = action({
  args: reverseGeocodeArgsValidator,
  returns: reverseGeocodeReturnsValidator,
  handler: getReverseGeocodeHandler,
})

export const suggestPlaces = action({
  args: suggestPlacesArgsValidator,
  returns: v.array(placeSuggestionValidator),
  handler: getSuggestPlacesHandler,
})

export const retrievePlace = action({
  args: retrievePlaceArgsValidator,
  returns: selectedPlaceValidator,
  handler: getRetrievePlaceHandler,
})
