import { afterEach, describe, expect, it, vi } from 'vitest'
import { getElevation, samplePolyline } from '../getElevation'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type LatLng = { lat: number; lng: number }

/**
 * Build a mock Open-Elevation response for the given points with prescribed
 * elevation values (in meters).
 */
const makeElevationResponse = (points: { lat: number; lng: number; elevation: number }[]) => ({
  ok: true,
  status: 200,
  json: async () => ({
    results: points.map((p) => ({
      latitude: p.lat,
      longitude: p.lng,
      elevation: p.elevation,
    })),
  }),
})

const setupFetch = (response: ReturnType<typeof makeElevationResponse>) => {
  ;(globalThis as { fetch: unknown }).fetch = vi.fn(async () => response)
}

const setupFetchError = (error: Error) => {
  ;(globalThis as { fetch: unknown }).fetch = vi.fn(async () => {
    throw error
  })
}

// ---------------------------------------------------------------------------
// Fixture polylines
// ---------------------------------------------------------------------------

/**
 * Mountain road fixture: 5 points climbing ~900m then descending ~700m.
 * Points are ~2km apart so grades are steep (>5%).
 * 800m gain over ~2km = ~40% max grade segment.
 */
const MOUNTAIN_POLYLINE: LatLng[] = [
  { lat: 37.0, lng: -122.0 }, // base: ~200m
  { lat: 37.018, lng: -121.998 }, // climb: ~500m  (~2km)
  { lat: 37.036, lng: -121.996 }, // peak: ~1100m  (~2km)
  { lat: 37.054, lng: -121.994 }, // descent: ~700m (~2km)
  { lat: 37.072, lng: -121.992 }, // valley: ~400m  (~2km)
]

const MOUNTAIN_ELEVATIONS = [200, 500, 1100, 700, 400] // meters

/**
 * Flat road fixture: 5 points all within ~10m elevation (coastal/valley).
 */
const FLAT_POLYLINE: LatLng[] = [
  { lat: 36.6, lng: -121.9 },
  { lat: 36.7, lng: -121.85 },
  { lat: 36.8, lng: -121.8 },
  { lat: 36.9, lng: -121.75 },
  { lat: 37.0, lng: -121.7 },
]

const FLAT_ELEVATIONS = [10, 12, 11, 13, 10] // meters — nearly flat

/**
 * Dense polyline for sampling test: 150 points.
 */
const DENSE_POLYLINE: LatLng[] = Array.from({ length: 150 }, (_, i) => ({
  lat: 37.0 + i * 0.001,
  lng: -122.0 + i * 0.001,
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getElevation', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  // AC-1: mountain route returns positive gain/loss and grade > 5%
  it('mountain route: returns positive gain/loss and maxGradePct above 5%', async () => {
    const mockPoints = MOUNTAIN_POLYLINE.map((p, i) => ({
      lat: p.lat,
      lng: p.lng,
      elevation: MOUNTAIN_ELEVATIONS[i],
    }))
    setupFetch(makeElevationResponse(mockPoints))

    const result = await getElevation({ polyline: MOUNTAIN_POLYLINE })

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return

    expect(result.totalGainFt).toBeGreaterThan(0)
    expect(result.totalLossFt).toBeGreaterThan(0)
    expect(result.maxGradePct).toBeGreaterThan(5)
  })

  // AC-2: flat route returns minimal gain and low grade
  it('flat route: returns totalGainFt below 200 and maxGradePct below 3%', async () => {
    const mockPoints = FLAT_POLYLINE.map((p, i) => ({
      lat: p.lat,
      lng: p.lng,
      elevation: FLAT_ELEVATIONS[i],
    }))
    setupFetch(makeElevationResponse(mockPoints))

    const result = await getElevation({ polyline: FLAT_POLYLINE })

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return

    expect(result.totalGainFt).toBeLessThan(200)
    expect(result.maxGradePct).toBeLessThan(3)
  })

  // AC-3: sampling — dense polyline gets sampled to <= 100 points before API call
  it('sampling: polyline with 150 points is sampled to at most 100 before API call', async () => {
    // Track how many locations were sent to the API
    let sentLocationCount = 0

    ;(globalThis as { fetch: unknown }).fetch = vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as { locations: unknown[] }
      sentLocationCount = body.locations.length

      // Return flat elevations for all sampled points
      const results = body.locations.map((loc: unknown) => {
        const l = loc as { latitude: number; longitude: number }
        return { latitude: l.latitude, longitude: l.longitude, elevation: 100 }
      })
      return {
        ok: true,
        status: 200,
        json: async () => ({ results }),
      }
    })

    await getElevation({ polyline: DENSE_POLYLINE })

    expect(sentLocationCount).toBeLessThanOrEqual(100)
    expect(sentLocationCount).toBeGreaterThan(0)
  })

  // AC-4: API failure returns unavailable status without throwing
  it('api failure: returns unavailable status without throwing', async () => {
    setupFetchError(new Error('Network error'))

    const result = await getElevation({ polyline: MOUNTAIN_POLYLINE })

    expect(result.status).toBe('unavailable')
  })
})

// ---------------------------------------------------------------------------
// Unit tests for samplePolyline helper
// ---------------------------------------------------------------------------

describe('samplePolyline', () => {
  it('returns polyline unchanged when it has fewer points than max', () => {
    const points: LatLng[] = [
      { lat: 37.0, lng: -122.0 },
      { lat: 37.1, lng: -122.1 },
    ]
    const sampled = samplePolyline(points, 100)
    expect(sampled).toHaveLength(points.length)
  })

  it('samples down to at most max points when input exceeds max', () => {
    const points: LatLng[] = Array.from({ length: 200 }, (_, i) => ({
      lat: 37.0 + i * 0.001,
      lng: -122.0,
    }))
    const sampled = samplePolyline(points, 100)
    expect(sampled.length).toBeLessThanOrEqual(100)
  })

  it('always includes first and last points', () => {
    const points: LatLng[] = Array.from({ length: 150 }, (_, i) => ({
      lat: 37.0 + i * 0.001,
      lng: -122.0,
    }))
    const sampled = samplePolyline(points, 50)
    expect(sampled[0]).toEqual(points[0])
    expect(sampled[sampled.length - 1]).toEqual(points[points.length - 1])
  })
})
