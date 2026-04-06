import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest'
import type { RouteSketch } from '../../../../../models/route-sketch'
import type { PlanInput } from '../../../../../models/saved-routes'
import { compileSketch, compileSegments } from '../compileSketch'

const mockGoogleRoutesOkFetch = (): Mock => {
  const json = {
    routes: [
      {
        viewport: {
          low: { latitude: 36.9, longitude: -122.2 },
          high: { latitude: 37.2, longitude: -121.9 },
        },
        polyline: { encodedPolyline: 'OVERVIEW_POLYLINE' },
        legs: [
          {
            distanceMeters: 50_000,
            duration: '3600s',
            polyline: { encodedPolyline: 'LEG0_POLYLINE' },
            startLocation: { latLng: { latitude: 37.0, longitude: -122.0 } },
            endLocation: { latLng: { latitude: 37.1, longitude: -122.1 } },
          },
        ],
      },
    ],
  }

  return vi.fn(async (url: string) => {
    if (url.startsWith('https://routes.googleapis.com/directions/v2:computeRoutes')) {
      return {
        ok: true,
        status: 200,
        json: async () => json,
        text: async () => JSON.stringify(json),
      }
    }

    throw new Error(`Unexpected fetch url in compile-sketch test: ${url}`)
  })
}

describe('compileSketch', () => {
  const planInput: PlanInput = {
    start: { lat: 37.0, lng: -122.0, label: 'Start' },
    end: { lat: 37.1, lng: -122.1, label: 'End' },
    departureTime: Date.UTC(2026, 0, 13, 12, 0, 0),
    preferences: { scenicBias: 'default' },
  }

  const sketch: RouteSketch = {
    label: 'Test',
    rationale: 'Mocked',
    segments: [{ roadName: 'Road', fromName: 'A', toName: 'B' }],
    anchorPoints: [{ name: 'Mid', kind: 'junction', lat: 37.05, lng: -122.05 }],
  }

  beforeEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-google-key'
    ;(globalThis as any).fetch = mockGoogleRoutesOkFetch()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns provider response with expected fields', async () => {
    const result = await compileSketch({ planInput, sketch })
    expect(result.provider).toBe('google')
    expect(result.bounds).toBeDefined()
    expect(result.overviewGeometry.format).toBe('polyline')
    expect(result.legs.length).toBeGreaterThan(0)
  })

  it('is deterministic for the provider', async () => {
    const a = await compileSketch({ planInput, sketch })
    const b = await compileSketch({ planInput, sketch })
    expect(a.provider).toBe(b.provider)
    expect(a.legs.length).toBe(b.legs.length)
    expect(a.overviewGeometry.value).toBe(b.overviewGeometry.value)
  })
})

describe('compileSegments', () => {
  const planInput: PlanInput = {
    start: { lat: 37.0, lng: -122.0, label: 'Start' },
    end: { lat: 37.5, lng: -122.5, label: 'End' },
    departureTime: Date.UTC(2026, 0, 13, 12, 0, 0),
    preferences: { scenicBias: 'default' },
  }

  const validSketch: RouteSketch = {
    label: 'Test Route',
    rationale: 'Multi-segment test',
    segments: [
      { roadName: 'Highway 1', fromName: 'Start', toName: 'Mid' },
      { roadName: 'Highway 2', fromName: 'Mid', toName: 'End' },
    ],
    anchorPoints: [
      { name: 'Start', kind: 'town', lat: 37.0, lng: -122.0 },
      { name: 'Mid', kind: 'junction', lat: 37.25, lng: -122.25 },
      { name: 'End', kind: 'town', lat: 37.5, lng: -122.5 },
    ],
  }

  beforeEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-google-key'
    ;(globalThis as any).fetch = mockGoogleRoutesOkFetch()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('AC-1: compileSegments returns ok status for all segments when all anchorPoints have lat/lng', async () => {
    const results = await compileSegments({ planInput, sketch: validSketch })

    expect(results).toHaveLength(2)
    for (const result of results) {
      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.route.provider).toBe('google')
        expect(result.route.legs).toHaveLength(1)
      }
    }
  })

  it('AC-2: compileSegments returns failed status for invalid segment while other segments succeed', async () => {
    let callCount = 0
    ;(globalThis as any).fetch = vi.fn(async (url: string) => {
      callCount++
      if (callCount === 1) {
        // First segment fails
        return { ok: false, status: 400, text: async () => 'ROUTE_NOT_FOUND' }
      }
      // Second segment succeeds
      const json = {
        routes: [
          {
            viewport: {
              low: { latitude: 36.9, longitude: -122.6 },
              high: { latitude: 37.6, longitude: -121.9 },
            },
            polyline: { encodedPolyline: 'OVERVIEW_POLYLINE' },
            legs: [
              {
                distanceMeters: 50_000,
                duration: '3600s',
                polyline: { encodedPolyline: 'LEG0_POLYLINE' },
                startLocation: { latLng: { latitude: 37.0, longitude: -122.0 } },
                endLocation: { latLng: { latitude: 37.5, longitude: -122.5 } },
              },
            ],
          },
        ],
      }
      return { ok: true, status: 200, json: async () => json, text: async () => JSON.stringify(json) }
    })

    const results = await compileSegments({ planInput, sketch: validSketch })

    expect(results).toHaveLength(2)
    expect(results[0].status).toBe('failed')
    expect(results[1].status).toBe('ok')
    if (results[0].status === 'failed') {
      expect(results[0].error).toBeDefined()
    }
  })

  it('AC-3: compileSegments executes all segment API calls in parallel via Promise.allSettled', async () => {
    const callTimestamps: number[] = []
    const DELAY_MS = 100

    ;(globalThis as any).fetch = vi.fn(async () => {
      callTimestamps.push(Date.now())
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
      const json = {
        routes: [
          {
            viewport: {
              low: { latitude: 36.9, longitude: -122.6 },
              high: { latitude: 37.6, longitude: -121.9 },
            },
            polyline: { encodedPolyline: 'OVERVIEW_POLYLINE' },
            legs: [
              {
                distanceMeters: 50_000,
                duration: '3600s',
                polyline: { encodedPolyline: 'LEG0_POLYLINE' },
                startLocation: { latLng: { latitude: 37.0, longitude: -122.0 } },
                endLocation: { latLng: { latitude: 37.5, longitude: -122.5 } },
              },
            ],
          },
        ],
      }
      return { ok: true, status: 200, json: async () => json, text: async () => JSON.stringify(json) }
    })

    const start = Date.now()
    const results = await compileSegments({ planInput, sketch: validSketch })
    const elapsed = Date.now() - start

    // With 2 segments each taking ~100ms, parallel execution should complete in < 600ms
    // (max(individual) + 500ms buffer). Sequential would take ~200ms+.
    expect(results).toHaveLength(2)
    expect(elapsed).toBeLessThan(DELAY_MS * validSketch.segments.length + 500)

    // Both calls should have started nearly simultaneously (within 50ms of each other)
    expect(callTimestamps).toHaveLength(2)
    const timeDiff = Math.abs(callTimestamps[1] - callTimestamps[0])
    expect(timeDiff).toBeLessThan(50)
  })

  it('AC-4: compileSegments rejects sketches with more than 10 segments before making API calls', async () => {
    const fetchMock = mockGoogleRoutesOkFetch()
    ;(globalThis as any).fetch = fetchMock

    const tooManySegments: RouteSketch = {
      label: 'Too Many',
      rationale: 'Exceeds limit',
      segments: Array.from({ length: 11 }, (_, i) => ({
        roadName: `Road ${i}`,
        fromName: `Point ${i}`,
        toName: `Point ${i + 1}`,
      })),
      anchorPoints: Array.from({ length: 12 }, (_, i) => ({
        name: `Point ${i}`,
        kind: 'town' as const,
        lat: 37.0 + i * 0.05,
        lng: -122.0 - i * 0.05,
      })),
    }

    await expect(compileSegments({ planInput, sketch: tooManySegments })).rejects.toThrow(
      /segment/i
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
