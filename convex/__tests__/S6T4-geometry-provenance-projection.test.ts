/**
 * S6-T4 / UC-SURF-05 — geometryProvenance projection through the real
 * getCuratedRouteDetail build path (`buildRouteDetail`).
 *
 * F1 fix: this is NOT a UI mock of the query return. It imports the real
 * `buildRouteDetail` from convex/curatedRoutes.ts and seeds route-shaped
 * fixtures with every geometryProvenance variant. If the projection line is
 * dropped, these assertions FAIL.
 *
 * TEST_TIER: unit (pure projection — no I/O; imports production build path)
 * VERIFICATION_SERVICE: vitest
 * FLOW_REF: UC-SURF-05
 * UNIT_TEST_JUSTIFIED: pure projection over a Doc-shaped input; live Convex
 *   deployment is not available in this worktree (no CONVEX_DEPLOYMENT). The
 *   production transform is imported directly so a dropped field cannot pass.
 */

import { describe, expect, it, vi } from 'vitest'

// Mirror curatedRoutes.test.ts boundary stubs so the production module loads.
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

import type { Doc, Id } from '../_generated/dataModel'
import { buildRouteDetail } from '../curatedRoutes'

type Provenance = 'scraped_promoted' | 'ai_reconstructed' | 'name_routed'

/** Minimal curated_routes Doc for projection (only fields buildRouteDetail reads). */
function seedRoute(
  overrides: Partial<Doc<'curated_routes'>> & {
    geometryProvenance?: Provenance | undefined
  } = {},
): Doc<'curated_routes'> {
  const base = {
    _id: 'jd7s6t4projection000000001' as Id<'curated_routes'>,
    _creationTime: 1,
    routeId: 'test:s6t4-provenance-projection',
    name: 'S6-T4 Projection Seed',
    state: 'Tennessee',
    source: 'editorial' as const,
    primaryArchetype: 'scenic' as const,
    secondaryTags: [],
    oneLiner: '',
    badges: [],
    season: 'year_round' as const,
    contentVersion: 1,
    seededAt: 1,
    centroidLat: 35.4,
    centroidLng: -84.1,
    boundsNeLat: 35.6,
    boundsNeLng: -83.9,
    boundsSwLat: 35.2,
    boundsSwLng: -84.3,
    compositeScore: 81,
    curvatureScore: 80,
    scenicScore: 90,
    technicalScore: 70,
    trafficScore: 30,
    remotenessScore: 60,
    lengthMiles: 47,
    summary: 'Projection seed summary',
    routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    geometryStatus: 'generated' as const,
    riderReady: true,
    ...overrides,
  }
  return base as Doc<'curated_routes'>
}

describe('S6-T4: getCuratedRouteDetail geometryProvenance projection (buildRouteDetail)', () => {
  it('AC-projection: projects ai_reconstructed from rest → detail.geometryProvenance', () => {
    const route = seedRoute({
      name: 'Von Hoak Loop',
      geometryProvenance: 'ai_reconstructed',
    })

    const detail = buildRouteDetail(route)

    // MUST_OBSERVE — exact rest value; cannot pass if projection dropped
    expect(detail.geometryProvenance).toBe('ai_reconstructed')
    expect(detail.name).toBe('Von Hoak Loop')
    // MUST_NOT_OBSERVE — wrong provenance / silent drop
    expect(detail.geometryProvenance).not.toBe('name_routed')
    expect(detail.geometryProvenance).not.toBe('scraped_promoted')
    expect(detail.geometryProvenance).not.toBeUndefined()
    expect(detail.geometryProvenance).not.toBeNull()
  })

  it('AC-projection: projects name_routed from rest → detail.geometryProvenance', () => {
    const route = seedRoute({
      name: 'Blue Ridge Parkway Spur',
      geometryProvenance: 'name_routed',
    })

    const detail = buildRouteDetail(route)

    expect(detail.geometryProvenance).toBe('name_routed')
    expect(detail.name).toBe('Blue Ridge Parkway Spur')
    expect(detail.geometryProvenance).not.toBe('ai_reconstructed')
    expect(detail.geometryProvenance).not.toBeUndefined()
  })

  it('AC-projection: projects scraped_promoted (no caption branch, field still present)', () => {
    const route = seedRoute({
      name: 'Cherohala Skyway',
      geometryProvenance: 'scraped_promoted',
    })

    const detail = buildRouteDetail(route)

    // Projection still surfaces the field so the leaf can branch on it.
    expect(detail.geometryProvenance).toBe('scraped_promoted')
    expect(detail.name).toBe('Cherohala Skyway')
  })

  it('AC-projection: pre-provenance (unset) remains undefined after projection', () => {
    const route = seedRoute({
      name: 'Legacy Ridge Run',
      // geometryProvenance intentionally omitted
    })
    // Ensure we did not accidentally set it.
    expect(route.geometryProvenance).toBeUndefined()

    const detail = buildRouteDetail(route)

    expect(detail.name).toBe('Legacy Ridge Run')
    // Unset rest → unset detail (not coerced to null / scraped_promoted)
    expect(detail.geometryProvenance).toBeUndefined()
  })

  it('AC-projection: negative control — would fail if projection line is dropped', () => {
    // Structural proof: the returned object must own the key when rest has it.
    const route = seedRoute({ geometryProvenance: 'ai_reconstructed' })
    const detail = buildRouteDetail(route)

    expect(
      Object.hasOwn(detail, 'geometryProvenance'),
      'detail must own geometryProvenance when rest has it (projection not dropped)',
    ).toBe(true)
    expect(detail).toEqual(
      expect.objectContaining({
        geometryProvenance: 'ai_reconstructed',
        routeId: route.routeId,
      }),
    )
  })
})
