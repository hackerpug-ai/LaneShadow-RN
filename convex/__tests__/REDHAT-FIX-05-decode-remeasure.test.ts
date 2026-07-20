/**
 * REDHAT-FIX-05 [UNIT]: REVIEW approval must DECODE the candidate geometry and
 * re-derive pointCount / routedMiles / ratio from the real polyline, NOT trust
 * the stored verification record. A stale or attacker-influenced stored record
 * must not be able to promote a geometry whose actual points/length fail the gate.
 *
 * Fresh report finding (CRITICAL): approveDisposition read geom.verification
 * fields (pointCount/routedMiles/ratio/anchorCount) and never decoded `geometry`.
 */

import polyline from '@mapbox/polyline'
import { describe, expect, it } from 'vitest'

import { measureCandidateGeometry } from '../reviewQueue'

/** Build a polyline of `n` points walking north along a meridian, ~`milesPerStep` mi each. */
function meridianPolyline(n: number, milesPerStep: number, startLat = 34.0, lng = -119.0): string {
  const dLat = milesPerStep / 69.0 // ~69 miles per degree of latitude
  const coords: [number, number][] = []
  for (let i = 0; i < n; i++) coords.push([startLat + i * dLat, lng])
  return polyline.encode(coords)
}

describe('measureCandidateGeometry (REDHAT-FIX-05 decode + re-measure)', () => {
  it('decodes the real pointCount from the polyline (ignores any stored number)', () => {
    const encoded = meridianPolyline(12, 5) // 12 points, ~5mi steps
    const m = measureCandidateGeometry(encoded)
    expect(m.pointCount).toBe(12)
    expect(m.routedMiles).toBeGreaterThan(50) // ~55 mi
    expect(m.routedMiles).toBeLessThan(70)
  })

  it('measures routedMiles as the cumulative polyline length, not a stored value', () => {
    const encoded = meridianPolyline(5, 10) // 5 points, ~10mi steps → ~40mi
    const m = measureCandidateGeometry(encoded)
    expect(m.pointCount).toBe(5)
    expect(m.routedMiles).toBeGreaterThan(35)
    expect(m.routedMiles).toBeLessThan(45)
  })

  it('returns pointCount 0 for an empty/undecodable geometry (fails degenerate gate)', () => {
    const m = measureCandidateGeometry('')
    expect(m.pointCount).toBe(0)
    expect(m.routedMiles).toBe(0)
  })

  it('a degenerate 2-point geometry measures few points even if a stored record claimed 80', () => {
    // The whole point of FIX-05: the REAL polyline has 2 points; a stored
    // verification record claiming pointCount=80 must be ignored.
    const degenerate = polyline.encode([
      [34.0, -119.0],
      [34.05, -119.0],
    ])
    const m = measureCandidateGeometry(degenerate)
    expect(m.pointCount).toBe(2) // NOT 80
    expect(m.routedMiles).toBeLessThan(5)
  })

  it('accepts a {value, precision} geometry object (stored routeGeometry shape)', () => {
    const encoded = meridianPolyline(8, 5)
    const m = measureCandidateGeometry({ value: encoded, precision: 5 })
    expect(m.pointCount).toBe(8)
  })
})
