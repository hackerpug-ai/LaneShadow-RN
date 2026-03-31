/**
 * Tests for routePlans.ts CRUD and status management.
 *
 * These tests exercise behavior via exported handler functions that can be
 * unit-tested without a running Convex backend.
 */

import { ConvexError } from 'convex/values'

import { ERROR_CODES } from '../../errors'
import type { Id } from '../../_generated/dataModel'
import {
  createPlanHandler,
  getActivePlanHandler,
  getPlanByIdHandler,
  updatePlanStatusHandler,
  cancelPlanHandler,
} from '../routePlans'

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
        query: jest.fn().mockReturnValue({
          withIndex: jest.fn().mockReturnValue({
            filter: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue(PLAN_ID),
        patch: jest.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        runAfter: jest.fn().mockResolvedValue(SCHEDULED_ACTION_ID),
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
        query: jest.fn().mockReturnValue({
          withIndex: jest.fn().mockReturnValue({
            filter: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue(PLAN_ID),
        patch: jest.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        runAfter: jest.fn().mockResolvedValue(SCHEDULED_ACTION_ID),
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
        query: jest.fn().mockReturnValue({
          withIndex: jest.fn().mockReturnValue({
            filter: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(existingPlan),
            }),
          }),
        }),
        insert: jest.fn(),
        patch: jest.fn(),
      },
      scheduler: {
        runAfter: jest.fn(),
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
        query: jest.fn().mockReturnValue({
          withIndex: jest.fn().mockReturnValue({
            filter: jest.fn().mockReturnValue({
              first: jest.fn().mockImplementation(() => {
                callCount++
                if (callCount === 1) return Promise.resolve(null)
                return Promise.resolve(existingPlan)
              }),
            }),
          }),
        }),
        insert: jest.fn(),
        patch: jest.fn(),
      },
      scheduler: {
        runAfter: jest.fn(),
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
        query: jest.fn().mockReturnValue({
          withIndex: jest.fn().mockReturnValue({
            filter: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(null),
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
        query: jest.fn().mockReturnValue({
          withIndex: jest.fn().mockReturnValue({
            filter: jest.fn().mockReturnValue({
              first: jest.fn().mockResolvedValue(pendingPlan),
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
        query: jest.fn().mockReturnValue({
          withIndex: jest.fn().mockReturnValue({
            filter: jest.fn().mockReturnValue({
              first: jest.fn().mockImplementation(() => {
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
        get: jest.fn().mockResolvedValue(plan),
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
        get: jest.fn().mockResolvedValue(null),
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
        get: jest.fn().mockResolvedValue(plan),
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
        get: jest.fn().mockResolvedValue(plan),
        patch: jest.fn().mockResolvedValue(undefined),
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
        get: jest.fn().mockResolvedValue(plan),
        patch: jest.fn().mockResolvedValue(undefined),
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
        get: jest.fn().mockResolvedValue(plan),
        patch: jest.fn().mockResolvedValue(undefined),
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
        get: jest.fn().mockResolvedValue(plan),
        patch: jest.fn().mockResolvedValue(undefined),
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
        get: jest.fn().mockResolvedValue(plan),
        patch: jest.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: jest.fn().mockResolvedValue(undefined),
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
        get: jest.fn().mockResolvedValue(plan),
        patch: jest.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: jest.fn().mockResolvedValue(undefined),
      },
    }

    await cancelPlanHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)

    expect(ctx.scheduler.cancel).toHaveBeenCalledWith(SCHEDULED_ACTION_ID)
  })

  it('AC-5: still patches cancelled when no scheduledActionId present', async () => {
    const plan = makePlanDoc({ status: 'pending' }) // no scheduledActionId
    const ctx = {
      db: {
        get: jest.fn().mockResolvedValue(plan),
        patch: jest.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: jest.fn(),
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
        get: jest.fn().mockResolvedValue(null),
        patch: jest.fn(),
      },
      scheduler: {
        cancel: jest.fn(),
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
        get: jest.fn().mockResolvedValue(plan),
        patch: jest.fn(),
      },
      scheduler: {
        cancel: jest.fn(),
      },
    }

    await expect(
      cancelPlanHandler(ctx as any, { routePlanId: PLAN_ID }, CLERK_USER_ID)
    ).rejects.toThrow(ERROR_CODES.PLAN_NOT_FOUND)
  })
})
