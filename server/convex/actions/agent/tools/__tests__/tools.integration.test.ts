import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest'
import type { RouteSketch } from '../../../../../models/route-sketch'
import type { PlanInput } from '../../../../../models/saved-routes'
import { createWeatherProvider } from '../../providers/weatherProvider'
import { compileSketch } from '../compileSketch'
import { computeRouteIndex } from '../computeRouteIndex'
import { mapConditions } from '../mapConditions'
import { normalizeRoute } from '../normalizeRoute'
import { probeConditions } from '../probeConditions'

const planInput: PlanInput = {
  start: { lat: 37.0, lng: -122.0, label: 'Start', placeId: 'start' },
  end: { lat: 37.5, lng: -122.5, label: 'End', placeId: 'end' },
  departureTime: Date.UTC(2026, 0, 13, 12, 0, 0),
  preferences: { scenicBias: 'default' },
}

const sketch: RouteSketch = {
  label: 'Scenic',
  rationale: 'Coastal',
  segments: [
    {
      roadName: 'Segment 1',
      fromName: 'A',
      toName: 'B',
    },
  ],
  anchorPoints: [{ name: 'Mid', kind: 'junction', lat: 37.25, lng: -122.25 }],
}

const makeIntegrationFetch = (): Mock => {
  const googleJson = {
    routes: [
      {
        viewport: {
          low: { latitude: 36.8, longitude: -122.6 },
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

  const openMeteoTimes: string[] = [
    '2026-01-13T11:00:00.000Z',
    '2026-01-13T12:00:00.000Z',
    '2026-01-13T13:00:00.000Z',
  ]
  const openMeteoJson = {
    hourly: {
      time: openMeteoTimes,
      windspeed_10m: [8, 10, 12],
      winddirection_10m: [180, 200, 220],
      windgusts_10m: [14, 15, 16],
    },
  }

  return vi.fn(async (url: string) => {
    if (url.startsWith('https://routes.googleapis.com/directions/v2:computeRoutes')) {
      return {
        ok: true,
        status: 200,
        json: async () => googleJson,
        text: async () => JSON.stringify(googleJson),
      }
    }

    if (url.startsWith('https://api.open-meteo.com/v1/forecast')) {
      return {
        ok: true,
        status: 200,
        json: async () => openMeteoJson,
        text: async () => JSON.stringify(openMeteoJson),
      }
    }

    throw new Error(`Unexpected fetch url in tools integration test: ${url}`)
  })
}

describe('agent tools integration', () => {
  beforeEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-google-key'
    ;(globalThis as any).fetch = makeIntegrationFetch()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('compiles, normalizes, indexes, probes, and maps wind overlay deterministically', async () => {
    // compile sketch using routing provider (google in this test, via fetch mock)
    const providerRoute = await compileSketch({ planInput, sketch })
    expect(providerRoute.legs.length).toBeGreaterThan(0)
    expect(providerRoute.overviewGeometry.value).toBeDefined()

    // normalize provider output
    const snapshot = await normalizeRoute({ providerRoute, planInput })
    expect(snapshot.legs.length).toBe(providerRoute.legs.length)
    expect(snapshot.annotations).toEqual([])
    expect(snapshot.overlays).toEqual({})

    // compute route index
    const index = await computeRouteIndex(snapshot)
    expect(index.sampledPoints.length).toBeGreaterThan(0)
    expect(index.sampledPoints[0].distanceFromStartMeters).toBe(0)

    // probe conditions with real provider (open-meteo in this test, via fetch mock)
    const weatherProvider = createWeatherProvider()
    const probed = await probeConditions({
      routeIndex: index,
      departureTimeMs: planInput.departureTime,
      weatherProvider,
    })
    expect(probed.length).toBeGreaterThan(0)

    // map conditions into wind overlay
    const overlay = await mapConditions({ routeSnapshot: snapshot, routeIndex: index, probed })
    expect(overlay.legend.length).toBeGreaterThan(0)
    expect(overlay.byLeg.length).toBeGreaterThan(0)
    expect(overlay.byLeg[0].segments.length).toBeGreaterThan(0)
  })
})
