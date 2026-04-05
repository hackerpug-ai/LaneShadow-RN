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
  let url = `${GEOCODING_ENDPOINT}?address=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`

  if (bias) {
    url += `&location=${encodeURIComponent(`${bias.lat},${bias.lng}`)}&radius=50000`
  }

  try {
    const data: any = await withTimeout(
      async (signal) => {
        const response = await fetch(url, { signal })
        return response.json()
      },
      { ms: GEOCODING_TIMEOUT_MS, label: 'geocode' }
    )

    if (data?.status === 'ZERO_RESULTS') {
      return []
    }

    const results: any[] = Array.isArray(data?.results) ? data.results : []
    return results.slice(0, MAX_RESULTS).map((result: any) => ({
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      label: result.formatted_address,
      placeId: result.place_id,
      types: result.types ?? [],
    }))
  } catch {
    return []
  }
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
