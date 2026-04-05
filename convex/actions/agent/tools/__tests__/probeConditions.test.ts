import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest'
import type { RouteIndex, RouteIndexPoint } from '../../../../../models/saved-routes'
import { createWeatherProvider } from '../../providers/weatherProvider'
import { probeConditions } from '../probeConditions'

const makePoints = (count: number): RouteIndexPoint[] =>
  Array.from({ length: count }).map((_, i) => ({
    lat: 37 + i * 0.001,
    lng: -122 - i * 0.001,
    distanceFromStartMeters: i * 1000,
  }))

const makeRouteIndex = (points: RouteIndexPoint[]): RouteIndex => ({
  routeFingerprint: 'fp',
  sampledPoints: points,
})

const makeOkFetch = (): Mock => {
  const times: string[] = [
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
    },
  }

  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => json,
  }))
}

describe('probeConditions', () => {
  const departureTimeMs = Date.parse('2026-01-13T12:00:00.000Z')
  const allowedTimes = new Set([
    '2026-01-13T11:00:00.000Z',
    '2026-01-13T12:00:00.000Z',
    '2026-01-13T13:00:00.000Z',
  ])
  const allowedWindSpeeds = new Set([8, 10, 12])
  const allowedWindDirections = new Set([180, 200, 220])
  const allowedWindGusts = new Set([14, 15, 16])

  beforeEach(() => {
    ;(globalThis as any).fetch = makeOkFetch()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns empty array when no points', async () => {
    const weather = createWeatherProvider()
    const result = await probeConditions({
      routeIndex: makeRouteIndex([]),
      departureTimeMs,
      weatherProvider: weather,
    })
    expect(result).toEqual([])
    expect((globalThis as any).fetch).toHaveBeenCalledTimes(0)
  })

  it('caps probed points to 25 and preserves ordering', async () => {
    const weather = createWeatherProvider()
    const manyPoints = makePoints(60) // > 25
    const result = await probeConditions({
      routeIndex: makeRouteIndex(manyPoints),
      departureTimeMs,
      weatherProvider: weather,
    })

    expect((globalThis as any).fetch).toHaveBeenCalledTimes(25)
    expect(result.length).toBeLessThanOrEqual(25)
    // ensure first/last distances preserved and sorted
    expect(result[0].distanceFromStartMeters).toBe(0)
    expect(result[result.length - 1].distanceFromStartMeters).toBe(59_000)
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i].distanceFromStartMeters).toBeGreaterThanOrEqual(
        result[i - 1].distanceFromStartMeters
      )
    }
  })

  it('maps returned samples to probed points', async () => {
    const weather = createWeatherProvider()
    const points = makePoints(5)
    const result = await probeConditions({
      routeIndex: makeRouteIndex(points),
      departureTimeMs,
      weatherProvider: weather,
    })

    expect(result).toHaveLength(points.length)
    result.forEach((r, idx) => {
      expect(r.distanceFromStartMeters).toBe(points[idx].distanceFromStartMeters)
      expect(r.wind.lat).toBe(points[idx].lat)
      expect(r.wind.lng).toBe(points[idx].lng)
      expect(typeof r.wind.windSpeed).toBe('number')
      expect(allowedWindSpeeds.has(r.wind.windSpeed)).toBe(true)
      expect(typeof r.wind.windDirectionDeg).toBe('number')
      expect(allowedWindDirections.has(r.wind.windDirectionDeg)).toBe(true)
      if (r.wind.windGust !== undefined) {
        expect(allowedWindGusts.has(r.wind.windGust)).toBe(true)
      }
      expect(typeof r.wind.timeIso).toBe('string')
      expect(allowedTimes.has(r.wind.timeIso)).toBe(true)
    })
    expect((globalThis as any).fetch).toHaveBeenCalledTimes(points.length)
  })
})
