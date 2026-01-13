import type { RouteIndex, RouteSnapshot } from '../../../../../models/saved-routes'
import { mapConditions } from '../mapConditions'

const snapshot: RouteSnapshot = {
  provider: 'mock',
  bounds: { north: 1, south: 0, east: 1, west: 0 },
  origin: { lat: 0, lng: 0 },
  destination: { lat: 1, lng: 1 },
  waypoints: [],
  overviewGeometry: { format: 'polyline', encoding: 'x', precision: 5, value: 'x' },
  legs: [
    {
      legIndex: 0,
      start: { lat: 0, lng: 0 },
      end: { lat: 1, lng: 1 },
      distanceMeters: 1000,
      durationSeconds: 600,
      geometry: { format: 'polyline', encoding: 'x', precision: 5, value: 'x' },
    },
  ],
  annotations: [],
  overlays: {},
}

const index: RouteIndex = {
  routeFingerprint: 'fnv1a:abc',
  sampledPoints: [
    { lat: 0, lng: 0, distanceFromStartMeters: 0 },
    { lat: 1, lng: 1, distanceFromStartMeters: 1000 },
  ],
}

describe('mapConditions reliability', () => {
  it('throws deterministic error code when no probed points are provided', async () => {
    await expect(
      mapConditions({ routeSnapshot: snapshot, routeIndex: index, probed: [] })
    ).rejects.toThrow('CONDITIONS_LOOKUP_FAILED')
  })
})
