import { describe, it, expect } from 'vitest'
import type { RouteIndex, RouteSnapshot } from '../../../../../models/saved-routes'
import { mapConditions } from '../mapConditions'
import type { ProbedWindPoint } from '../probeConditions'

const makeSnapshot = (): RouteSnapshot => ({
  provider: 'mock',
  bounds: { north: 38, south: 36, east: -121, west: -123 },
  origin: { lat: 37, lng: -122 },
  destination: { lat: 37.1, lng: -122.1 },
  waypoints: [],
  overviewGeometry: {
    format: 'polyline',
    encoding: 'enc-overview',
    precision: 5,
    value: 'val-overview',
  },
  legs: [
    {
      legIndex: 0,
      start: { lat: 37, lng: -122 },
      end: { lat: 37.1, lng: -122.1 },
      distanceMeters: 10_000,
      durationSeconds: 600,
      geometry: {
        format: 'polyline',
        encoding: 'enc0',
        precision: 5,
        value: 'val0',
      },
    },
  ],
  annotations: [],
  overlays: {},
})

const makeIndex = (): RouteIndex => ({
  routeFingerprint: 'fp',
  sampledPoints: [
    { lat: 37, lng: -122, distanceFromStartMeters: 0 },
    { lat: 37.05, lng: -122.05, distanceFromStartMeters: 5_000 },
    { lat: 37.1, lng: -122.1, distanceFromStartMeters: 10_000 },
  ],
})

const makeProbed = (levels: ('low' | 'moderate' | 'high')[]): ProbedWindPoint[] => {
  const distances = [0, 5_000, 10_000]
  const speeds = { low: 3, moderate: 7, high: 12 }
  return levels.map((lvl, idx) => ({
    distanceFromStartMeters: distances[idx],
    lat: 37 + idx * 0.05,
    lng: -122 - idx * 0.05,
    wind: {
      lat: 0,
      lng: 0,
      windSpeed: speeds[lvl],
      windDirectionDeg: 220,
      unit: 'm/s',
      timeIso: new Date().toISOString(),
    },
  }))
}

describe('mapConditions', () => {
  it('returns overlay with legend and segments bounded to leg distance', async () => {
    const snapshot = makeSnapshot()
    const index = makeIndex()
    const probed = makeProbed(['low', 'moderate', 'high'])

    const overlay = await mapConditions({ routeSnapshot: snapshot, routeIndex: index, probed })

    expect(overlay.legend.map((l) => l.level)).toEqual(
      expect.arrayContaining(['low', 'moderate', 'high'])
    )
    expect(overlay.byLeg.length).toBe(1)
    const leg = overlay.byLeg[0]
    expect(leg.legIndex).toBe(0)
    expect(leg.segments.length).toBeGreaterThan(0)
    leg.segments.forEach((seg) => {
      expect(seg.startMeters).toBeGreaterThanOrEqual(0)
      expect(seg.endMeters).toBeLessThanOrEqual(snapshot.legs[0].distanceMeters)
      expect(seg.startMeters).toBeLessThanOrEqual(seg.endMeters)
    })
  })

  it('merges adjacent segments with same level', async () => {
    const snapshot = makeSnapshot()
    const index = makeIndex()
    // All points same level -> should merge to 1 segment
    const probed = makeProbed(['moderate', 'moderate', 'moderate'])
    const overlay = await mapConditions({ routeSnapshot: snapshot, routeIndex: index, probed })
    const leg = overlay.byLeg[0]
    expect(leg.segments.length).toBe(1)
  })

  it('throws on empty probed', async () => {
    const snapshot = makeSnapshot()
    const index = makeIndex()
    await expect(
      mapConditions({ routeSnapshot: snapshot, routeIndex: index, probed: [] })
    ).rejects.toThrow()
  })
})
