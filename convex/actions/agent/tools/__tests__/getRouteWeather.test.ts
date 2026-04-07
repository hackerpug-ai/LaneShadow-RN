'use node'
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest'
import { getRouteWeather } from '../getRouteWeather'

type LatLng = { lat: number; lng: number }

const makePolyline = (count: number, baseLat = 37, baseLng = -122): LatLng[] =>
  Array.from({ length: count }).map((_, i) => ({
    lat: baseLat + i * 0.1,
    lng: baseLng - i * 0.1,
  }))

const makeFoggyPolyline = (): LatLng[] => [
  { lat: 37.5, lng: -122.5 }, // inland start
  { lat: 37.7, lng: -122.7 }, // coast (fog)
  { lat: 37.9, lng: -122.9 }, // end
]

const makeOkFetch = (overrides?: { visibility?: number; temperature?: number; rain?: number }): Mock => {
  const times = [
    '2026-01-13T11:00:00.000Z',
    '2026-01-13T12:00:00.000Z',
    '2026-01-13T13:00:00.000Z',
  ]

  const json = {
    hourly: {
      time: times,
      windspeed_10m: [8, 10, 12],
      winddirection_10m: [180, 200, 220],
      windgusts_10m: [14, 15, 16],
      temperature_2m: [overrides?.temperature ?? 17, 18, 19],
      precipitation_probability: [overrides?.rain ?? 10, 15, 20],
      visibility: [overrides?.visibility ?? 10000, 10000, 10000],
    },
  }

  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => json,
  }))
}

describe('getRouteWeather', () => {
  const departureTimeMs = Date.parse('2026-01-13T12:00:00.000Z')

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('basic weather', () => {
    beforeEach(() => {
      ;(globalThis as any).fetch = makeOkFetch()
    })

    it('returns temperature, wind, and rain data for each sample point', async () => {
      const polyline = makePolyline(5)
      const result = await getRouteWeather({ polyline, departureTimeMs })

      expect(result.status).toBe('ok')
      if (result.status !== 'ok') return

      expect(result.segments).toHaveLength(result.segments.length)
      expect(result.segments.length).toBeGreaterThanOrEqual(1)

      for (const seg of result.segments) {
        expect(typeof seg.lat).toBe('number')
        expect(typeof seg.lng).toBe('number')
        expect(typeof seg.tempC).toBe('number')
        expect(typeof seg.windSpeedKph).toBe('number')
        expect(typeof seg.rainProbabilityPct).toBe('number')
        expect(typeof seg.fog).toBe('boolean')
      }

      expect(typeof result.routeWeatherSummary).toBe('string')
      expect(result.routeWeatherSummary.length).toBeGreaterThan(0)
    })
  })

  describe('fog detection', () => {
    it('returns fog: true for coastal sample point with visibility < 1km', async () => {
      // First two calls normal, middle call returns low visibility (fog)
      let callCount = 0
      ;(globalThis as any).fetch = vi.fn(async () => {
        callCount += 1
        const isFoggy = callCount === 2 // second sample point is foggy
        const times = ['2026-01-13T11:00:00.000Z', '2026-01-13T12:00:00.000Z', '2026-01-13T13:00:00.000Z']
        const json = {
          hourly: {
            time: times,
            windspeed_10m: [8, 10, 12],
            winddirection_10m: [180, 200, 220],
            windgusts_10m: [14, 15, 16],
            temperature_2m: [17, 18, 19],
            precipitation_probability: [10, 15, 20],
            visibility: isFoggy ? [500, 500, 500] : [10000, 10000, 10000],
          },
        }
        return { ok: true, status: 200, json: async () => json }
      })

      const polyline = makeFoggyPolyline()
      const result = await getRouteWeather({ polyline, departureTimeMs })

      expect(result.status).toBe('ok')
      if (result.status !== 'ok') return

      const foggySegments = result.segments.filter((s) => s.fog)
      expect(foggySegments.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('api failure', () => {
    it('returns { status: unavailable } without throwing on API failure', async () => {
      ;(globalThis as any).fetch = vi.fn(async () => {
        throw new Error('Network error')
      })

      const polyline = makePolyline(3)
      const result = await getRouteWeather({ polyline, departureTimeMs })

      expect(result.status).toBe('unavailable')
    })
  })

  describe('sampling', () => {
    beforeEach(() => {
      ;(globalThis as any).fetch = makeOkFetch()
    })

    it('samples polyline with 50 points down to 3-5 representative points before API call', async () => {
      const polyline = makePolyline(50)
      const result = await getRouteWeather({ polyline, departureTimeMs })

      // The number of fetch calls reveals how many points were queried
      const fetchCallCount = ((globalThis as any).fetch as Mock).mock.calls.length
      expect(fetchCallCount).toBeGreaterThanOrEqual(3)
      expect(fetchCallCount).toBeLessThanOrEqual(5)

      expect(result.status).toBe('ok')
      if (result.status !== 'ok') return
      expect(result.segments.length).toBeGreaterThanOrEqual(3)
      expect(result.segments.length).toBeLessThanOrEqual(5)
    })

    it('preserves at least start and end points in sampling', async () => {
      const polyline = makePolyline(50)
      const result = await getRouteWeather({ polyline, departureTimeMs })

      expect(result.status).toBe('ok')
      if (result.status !== 'ok') return

      const first = result.segments[0]
      const last = result.segments[result.segments.length - 1]

      // Start should be close to polyline[0]
      expect(first.lat).toBeCloseTo(polyline[0].lat, 2)
      expect(first.lng).toBeCloseTo(polyline[0].lng, 2)

      // End should be close to polyline[49]
      expect(last.lat).toBeCloseTo(polyline[49].lat, 2)
      expect(last.lng).toBeCloseTo(polyline[49].lng, 2)
    })
  })
})
