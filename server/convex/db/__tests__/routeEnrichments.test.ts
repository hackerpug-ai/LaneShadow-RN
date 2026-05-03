/**
 * Tests for routeEnrichments.ts CRUD and status management.
 *
 * These tests exercise behavior via exported handler functions that can be
 * unit-tested without a running Convex backend.
 */

import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../../_generated/dataModel'

// These imports will fail until we implement the module
import {
  cancelEnrichmentHandler,
  completeEnrichmentHandler,
  createEnrichmentHandler,
  failEnrichmentHandler,
  findByContentFingerprintHandler,
  findByRoutePlanIdHandler,
  getByIdHandler,
  invalidateStaleEnrichmentsHandler,
  listHandler,
  updateStatusHandler,
} from '../routeEnrichments'

// ---------------------------------------------------------------------------
// AC-1: CRUD operations exist in convex/db/routeEnrichments.ts
// ---------------------------------------------------------------------------

const CLERK_USER_ID = 'user_test_123'
const OTHER_USER_ID = 'user_other_456'
const ENRICHMENT_ID = 'route_enrichments_id_abc' as Id<'route_enrichments'>
const ROUTE_PLAN_ID = 'route_plans_id_xyz' as Id<'route_plans'>
const SCHEDULED_JOB_ID = 'sched_job_id' as Id<'_scheduled_functions'>
const PLANNING_SESSION_ID = 'planning_sessions_id_123' as Id<'planning_sessions'>

const makeEnrichmentDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: ENRICHMENT_ID,
  _creationTime: 1000,
  routePlanId: ROUTE_PLAN_ID,
  planningSessionId: PLANNING_SESSION_ID,
  clerkUserId: CLERK_USER_ID,
  contentFingerprint: 'abc123',
  phase: 'fast' as const,
  status: 'pending' as const,
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 5000,
  ...overrides,
})

const makeRoutePlanDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: ROUTE_PLAN_ID,
  _creationTime: 1000,
  clerkUserId: CLERK_USER_ID,
  planInput: { from: 'A', to: 'B' },
  status: 'pending' as const,
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 5000,
  ...overrides,
})

const makeHourlyEntry = (forecastTime: number, overrides: Record<string, unknown> = {}) => ({
  forecastTime,
  temperature: 72,
  windSpeed: 10,
  windDirection: 180,
  rainProbability: 0.1,
  ...overrides,
})

describe('createEnrichmentHandler', () => {
  it('AC-3: creates enrichment with status=pending and returns enrichmentId', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(ENRICHMENT_ID),
      },
    }

    const result = await createEnrichmentHandler(ctx as any, {
      routePlanId: ROUTE_PLAN_ID,
      planningSessionId: PLANNING_SESSION_ID,
      clerkUserId: CLERK_USER_ID,
      contentFingerprint: 'abc123',
      phase: 'fast',
    })

    expect(ctx.db.insert).toHaveBeenCalledWith(
      'route_enrichments',
      expect.objectContaining({
        routePlanId: ROUTE_PLAN_ID,
        clerkUserId: CLERK_USER_ID,
        contentFingerprint: 'abc123',
        phase: 'fast',
        status: 'pending',
      }),
    )
    expect(result).toEqual({ enrichmentId: ENRICHMENT_ID })
  })
})

describe('getByIdHandler', () => {
  it('AC-3: returns enrichment by ID', async () => {
    const doc = makeEnrichmentDoc()
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(doc),
      },
    }

    const result = await getByIdHandler(ctx as any, { enrichmentId: ENRICHMENT_ID })

    expect(ctx.db.get).toHaveBeenCalledWith(ENRICHMENT_ID)
    expect(result).toEqual(doc)
  })

  it('AC-3: returns null when enrichment not found', async () => {
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(null),
      },
    }

    const result = await getByIdHandler(ctx as any, { enrichmentId: ENRICHMENT_ID })

    expect(result).toBeNull()
  })
})

describe('updateStatusHandler', () => {
  it('AC-3: updates enrichment status', async () => {
    const ctx = {
      db: {
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await updateStatusHandler(ctx as any, {
      enrichmentId: ENRICHMENT_ID,
      status: 'running',
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      ENRICHMENT_ID,
      expect.objectContaining({
        status: 'running',
        updatedAt: expect.any(Number),
      }),
    )
  })
})

describe('completeEnrichmentHandler', () => {
  it('AC-3: marks enrichment as completed with results', async () => {
    const enrichments = [
      {
        routeOptionId: 'opt1',
        label: 'Scenic Route',
        rationale: 'Beautiful views',
        highlights: ['Coastal drive', 'Mountain pass'],
      },
    ]
    const ctx = {
      db: {
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await completeEnrichmentHandler(ctx as any, {
      enrichmentId: ENRICHMENT_ID,
      enrichments,
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      ENRICHMENT_ID,
      expect.objectContaining({
        status: 'completed',
        enrichments,
        completedAt: expect.any(Number),
        updatedAt: expect.any(Number),
      }),
    )
  })
})

describe('failEnrichmentHandler', () => {
  it('AC-3: marks enrichment as failed with error message', async () => {
    const ctx = {
      db: {
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    await failEnrichmentHandler(ctx as any, {
      enrichmentId: ENRICHMENT_ID,
      error: 'API rate limit exceeded',
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      ENRICHMENT_ID,
      expect.objectContaining({
        status: 'failed',
        error: 'API rate limit exceeded',
        updatedAt: expect.any(Number),
      }),
    )
  })
})

describe('cancelEnrichmentHandler', () => {
  it('AC-3: cancels enrichment and scheduled job', async () => {
    const doc = makeEnrichmentDoc({
      status: 'running',
      scheduledJobId: SCHEDULED_JOB_ID,
    })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(doc),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await cancelEnrichmentHandler(ctx as any, {
      enrichmentId: ENRICHMENT_ID,
    })

    expect(ctx.scheduler.cancel).toHaveBeenCalledWith(SCHEDULED_JOB_ID)
    expect(ctx.db.patch).toHaveBeenCalledWith(
      ENRICHMENT_ID,
      expect.objectContaining({
        status: 'cancelled',
        updatedAt: expect.any(Number),
      }),
    )
  })

  it('AC-3: handles cancellation when no scheduled job exists', async () => {
    const doc = makeEnrichmentDoc({
      status: 'pending',
      scheduledJobId: undefined,
    })
    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(doc),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await cancelEnrichmentHandler(ctx as any, {
      enrichmentId: ENRICHMENT_ID,
    })

    expect(ctx.scheduler.cancel).not.toHaveBeenCalled()
    expect(ctx.db.patch).toHaveBeenCalledWith(
      ENRICHMENT_ID,
      expect.objectContaining({
        status: 'cancelled',
      }),
    )
  })
})

describe('findByRoutePlanIdHandler', () => {
  it('AC-3: returns all enrichments for a route plan', async () => {
    const docs = [
      makeEnrichmentDoc(),
      makeEnrichmentDoc({ _id: 'other_id' as Id<'route_enrichments'> }),
    ]
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue(docs),
          }),
        }),
      },
    }

    const result = await findByRoutePlanIdHandler(ctx as any, {
      routePlanId: ROUTE_PLAN_ID,
    })

    expect(ctx.db.query).toHaveBeenCalledWith('route_enrichments')
    expect(result).toEqual(docs)
  })
})

describe('findByContentFingerprintHandler', () => {
  it('AC-3: returns enrichment by content fingerprint and phase', async () => {
    const doc = makeEnrichmentDoc()
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            unique: vi.fn().mockResolvedValue(doc),
          }),
        }),
      },
    }

    const result = await findByContentFingerprintHandler(ctx as any, {
      contentFingerprint: 'abc123',
      phase: 'fast',
    })

    expect(ctx.db.query).toHaveBeenCalledWith('route_enrichments')
    expect(result).toEqual(doc)
  })

  it('AC-3: returns null when no matching enrichment found', async () => {
    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            unique: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
    }

    const result = await findByContentFingerprintHandler(ctx as any, {
      contentFingerprint: 'abc123',
      phase: 'fast',
    })

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// NEW TESTS: AC-1 through AC-5 for list query
// ---------------------------------------------------------------------------

describe('listHandler', () => {
  it('TC-1: returns entries array with length 3 and status pending, with non-decreasing forecastTime', async () => {
    const now = Date.now()
    const routePlan = makeRoutePlanDoc({ clerkUserId: CLERK_USER_ID })
    const enrichment = makeEnrichmentDoc({
      entries: [
        makeHourlyEntry(now + 3600000), // t+1h
        makeHourlyEntry(now), // t
        makeHourlyEntry(now + 7200000), // t+2h
      ],
      status: 'pending',
    })

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([enrichment]),
          }),
        }),
        get: vi.fn().mockResolvedValue(routePlan),
      },
    }

    const result = await listHandler(ctx as any, {
      routePlanId: ROUTE_PLAN_ID,
      clerkUserId: CLERK_USER_ID,
    })

    // TC-1: Assert entries.length === 3
    expect(result.entries).toHaveLength(3)
    // TC-1: Assert status is pending
    expect(result.status).toBe('pending')
    // TC-1: Assert entries are non-decreasing
    for (let i = 0; i < result.entries.length - 1; i++) {
      expect(result.entries[i].forecastTime).toBeLessThanOrEqual(result.entries[i + 1].forecastTime)
    }
  })

  it('AC-2: returns empty entries for cross-user request', async () => {
    const routePlan = makeRoutePlanDoc({ clerkUserId: CLERK_USER_ID })

    const ctx = {
      db: {
        get: vi.fn().mockResolvedValue(routePlan),
      },
    }

    const result = await listHandler(ctx as any, {
      routePlanId: ROUTE_PLAN_ID,
      clerkUserId: OTHER_USER_ID,
    })

    expect(result.entries).toEqual([])
    expect(result.status).toBe('pending')
  })

  it('AC-3: returns entries sorted chronologically by forecastTime ascending', async () => {
    const now = Date.now()
    const routePlan = makeRoutePlanDoc({ clerkUserId: CLERK_USER_ID })
    const enrichment = makeEnrichmentDoc({
      entries: [
        makeHourlyEntry(now + 7200000), // t+2h
        makeHourlyEntry(now), // t
        makeHourlyEntry(now + 3600000), // t+1h
      ],
      status: 'pending',
    })

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([enrichment]),
          }),
        }),
        get: vi.fn().mockResolvedValue(routePlan),
      },
    }

    const result = await listHandler(ctx as any, {
      routePlanId: ROUTE_PLAN_ID,
      clerkUserId: CLERK_USER_ID,
    })

    expect(result.entries).toHaveLength(3)
    // Check entries are sorted chronologically
    expect(result.entries[0].forecastTime).toBe(now)
    expect(result.entries[1].forecastTime).toBe(now + 3600000)
    expect(result.entries[2].forecastTime).toBe(now + 7200000)
  })

  it('TC-4: handler returns current enrichment status (reactive behavior)', async () => {
    const now = Date.now()
    const routePlan = makeRoutePlanDoc({ clerkUserId: CLERK_USER_ID })
    const entries = [
      { forecastTime: now, temperature: 72, windSpeed: 10 },
      { forecastTime: now + 3600000, temperature: 70, windSpeed: 12 },
      { forecastTime: now + 7200000, temperature: 68, windSpeed: 14 },
    ]

    // Test 1: handler returns PENDING status when enrichment is pending
    const pendingEnrichment = makeEnrichmentDoc({
      entries,
      status: 'pending' as const,
    })

    const ctxPending = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([pendingEnrichment]),
          }),
        }),
        get: vi.fn().mockResolvedValue(routePlan),
      },
    }

    const resultPending = await listHandler(ctxPending as any, {
      routePlanId: ROUTE_PLAN_ID,
      clerkUserId: CLERK_USER_ID,
    })

    expect(resultPending.status).toBe('pending')
    expect(resultPending.entries).toHaveLength(3)

    // Test 2: handler returns COMPLETED status when enrichment is completed
    const completedEnrichment = makeEnrichmentDoc({
      entries,
      status: 'completed' as const,
    })

    const ctxCompleted = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([completedEnrichment]),
          }),
        }),
        get: vi.fn().mockResolvedValue(routePlan),
      },
    }

    const resultCompleted = await listHandler(ctxCompleted as any, {
      routePlanId: ROUTE_PLAN_ID,
      clerkUserId: CLERK_USER_ID,
    })

    expect(resultCompleted.status).toBe('completed')
    expect(resultCompleted.entries).toHaveLength(3)
  })

  it('AC-5: uses withIndex for efficient lookup', async () => {
    const now = Date.now()
    const routePlan = makeRoutePlanDoc({ clerkUserId: CLERK_USER_ID })
    const enrichment = makeEnrichmentDoc({
      entries: [makeHourlyEntry(now)],
      status: 'pending',
    })

    const mockWithIndex = vi.fn().mockReturnValue({
      collect: vi.fn().mockResolvedValue([enrichment]),
    })

    const ctx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: mockWithIndex,
        }),
        get: vi.fn().mockResolvedValue(routePlan),
      },
    }

    await listHandler(ctx as any, {
      routePlanId: ROUTE_PLAN_ID,
      clerkUserId: CLERK_USER_ID,
    })

    // Verify withIndex was called with the correct index name
    expect(mockWithIndex).toHaveBeenCalledWith('by_routePlanId', expect.any(Function))
  })
})

// ---------------------------------------------------------------------------
// AC-1 through AC-5: Invalidation of stale enrichments when new route is created
// ---------------------------------------------------------------------------

const NEW_ROUTE_PLAN_ID = 'route_plans_new' as Id<'route_plans'>

// Helper to create mock query builder that mimics Convex query chain
const createMockQueryBuilder = (result: any[]) => ({
  collect: vi.fn().mockResolvedValue(result),
})

// Helper to create mock withIndex that handles the callback pattern
const createMockWithIndex = (result: any[]) => {
  return vi.fn((indexName: string, callback: any) => {
    // Create a query builder mock for the callback
    const queryBuilder = {
      eq: vi.fn().mockReturnThis(),
    }
    // Call the callback with the query builder
    callback(queryBuilder)
    // Return the final query builder with collect
    return createMockQueryBuilder(result)
  })
}

describe('invalidateStaleEnrichmentsHandler', () => {
  it('AC-1: finds all pending/running enrichments for the planning session', async () => {
    const oldRoutePlanId = 'route_plans_old' as Id<'route_plans'>
    const staleEnrichment1 = makeEnrichmentDoc({
      _id: 'enrich1' as Id<'route_enrichments'>,
      routePlanId: oldRoutePlanId,
      planningSessionId: PLANNING_SESSION_ID,
      status: 'running' as const,
      scheduledJobId: 'job1' as Id<'_scheduled_functions'>,
    })
    const staleEnrichment2 = makeEnrichmentDoc({
      _id: 'enrich2' as Id<'route_enrichments'>,
      routePlanId: oldRoutePlanId,
      planningSessionId: PLANNING_SESSION_ID,
      status: 'pending' as const,
      scheduledJobId: 'job2' as Id<'_scheduled_functions'>,
    })

    const ctx = {
      db: {
        query: vi.fn(() => {
          return {
            withIndex: createMockWithIndex([staleEnrichment1, staleEnrichment2]),
          }
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await invalidateStaleEnrichmentsHandler(ctx as any, {
      planningSessionId: PLANNING_SESSION_ID,
      newRoutePlanId: NEW_ROUTE_PLAN_ID,
    })

    // Verify query was called for route_enrichments with planning session index
    expect(ctx.db.query).toHaveBeenCalledWith('route_enrichments')
  })

  it('AC-2: cancels scheduled jobs for stale enrichments', async () => {
    const oldRoutePlanId = 'route_plans_old' as Id<'route_plans'>
    const staleEnrichment = makeEnrichmentDoc({
      routePlanId: oldRoutePlanId,
      planningSessionId: PLANNING_SESSION_ID,
      status: 'running' as const,
      scheduledJobId: SCHEDULED_JOB_ID,
    })

    const ctx = {
      db: {
        query: vi.fn(() => {
          return {
            withIndex: createMockWithIndex([staleEnrichment]),
          }
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await invalidateStaleEnrichmentsHandler(ctx as any, {
      planningSessionId: PLANNING_SESSION_ID,
      newRoutePlanId: NEW_ROUTE_PLAN_ID,
    })

    expect(ctx.scheduler.cancel).toHaveBeenCalledWith(SCHEDULED_JOB_ID)
  })

  it('AC-3: marks stale enrichments as cancelled', async () => {
    const oldRoutePlanId = 'route_plans_old' as Id<'route_plans'>
    const staleEnrichment = makeEnrichmentDoc({
      _id: 'enrich1' as Id<'route_enrichments'>,
      routePlanId: oldRoutePlanId,
      planningSessionId: PLANNING_SESSION_ID,
      status: 'running' as const,
      scheduledJobId: SCHEDULED_JOB_ID,
    })

    const ctx = {
      db: {
        query: vi.fn(() => {
          return {
            withIndex: createMockWithIndex([staleEnrichment]),
          }
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await invalidateStaleEnrichmentsHandler(ctx as any, {
      planningSessionId: PLANNING_SESSION_ID,
      newRoutePlanId: NEW_ROUTE_PLAN_ID,
    })

    expect(ctx.db.patch).toHaveBeenCalledWith(
      'enrich1' as Id<'route_enrichments'>,
      expect.objectContaining({
        status: 'cancelled',
        updatedAt: expect.any(Number),
      }),
    )
  })

  it('AC-4: does not cancel enrichments for other planning sessions', async () => {
    const oldRoutePlanId = 'route_plans_old' as Id<'route_plans'>
    const otherSessionId = 'other_session' as Id<'planning_sessions'>
    const _staleEnrichment = makeEnrichmentDoc({
      routePlanId: oldRoutePlanId,
      planningSessionId: otherSessionId,
      status: 'running' as const,
      scheduledJobId: SCHEDULED_JOB_ID,
    })

    const ctx = {
      db: {
        query: vi.fn(() => {
          // Return empty array since the enrichment has a different planningSessionId
          // The index filter would exclude it in a real query
          return {
            withIndex: createMockWithIndex([]),
          }
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await invalidateStaleEnrichmentsHandler(ctx as any, {
      planningSessionId: PLANNING_SESSION_ID,
      newRoutePlanId: NEW_ROUTE_PLAN_ID,
    })

    // Should NOT cancel since the query returns no results for this session
    expect(ctx.scheduler.cancel).not.toHaveBeenCalled()
    expect(ctx.db.patch).not.toHaveBeenCalled()
  })

  it('AC-5: handles case where no stale enrichments exist', async () => {
    const ctx = {
      db: {
        query: vi.fn(() => {
          return {
            withIndex: createMockWithIndex([]),
          }
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await invalidateStaleEnrichmentsHandler(ctx as any, {
      planningSessionId: PLANNING_SESSION_ID,
      newRoutePlanId: NEW_ROUTE_PLAN_ID,
    })

    expect(ctx.scheduler.cancel).not.toHaveBeenCalled()
    expect(ctx.db.patch).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // US-059 Remediation Tests
  // ---------------------------------------------------------------------------

  it('US-059-AC-4: preserves completed enrichments when new route is created', async () => {
    const oldRoutePlanId = 'route_plans_old' as Id<'route_plans'>
    const completedEnrichment = makeEnrichmentDoc({
      _id: 'completed_enrich' as Id<'route_enrichments'>,
      routePlanId: oldRoutePlanId,
      planningSessionId: PLANNING_SESSION_ID,
      status: 'completed' as const,
      scheduledJobId: undefined,
    })
    const pendingEnrichment = makeEnrichmentDoc({
      _id: 'pending_enrich' as Id<'route_enrichments'>,
      routePlanId: oldRoutePlanId,
      planningSessionId: PLANNING_SESSION_ID,
      status: 'pending' as const,
      scheduledJobId: SCHEDULED_JOB_ID,
    })

    const ctx = {
      db: {
        query: vi.fn(() => {
          return {
            withIndex: createMockWithIndex([completedEnrichment, pendingEnrichment]),
          }
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await invalidateStaleEnrichmentsHandler(ctx as any, {
      planningSessionId: PLANNING_SESSION_ID,
      newRoutePlanId: NEW_ROUTE_PLAN_ID,
    })

    // Should only cancel the pending enrichment, not the completed one
    expect(ctx.scheduler.cancel).toHaveBeenCalledTimes(1)
    expect(ctx.scheduler.cancel).toHaveBeenCalledWith(SCHEDULED_JOB_ID)
    expect(ctx.db.patch).toHaveBeenCalledWith(
      'pending_enrich' as Id<'route_enrichments'>,
      expect.objectContaining({
        status: 'cancelled',
      }),
    )
    // Completed enrichment should NOT be patched
    expect(ctx.db.patch).not.toHaveBeenCalledWith(
      'completed_enrich' as Id<'route_enrichments'>,
      expect.objectContaining({
        status: 'cancelled',
      }),
    )
  })

  it('US-059-AC-3: handles scheduler.cancel errors gracefully and still marks enrichment as cancelled', async () => {
    const oldRoutePlanId = 'route_plans_old' as Id<'route_plans'>
    const staleEnrichment = makeEnrichmentDoc({
      _id: 'enrich1' as Id<'route_enrichments'>,
      routePlanId: oldRoutePlanId,
      planningSessionId: PLANNING_SESSION_ID,
      status: 'running' as const,
      scheduledJobId: SCHEDULED_JOB_ID,
    })

    const ctx = {
      db: {
        query: vi.fn(() => {
          return {
            withIndex: createMockWithIndex([staleEnrichment]),
          }
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockRejectedValue(new Error('Scheduler service unavailable')),
      },
    }

    // Should not throw despite scheduler.cancel error
    await invalidateStaleEnrichmentsHandler(ctx as any, {
      planningSessionId: PLANNING_SESSION_ID,
      newRoutePlanId: NEW_ROUTE_PLAN_ID,
    })
    // If we get here, the function completed without throwing

    // Should still mark enrichment as cancelled despite scheduler error
    expect(ctx.db.patch).toHaveBeenCalledWith(
      'enrich1' as Id<'route_enrichments'>,
      expect.objectContaining({
        status: 'cancelled',
        updatedAt: expect.any(Number),
      }),
    )
  })

  it('US-059-AC-2: uses single query to fetch all stale enrichments via planningSessionId index', async () => {
    const oldRoutePlanId = 'route_plans_old' as Id<'route_plans'>
    const staleEnrichment1 = makeEnrichmentDoc({
      _id: 'enrich1' as Id<'route_enrichments'>,
      routePlanId: oldRoutePlanId,
      planningSessionId: PLANNING_SESSION_ID,
      status: 'running' as const,
      scheduledJobId: 'job1' as Id<'_scheduled_functions'>,
    })
    const staleEnrichment2 = makeEnrichmentDoc({
      _id: 'enrich2' as Id<'route_enrichments'>,
      routePlanId: oldRoutePlanId,
      planningSessionId: PLANNING_SESSION_ID,
      status: 'pending' as const,
      scheduledJobId: 'job2' as Id<'_scheduled_functions'>,
    })

    const indexCalls: any[] = []
    const ctx = {
      db: {
        query: vi.fn((table: string) => {
          if (table === 'route_enrichments') {
            return {
              withIndex: vi.fn((indexName: string, callback: any) => {
                indexCalls.push({ table, index: indexName })
                const queryBuilder = {
                  eq: vi.fn().mockReturnThis(),
                }
                callback(queryBuilder)
                return {
                  collect: vi.fn().mockResolvedValue([staleEnrichment1, staleEnrichment2]),
                }
              }),
            }
          }
          return {
            withIndex: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([]),
            }),
          }
        }),
        patch: vi.fn().mockResolvedValue(undefined),
      },
      scheduler: {
        cancel: vi.fn().mockResolvedValue(undefined),
      },
    }

    await invalidateStaleEnrichmentsHandler(ctx as any, {
      planningSessionId: PLANNING_SESSION_ID,
      newRoutePlanId: NEW_ROUTE_PLAN_ID,
    })

    // Should query route_enrichments with the planning session index
    expect(indexCalls).toHaveLength(1)
    expect(indexCalls[0]).toEqual({
      table: 'route_enrichments',
      index: 'by_planningSessionId_and_status',
    })
  })
})
