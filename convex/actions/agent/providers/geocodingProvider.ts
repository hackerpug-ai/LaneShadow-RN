'use node'
import { GOOGLE_MAPS_API_KEY } from '../../../lib/env'
import { normalizePlaceQueryForGeocode } from '../lib/placeAliases'
import { withTimeout } from '../lib/reliability'

export type GeocodeResult = {
  lat: number
  lng: number
  label: string
  placeId: string
  types: string[]
}

const GEOCODING_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json'
const GEOCODING_TIMEOUT_MS = 5_000
const MAX_RESULTS = 5

type LocationBiasOptions = {
  currentLocation?: { lat: number; lng: number }
  routeStart?: { lat: number; lng: number }
  routeEnd?: { lat: number; lng: number }
}

// Accept both legacy { lat, lng } format and new LocationBiasOptions
type GeocodeBias = { lat: number; lng: number } | LocationBiasOptions

const normalizeLocationOptions = (bias?: GeocodeBias): LocationBiasOptions | undefined => {
  if (!bias) return undefined
  // Check if it's the legacy { lat, lng } format
  if ('lat' in bias && 'lng' in bias && !('currentLocation' in bias)) {
    return { currentLocation: bias as { lat: number; lng: number } }
  }
  return bias as LocationBiasOptions
}

const geocodeWithKey = async (
  apiKey: string,
  query: string,
  locationOptions?: GeocodeBias,
): Promise<GeocodeResult[]> => {
  const normalizedQuery = normalizePlaceQueryForGeocode(query)
  const makeUrl = (bias?: { lat: number; lng: number }, radius?: number) => {
    let url = `${GEOCODING_ENDPOINT}?address=${encodeURIComponent(normalizedQuery)}&key=${encodeURIComponent(apiKey)}`
    if (bias && radius) {
      url += `&location=${encodeURIComponent(`${bias.lat},${bias.lng}`)}&radius=${radius}`
    }
    return url
  }

  // Normalize location options to handle both legacy and new formats
  const normalizedOptions = normalizeLocationOptions(locationOptions)

  // Try with location bias first (larger radius for better coverage)
  const tryGeocode = async (url: string): Promise<GeocodeResult[] | null> => {
    try {
      const data: any = await withTimeout(
        async (signal) => {
          const response = await fetch(url, { signal })
          return response.json()
        },
        { ms: GEOCODING_TIMEOUT_MS, label: 'geocode' },
      )

      if (data?.status === 'ZERO_RESULTS') {
        return null
      }

      const results: any[] = Array.isArray(data?.results) ? data.results : []
      if (results.length === 0) {
        return null
      }

      return results.slice(0, MAX_RESULTS).map((result: any) => ({
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        label: result.formatted_address,
        placeId: result.place_id,
        types: result.types ?? [],
      }))
    } catch {
      return null
    }
  }

  // Tier 1: Current location (200km) - highest priority when available
  if (normalizedOptions?.currentLocation) {
    const results = await tryGeocode(makeUrl(normalizedOptions.currentLocation, 200000))
    if (results && results.length > 0) return results
  }

  // Tier 2: Route start point (300km) - fallback when currentLocation unavailable
  if (normalizedOptions?.routeStart) {
    const results = await tryGeocode(makeUrl(normalizedOptions.routeStart, 300000))
    if (results && results.length > 0) return results
  }

  // Tier 3: Route midpoint (500km) - covers entire route corridor
  if (normalizedOptions?.routeStart && normalizedOptions?.routeEnd) {
    const midpoint = {
      lat: (normalizedOptions.routeStart.lat + normalizedOptions.routeEnd.lat) / 2,
      lng: (normalizedOptions.routeStart.lng + normalizedOptions.routeEnd.lng) / 2,
    }
    const results = await tryGeocode(makeUrl(midpoint, 500000))
    if (results && results.length > 0) return results
  }

  // Tier 4: Global search - no location bias
  const results = await tryGeocode(makeUrl())
  return results ?? []
}

// Production callers use no arguments. Pass an explicit apiKey string in tests
// to bypass the env module (avoids ESM mock hoisting complexity).
export const createGeocodingProvider = (apiKeyParam?: string) => {
  const apiKey = apiKeyParam !== undefined ? apiKeyParam : GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Missing required environment variable: GOOGLE_MAPS_API_KEY')
  }

  return {
    geocode: async (query: string, bias?: GeocodeBias): Promise<GeocodeResult[]> =>
      geocodeWithKey(apiKey, query, bias),
  }
}
