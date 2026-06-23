/**
 * Integration test for DATA-011 AC-3: discoverCuratedRoutes returns the real line
 * when present, falls back to centroid when absent.
 *
 * Tests the `buildCuratedMapGeometry` function that discoverCuratedRoutes uses to
 * build the map geometry for each curated route option. This function reads the
 * generated geometry from the side table when present and falls back to the
 * centroid encode when absent.
 *
 * Run: pnpm test convex/actions/agent/__tests__/discoverCuratedRoutesGeometry.integration.test.ts
 */

import polyline from '@mapbox/polyline'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildCuratedMapGeometry, encodeCentroidToPolyline } from '../tools/discoverCuratedRoutes'

// ---------------------------------------------------------------------------
// Check whether real API keys are available for end-to-end verification
// ---------------------------------------------------------------------------

let hasRealGoogleKey = false

beforeAll(() => {
  const key = process.env.GOOGLE_MAPS_API_KEY
  hasRealGoogleKey = !!key && key !== 'test-google-key'
})

// ---------------------------------------------------------------------------
// Fixtures — curated route docs (as returned by listCuratedRoutes)
// ---------------------------------------------------------------------------

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
 * Simulated Google Routes geometry (single-line `polyline` format, as produced
 * by the new Nominatim + Google Routes generation pipeline).
 */
const GENERATED_GEOMETRY_POLYLINE = {
  format: 'polyline' as const,
  encoding: 'google_encoded_polyline',
  precision: 5,
  value: polyline.encode([
    [35.6, -83.3],
    [35.8, -82.9],
    [36.0, -82.0],
    [36.1, -81.0],
    [36.3, -79.0],
    [36.55, -75.6],
  ] as [number, number][]),
}

/**
 * Legacy Overpass geometry (multipolyline format, still supported by the reader).
 */
const GENERATED_GEOMETRY_MULTIPOLYLINE = {
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DATA-011 AC-3: discoverCuratedRoutes geometry reader', () => {
  /**
   * AC-3: the generated route's overviewGeometry decodes to > 1 coordinate.
   * When real geometry from the side table is present (Google Routes polyline format),
   * buildCuratedMapGeometry returns it as overviewGeometry with real bounds.
   */
  it('returnsRealLineWhenPresentElseCentroidFallback: Google Routes polyline format', () => {
    const result = buildCuratedMapGeometry(GENERATED_ROUTE, GENERATED_GEOMETRY_POLYLINE)

    // The overviewGeometry should be a polyline that decodes to >1 coordinate
    const decoded = polyline.decode(result.overviewGeometry, 5) as [number, number][]
    expect(decoded.length).toBeGreaterThan(1)

    // overviewSegments should be absent for single-line polyline format
    expect(result.overviewSegments).toBeUndefined()

    // Bounds should be derived from the actual geometry
    const allDecodedCoords = polyline.decode(GENERATED_GEOMETRY_POLYLINE.value!, 5) as [
      number,
      number,
    ][]
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
   * AC-3: legacy multipolyline format also works (backward compatibility).
   */
  it('returnsRealLineWhenPresentElseCentroidFallback: legacy multipolyline format', () => {
    const result = buildCuratedMapGeometry(GENERATED_ROUTE, GENERATED_GEOMETRY_MULTIPOLYLINE)

    // The overviewGeometry should decode to >1 coordinate
    const decoded = polyline.decode(result.overviewGeometry, 5) as [number, number][]
    expect(decoded.length).toBeGreaterThan(1)

    // overviewSegments should be present for multipolyline format
    expect(result.overviewSegments).toBeDefined()
    expect(result.overviewSegments!.length).toBe(2)

    // Bounds should be derived from the decoded segments
    expect(result.bounds.north).toBeGreaterThan(35)
    expect(result.bounds.south).toBeLessThan(36)
    expect(result.bounds.east).toBeGreaterThan(-84)
    expect(result.bounds.west).toBeLessThan(-82)
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
    expect(decoded.length).toBe(1) // single point (centroid fallback)
    expect(decoded[0][0]).toBeCloseTo(UNRESOLVED_ROUTE.centroidLat, 3)
    expect(decoded[0][1]).toBeCloseTo(UNRESOLVED_ROUTE.centroidLng, 3)

    // overviewSegments should be absent for centroid fallback
    expect(result.overviewSegments).toBeUndefined()

    // Bounds should be the centroid ±0.5° fallback
    expect(result.bounds.north).toBeCloseTo(UNRESOLVED_ROUTE.centroidLat + 0.5, 3)
    expect(result.bounds.south).toBeCloseTo(UNRESOLVED_ROUTE.centroidLat - 0.5, 3)
  })

  /**
   * AC-3: neither path crashes — the generated route works, the unresolved
   * route works, and the function handles both gracefully.
   */
  it('returnsRealLineWhenPresentElseCentroidFallback: neither path crashes', () => {
    // Generated route with polyline geometry
    expect(() =>
      buildCuratedMapGeometry(GENERATED_ROUTE, GENERATED_GEOMETRY_POLYLINE),
    ).not.toThrow()

    // Generated route with multipolyline geometry
    expect(() =>
      buildCuratedMapGeometry(GENERATED_ROUTE, GENERATED_GEOMETRY_MULTIPOLYLINE),
    ).not.toThrow()

    // Unresolved route without geometry
    expect(() => buildCuratedMapGeometry(UNRESOLVED_ROUTE, null)).not.toThrow()

    // Undefined geometry (edge case)
    expect(() => buildCuratedMapGeometry(UNRESOLVED_ROUTE, undefined)).not.toThrow()
  })

  /**
   * Edge case: geometry with value but decodes to <2 points should fall back
   * to centroid (defensive — a single-point polyline is not a real line).
   */
  it('falls back to centroid when geometry value decodes to <2 points', () => {
    const badGeometry = {
      format: 'polyline' as const,
      encoding: 'google_encoded_polyline',
      precision: 5,
      value: polyline.encode([[36.1, -81.8]] as [number, number][]), // single-point
    }

    const result = buildCuratedMapGeometry(GENERATED_ROUTE, badGeometry)

    // Falls back to centroid because decoded points < 2
    const decoded = polyline.decode(result.overviewGeometry, 5) as [number, number][]
    expect(decoded.length).toBe(1) // centroid fallback
  })

  /**
   * End-to-end verification: if we have a real Google API key, generate a real
   * polyline and verify the reader handles it correctly.
   */
  it('handles real Google Routes polyline end-to-end', async () => {
    if (!hasRealGoogleKey) return

    // Generate a real route polyline
    const apiKey = process.env.GOOGLE_MAPS_API_KEY!
    const body = {
      origin: { location: { latLng: { latitude: 35.5, longitude: -83.5 } } },
      destination: { location: { latLng: { latitude: 36.6, longitude: -75.5 } } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      polylineQuality: 'OVERVIEW',
      polylineEncoding: 'ENCODED_POLYLINE',
    }

    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) return

    const data = (await res.json()) as {
      routes?: Array<{ polyline?: { encodedPolyline?: string } }>
    }
    const encoded = data?.routes?.[0]?.polyline?.encodedPolyline
    if (!encoded) return

    // Feed the real polyline into buildCuratedMapGeometry
    const realGeometry = {
      format: 'polyline' as const,
      encoding: 'google_encoded_polyline',
      precision: 5,
      value: encoded,
    }

    const result = buildCuratedMapGeometry(GENERATED_ROUTE, realGeometry)
    const decoded = polyline.decode(result.overviewGeometry, 5) as [number, number][]

    // A real Google Routes polyline should decode to many coordinates
    expect(decoded.length).toBeGreaterThan(1)

    // Bounds should reflect the actual route area (NC/surrounding)
    expect(result.bounds.north).toBeGreaterThan(34)
    expect(result.bounds.south).toBeLessThan(38)
  }, 15_000)
})

describe('encodeCentroidToPolyline', () => {
  it('encodes a single centroid point as a polyline', () => {
    const encoded = encodeCentroidToPolyline(36.1, -81.8)
    const decoded = polyline.decode(encoded, 5) as [number, number][]

    expect(decoded.length).toBe(1)
    expect(decoded[0][0]).toBeCloseTo(36.1, 3)
    expect(decoded[0][1]).toBeCloseTo(-81.8, 3)
  })
})
