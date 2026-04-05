// Mock the env module to prevent requireEnv from throwing on missing Clerk secrets
// and to control the GOOGLE_MAPS_API_KEY value in tests.
vi.mock('../../../../lib/env', () => ({ GOOGLE_MAPS_API_KEY: 'test-api-key' }))

import { vi, describe, it, expect, afterEach, Mock } from 'vitest'
import type { RouteSketch } from '../../../../../models/route-sketch'
import type { PlanInput } from '../../../../../models/saved-routes'

import { createRoutingProvider } from '../routingProvider'

const planInput: PlanInput = {
  start: { lat: 37.0, lng: -122.0, label: 'Start', placeId: 'start' },
  end: { lat: 37.5, lng: -122.5, label: 'End', placeId: 'end' },
  departureTime: Date.UTC(2026, 0, 13, 12, 0, 0),
  preferences: { scenicBias: 'default' },
}

const sketch: RouteSketch = {
  label: 'Test',
  rationale: 'Mocked',
  segments: [{ roadName: 'Road', fromName: 'A', toName: 'B' }],
  anchorPoints: [{ name: 'Mid', kind: 'junction', lat: 37.25, lng: -122.25 }],
}

const makeGoogleOkFetch = (overrides?: {
  duration?: string
  includeOverview?: boolean
  includeViewport?: boolean
  includeLegs?: boolean
}): Mock => {
  const json = {
    routes: [
      {
        viewport:
          overrides?.includeViewport === false
            ? undefined
            : {
                low: { latitude: 36.8, longitude: -122.6 },
                high: { latitude: 37.6, longitude: -121.9 },
              },
        polyline:
          overrides?.includeOverview === false
            ? undefined
            : { encodedPolyline: 'OVERVIEW_POLYLINE' },
        legs:
          overrides?.includeLegs === false
            ? []
            : [
                {
                  distanceMeters: 50_000,
                  duration: overrides?.duration ?? '3600s',
                  polyline: { encodedPolyline: 'LEG0_POLYLINE' },
                  startLocation: { latLng: { latitude: 37.0, longitude: -122.0 } },
                  endLocation: { latLng: { latitude: 37.5, longitude: -122.5 } },
                },
              ],
      },
    ],
  }

  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => json,
    text: async () => JSON.stringify(json),
  }))
}

describe('routing provider', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('google provider calls Routes API with key and parses response', async () => {
    const fetchMock = makeGoogleOkFetch()
    ;(globalThis as any).fetch = fetchMock

    const provider = createRoutingProvider()
    const result = await provider.routeFromSketch({ planInput, sketch })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://routes.googleapis.com/directions/v2:computeRoutes')
    expect(init?.method).toBe('POST')
    expect(init?.headers?.['X-Goog-Api-Key']).toBe('test-api-key')

    expect(result.provider).toBe('google')
    expect(result.overviewGeometry.value).toBe('OVERVIEW_POLYLINE')
    expect(result.legs).toHaveLength(1)
    expect(result.legs[0].durationSeconds).toBe(3600)
  })

  it('google provider returns durationSeconds=0 when duration is malformed', async () => {
    ;(globalThis as any).fetch = makeGoogleOkFetch({ duration: 'not-seconds' })

    const provider = createRoutingProvider()
    const result = await provider.routeFromSketch({ planInput, sketch })

    expect(result.legs[0].durationSeconds).toBe(0)
  })

  it('google provider throws on non-ok responses and includes status/body', async () => {
    ;(globalThis as any).fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => 'oops',
    }))

    const provider = createRoutingProvider()
    await expect(provider.routeFromSketch({ planInput, sketch })).rejects.toThrow(
      /Google Routes request failed: 500/
    )
  })

  it('google provider throws when required fields are missing', async () => {
    ;(globalThis as any).fetch = makeGoogleOkFetch({ includeOverview: false })

    const provider = createRoutingProvider()
    await expect(provider.routeFromSketch({ planInput, sketch })).rejects.toThrow(
      /missing overview polyline/i
    )
  })

  it('google provider is deterministic when upstream payload is deterministic', async () => {
    ;(globalThis as any).fetch = makeGoogleOkFetch()

    const provider = createRoutingProvider()
    const a = await provider.routeFromSketch({ planInput, sketch })
    const b = await provider.routeFromSketch({ planInput, sketch })

    expect(a).toEqual(b)
  })

  it('uses DRIVE travel mode', async () => {
    // The provider only issues DRIVE requests. (The previous TWO_WHEELER-first
    // fallback was removed — Google's Routes API rejects routingPreference for
    // TWO_WHEELER, and DRIVE is the stable mode for motorcycle scenic routing.)
    let callCount = 0
    const fetchMock = vi.fn(async (_url: string, init: any) => {
      callCount++
      const body = JSON.parse(init.body)
      expect(body.travelMode).toBe('DRIVE')
      return makeGoogleOkFetch()()
    })
    ;(globalThis as any).fetch = fetchMock

    const provider = createRoutingProvider()
    const result = await provider.routeFromSketch({ planInput, sketch })

    expect(callCount).toBe(1)
    expect(result.provider).toBe('google')
  })
})
