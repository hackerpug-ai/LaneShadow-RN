'use node'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executePlanHandler } from '../planRide'
import { ROUTE_PLAN_STATUS } from '../../../../models/route-plans'
import type { Id } from '../../../_generated/dataModel'

// -----------------------------------------------------------------------------
// Test Data
// -----------------------------------------------------------------------------

const routePlanId = 'plan_abc123' as Id<'route_plans'>

const basePlanDoc = {
  _id: routePlanId,
  _creationTime: Date.now(),
  clerkUserId: 'user_clerk_123',
  planInput: {
    start: { lat: 0, lng: 0, label: 'Start' },
    end: { lat: 1, lng: 1, label: 'End' },
    departureTime: Date.UTC(2026, 0, 1, 12, 0, 0),
    preferences: { scenicBias: 'default' as const },
  },
  status: ROUTE_PLAN_STATUS.PENDING,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const makeSnapshot = () => ({
  provider: 'google',
  bounds: { north: 1, south: 0, east: 1, west: 0 },
  origin: { lat: 0, lng: 0 },
  destination: { lat: 1, lng: 1 },
  waypoints: [],
  overviewGeometry: { format: 'polyline' as const, encoding: 'encoded_polyline', precision: 5, value: 'test' },
  legs: [
    {
      legIndex: 0,
      start: { lat: 0, lng: 0 },
      end: { lat: 1, lng: 1 },
      distanceMeters: 25000,
      durationSeconds: 1800,
      geometry: { format: 'polyline' as const, encoding: 'encoded_polyline', precision: 5, value: 'leg_val' },
    },
  ],
  annotations: [],
  overlays: {},
})

const mockOrchestratorResult = [
  {
    routeSnapshot: makeSnapshot(),
    sketch: { label: 'Coastal Route', rationale: 'Ocean views' },
  },
]

// -----------------------------------------------------------------------------
// executePlanHandler
// -----------------------------------------------------------------------------

describe('executePlanHandler', () => {
  let mockRunQuery: ReturnType<typeof vi.fn>
  let mockRunMutation: ReturnType<typeof vi.fn>
  let mockOrchestrator: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockRunMutation = vi.fn().mockResolvedValue(null)
    mockOrchestrator = vi.fn().mockResolvedValue(mockOrchestratorResult)
    mockRunQuery = vi.fn().mockResolvedValue(basePlanDoc)
  })

  // ---------------------------------------------------------------------------
  // AC-1: Happy path
  // ---------------------------------------------------------------------------
  it('AC-1: Given a pending plan, When executePlanHandler runs, Then updates status to running then completed', async () => {
    const ctx = {
      runQuery: mockRunQuery,
      runMutation: mockRunMutation,
    }

    await executePlanHandler(ctx as any, { routePlanId }, mockOrchestrator)

    const statusArgs = mockRunMutation.mock.calls.map((call) => call[1])
    const runningCall = statusArgs.find((a) => a?.status === ROUTE_PLAN_STATUS.RUNNING)
    const completedCall = statusArgs.find((a) => a?.status === ROUTE_PLAN_STATUS.COMPLETED)

    expect(runningCall).toBeDefined()
    expect(completedCall).toBeDefined()
    expect(completedCall?.result).toBeDefined()
    expect(completedCall?.result?.options).toHaveLength(1)
    expect(completedCall?.result?.options[0].label).toBe('Coastal Route')
  })

  // ---------------------------------------------------------------------------
  // AC-2: Early return when plan is null
  // ---------------------------------------------------------------------------
  it('AC-2: Given plan not found, When executePlanHandler runs, Then returns without calling runMutation', async () => {
    mockRunQuery = vi.fn().mockResolvedValue(null)

    const ctx = {
      runQuery: mockRunQuery,
      runMutation: mockRunMutation,
    }

    await executePlanHandler(ctx as any, { routePlanId }, mockOrchestrator)

    expect(mockRunMutation).not.toHaveBeenCalled()
    expect(mockOrchestrator).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // AC-3: Early return when plan is cancelled
  // ---------------------------------------------------------------------------
  it('AC-3: Given a cancelled plan, When executePlanHandler runs, Then returns without calling runMutation', async () => {
    mockRunQuery = vi.fn().mockResolvedValue({
      ...basePlanDoc,
      status: ROUTE_PLAN_STATUS.CANCELLED,
    })

    const ctx = {
      runQuery: mockRunQuery,
      runMutation: mockRunMutation,
    }

    await executePlanHandler(ctx as any, { routePlanId }, mockOrchestrator)

    expect(mockRunMutation).not.toHaveBeenCalled()
    expect(mockOrchestrator).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // AC-4: Orchestrator failure writes 'failed' status to DB
  // ---------------------------------------------------------------------------
  it('AC-4: Given orchestrator throws, When executePlanHandler runs, Then writes failed status to DB', async () => {
    mockOrchestrator = vi.fn().mockRejectedValue(new Error('ROUTING_ALL_VARIANTS_FAILED'))

    const ctx = {
      runQuery: mockRunQuery,
      runMutation: mockRunMutation,
    }

    await executePlanHandler(ctx as any, { routePlanId }, mockOrchestrator)

    const statusArgs = mockRunMutation.mock.calls.map((call) => call[1])
    const failedCall = statusArgs.find((a) => a?.status === ROUTE_PLAN_STATUS.FAILED)

    expect(failedCall).toBeDefined()
    // The handler maps unknown error messages to GENERATION_FAILED. Specific
    // codes (AGENT_TIMEOUT, NO_ROUTES_GENERATED, INVALID_AGENT_RESPONSE_STRUCTURE)
    // are preserved; everything else is surfaced as the generic failure code.
    expect(failedCall?.errorCode).toBe('GENERATION_FAILED')
  })

  // ---------------------------------------------------------------------------
  // AC-5: Cancellation mid-run
  // ---------------------------------------------------------------------------
  it('AC-5: Given plan is cancelled mid-run, When executePlanHandler checks, Then does not write completed', async () => {
    let queryCallCount = 0
    mockRunQuery = vi.fn().mockImplementation(async (_ref: any, _args: any) => {
      queryCallCount++
      if (queryCallCount === 1) {
        return { ...basePlanDoc, status: ROUTE_PLAN_STATUS.PENDING }
      }
      // Subsequent calls (cancellation checks): plan is now cancelled
      return { ...basePlanDoc, status: ROUTE_PLAN_STATUS.CANCELLED }
    })

    const ctx = {
      runQuery: mockRunQuery,
      runMutation: mockRunMutation,
    }

    await executePlanHandler(ctx as any, { routePlanId }, mockOrchestrator)

    const statusArgs = mockRunMutation.mock.calls.map((call) => call[1])
    const completedCall = statusArgs.find((a) => a?.status === ROUTE_PLAN_STATUS.COMPLETED)

    // Should NOT write completed since it was cancelled
    expect(completedCall).toBeUndefined()
  })
})
