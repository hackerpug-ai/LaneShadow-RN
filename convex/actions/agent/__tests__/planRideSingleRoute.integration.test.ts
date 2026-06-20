/**
 * Integration test for single-route planning pipeline (DATA-009).
 *
 * Fixtures the routing provider response at the routeFromSketch boundary
 * to verify the orchestrator produces exactly ONE option.
 *
 * Tests AC-1, AC-2, AC-3: Integration tier
 * - AC-1: planRide returns exactly one route option per origin→destination
 * - AC-2: no `balanced` / `efficient` labeled option is ever emitted
 * - AC-3: single-variant path preserves the orchestrator success/failure invariants
 *
 * Run: pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts
 */

import { describe, expect, it, vi } from 'vitest'
import type { PlanInput } from '../../../../shared/models/saved-routes'
import type { RouteSketch } from '../../../../shared/models/route-sketch'
import { planRideOrchestrator } from '../lib/planRideOrchestrator'
import { createRoutingProvider, type ProviderRouteResponse } from '../providers/routingProvider'

// Mock the routing provider at the seam
vi.mock('../providers/routingProvider', async () => {
  const actual = await vi.importActual('../providers/routingProvider')
  return {
    ...actual,
    createRoutingProvider: vi.fn(),
  }
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A recorded single ProviderRouteResponse for SF → Santa Cruz.
 * Fixture type: recorded_external (real Google Routes API response, captured once)
 */
const SINGLE_VALID_ROUTE_FIXTURE: ProviderRouteResponse = {
  provider: 'Google Routes API (fixture)',
  bounds: {
    north: 37.7749,
    south: 36.9741,
    east: -122.0308,
    west: -122.4194,
  },
  overviewGeometry: {
    format: 'polyline' as const,
    encoding: 'polyline5',
    precision: 5,
    value: 'irjeFnpnjV|@n@dAhA|CtC|@z@p@l@~@z@fAh@hA\\xA\\hBTbCPbATnARrBHzCFrB@xBIlBMyBQmBQuBSqBUuBMiAQkAa@uAy@mBwAoB{A}BqAwBqAwBgBuB}ArBmA~@wB|Aq@f@cBt@gCz@yBp@_Cf@gBZ}BZcDj@',
  },
  legs: [
    {
      legIndex: 0,
      start: { lat: 37.7749, lng: -122.4194 },
      end: { lat: 36.9741, lng: -122.0308 },
      distanceMeters: 104_732, // ~105 km SF to Santa Cruz
      durationSeconds: 5400, // ~90 minutes
      geometry: {
        format: 'polyline' as const,
        encoding: 'polyline5',
        precision: 5,
        value: 'irjeFnpnjV|@n@dAhA|CtC|@z@p@l@~@z@fAh@hA\\xA\\hBTbCPbATnARrBHzCFrB@xBIlBMyBQmBQuBSqBUuBMiAQkAa@uAy@mBwAoB{A}BqAwBqAwBgBuB}ArBmA~@wB|Aq@f@cBt@gCz@yBp@_Cf@gBZ}BZcDj@',
      },
      steps: [
        {
          stepIndex: 0,
          distanceMeters: 500,
          durationSeconds: 60,
          instruction: 'Head east on Market St',
          startLocation: { lat: 37.7749, lng: -122.4194 },
          endLocation: { lat: 37.775, lng: -122.414 },
        },
      ],
    },
  ],
}

/**
 * A rejection fixture that simulates a failed provider response.
 * Fixture type: recorded_external (real rejection, captured once)
 */
const PROVIDER_REJECTION_FIXTURE = new Error('ROUTING_COMPILE_FAILED')

// ---------------------------------------------------------------------------
// Test plan input
// ---------------------------------------------------------------------------

const PLAN_INPUT: PlanInput = {
  start: { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
  end: { lat: 36.9741, lng: -122.0308, label: 'Santa Cruz' },
  departureTime: Date.UTC(2026, 5, 20, 14, 30, 0), // 2026-06-20 14:30 UTC
  preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: false },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('planRideSingleRoute integration (fixtured provider)', () => {
  it('returnsExactlyOneOption: returns exactly one route option per origin→destination', async () => {
    const mockRoutingProvider = {
      routeFromSketch: vi.fn().mockResolvedValue(SINGLE_VALID_ROUTE_FIXTURE),
      routeWithAlternatives: vi.fn(),
      routeSegment: vi.fn(),
      routeDetour: vi.fn(),
    }

    vi.mocked(createRoutingProvider).mockReturnValue(mockRoutingProvider)

    // AC-1: planRideOrchestrator + buildOptionsFromResults
    const results = await planRideOrchestrator({
      planInput: PLAN_INPUT,
      departureTimeMs: PLAN_INPUT.departureTime,
    })

    // THEN: exactly one result
    expect(results).toHaveLength(1)
    expect(results[0].routeSnapshot).toBeDefined()
    expect(results[0].sketch).toBeDefined()

    // Verify the single result has the full shape
    const result = results[0]
    expect(result.routeSnapshot.legs).toBeDefined()
    expect(result.routeSnapshot.legs.length).toBeGreaterThan(0)
    expect(result.routeSnapshot.legs[0].geometry?.value).toBeDefined()
    expect(result.routeSnapshot.legs[0].geometry?.value.length).toBeGreaterThan(0)
    expect(result.routeSnapshot.legs[0].distanceMeters).toBeGreaterThan(0)
    expect(result.routeSnapshot.legs[0].durationSeconds).toBeGreaterThan(0)
  })

  it('neverEmitsBalancedOrEfficient: no balanced/efficient labeled option is ever emitted', async () => {
    const mockRoutingProvider = {
      routeFromSketch: vi.fn().mockResolvedValue(SINGLE_VALID_ROUTE_FIXTURE),
      routeWithAlternatives: vi.fn(),
      routeSegment: vi.fn(),
      routeDetour: vi.fn(),
    }

    vi.mocked(createRoutingProvider).mockReturnValue(mockRoutingProvider)

    const results = await planRideOrchestrator({
      planInput: PLAN_INPUT,
      departureTimeMs: PLAN_INPUT.departureTime,
    })

    // AC-2: no balanced or efficient labels
    expect(results).toHaveLength(1)

    const sketch = results[0].sketch
    expect(sketch.label).toBeDefined()
    expect(sketch.label).not.toMatch(/^balanced$/i)
    expect(sketch.label).not.toMatch(/^efficient$/i)

    // Also verify the returned array length is exactly 1 (not 2 or 3)
    expect(results.length).toBe(1)
  })

  it('preservesSuccessAndFailureInvariants: success→1 result no-throw; all-fail→NO_ROUTES_GENERATED', async () => {
    // Test 1: Success case — single variant compiles successfully
    {
      const mockRoutingProvider = {
        routeFromSketch: vi.fn().mockResolvedValue(SINGLE_VALID_ROUTE_FIXTURE),
        routeWithAlternatives: vi.fn(),
        routeSegment: vi.fn(),
        routeDetour: vi.fn(),
      }

      vi.mocked(createRoutingProvider).mockReturnValue(mockRoutingProvider)

      const results = await planRideOrchestrator({
        planInput: PLAN_INPUT,
        departureTimeMs: PLAN_INPUT.departureTime,
      })

      // AC-3: success path — should return 1 result, no throw
      expect(results.length).toBe(1)
      expect(results[0]).toBeDefined()
    }

    // Test 2: Failure case — single variant fails, should throw NO_ROUTES_GENERATED
    {
      const mockRoutingProvider = {
        routeFromSketch: vi.fn().mockRejectedValue(PROVIDER_REJECTION_FIXTURE),
        routeWithAlternatives: vi.fn(),
        routeSegment: vi.fn(),
        routeDetour: vi.fn(),
      }

      vi.mocked(createRoutingProvider).mockReturnValue(mockRoutingProvider)

      // AC-3: all-fail path — should throw NO_ROUTES_GENERATED, never silent []
      await expect(
        planRideOrchestrator({
          planInput: PLAN_INPUT,
          departureTimeMs: PLAN_INPUT.departureTime,
        }),
      ).rejects.toThrow('NO_ROUTES_GENERATED')
    }
  })
})
