import type { RouteSnapshot } from '../../../../../models/saved-routes'
import { computeRouteIndex } from '../compute-route-index'

const makeSnapshot = (legsCount: number): RouteSnapshot => {
  const legs = Array.from({ length: legsCount }).map((_, idx) => ({
    legIndex: idx,
    start: { lat: 37 + idx * 0.01, lng: -122 - idx * 0.01 },
    end: { lat: 37 + (idx + 1) * 0.01, lng: -122 - (idx + 1) * 0.01 },
    distanceMeters: 10_000,
    durationSeconds: 600,
    geometry: {
      format: 'polyline' as const,
      encoding: `enc${idx}`,
      precision: 5,
      value: `val${idx}`,
    },
  }))

  return {
    provider: 'mock',
    bounds: { north: 38, south: 36, east: -121, west: -123 },
    origin: { lat: 37, lng: -122 },
    destination: { lat: 37.1, lng: -122.1 },
    waypoints: [],
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'enc-overview',
      precision: 5,
      value: 'val-overview',
    },
    legs,
    annotations: [],
    overlays: {},
  }
}

describe('computeRouteIndex', () => {
  it('produces stable fingerprint for same snapshot', () => {
    const snapshot = makeSnapshot(2)
    const a = computeRouteIndex(snapshot)
    const b = computeRouteIndex(snapshot)
    expect(a.routeFingerprint).toBe(b.routeFingerprint)
  })

  it('returns bounded, monotonic sampled points with endpoints', () => {
    const snapshot = makeSnapshot(3)
    const index = computeRouteIndex(snapshot)
    expect(index.sampledPoints.length).toBeGreaterThan(0)
    expect(index.sampledPoints.length).toBeLessThanOrEqual(200)
    expect(index.sampledPoints[0].distanceFromStartMeters).toBe(0)
    for (let i = 1; i < index.sampledPoints.length; i += 1) {
      expect(index.sampledPoints[i].distanceFromStartMeters).toBeGreaterThanOrEqual(
        index.sampledPoints[i - 1].distanceFromStartMeters
      )
    }
    const totalDistance = snapshot.legs.reduce((sum, l) => sum + l.distanceMeters, 0)
    const last = index.sampledPoints[index.sampledPoints.length - 1]
    expect(last.distanceFromStartMeters).toBeCloseTo(totalDistance)
  })

  it('handles no legs by returning origin-only point', () => {
    const snapshot = makeSnapshot(0)
    const index = computeRouteIndex(snapshot)
    expect(index.sampledPoints.length).toBe(1)
    expect(index.sampledPoints[0].lat).toBe(snapshot.origin.lat)
    expect(index.sampledPoints[0].distanceFromStartMeters).toBe(0)
  })
})
