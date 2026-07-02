import { describe, expect, it } from 'vitest'
import { computeRouteMidpoint } from './route-midpoint'

describe('computeRouteMidpoint', () => {
  it('falls back to flat north/south/east/west bounds for centroid-only curated routes', () => {
    const midpoint = computeRouteMidpoint(
      {
        format: 'polyline',
        encoding: 'polyline',
        precision: 5,
        value: 'cgvyEpy~sN',
      },
      {
        north: 36.3361775,
        south: 35.3361775,
        east: -81.5829725,
        west: -82.5829725,
      },
    )

    expect(midpoint.latitude).toBeCloseTo(35.8361775, 6)
    expect(midpoint.longitude).toBeCloseTo(-82.0829725, 6)
  })
})
