import { describe, expect, it, vi } from 'vitest'

vi.mock('../_generated/server', () => ({
  query: (def: unknown) => def,
  internalQuery: (def: unknown) => def,
}))

vi.mock('../geospatialIndex', () => ({
  geospatial: {},
}))

vi.mock('../guards', () => ({
  requireIdentity: vi.fn(),
}))

import {
  isWithinNearestCuratedRouteDistance,
  MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI,
} from '../curatedRoutes'

describe('curatedRoutes nearest radius', () => {
  it('keeps nearest curated suggestions within 20 miles of the rider', () => {
    expect(MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI).toBe(20)
    expect(isWithinNearestCuratedRouteDistance(0)).toBe(true)
    expect(isWithinNearestCuratedRouteDistance(19.99)).toBe(true)
    expect(isWithinNearestCuratedRouteDistance(20)).toBe(true)
    expect(isWithinNearestCuratedRouteDistance(20.01)).toBe(false)
    expect(isWithinNearestCuratedRouteDistance(undefined)).toBe(false)
  })
})
