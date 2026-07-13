/**
 * REDHAT-RH001 — Regression test: injected queryFn seam in
 * createSearchCuratedRoutes.
 *
 * The deployed Convex action passes a `ctx.runQuery` function as the queryFn
 * to `createSearchCuratedRoutes`, bypassing the CLI bridge (`npx convex run`)
 * that is unavailable inside the Convex 'use node' sandbox. These tests prove
 * that the seam works end-to-end: deterministic mock route data flows through
 * the injected function into the tool's filter / sort / map pipeline, producing
 * real route-shaped output — NOT the CLI fallback, NOT hardcoded constants.
 *
 * This is a pure unit test (zero I/O): the injected queryFn is deterministic,
 * no `npx convex run` round-trip, no geocoder, no Convex runtime. It exercises
 * only the execute() logic that lives between the query seam and the output
 * contract.
 */

import { describe, expect, it } from 'vitest'
import { createSearchCuratedRoutes, type QueryNearestCuratedRoutesFn } from '../spikeTools'

describe('searchCuratedRoutes injected query seam (REDHAT-RH001)', () => {
  it('returns real route rows from the injected queryFn (not CLI fallback)', async () => {
    // Deterministic queryFn that returns known route data
    const mockRoutes = [
      { routeId: 'test-001', name: 'Ogden Canyon', compositeScore: 8.5, distanceMi: 12.3 },
      { routeId: 'test-002', name: 'Monte Cristo', compositeScore: 7.2, distanceMi: 35.1 },
    ]
    const queryFn: QueryNearestCuratedRoutesFn = async () => mockRoutes

    const tool = createSearchCuratedRoutes(queryFn)
    const result = await tool.execute(
      { center: { lat: 41.22, lng: -111.97 }, radiusMi: 50 },
      {} as any, // Mastra tool context (not used by this tool)
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.routes).toHaveLength(2)
      expect(result.routes[0].routeId).toBe('test-001')
      expect(result.routes[0].name).toBe('Ogden Canyon')
      expect(result.routes[0].distanceMi).toBe(12.3)
      expect(result.routes[0].riderReady).toBe(true)
    }
  })

  it('filters routes outside radiusMi', async () => {
    const mockRoutes = [
      { routeId: 'near', name: 'Near Route', compositeScore: 9, distanceMi: 10 },
      { routeId: 'far', name: 'Far Route', compositeScore: 8, distanceMi: 100 },
    ]
    const queryFn: QueryNearestCuratedRoutesFn = async () => mockRoutes
    const tool = createSearchCuratedRoutes(queryFn)
    const result = await tool.execute(
      { center: { lat: 41.22, lng: -111.97 }, radiusMi: 50 },
      {} as any,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.routes).toHaveLength(1)
      expect(result.routes[0].routeId).toBe('near')
    }
  })

  it('sorts routes nearest-first', async () => {
    const mockRoutes = [
      { routeId: 'far', name: 'Far', compositeScore: 9, distanceMi: 40 },
      { routeId: 'near', name: 'Near', compositeScore: 7, distanceMi: 5 },
    ]
    const queryFn: QueryNearestCuratedRoutesFn = async () => mockRoutes
    const tool = createSearchCuratedRoutes(queryFn)
    const result = await tool.execute(
      { center: { lat: 41.22, lng: -111.97 }, radiusMi: 50 },
      {} as any,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.routes[0].routeId).toBe('near')
      expect(result.routes[1].routeId).toBe('far')
    }
  })

  it('returns query_failed when injected queryFn throws', async () => {
    const queryFn: QueryNearestCuratedRoutesFn = async () => {
      throw new Error('ctx.runQuery failed: connection refused')
    }
    const tool = createSearchCuratedRoutes(queryFn)
    const result = await tool.execute(
      { center: { lat: 41.22, lng: -111.97 }, radiusMi: 50 },
      {} as any,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errorCode).toBe('query_failed')
      expect(result.message).toContain('connection refused')
    }
  })

  it('returns no_results when injected queryFn returns empty array', async () => {
    const queryFn: QueryNearestCuratedRoutesFn = async () => []
    const tool = createSearchCuratedRoutes(queryFn)
    const result = await tool.execute(
      { center: { lat: 41.22, lng: -111.97 }, radiusMi: 50 },
      {} as any,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errorCode).toBe('no_results')
    }
  })

  it('returns center_required when center is absent', async () => {
    const queryFn: QueryNearestCuratedRoutesFn = async () => []
    const tool = createSearchCuratedRoutes(queryFn)
    const result = await tool.execute({ radiusMi: 50 }, {} as any)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errorCode).toBe('center_required')
    }
  })
})
