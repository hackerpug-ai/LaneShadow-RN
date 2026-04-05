/**
 * Tests for routePlans.ts CRUD and status management.
 *
 * These tests exercise behavior via exported handler functions that can be
 * unit-tested without a running Convex backend.
 */

import { ConvexError } from 'convex/values'
import { vi, describe, it, expect } from 'vitest'

import { ERROR_CODES } from '../../errors'
import type { Id } from '../../_generated/dataModel'
import {
  createPlanHandler,
  getActivePlanHandler,
  getPlanByIdHandler,
  updatePlanStatusHandler,
  cancelPlanHandler,
  listBySessionHandler,
} from '../routePlans'

// Mock planUsage functions
vi.mock('../planUsage', () => ({
  checkUsage: vi.fn().mockResolvedValue({
    count: 0,
    limit: 5,
    allowed: true,
    remaining: 5,
  }),
  incrementUsage: vi.fn().mockResolvedValue({
    count: 1,
    limit: 5,
    allowed: true,
    remaining: 4,
  }),
  getCurrentMonth: vi.fn().mockReturnValue('2026-04'),
}))

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CLERK_USER_ID = 'user_test_123'
const PLAN_ID = 'route_plans_id_abc' as Id<'route_plans'>
const SCHEDULED_ACTION_ID = 'sched_action_xyz' as Id<'_scheduled_functions'>

// Simplified fixture shape — tests pass this through mocks so no runtime validation
const basePlanInput = {
  start: { label: 'Start City', lat: 37.7749, lng: -122.4194 },
  end: { label: 'End City', lat: 34.0522, lng: -118.2437 },
  departureTime: 1711670400000,
  preferences: { scenicBias: 'default' as const },
} as any

const makePlanDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: PLAN_ID,
  _creationTime: 1000,
  clerkUserId: CLERK_USER_ID,
  planInput: basePlanInput,
  startLabel: 'Start City',
  endLabel: 'End City',
  status: 'pending',
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 5000,
  ...overrides,
})

// ---------------------------------------------------------------------------
// AC-1: createPlan inserts a new record with status='pending' and schedules execution
// ---------------------------------------------------------------------------

describe('createPlanHandler', () => {
  it('AC-1: inserts plan with status=pending and returns routePlanId', async () => {
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue(PLAN_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        runAfter: vi.fn().mockResolvedValue(SCHEDULED_ACTION_ID),
      },
    }

    const result = await createPlanHandler(
      ctx as any,
      { planInput: basePlanInput, startLabel: 'Start City', endLabel: 'End City' },
      CLERK_USER_ID
    )

    expect(ctx.db.insert).toHaveBeenCalledWith(
      'route_plans',
      expect.objectContaining({
        clerkUserId: CLERK_USER_ID,
        status: 'pending',
        planInput: basePlanInput,
        startLabel: 'Start City',
        endLabel: 'End City',
      })
    )
    expect(result).toEqual({ routePlanId: PLAN_ID })
  })

  it('AC-1: schedules executePlan action and patches scheduledActionId', async () => {
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue(PLAN_ID),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        runAfter: vi.fn().mockResolvedValue(SCHEDULED_ACTION_ID),
      },
    }

    await createPlanHandler(
      ctx as any,
      { planInput: basePlanInput },
      CLERK_USER_ID
    )

    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(
      0,
      expect.anything(),
      { routePlanId: PLAN_ID }
    )
    expect(ctx.db.patch).toHaveBeenCalledWith(
      PLAN_ID,
      expect.objectContaining({ scheduledActionId: SCHEDULED_ACTION_ID })
    )
  })

  it('AC-1: throws PLAN_ALREADY_ACTIVE when a pending plan exists', async () => {
    const existingPlan = makePlanDoc({ status: 'pending' })
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(existingPlan),
            }),
          }),
        }),
        insert: vi.fn(),
        patch: vi.fn(),
      },
      scheduler: {
        runAfter: vi.fn(),
      },
    }

    await expect(
      createPlanHandler(ctx as any, { planInput: basePlanInput }, CLERK_USER_ID)
    ).rejects.toThrow(ConvexError)

    await expect(
      createPlanHandler(ctx as any, { planInput: basePlanInput }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.PLAN_ALREADY_ACTIVE)
  })

  it('AC-1: throws PLAN_ALREADY_ACTIVE when a running plan exists', async () => {
    const existingPlan = makePlanDoc({ status: 'running' })
    // pending query returns null, running query returns existing
    let callCount = 0
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockImplementation(() => {
                callCount++
                if (callCount === 1) return Promise.resolve(null)
                return Promise.resolve(existingPlan)
              }),
            }),
          }),
        }),
        insert: vi.fn(),
        patch: vi.fn(),
      },
      scheduler: {
        runAfter: vi.fn(),
      },
    }

    await expect(
      createPlanHandler(ctx as any, { planInput: basePlanInput }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.PLAN_ALREADY_ACTIVE)
  })
})

// ---------------------------------------------------------------------------
// AC-2: getActivePlan returns the first non-terminal plan or null
// ---------------------------------------------------------------------------

describe('getActivePlanHandler', () => {
  it('AC-2: returns null when no active plan exists', async () => {
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
        }),
      },
    }

    const result = await getActivePlanHandler(ctx as any, CLERK_USER_ID)
    expect(result).toBeNull()
  })

  it('AC-2: returns the pending plan when one exists', async () => {
    const pendingPlan = makePlanDoc({ status: 'pending' })
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(pendingPlan),
            }),
          }),
        }),
      },
    }

    const result = await getActivePlanHandler(ctx as any, CLERK_USER_ID)
    expect(result).toEqual(pendingPlan)
  })

  it('AC-2: returns the running plan when pending is null but running exists', async () => {
    const runningPlan = makePlanDoc({ status: 'running' })
    let callCount = 0
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockImplementation(() => {
                callCount++
                if (callCount === 1) return Promise.resolve(null) // pending
                return Promise.resolve(runningPlan) // running
              }),
            }),
          }),
        }),
      },
    }

    const result = await getActivePlanHandler(ctx as any, CLERK_USER_ID)
    expect(result).toEqual(runningPlan)
  })
})

// ---------------------------------------------------------------------------
// AC-3: getPlanById returns the plan for owner, throws for non-owner or missing
// ---------------------------------------------------------------------------

describe('getPlanByIdHandler', () => {
  it('AC-3: returns plan when owned by requesting user', async () => {
    const plan = makePlanDoc()
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
      },
    }

    const result = await getPlanByIdHandler(
      ctx as any,
      { routePlanId: PLAN_ID },
      CLERK_USER_ID
    )

    expect(result).toEqual(plan)
  })

  it('AC-3: throws PLAN_NOT_FOUND when plan does not exist', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
      },
    }

    await expect(
      getPlanByIdHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ConvexError)

    await expect(
      getPlanByIdHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.PLAN_NOT_FOUND)
  })

  it('AC-3: throws PLAN_NOT_FOUND when plan is owned by a different user', async () => {
    const plan = makePlanDoc({ clerkUserId: 'other_user_456' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
      },
    }

    await expect(
      getPlanByIdHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.PLAN_NOT_FOUND)
  })
})

// ---------------------------------------------------------------------------
// AC-4: updatePlanStatus patches status and timestamp fields
// ---------------------------------------------------------------------------

describe('updatePlanStatusHandler', () => {
  it('AC-4: patches status and updatedAt on status update', async () => {
    const plan = makePlanDoc({ status: 'pending' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await updatePlanStatusHandler(ctx as any, {
      routePlanId: PLAN_ID,
      status: 'running',
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      PLAN_ID,
      expect.objectContaining({
        status: 'running',
        updatedAt: expect.any(Number),
      })
    )
  })

  it('AC-4: sets completedAt when status is completed', async () => {
    const plan = makePlanDoc({ status: 'running' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await updatePlanStatusHandler(ctx as any, {
      routePlanId: PLAN_ID,
      status: 'completed',
      result: { routes: [] },
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      PLAN_ID,
      expect.objectContaining({
        status: 'completed',
        completedAt: expect.any(Number),
        result: { routes: [] },
      })
    )
  })

  it('AC-4: sets completedAt when status is failed', async () => {
    const plan = makePlanDoc({ status: 'running' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await updatePlanStatusHandler(ctx as any, {
      routePlanId: PLAN_ID,
      status: 'failed',
      errorCode: 'SOME_ERROR',
      errorMessage: 'Something went wrong',
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      PLAN_ID,
      expect.objectContaining({
        status: 'failed',
        completedAt: expect.any(Number),
        errorCode: 'SOME_ERROR',
        errorMessage: 'Something went wrong',
      })
    )
  })

  it('AC-4: includes statusMessage when provided', async () => {
    const plan = makePlanDoc({ status: 'pending' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await updatePlanStatusHandler(ctx as any, {
      routePlanId: PLAN_ID,
      status: 'running',
      statusMessage: 'Planning your route...',
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      PLAN_ID,
      expect.objectContaining({
        statusMessage: 'Planning your route...',
      })
    )
  })
})

// ---------------------------------------------------------------------------
// AC-5: cancelPlan cancels the scheduled action and sets status=cancelled
// ---------------------------------------------------------------------------

describe('cancelPlanHandler', () => {
  it('AC-5: cancels scheduler and sets status=cancelled for a pending plan', async () => {
    const plan = makePlanDoc({
      status: 'pending',
      scheduledActionId: SCHEDULED_ACTION_ID,
    })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await cancelPlanHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)

    expect(ctx.scheduler.cancel).toHaveBeenCalledWith(SCHEDULED_ACTION_ID)
    expect(ctx.db.patch).toHaveBeenCalledWith(
      PLAN_ID,
      expect.objectContaining({ status: 'cancelled', updatedAt: expect.any(Number) })
    )
  })

  it('AC-5: cancels scheduler for a running plan', async () => {
    const plan = makePlanDoc({
      status: 'running',
      scheduledActionId: SCHEDULED_ACTION_ID,
    })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await cancelPlanHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)

    expect(ctx.scheduler.cancel).toHaveBeenCalledWith(SCHEDULED_ACTION_ID)
  })

  it('AC-5: still patches cancelled when no scheduledActionId present', async () => {
    const plan = makePlanDoc({ status: 'pending' }) // no scheduledActionId
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn(),
      },
    }

    await cancelPlanHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)

    expect(ctx.scheduler.cancel).not.toHaveBeenCalled()
    expect(ctx.db.patch).toHaveBeenCalledWith(
      PLAN_ID,
      expect.objectContaining({ status: 'cancelled' })
    )
  })

  it('AC-5: throws PLAN_NOT_FOUND when plan does not exist', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
        patch: vi.fn(),
      },
      scheduler: {
        cancel: vi.fn(),
      },
    }

    await expect(
      cancelPlanHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.PLAN_NOT_FOUND)
  })

  it('AC-5: throws PLAN_NOT_FOUND when plan belongs to another user', async () => {
    const plan = makePlanDoc({ clerkUserId: 'other_user_789' })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(plan),
        patch: vi.fn(),
      },
      scheduler: {
        cancel: vi.fn(),
      },
    }

    await expect(
      cancelPlanHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.PLAN_NOT_FOUND)
  })
})

// ---------------------------------------------------------------------------
// listBySessionHandler (agent-context summarized query)
// ---------------------------------------------------------------------------

describe('listBySessionHandler', () => {
  const SESSION_ID = 'session_abc' as Id<'planning_sessions'>

  const makeDoc = (overrides: Record<string, unknown> = {}) => ({
    _id: PLAN_ID,
    _creationTime: 1000,
    clerkUserId: CLERK_USER_ID,
    planningSessionId: SESSION_ID,
    planInput: basePlanInput,
    startLabel: 'SF',
    endLabel: 'LA',
    status: 'completed',
    createdAt: Date.now() - 5000,
    updatedAt: Date.now() - 4000,
    result: {
      planId: 'plan-1',
      options: [
        {
          routeOptionId: 'opt-1',
          label: 'Scenic',
          rationale: '...',
          stats: {
            distanceMeters: 123456,
            durationSeconds: 7200,
            legsCount: 2,
          },
          map: { bounds: {}, overviewGeometry: {}, legs: [] },
          overlaysPreview: {},
        },
      ],
    },
    ...overrides,
  })

  const makeCtx = (docs: unknown[], opts: { captureRange?: (q: any) => void } = {}) => {
    const takeFn = vi.fn().mockResolvedValue(docs)
    const orderFn = vi.fn().mockReturnValue({ take: takeFn })
    const withIndexFn = vi.fn().mockImplementation((_name: string, range: (q: any) => any) => {
      if (opts.captureRange) {
        const eqCalls: { field: string; value: unknown }[] = []
        const mockQ: any = {
          eq: (field: string, value: unknown) => {
            eqCalls.push({ field, value })
            return mockQ
          },
        }
        range(mockQ)
        opts.captureRange(eqCalls)
      }
      return { order: orderFn }
    })
    const queryFn = vi.fn().mockReturnValue({ withIndex: withIndexFn })
    return {
      ctx: { db: { query: queryFn } },
      spies: { takeFn, orderFn, withIndexFn, queryFn },
    }
  }

  it('returns summarized rows with distanceMeters/durationSeconds from first option', async () => {
    const doc = makeDoc()
    const { ctx } = makeCtx([doc])

    const result = await listBySessionHandler(ctx as any, { sessionId: SESSION_ID })

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      _id: PLAN_ID,
      _creationTime: 1000,
      startLabel: 'SF',
      endLabel: 'LA',
      preferences: basePlanInput.preferences,
      status: 'completed',
      distanceMeters: 123456,
      durationSeconds: 7200,
    })
  })

  it('strips result.options geometry/waypoints from returned rows', async () => {
    const doc = makeDoc()
    const { ctx } = makeCtx([doc])

    const result = await listBySessionHandler(ctx as any, { sessionId: SESSION_ID })

    expect(result[0]).not.toHaveProperty('result')
    expect(result[0]).not.toHaveProperty('planInput')
    expect(JSON.stringify(result[0])).not.toContain('overviewGeometry')
  })

  it('handles rows without result (pending/running plans)', async () => {
    const doc = makeDoc({ status: 'pending', result: undefined })
    const { ctx } = makeCtx([doc])

    const result = await listBySessionHandler(ctx as any, { sessionId: SESSION_ID })

    expect(result[0].status).toBe('pending')
    expect(result[0].distanceMeters).toBeUndefined()
    expect(result[0].durationSeconds).toBeUndefined()
  })

  it('defaults limit to 5', async () => {
    const { ctx, spies } = makeCtx([])

    await listBySessionHandler(ctx as any, { sessionId: SESSION_ID })

    expect(spies.takeFn).toHaveBeenCalledWith(5)
  })

  it('respects custom limit', async () => {
    const { ctx, spies } = makeCtx([])

    await listBySessionHandler(ctx as any, { sessionId: SESSION_ID, limit: 20 })

    expect(spies.takeFn).toHaveBeenCalledWith(20)
  })

  it('filters by planningSessionId only when status not provided', async () => {
    let captured: { field: string; value: unknown }[] = []
    const { ctx } = makeCtx([], {
      captureRange: (calls) => {
        captured = calls
      },
    })

    await listBySessionHandler(ctx as any, { sessionId: SESSION_ID })

    expect(captured).toEqual([{ field: 'planningSessionId', value: SESSION_ID }])
  })

  it('filters by planningSessionId AND status when status provided', async () => {
    let captured: { field: string; value: unknown }[] = []
    const { ctx } = makeCtx([], {
      captureRange: (calls) => {
        captured = calls
      },
    })

    await listBySessionHandler(ctx as any, {
      sessionId: SESSION_ID,
      status: 'completed',
    })

    expect(captured).toEqual([
      { field: 'planningSessionId', value: SESSION_ID },
      { field: 'status', value: 'completed' },
    ])
  })

  it('returns empty array when no plans match', async () => {
    const { ctx } = makeCtx([])

    const result = await listBySessionHandler(ctx as any, { sessionId: SESSION_ID })

    expect(result).toEqual([])
  })
})
