import type { RouteSketch } from '../../../../../models/route-sketch'
import type { PlanInput } from '../../../../../models/saved-routes'
import { compileSketch } from '../compile-sketch'

const mockGoogleRoutesOkFetch = (): jest.Mock => {
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

  return jest.fn(async (url: string) => {
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
    process.env.ROUTING_PROVIDER_NAME = 'google'
    process.env.GOOGLE_MAPS_API_KEY = 'test-google-key'
    ;(globalThis as any).fetch = mockGoogleRoutesOkFetch()
  })

  afterEach(() => {
    jest.resetAllMocks()
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
