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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAPBOX_GEOCODING_ENDPOINT = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
const GEOCODING_TIMEOUT_MS = 5_000

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

const reverseGeocodeReturnsValidator = v.object({
  city: v.string(),
  state: v.string(),
  label: v.string(),
})

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
        // AC-2: Propagate upstream HTTP errors as GEOCODE_UPSTREAM_ERROR
        throw new ConvexError({
          code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
          message: `Mapbox API request failed: ${response.status} ${response.statusText}`,
        })
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
      if (error instanceof ConvexError) {
        const code = (error.data as any)?.code
        return code === ERROR_CODES.GEOCODE_UPSTREAM_ERROR
      }
      return false
    },
  })
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
  handler: async (_ctx, args) => {
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
  },
})
