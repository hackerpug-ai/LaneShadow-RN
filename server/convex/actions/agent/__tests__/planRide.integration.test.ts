/**
 * Real integration test for the route planning pipeline.
 *
 * Calls planRideOrchestrator + executePlanHandler with:
 * - Real Google Routes API
 * - Real Overpass API
 * - No mocks
 *
 * Requires env vars: GOOGLE_MAPS_API_KEY
 * Run: npx vitest run convex/actions/agent/__tests__/planRide.integration.test.ts
 */

import { describe, expect, it } from 'vitest'
import { ROUTE_PLAN_STATUS } from '../../../../models/route-plans'
import type { Id } from '../../../_generated/dataModel'
import { planRideOrchestrator } from '../lib/planRideOrchestrator'
import { executePlanHandler } from '../planRide'

// ---------------------------------------------------------------------------
// Env check
// ---------------------------------------------------------------------------

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

if (!GOOGLE_MAPS_API_KEY) throw new Error('GOOGLE_MAPS_API_KEY required for integration tests')

// ---------------------------------------------------------------------------
// Test plan
// ---------------------------------------------------------------------------

const planInput = {
  start: { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
  end: { lat: 37.4419, lng: -122.143, label: 'Palo Alto' },
  departureTime: Date.UTC(2026, 3, 3, 12, 0, 0),
  preferences: { scenicBias: 'default' as const, avoidHighways: false, avoidTolls: false },
}

const routePlanId = 'integration-test-plan' as Id<'route_plans'>

const basePlanDoc = {
  _id: routePlanId,
  _creationTime: Date.now(),
  clerkUserId: 'test-user',
  planInput,
  status: ROUTE_PLAN_STATUS.PENDING,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

// ---------------------------------------------------------------------------
// Fake ctx
// ---------------------------------------------------------------------------

const makeFakeCtx = () => {
  const mutations: {
    status: string
    result?: unknown
    errorCode?: string
    statusMessage?: string
  }[] = []

  const ctx = {
    runQuery: async (_ref: unknown, _args: unknown) => basePlanDoc,
    runMutation: async (_ref: unknown, args: any) => {
      mutations.push(args)

      return null
    },
  }

  return { ctx, mutations }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('planRide integration (real APIs)', () => {
  it('planRideOrchestrator returns at least one route', async () => {
    const results = await planRideOrchestrator({
      planInput,
      departureTimeMs: planInput.departureTime,
    })

    expect(results).toBeInstanceOf(Array)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].routeSnapshot.legs.length).toBeGreaterThan(0)
  }, 60_000)

  it('executePlanHandler calls real Overpass + Google and writes completed result', async () => {
    const { ctx, mutations } = makeFakeCtx()

    await executePlanHandler(ctx as any, { routePlanId })

    const completed = mutations.find((m) => m.status === ROUTE_PLAN_STATUS.COMPLETED)
    const failed = mutations.find((m) => m.status === ROUTE_PLAN_STATUS.FAILED)

    if (failed) if (completed) expect(failed, `Plan failed: ${failed?.errorCode}`).toBeUndefined()
    expect(completed).toBeDefined()
    expect((completed?.result as any)?.options).toBeInstanceOf(Array)
    expect((completed?.result as any)?.options.length).toBeGreaterThan(0)

    const firstOption = (completed?.result as any)?.options[0]
    expect(firstOption.routeOptionId).toBeDefined()
    expect(firstOption.label).toBeDefined()
    expect(firstOption.map?.overviewGeometry?.value).toBeDefined()
    expect(firstOption.map?.legs?.length).toBeGreaterThan(0)

    const geo = firstOption.map?.overviewGeometry
    expect(geo?.format).toBe('polyline')
    expect(typeof geo?.value).toBe('string')
    expect(geo?.value.length).toBeGreaterThan(0)
    expect(typeof geo?.precision).toBe('number')

    const firstLeg = firstOption.map?.legs?.[0]
    expect(firstLeg?.geometry?.value).toBeDefined()
    expect(typeof firstLeg?.geometry?.precision).toBe('number')

    expect(typeof firstOption.stats?.distanceMeters).toBe('number')
    expect(typeof firstOption.stats?.durationSeconds).toBe('number')
  }, 300_000)
})
