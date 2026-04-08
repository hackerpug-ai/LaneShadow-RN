/**
 * Tests for routeEnrichments.ts CRUD and status management.
 *
 * These tests exercise behavior via exported handler functions that can be
 * unit-tested without a running Convex backend.
 */

import { vi, describe, it, expect } from 'vitest'
import schema from '../../schema'
import type { Id } from '../../_generated/dataModel'

// These imports will fail until we implement the module
import {
  createEnrichmentHandler,
  getByIdHandler,
  updateStatusHandler,
  completeEnrichmentHandler,
  failEnrichmentHandler,
  cancelEnrichmentHandler,
  findByRoutePlanIdHandler,
  findByContentFingerprintHandler,
} from '../routeEnrichments'

// ---------------------------------------------------------------------------
// AC-1: route_enrichments table exists in schema.ts
// ---------------------------------------------------------------------------

describe('route_enrichments schema', () => {
  it('AC-1: route_enrichments table exists in schema', () => {
    // This will fail if the table doesn't exist
    expect(schema.tables).toHaveProperty('route_enrichments')
  })

  it('AC-2: has by_routePlanId index', () => {
    const table = schema.tables.route_enrichments as any
    expect(table).toBeDefined()
    const indexDescriptors = table.indexes.map((idx: any) => idx.indexDescriptor)
    expect(indexDescriptors).toContain('by_routePlanId')
  })

  it('AC-2: has by_contentFingerprint_and_phase index', () => {
    const table = schema.tables.route_enrichments as any
    expect(table).toBeDefined()
    const indexDescriptors = table.indexes.map((idx: any) => idx.indexDescriptor)
    expect(indexDescriptors).toContain('by_contentFingerprint_and_phase')
  })
})

// ---------------------------------------------------------------------------
// AC-3: CRUD operations exist in convex/db/routeEnrichments.ts
// ---------------------------------------------------------------------------

const CLERK_USER_ID = 'user_test_123'
const ENRICHMENT_ID = 'route_enrichments_id_abc' as Id<'route_enrichments'>
const ROUTE_PLAN_ID = 'route_plans_id_xyz' as Id<'route_plans'>
const SCHEDULED_JOB_ID = 'sched_job_id' as Id<'_scheduled_functions'>

const makeEnrichmentDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: ENRICHMENT_ID,
  _creationTime: 1000,
  routePlanId: ROUTE_PLAN_ID,
  clerkUserId: CLERK_USER_ID,
  contentFingerprint: 'abc123',
  phase: 'fast' as const,
  status: 'pending' as const,
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 5000,
  ...overrides,
})

describe('createEnrichmentHandler', () => {
  it('AC-3: creates enrichment with status=pending and returns enrichmentId', async () => {
    const ctx = {
      db: {
        insert: vi.fn().mockResolvedValue(ENRICHMENT_ID),
      },
    }

    const result = await createEnrichmentHandler(
      ctx as any,
      {
        routePlanId: ROUTE_PLAN_ID,
        clerkUserId: CLERK_USER_ID,
        contentFingerprint: 'abc123',
        phase: 'fast',
      }
    )

    expect(ctx.db.insert).toHaveBeenCalledWith(
      'route_enrichments',
      expect.objectContaining({
        routePlanId: ROUTE_PLAN_ID,
        clerkUserId: CLERK_USER_ID,
        contentFingerprint: 'abc123',
        phase: 'fast',
        status: 'pending',
      })
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
      })
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
      })
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
      })
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
      })
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
      })
    )
  })
})

describe('findByRoutePlanIdHandler', () => {
  it('AC-3: returns all enrichments for a route plan', async () => {
    const docs = [makeEnrichmentDoc(), makeEnrichmentDoc({ _id: 'other_id' as Id<'route_enrichments'> })]
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
