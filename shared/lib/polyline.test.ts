import { describe, expect, it } from 'vitest'
import {
  computeCumulativeDistances,
  decodePolylineGeometry,
  slicePolylineByMeters,
} from './polyline'

describe('polyline utils', () => {
  it('decodes encoded polyline geometry with expected coordinates', () => {
    const geometry = {
      format: 'polyline' as const,
      encoding: 'polyline' as const,
      precision: 5,
      value: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    }

    const coords = decodePolylineGeometry(geometry)

    expect(coords).toHaveLength(3)
    expect(coords[0].latitude).toBeCloseTo(38.5, 3)
    expect(coords[0].longitude).toBeCloseTo(-120.2, 3)
    expect(coords[2].latitude).toBeCloseTo(43.252, 3)
    expect(coords[2].longitude).toBeCloseTo(-126.453, 3)
  })

  it('slices a polyline by meters with interpolation across segments', () => {
    const coords = [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0.001 },
      { latitude: 0, longitude: 0.002 },
    ]
    const distances = computeCumulativeDistances(coords)

    const sliced = slicePolylineByMeters(coords, distances, 50, 150)

    expect(sliced).toHaveLength(3)
    expect(sliced[0].longitude).toBeGreaterThan(0)
    expect(sliced[0].longitude).toBeCloseTo(0.00045, 2)
    expect(sliced[2].longitude).toBeCloseTo(0.00135, 2)
    expect(sliced[0].longitude).toBeLessThan(sliced[1].longitude)
    expect(sliced[1].longitude).toBeLessThan(sliced[2].longitude)
  })
})
