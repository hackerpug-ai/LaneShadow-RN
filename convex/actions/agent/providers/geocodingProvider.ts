'use node'
import { haversineDistance } from '../../../curatedGeometryGate'
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

/** Region-filtered geocode result used by Lever 2 reconstruct. */
export type RegionGeocodedAnchor = {
  lat: number
  lng: number
  formatted: string
  distanceFromCentroid: number
  placeId?: string
}

/** Default Lever-2 region radius (miles) — must match isAnchorInRegion gate. */
export const DEFAULT_REGION_RADIUS_MI = 150

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

/**
 * True when the point lies within `maxDistanceMi` of the route centroid.
 * Mirrors curatedGeometryGate.isAnchorInRegion (default 150mi).
 */
export const isGeocodedAnchorInRegion = (
  anchor: { lat: number; lng: number },
  centroid: { lat: number; lng: number },
  maxDistanceMi: number = DEFAULT_REGION_RADIUS_MI,
): boolean => haversineDistance(anchor, centroid) <= maxDistanceMi

/**
 * Geocode a single query with viewport bounds centered on the route centroid
 * (region bias), then reject results outside maxDistanceMi.
 *
 * Uses Google Geocoding `bounds` so results prefer the route's region; the
 * hard 150mi fence is applied after geocode (gate-identical filter).
 */
export const geocodeWithRegionBias = async (
  query: string,
  centroid: { lat: number; lng: number },
  maxDistanceMi: number = DEFAULT_REGION_RADIUS_MI,
  apiKeyParam?: string,
): Promise<RegionGeocodedAnchor | null> => {
  const apiKey = apiKeyParam !== undefined ? apiKeyParam : GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Missing required environment variable: GOOGLE_MAPS_API_KEY')
  }

  // ~1.2° ≈ 80–90mi at CA latitudes — bounds bias, not a hard fence.
  // The hard fence is maxDistanceMi below.
  const delta = 1.2
  const url = new URL(GEOCODING_ENDPOINT)
  url.searchParams.set('address', normalizePlaceQueryForGeocode(query))
  url.searchParams.set('key', apiKey)
  url.searchParams.set(
    'bounds',
    `${centroid.lat - delta},${centroid.lng - delta}|${centroid.lat + delta},${centroid.lng + delta}`,
  )

  // Plain fetch (no withTimeout AbortSignal) — matches reconstruct defaultGeocode
  // and avoids jsdom AbortSignal instanceof mismatches in integration tests.
  const response = await fetch(url.toString())
  const data: any = await response.json()

  if (data?.status !== 'OK' || !Array.isArray(data?.results) || data.results.length === 0) {
    return null
  }

  const loc = data.results[0].geometry.location
  const point = { lat: loc.lat as number, lng: loc.lng as number }
  const distanceFromCentroid = haversineDistance(point, centroid)
  if (distanceFromCentroid > maxDistanceMi) {
    return null
  }

  return {
    lat: point.lat,
    lng: point.lng,
    formatted: data.results[0].formatted_address as string,
    distanceFromCentroid,
    placeId: data.results[0].place_id as string | undefined,
  }
}

/**
 * Geocode an ordered list of anchor queries with region bias, dropping misses
 * and off-region results. Surviving anchors are the routing intermediate set.
 */
export const geocodeAnchorsInRegion = async (
  queries: string[],
  centroid: { lat: number; lng: number },
  maxDistanceMi: number = DEFAULT_REGION_RADIUS_MI,
  apiKeyParam?: string,
): Promise<RegionGeocodedAnchor[]> => {
  const results: RegionGeocodedAnchor[] = []
  for (const query of queries) {
    const geocoded = await geocodeWithRegionBias(query, centroid, maxDistanceMi, apiKeyParam)
    if (geocoded) results.push(geocoded)
  }
  return results
}
