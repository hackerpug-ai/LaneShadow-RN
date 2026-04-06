// Mock the env module to prevent requireEnv from throwing on missing Clerk secrets
// and to control the GOOGLE_MAPS_API_KEY value in tests.
import { vi, describe, it, expect, afterEach, Mock } from 'vitest'
import type { RouteSketch } from '../../../../../models/route-sketch'
import type { PlanInput } from '../../../../../models/saved-routes'

import { createRoutingProvider, resolveViaWaypoints } from '../routingProvider'

vi.mock('../../../../lib/env', () => ({ GOOGLE_MAPS_API_KEY: 'test-api-key' }))

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

describe('resolveViaWaypoints', () => {
  const anchorPoints = [
    { name: 'Alice Springs', kind: 'town' as const, lat: 37.1, lng: -122.1 },
    { name: 'Bob Peak', kind: 'pass' as const, lat: 37.2, lng: -122.2 },
    { name: 'Charlie Junction', kind: 'junction' as const, lat: 37.3, lng: -122.3 },
    { name: 'Delta Landmark', kind: 'landmark' as const, lat: 37.4, lng: -122.4 },
  ]

  it('AC-1: resolves a single viaName to its matching anchorPoint coordinates', () => {
    const result = resolveViaWaypoints(['Alice Springs'], anchorPoints)
    expect(result).toEqual([{ lat: 37.1, lng: -122.1 }])
  })

  it('AC-2: multiple viaNames are resolved in order matching the viaNames array', () => {
    const result = resolveViaWaypoints(['Bob Peak', 'Alice Springs'], anchorPoints)
    expect(result).toEqual([
      { lat: 37.2, lng: -122.2 },
      { lat: 37.1, lng: -122.1 },
    ])
  })

  it('AC-3: unresolvable viaName is skipped and does not throw', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = resolveViaWaypoints(['Alice Springs', 'NONEXISTENT'], anchorPoints)
    expect(result).toEqual([{ lat: 37.1, lng: -122.1 }])
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('NONEXISTENT'))
    warnSpy.mockRestore()
  })

  it('AC-4: no viaNames returns empty array (origin→destination only in request)', () => {
    const result = resolveViaWaypoints([], anchorPoints)
    expect(result).toEqual([])
  })

  it('AC-5: more than 3 viaNames uses only first 3 and warns about the rest', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = resolveViaWaypoints(
      ['Alice Springs', 'Bob Peak', 'Charlie Junction', 'Delta Landmark'],
      anchorPoints
    )
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ lat: 37.1, lng: -122.1 })
    expect(result[1]).toEqual({ lat: 37.2, lng: -122.2 })
    expect(result[2]).toEqual({ lat: 37.3, lng: -122.3 })
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Delta Landmark'))
    warnSpy.mockRestore()
  })

  it('AC-1 integration: Google Maps request body includes viaName as intermediate waypoint', async () => {
    const sketchWithVia: RouteSketch = {
      label: 'Test',
      rationale: 'Mocked',
      segments: [
        {
          roadName: 'Scenic Hwy',
          fromName: 'Start',
          toName: 'End',
          viaNames: ['Mid'],
        },
      ],
      anchorPoints: [{ name: 'Mid', kind: 'junction', lat: 37.25, lng: -122.25 }],
    }

    let capturedBody: any
    const fetchMock = vi.fn(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body)
      return makeGoogleOkFetch()()
    })
    ;(globalThis as any).fetch = fetchMock

    const provider = createRoutingProvider()
    await provider.routeFromSketch({ planInput, sketch: sketchWithVia })

    expect(capturedBody.intermediates).toHaveLength(1)
    expect(capturedBody.intermediates[0]).toEqual({
      location: { latLng: { latitude: 37.25, longitude: -122.25 } },
    })
  })

  it('AC-4 integration: no viaNames means no intermediates in Google Maps request', async () => {
    const sketchNoVia: RouteSketch = {
      label: 'Test',
      rationale: 'Mocked',
      segments: [{ roadName: 'Hwy', fromName: 'A', toName: 'B' }],
      anchorPoints: [],
    }

    let capturedBody: any
    const fetchMock = vi.fn(async (_url: string, init: any) => {
      capturedBody = JSON.parse(init.body)
      return makeGoogleOkFetch()()
    })
    ;(globalThis as any).fetch = fetchMock

    const provider = createRoutingProvider()
    await provider.routeFromSketch({ planInput, sketch: sketchNoVia })

    expect(capturedBody.intermediates).toHaveLength(0)
  })
})
