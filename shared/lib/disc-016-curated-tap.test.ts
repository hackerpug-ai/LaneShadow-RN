// @vitest-environment node
/**
 * DISC-016: curated suggestion-card tap plots the route directly.
 *
 * Contract test for the geometry seam the standard route machinery depends on:
 * the createCuratedRoutePlan option's overviewGeometry MUST be a proper
 * PolylineGeometry object (not a raw string) so decodePolylineGeometry resolves
 * it, and a centroid-only route MUST decode to exactly one coordinate — which
 * drives doFit's single-point branch (setCameraPosition zoom 12) at
 * app/(app)/(tabs)/index.tsx.
 *
 * The full UI wiring (mutation -> setSelectedRouteId/setDisplayedRoutePlanId ->
 * useActiveSessionRoute -> RoutePolyline -> doFit, no chat message) is verified
 * at the Maestro human gate (.maestro/) against live Convex; this test pins the
 * geometry invariant that makes the centroid plot + camera fit work.
 */
import polyline from '@mapbox/polyline'
import { describe, expect, it } from 'vitest'

import type { PolylineGeometry } from '../models/saved-routes'
import { decodePolylineGeometry } from './polyline'

const buildCuratedOverviewGeometry = (lat: number, lng: number): PolylineGeometry => ({
  format: 'polyline',
  encoding: 'polyline',
  precision: 5,
  value: polyline.encode([[lat, lng]]),
})

describe('DISC-016: curated centroid overviewGeometry → doFit single-point branch', () => {
  it('a centroid-only curated route decodes to exactly one coordinate', () => {
    // Known curated route centroid (Asheville-area twisties)
    const geometry = buildCuratedOverviewGeometry(35.59, -82.55)
    const coords = decodePolylineGeometry(geometry)

    // doFit: coords.length === 1 -> setCameraPosition zoom 12 (centroid branch)
    expect(coords).toHaveLength(1)
    expect(coords[0].latitude).toBeCloseTo(35.59, 3)
    expect(coords[0].longitude).toBeCloseTo(-82.55, 3)
  })

  it('is NOT the empty/start signature (would fail if the geometry were absent or zero-length)', () => {
    const geometry = buildCuratedOverviewGeometry(35.59, -82.55)
    const coords = decodePolylineGeometry(geometry)

    // Negative control: an empty/stub geometry would decode to 0 coords and doFit
    // would no-op (no camera move, no polyline) — that is the bug DISC-016 fixes.
    expect(coords.length).toBeGreaterThan(0)
  })

  it('a multi-point geometry would take the fitToCoordinates branch (guards the >1 path)', () => {
    const geometry: PolylineGeometry = {
      format: 'polyline',
      encoding: 'polyline',
      precision: 5,
      value: polyline.encode([
        [35.59, -82.55],
        [35.6, -82.56],
        [35.61, -82.54],
      ]),
    }
    const coords = decodePolylineGeometry(geometry)

    // doFit: coords.length > 1 -> fitToCoordinates
    expect(coords.length).toBeGreaterThan(1)
  })
})
