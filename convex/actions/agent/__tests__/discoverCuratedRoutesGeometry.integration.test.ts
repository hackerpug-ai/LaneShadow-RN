/**
 * Integration test for DATA-011 AC-3: discoverCuratedRoutes returns the real line
 * when present, falls back to centroid when absent.
 *
 * Tests the `buildCuratedMapGeometry` function that discoverCuratedRoutes uses to
 * build the map geometry for each curated route option.
 *
 * Run: pnpm test convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts
 */

import polyline from '@mapbox/polyline'
import { describe, expect, it } from 'vitest'
import { buildCuratedMapGeometry, encodeCentroidToPolyline } from '../tools/discoverCuratedRoutes'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A curated route doc (lean fields only, as returned by listCuratedRoutes).
 */
const GENERATED_ROUTE = {
  routeId: 'brp-nc',
  name: 'Blue Ridge Parkway',
  centroidLat: 36.1,
  centroidLng: -81.8,
  boundsNeLat: 36.6,
  boundsNeLng: -75.5,
  boundsSwLat: 35.5,
  boundsSwLng: -83.5,
  geometryStatus: 'generated',
}

const UNRESOLVED_ROUTE = {
  routeId: 'fake-xyz',
  name: 'Xyzzy Nonexistent Highway 9999',
  centroidLat: 35.0,
  centroidLng: -80.0,
  boundsNeLat: 36.0,
  boundsNeLng: -79.0,
  boundsSwLat: 34.0,
  boundsSwLng: -81.0,
  geometryStatus: 'unresolved',
}

/**
 * Simulated geometry from the curated_route_geometry side table
 * for the generated route — multipolyline format (Overpass segments).
 */
const GENERATED_GEOMETRY = {
  format: 'multipolyline' as const,
  precision: 5,
  segments: [
    polyline.encode([
      [35.6, -83.3],
      [35.65, -83.2],
      [35.7, -83.1],
      [35.75, -83.0],
      [35.8, -82.9],
      [35.85, -82.8],
      [35.9, -82.7],
    ] as [number, number][]),
    polyline.encode([
      [35.9, -82.7],
      [36.0, -82.0],
      [36.05, -81.5],
      [36.1, -81.0],
    ] as [number, number][]),
  ],
  value: null,
}

/**
 * Simulated single-line geometry (legacy format).
 */
const SINGLE_LINE_GEOMETRY = {
  format: 'polyline' as const,
  precision: 5,
  value: polyline.encode([
    [35.5, -83.5],
    [35.8, -82.9],
    [36.1, -81.0],
    [36.4, -78.0],
    [36.55, -75.6],
  ] as [number, number][]),
  segments: null,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('discoverCuratedRoutes geometry: buildCuratedMapGeometry', () => {
  /**
   * AC-3: the generated route's overviewGeometry decodes to > 1 coordinate.
   * When real geometry from the side table is present, buildCuratedMapGeometry
   * returns it as overviewGeometry (+ overviewSegments for multipolyline).
   */
  it('returnsRealLineWhenPresentElseCentroidFallback: generated route decodes to >1 coordinate', () => {
    const result = buildCuratedMapGeometry(GENERATED_ROUTE, GENERATED_GEOMETRY)

    // The overviewGeometry should be a polyline that decodes to >1 coordinate
    const decoded = polyline.decode(result.overviewGeometry, 5) as [number, number][]
    expect(decoded.length).toBeGreaterThan(1)

    // overviewSegments should be present for multipolyline
    expect(result.overviewSegments).toBeDefined()
    expect(result.overviewSegments!.length).toBe(2)

    // Bounds should be derived from the actual geometry (from decoded segments),
    // not the ±0.5° centroid fallback. Verify that the bounds reflect the decoded
    // coordinates from the generated geometry, not just centroid±0.5.
    const allDecodedCoords: [number, number][] = []
    for (const seg of GENERATED_GEOMETRY.segments) {
      allDecodedCoords.push(...(polyline.decode(seg, 5) as [number, number][]))
    }
    const expectedNorth = Math.max(...allDecodedCoords.map((c) => c[0]))
    const expectedSouth = Math.min(...allDecodedCoords.map((c) => c[0]))
    const expectedEast = Math.max(...allDecodedCoords.map((c) => c[1]))
    const expectedWest = Math.min(...allDecodedCoords.map((c) => c[1]))

    expect(result.bounds.north).toBeCloseTo(expectedNorth, 3)
    expect(result.bounds.south).toBeCloseTo(expectedSouth, 3)
    expect(result.bounds.east).toBeCloseTo(expectedEast, 3)
    expect(result.bounds.west).toBeCloseTo(expectedWest, 3)
  })

  /**
   * AC-3: the unresolved route falls back to the centroid encode (current behavior).
   * When no geometry is present (null), buildCuratedMapGeometry returns a
   * single-point centroid polyline.
   */
  it('returnsRealLineWhenPresentElseCentroidFallback: unresolved route falls back to centroid', () => {
    const result = buildCuratedMapGeometry(UNRESOLVED_ROUTE, null)

    // overviewGeometry should be the centroid single-point encode
    const decoded = polyline.decode(result.overviewGeometry, 5) as [number, number][]
    expect(decoded.length).toBe(1) // single point
    expect(decoded[0][0]).toBeCloseTo(UNRESOLVED_ROUTE.centroidLat, 3)
    expect(decoded[0][1]).toBeCloseTo(UNRESOLVED_ROUTE.centroidLng, 3)

    // overviewSegments should be absent for centroid fallback
    expect(result.overviewSegments).toBeUndefined()

    // Bounds should be the ±0.5° centroid fallback
    expect(result.bounds.north).toBeCloseTo(UNRESOLVED_ROUTE.centroidLat + 0.5, 3)
    expect(result.bounds.south).toBeCloseTo(UNRESOLVED_ROUTE.centroidLat - 0.5, 3)
  })

  /**
   * AC-3: neither path crashes — the generated route works, the unresolved
   * route works, and the function handles both gracefully.
   */
  it('returnsRealLineWhenPresentElseCentroidFallback: neither path crashes', () => {
    // Generated route with geometry
    expect(() => buildCuratedMapGeometry(GENERATED_ROUTE, GENERATED_GEOMETRY)).not.toThrow()

    // Unresolved route without geometry
    expect(() => buildCuratedMapGeometry(UNRESOLVED_ROUTE, null)).not.toThrow()

    // Undefined geometry (edge case)
    expect(() => buildCuratedMapGeometry(UNRESOLVED_ROUTE, undefined)).not.toThrow()
  })

  /**
   * Single-line (legacy) geometry also works — decodes to >1 coordinate
   * and produces correct bounds.
   */
  it('handles single-line polyline geometry correctly', () => {
    const result = buildCuratedMapGeometry(GENERATED_ROUTE, SINGLE_LINE_GEOMETRY)

    const decoded = polyline.decode(result.overviewGeometry, 5) as [number, number][]
    expect(decoded.length).toBeGreaterThan(1)

    // No overviewSegments for single-line format
    expect(result.overviewSegments).toBeUndefined()

    // Bounds derived from the decoded polyline
    expect(result.bounds.north).toBeGreaterThan(35)
    expect(result.bounds.south).toBeLessThan(37)
  })

  /**
   * Edge case: geometry with segments but all segments decode to <2 points
   * should fall back to centroid (defensive).
   */
  it('falls back to centroid when geometry segments are empty or too short', () => {
    const badGeometry = {
      format: 'multipolyline' as const,
      precision: 5,
      segments: [polyline.encode([[36.1, -81.8]] as [number, number][])], // single-point segment
      value: null,
    }

    const result = buildCuratedMapGeometry(GENERATED_ROUTE, badGeometry)

    // Falls back to centroid because total pts < 2
    const decoded = polyline.decode(result.overviewGeometry, 5) as [number, number][]
    expect(decoded.length).toBe(1) // centroid fallback
  })
})

describe('discoverCuratedRoutes geometry: encodeCentroidToPolyline', () => {
  it('encodes a single centroid point as a polyline', () => {
    const encoded = encodeCentroidToPolyline(36.1, -81.8)
    const decoded = polyline.decode(encoded, 5) as [number, number][]

    expect(decoded.length).toBe(1)
    expect(decoded[0][0]).toBeCloseTo(36.1, 3)
    expect(decoded[0][1]).toBeCloseTo(-81.8, 3)
  })
})
