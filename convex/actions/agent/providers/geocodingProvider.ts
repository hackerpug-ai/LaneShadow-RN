'use node'
import { GOOGLE_MAPS_API_KEY } from '../../../lib/env'
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

const geocodeWithKey = async (
  apiKey: string,
  query: string,
  bias?: { lat: number; lng: number }
): Promise<GeocodeResult[]> => {
  const makeUrl = (radius?: number) => {
    let url = `${GEOCODING_ENDPOINT}?address=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`
    if (bias && radius) {
      url += `&location=${encodeURIComponent(`${bias.lat},${bias.lng}`)}&radius=${radius}`
    }
    return url
  }

  // Try with location bias first (larger radius for better coverage)
  const tryGeocode = async (url: string): Promise<GeocodeResult[] | null> => {
    try {
      const data: any = await withTimeout(
        async (signal) => {
          const response = await fetch(url, { signal })
          return response.json()
        },
        { ms: GEOCODING_TIMEOUT_MS, label: 'geocode' }
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

  // Strategy 1: Try with larger radius (200km for better regional coverage)
  if (bias) {
    const biasedResults = await tryGeocode(makeUrl(200000))
    if (biasedResults && biasedResults.length > 0) {
      return biasedResults
    }
  }

  // Strategy 2: Try without location bias (global search)
  const globalResults = await tryGeocode(makeUrl())
  if (globalResults && globalResults.length > 0) {
    return globalResults
  }

  // Strategy 3: Try with state/region hints for California locations
  if (bias && (bias.lat > 32 && bias.lat < 42 && bias.lng > -125 && bias.lng < -114)) {
    const californiaResults = await tryGeocode(
      `${GEOCODING_ENDPOINT}?address=${encodeURIComponent(query + ', California')}&key=${encodeURIComponent(apiKey)}`
    )
    if (californiaResults && californiaResults.length > 0) {
      return californiaResults
    }
  }

  return []
}

// Production callers use no arguments. Pass an explicit apiKey string in tests
// to bypass the env module (avoids ESM mock hoisting complexity).
export const createGeocodingProvider = (apiKeyParam?: string) => {
  const apiKey = apiKeyParam !== undefined ? apiKeyParam : GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Missing required environment variable: GOOGLE_MAPS_API_KEY')
  }

  return {
    geocode: async (
      query: string,
      bias?: { lat: number; lng: number }
    ): Promise<GeocodeResult[]> => geocodeWithKey(apiKey, query, bias),
  }
}
