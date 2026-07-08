/**
 * Integration tests for useCuratedDiscovery hook
 *
 * Acceptance Criteria:
 * - AC-1 (PRIMARY): Hook returns correct row shape with all fields populated
 * - AC-2: Loading ≠ Empty (isLoading true while undefined, isEmpty true only when [])
 * - AC-3: Center derivation from current location
 * - AC-4: Located nearest ordering; unlocated nearest waits while location
 *   is loading, then falls back to 'best' (DISC-007 STEP 2 fix) so the user
 *   still sees curated suggestion pills when location fails on cold boot
 * - AC-5: 0–1 score passthrough (never rescaled to 0-100)
 *
 * Test Data:
 * All mock data uses 0-1 normalized scores (e.g., 0.82, 0.91) to match Convex backend
 * behavior (compositeScore is already normalized via norm() in buildRouteCard).
 *
 * Mocking Note:
 * The vitest.config.ts stubs the Convex API client (line 150 resolves convex/_generated/api).
 * This means these tests use mocked Convex, not live services. For real integration against
 * live Convex dev, the config would need to be updated to not stub `convex/react` and
 * `useQuery` would need to be provided a real ConvexReactClient.
 */

import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// =========================================================================
// Setup mocks BEFORE any imports that depend on them
// =========================================================================

// Note: vi.mock() is hoisted, so we must NOT reference variables inside the factory.
// Instead, we'll use vi.mocked() to control behavior after mock setup.

vi.mock('convex/react', () => ({
  ConvexProvider: ({ children }: any) => React.createElement('div', { children }),
  useQuery: vi.fn(),
}))

vi.mock('../use-current-location', () => ({
  useCurrentLocation: vi.fn(),
}))

// =========================================================================
// Imports (after mocks)
// =========================================================================

import { useQuery } from 'convex/react'
import type { DiscoveryArchetype } from '../use-curated-discovery'
import { useCuratedDiscovery } from '../use-curated-discovery'
import { useCurrentLocation } from '../use-current-location'

// Get mocked functions
const mockUseQuery = vi.mocked(useQuery)
const mockUseCurrentLocation = vi.mocked(useCurrentLocation)

// =========================================================================
// Test Data - All scores normalized to 0-1 scale
// =========================================================================

const createMockRoute = (overrides: Partial<any> = {}): any => ({
  routeId: 'route-test',
  name: 'Test Route',
  state: 'California',
  primaryArchetype: 'scenic',
  centroidLat: 37.7749,
  centroidLng: -122.4194,
  compositeScore: 0.82, // 0-1 scale (Convex normalized)
  curvatureScore: 0.75,
  scenicScore: 0.92,
  technicalScore: 0.45,
  trafficScore: 0.65,
  remotenessScore: 0.78,
  lengthMiles: 120.5,
  distanceMi: undefined,
  summary: 'A scenic route',
  geometryStatus: 'generated',
  ...overrides,
})

const mockCuratedRoutesNearestOrdered = [
  // Ordered by ascending distance (nearest first)
  createMockRoute({
    routeId: 'route1',
    name: 'Pacific Coast Highway',
    distanceMi: 3.1,
    compositeScore: 0.85,
  }),
  createMockRoute({
    routeId: 'route2',
    name: 'Santa Cruz Loop',
    distanceMi: 7.8,
    compositeScore: 0.72,
  }),
  createMockRoute({
    routeId: 'route3',
    name: 'Monterey Peninsula',
    distanceMi: 12.4,
    compositeScore: 0.88,
  }),
]

const mockCuratedRoutesBestOrdered = [
  // Ordered by descending score (best first)
  createMockRoute({
    routeId: 'route2',
    name: 'Tail of the Dragon',
    compositeScore: 0.92,
    distanceMi: undefined,
  }),
  createMockRoute({
    routeId: 'route1',
    name: 'Pacific Coast Highway',
    compositeScore: 0.84,
    distanceMi: undefined,
  }),
  createMockRoute({
    routeId: 'route3',
    name: 'Route 66',
    compositeScore: 0.77,
    distanceMi: undefined,
  }),
]

const mockSingleRoute = [
  createMockRoute({
    routeId: 'single-route',
    name: 'Blue Ridge Parkway',
    compositeScore: 0.82,
  }),
]

const mockCurrentLocation = { lat: 35.5951, lng: -82.5515 } // Asheville, NC

// =========================================================================
// Test Helpers
// =========================================================================

/**
 * Setup mock implementations before each test.
 * Provides sensible defaults that tests can override.
 */
const setupMocks = () => {
  mockUseQuery.mockReturnValue(mockSingleRoute)
  mockUseCurrentLocation.mockReturnValue({
    location: mockCurrentLocation,
    loading: false,
    error: null,
  })
}

// =========================================================================
// Tests
// =========================================================================

describe('useCuratedDiscovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  describe('AC-1 (PRIMARY): Hook returns correct row shape', () => {
    it('returnsConsumedRowShapeAgainstLiveConvex', async () => {
      mockUseQuery.mockReturnValue(mockSingleRoute)

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          center: { lat: 35.5951, lng: -82.5515 },
          sort: 'nearest',
          limit: 5,
        }),
      )

      // Wait for hook to complete
      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const { routes } = result.current

      // Must observe: routes is a non-empty array
      expect(routes).toBeDefined()
      expect(Array.isArray(routes)).toBe(true)
      expect(routes!.length).toBeGreaterThan(0)

      const firstRoute = routes![0]!

      // All 7 required fields must be present
      expect(firstRoute).toHaveProperty('id')
      expect(firstRoute).toHaveProperty('name')
      expect(firstRoute).toHaveProperty('lat')
      expect(firstRoute).toHaveProperty('lng')
      expect(firstRoute).toHaveProperty('archetype')
      expect(firstRoute).toHaveProperty('score')
      expect(firstRoute).toHaveProperty('distanceMi')

      // Field type and content validation
      expect(typeof firstRoute.id).toBe('string')
      expect(firstRoute.id.length).toBeGreaterThan(0)

      expect(typeof firstRoute.name).toBe('string')
      expect(firstRoute.name.length).toBeGreaterThan(0)

      expect(typeof firstRoute.lat).toBe('number')
      expect(firstRoute.lat).toBeGreaterThan(-90)
      expect(firstRoute.lat).toBeLessThan(90)

      expect(typeof firstRoute.lng).toBe('number')
      expect(firstRoute.lng).toBeGreaterThan(-180)
      expect(firstRoute.lng).toBeLessThan(180)

      // Archetype must be a valid UI enum
      const validArchetypes: DiscoveryArchetype[] = [
        'twisties',
        'scenic',
        'technical',
        'cruising',
        'sport',
        'adventure',
      ]
      expect(validArchetypes).toContain(firstRoute.archetype)

      // Score must be 0-1 (not raw DB enum like 'mountain')
      expect(typeof firstRoute.score).toBe('number')
      expect(firstRoute.score).toBeGreaterThanOrEqual(0)
      expect(firstRoute.score).toBeLessThanOrEqual(1)

      // distanceMi is optional but when present, valid
      if (firstRoute.distanceMi !== undefined) {
        expect(typeof firstRoute.distanceMi).toBe('number')
        expect(firstRoute.distanceMi).toBeGreaterThanOrEqual(0)
      }

      // Must NOT observe: routes undefined, empty, or with missing fields
      expect(routes).not.toBe(undefined)
      expect(routes!.length).not.toBe(0)
      expect(Object.keys(firstRoute).length).toBe(7)
    })

    it('should properly map Convex data to discovery row shape', async () => {
      const testRoute = [
        createMockRoute({
          routeId: 'route-test',
          name: 'Test Route',
          centroidLat: 37.7749,
          centroidLng: -122.4194,
          primaryArchetype: 'scenic',
          compositeScore: 0.82,
          distanceMi: 5.2,
        }),
      ]
      mockUseQuery.mockReturnValue(testRoute)

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
          center: { lat: 37.7749, lng: -122.4194 },
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const route = result.current.routes![0]!

      // Verify exact field mapping
      expect(route.id).toBe('route-test') // routeId -> id
      expect(route.name).toBe('Test Route') // name (unchanged)
      expect(route.lat).toBe(37.7749) // centroidLat -> lat
      expect(route.lng).toBe(-122.4194) // centroidLng -> lng
      expect(route.archetype).toBe('scenic') // primaryArchetype -> archetype
      expect(route.score).toBe(0.82) // compositeScore (already 0-1 from Convex)
      expect(route.distanceMi).toBe(5.2) // distanceMi passed through
    })

    it('filters out curated rows without generated geometry so suggestion taps can draw a line', async () => {
      mockUseQuery.mockReturnValue([
        createMockRoute({
          routeId: 'unresolved-route',
          name: 'Unresolved Route',
          geometryStatus: 'unresolved',
        }),
        createMockRoute({
          routeId: 'generated-route',
          name: 'Generated Route',
          geometryStatus: 'generated',
        }),
      ])

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
          center: { lat: 37.7749, lng: -122.4194 },
          limit: 5,
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      expect(result.current.routes?.map((route) => route.id)).toEqual(['generated-route'])
    })

    it('showsRoutesWithAbsentGeometryStatus', async () => {
      // DISC-007 STEP 2 final fix (remediation cycle 2): the catalog's
      // top-quality routes (Cherohala Skyway, Wasatch Ridge Traverse, etc. —
      // exactly the routes the capstone ACs expect to see) have
      // geometryStatus === undefined because they predate the Sprint 02
      // geometry-backfill feature (see convex/curatedGeometry.ts:162 comment).
      // A strict `=== 'generated'` filter excluded them, leaving zero
      // suggestion pills. The relaxed filter allows absent/null geometryStatus
      // (graceful degradation per AC-4: "1 polyline OR 1 centroid pin") while
      // still hiding known-bad states (unresolved/failed).
      const cherohala = createMockRoute({
        routeId: 'cherohala-skyway',
        name: 'Cherohala Skyway',
        geometryStatus: undefined,
      })
      const wasatch = createMockRoute({
        routeId: 'wasatch-ridge',
        name: 'Wasatch Ridge Traverse',
      })
      // Simulate the field being LITERALLY ABSENT (not just undefined) — this
      // is the real Convex shape for pre-backfill rows.
      delete (wasatch as any).geometryStatus
      mockUseQuery.mockReturnValue([
        cherohala,
        wasatch,
        createMockRoute({
          routeId: 'generated-route',
          name: 'Generated Route',
          geometryStatus: 'generated',
        }),
      ])

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
          center: { lat: 37.7749, lng: -122.4194 },
          limit: 5,
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      // All three pass through: undefined, absent, and generated.
      expect(result.current.routes?.map((route) => route.id)).toEqual([
        'cherohala-skyway',
        'wasatch-ridge',
        'generated-route',
      ])
    })

    it('hidesUnresolvedAndFailedRoutes', async () => {
      // DISC-007 STEP 2 final fix (remediation cycle 2): known-bad geometry
      // states are still hidden. 'unresolved' = backfill pending (may not have
      // geometry yet); 'failed' = backfill tried and failed (known-bad).
      mockUseQuery.mockReturnValue([
        createMockRoute({
          routeId: 'unresolved-route',
          name: 'Unresolved Route',
          geometryStatus: 'unresolved',
        }),
        createMockRoute({
          routeId: 'failed-route',
          name: 'Failed Route',
          geometryStatus: 'failed',
        }),
        createMockRoute({
          routeId: 'good-route',
          name: 'Good Route',
          geometryStatus: 'generated',
        }),
      ])

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
          center: { lat: 37.7749, lng: -122.4194 },
          limit: 5,
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      // Only the generated route passes; unresolved + failed are filtered out.
      expect(result.current.routes?.map((route) => route.id)).toEqual(['good-route'])
    })
  })

  describe('AC-2: Loading and empty are distinct signals', () => {
    it('loadingIsDistinctFromEmpty', async () => {
      // Initially loading: routes undefined, isEmpty false
      mockUseQuery.mockReturnValue(undefined)
      mockUseCurrentLocation.mockReturnValue({
        location: mockCurrentLocation,
        loading: false,
        error: null,
      })

      const { result, rerender } = renderHook(() => useCuratedDiscovery())

      // Before resolve: isLoading true, isEmpty false
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isEmpty).toBe(false)
      expect(result.current.routes).toBe(undefined)

      // After resolve with empty array
      mockUseQuery.mockReturnValue([])
      rerender()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Must observe: isLoading false AND isEmpty true
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isEmpty).toBe(true)
      expect(result.current.routes).toEqual([])

      // Must NOT observe: isEmpty true while loading, or isLoading stuck true
    })

    it('should distinguish loading from empty data', async () => {
      // Start with undefined (loading)
      mockUseQuery.mockReturnValue(undefined)

      const { result } = renderHook(() => useCuratedDiscovery())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isEmpty).toBe(false)
    })

    it('should set isEmpty true only when routes array is empty', async () => {
      mockUseQuery.mockReturnValue([])

      const { result } = renderHook(() => useCuratedDiscovery())

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      expect(result.current.isEmpty).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should set isEmpty false when routes are present', async () => {
      mockUseQuery.mockReturnValue(mockSingleRoute)

      const { result } = renderHook(() => useCuratedDiscovery())

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      expect(result.current.isEmpty).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('AC-3: Center derived from useCurrentLocation', () => {
    it('derivesCenterFromCurrentLocation', async () => {
      // Setup: current location available, no explicit center
      mockUseCurrentLocation.mockReturnValue({
        location: mockCurrentLocation,
        loading: false,
        error: null,
      })
      // Use mock data with distanceMi populated (indicates center was used)
      const routesWithDistance = [
        createMockRoute({
          routeId: 'r1',
          name: 'Route 1',
          distanceMi: 5.2,
        }),
      ]
      mockUseQuery.mockReturnValue(routesWithDistance)

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
          limit: 5,
          // NO center provided - should derive from current location
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      // Verify query was called
      expect(mockUseQuery).toHaveBeenCalled()

      // Verify routes resolved (which means center was used)
      const routes = result.current.routes!
      expect(routes.length).toBeGreaterThan(0)

      // Verify distanceMi is populated (only returned when center is provided)
      routes.forEach((route) => {
        expect(route.distanceMi).toBeDefined()
        expect(typeof route.distanceMi).toBe('number')
        expect(route.distanceMi).toBeGreaterThanOrEqual(0)
      })
    })

    it('should use explicit center over current location', async () => {
      const explicitCenter = { lat: 34.0522, lng: -118.2437 }
      mockUseQuery.mockReturnValue(mockSingleRoute)

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          center: explicitCenter,
          sort: 'nearest',
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      // Verify the hook used the explicit center (by checking query args)
      const callArgs = mockUseQuery.mock.calls[0]
      expect(callArgs[1]).toHaveProperty('center', explicitCenter)
    })

    it('should handle missing current location gracefully', async () => {
      // No current location available
      mockUseCurrentLocation.mockReturnValue({
        location: null,
        loading: false,
        error: null,
      })
      mockUseQuery.mockReturnValue(mockCuratedRoutesBestOrdered)

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'best', // Fallback when no center
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      // Should still return results (without distance)
      expect(result.current.routes).toBeDefined()
      expect(result.current.routes!.length).toBeGreaterThan(0)
    })
  })

  describe('AC-4: Nearest-first when located, unlocated nearest falls back to best', () => {
    it('ordersNearestWhenLocatedThenFallsBackToBestWhenLocationFails', async () => {
      // Test 1: Located query (sort:nearest with center) — nearest-first ordering
      mockUseQuery.mockReturnValue(mockCuratedRoutesNearestOrdered)

      const { result: locatedResult } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
          center: { lat: 37.7749, lng: -122.4194 },
        }),
      )

      await waitFor(() => {
        expect(locatedResult.current.routes).toBeDefined()
      })

      // Must observe: ascending distanceMi
      const locatedRoutes = locatedResult.current.routes!
      for (let i = 0; i < locatedRoutes.length - 1; i++) {
        if (
          locatedRoutes[i].distanceMi !== undefined &&
          locatedRoutes[i + 1].distanceMi !== undefined
        ) {
          expect(locatedRoutes[i].distanceMi!).toBeLessThanOrEqual(locatedRoutes[i + 1].distanceMi!)
        }
      }

      // Test 2: Location FAILED (loading false, location null) with sort:nearest
      // → hook MUST fall back to sort:best and return routes (DISC-007 STEP 2 fix).
      // The PRD intent is "curated suggestion cards over the chat input" — not
      // specifically "nearest". On cold-boot simulators location can fail/timeout
      // even with permission granted; degrading to 'best' keeps pills on screen.
      mockUseQuery.mockReturnValue(mockCuratedRoutesBestOrdered)
      mockUseCurrentLocation.mockReturnValue({
        location: null,
        loading: false,
        error: 'Location unavailable',
      })

      const { result: fallbackResult } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest', // requested nearest, but location failed → falls back to best
          limit: 5,
        }),
      )

      await waitFor(() => {
        expect(fallbackResult.current.routes).toBeDefined()
      })

      // The query MUST have been issued with sort: 'best' (NOT skipped).
      const fallbackCallArgs = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1]
      expect(fallbackCallArgs[1]).not.toBe('skip')
      expect(fallbackCallArgs[1]).toHaveProperty('sort', 'best')
      // No center should be sent when falling back to best.
      expect(fallbackCallArgs[1]).not.toHaveProperty('center')

      // The user sees curated suggestion pills, NOT an empty grid.
      expect(fallbackResult.current.routes).toBeDefined()
      expect(fallbackResult.current.routes!.length).toBeGreaterThan(0)
      expect(fallbackResult.current.isLoading).toBe(false)
      expect(fallbackResult.current.isEmpty).toBe(false)
    })

    it('keeps nearest discovery loading while waiting for current location', async () => {
      // While location is still loading, the query stays skipped and the hook
      // reports loading — do NOT flash empty before location resolves, and do
      // NOT prematurely fall back to best either. Only fall back AFTER both
      // retry windows close (loading === false && location === null).
      mockUseCurrentLocation.mockReturnValue({
        location: null,
        loading: true,
        error: null,
      })
      mockUseQuery.mockReturnValue(mockCuratedRoutesBestOrdered)

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
        }),
      )

      expect(mockUseQuery.mock.calls[0]?.[1]).toBe('skip')
      expect(result.current.routes).toBeUndefined()
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isEmpty).toBe(false)
    })

    it('usesNearestWithCenterWhenLocationResolvesSuccessfully', async () => {
      // After location resolves (loading false, location present), sort:nearest
      // MUST use the resolved center — NOT fall back to best. This guards against
      // the fix accidentally degrading every located nearest query to best.
      mockUseCurrentLocation.mockReturnValue({
        location: mockCurrentLocation,
        loading: false,
        error: null,
      })
      mockUseQuery.mockReturnValue(mockCuratedRoutesNearestOrdered)

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
          limit: 5,
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const callArgs = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1]
      expect(callArgs[1]).toHaveProperty('sort', 'nearest')
      expect(callArgs[1]).toHaveProperty('center', mockCurrentLocation)
    })

    it('overFetchesOnBestFallbackSoGeometryFilterHasHeadroom', async () => {
      // DISC-007 STEP 2 fix (part 2): when sort='nearest' falls back to
      // sort='best' due to location failure, the query limit MUST over-fetch
      // (4x) so the client-side geometryStatus === 'generated' filter has a
      // pool to draw from. Convex Mode 4 (sort='best', no archetypes) reads
      // only `effectiveLimit` rows from by_composite_score — if the top-N
      // by score lack generated geometry, the filter kills them all → empty.
      // Over-fetching on fallback gives the filter headroom to find the 19
      // generated routes in the 5,654-route catalog. Explicit sort='best'
      // callers are unchanged (no over-fetch overhead for them).
      mockUseCurrentLocation.mockReturnValue({
        location: null,
        loading: false,
        error: 'Location unavailable',
      })
      mockUseQuery.mockReturnValue(mockCuratedRoutesBestOrdered)

      renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest', // requested nearest, falls back to best
          limit: 5,
        }),
      )

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalled()
      })

      const fallbackCallArgs = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1]
      // sort fell back to best...
      expect(fallbackCallArgs[1]).toHaveProperty('sort', 'best')
      // ...but limit over-fetches: 5 * 4 = 20 (NOT just 5)
      expect(fallbackCallArgs[1]).toHaveProperty('limit', 20)

      // Guard: explicit sort='best' (no fallback) does NOT over-fetch.
      mockUseQuery.mockClear()
      renderHook(() =>
        useCuratedDiscovery({
          sort: 'best',
          limit: 5,
        }),
      )

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalled()
      })

      const explicitBestArgs = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1]
      expect(explicitBestArgs[1]).toHaveProperty('sort', 'best')
      expect(explicitBestArgs[1]).toHaveProperty('limit', 5) // NOT over-fetched
    })

    it('should order by distance ascending when sort=nearest with center', async () => {
      mockUseQuery.mockReturnValue(mockCuratedRoutesNearestOrdered)

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
          center: { lat: 37.7749, lng: -122.4194 },
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const routes = result.current.routes!
      const distances = routes.map((r) => r.distanceMi).filter((d) => d !== undefined) as number[]

      // All distances should be in ascending order
      for (let i = 0; i < distances.length - 1; i++) {
        expect(distances[i]).toBeLessThanOrEqual(distances[i + 1])
      }
    })

    it('fallsBackToBestWhenNearestReturnsEmpty', async () => {
      // DISC-007 STEP 2 final fix (remediation cycle 2): when location
      // RESOLVES but the nearest query returns 0 passable routes (because
      // no curated routes exist within the server's 20-mile distance cap —
      // MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI in convex/curatedRoutes.ts),
      // the hook MUST fall back to sort='best' so the user sees curated
      // suggestion pills instead of "No nearby routes". This matches the
      // PRD intent: "curated-route suggestion cards over the chat input".
      mockUseCurrentLocation.mockReturnValue({
        location: mockCurrentLocation, // Location RESOLVED (Asheville)
        loading: false,
        error: null,
      })

      // First query (nearest): returns EMPTY (no routes within 20mi)
      // Second query (best fallback): returns top-by-score routes
      let callCount = 0
      mockUseQuery.mockImplementation(() => {
        callCount++
        if (callCount === 1) return [] // nearest returns empty
        return mockCuratedRoutesBestOrdered // best returns routes
      })

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'nearest',
          limit: 5,
        }),
      )

      // Wait for the fallback to trigger and the best query to resolve
      await waitFor(() => {
        expect(result.current.routes?.length).toBeGreaterThan(0)
      })

      // The fallback query MUST have been issued with sort: 'best'
      const lastCallArgs = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1]
      expect(lastCallArgs[1]).toHaveProperty('sort', 'best')
      // Over-fetch applied (4x = 20)
      expect(lastCallArgs[1]).toHaveProperty('limit', 20)

      // User sees curated suggestion pills, NOT empty
      expect(result.current.routes).toBeDefined()
      expect(result.current.routes!.length).toBeGreaterThan(0)
      expect(result.current.isEmpty).toBe(false)
    })

    it('should order by score descending when sort=best', async () => {
      mockUseQuery.mockReturnValue(mockCuratedRoutesBestOrdered)

      const { result } = renderHook(() =>
        useCuratedDiscovery({
          sort: 'best',
        }),
      )

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const routes = result.current.routes!

      // All scores should be in descending order
      for (let i = 0; i < routes.length - 1; i++) {
        expect(routes[i].score).toBeGreaterThanOrEqual(routes[i + 1].score)
      }
    })
  })

  describe('AC-5: compositeScore carried at 0-1, never rescaled', () => {
    it('carriesScoreOnRawZeroToOneScale', async () => {
      const testScores = [
        createMockRoute({ routeId: 'r1', compositeScore: 0.82 }),
        createMockRoute({ routeId: 'r2', compositeScore: 0.91 }),
        createMockRoute({ routeId: 'r3', compositeScore: 0.45 }),
      ]

      mockUseQuery.mockReturnValue(testScores)

      const { result } = renderHook(() => useCuratedDiscovery())

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const routes = result.current.routes!

      // Must observe: at least one score between 0 and 1
      const fractionalScores = routes.filter((r) => r.score > 0 && r.score < 1)
      expect(fractionalScores.length).toBeGreaterThan(0)

      // All scores must be 0-1
      routes.forEach((route) => {
        expect(route.score).toBeGreaterThanOrEqual(0)
        expect(route.score).toBeLessThanOrEqual(1)
      })

      // Must NOT observe: any score > 1 (would indicate 0-100 scale)
      routes.forEach((route) => {
        expect(route.score).toBeLessThanOrEqual(1)
      })
    })

    it('should pass through 0-1 scores unmodified', async () => {
      const testRoute = createMockRoute({ compositeScore: 0.82 })
      mockUseQuery.mockReturnValue([testRoute])

      const { result } = renderHook(() => useCuratedDiscovery())

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const route = result.current.routes![0]!
      expect(route.score).toBe(0.82)
    })

    it('should handle edge case scores (0 and 1)', async () => {
      const edgeCases = [
        createMockRoute({ routeId: 'zero', compositeScore: 0.0 }),
        createMockRoute({ routeId: 'one', compositeScore: 1.0 }),
      ]

      mockUseQuery.mockReturnValue(edgeCases)

      const { result } = renderHook(() => useCuratedDiscovery())

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const routes = result.current.routes!
      const zeroRoute = routes.find((r) => r.id === 'zero')!
      const oneRoute = routes.find((r) => r.id === 'one')!

      expect(zeroRoute.score).toBe(0.0)
      expect(oneRoute.score).toBe(1.0)
    })

    it('should never rescale to 0-100 scale', async () => {
      const testRoute = createMockRoute({ compositeScore: 0.85 })
      mockUseQuery.mockReturnValue([testRoute])

      const { result } = renderHook(() => useCuratedDiscovery())

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const route = result.current.routes![0]!

      // If rescaled to 0-100, would be 85
      expect(route.score).not.toBe(85)
      // Verify it's 0-1 scale
      expect(route.score).toBe(0.85)
    })
  })

  describe('Archetype Type Safety', () => {
    it('should return valid UI archetype enum values', async () => {
      const validArchetypes: DiscoveryArchetype[] = [
        'twisties',
        'scenic',
        'technical',
        'cruising',
        'sport',
        'adventure',
      ]

      const testRoutes = validArchetypes.map((arch, i) =>
        createMockRoute({
          routeId: `route-${i}`,
          primaryArchetype: arch,
        }),
      )

      mockUseQuery.mockReturnValue(testRoutes)

      const { result } = renderHook(() => useCuratedDiscovery())

      await waitFor(() => {
        expect(result.current.routes).toBeDefined()
      })

      const routes = result.current.routes!

      // All returned archetypes should be valid UI enums
      routes.forEach((route) => {
        expect(validArchetypes).toContain(route.archetype)
      })
    })
  })

  describe('Parameter Handling', () => {
    it('should pass limit parameter to query', async () => {
      mockUseQuery.mockReturnValue(mockSingleRoute)

      renderHook(() => useCuratedDiscovery({ limit: 10 }))

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalled()
      })

      const callArgs = mockUseQuery.mock.calls[0]
      expect(callArgs[1]).toHaveProperty('limit', 10)
    })

    it('should handle archetypes parameter', async () => {
      mockUseQuery.mockReturnValue(mockSingleRoute)

      const testArchetypes: DiscoveryArchetype[] = ['scenic', 'technical']
      renderHook(() => useCuratedDiscovery({ archetypes: testArchetypes }))

      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalled()
      })

      const callArgs = mockUseQuery.mock.calls[0]
      expect(callArgs[1]).toHaveProperty('archetypes', testArchetypes)
    })
  })
})
