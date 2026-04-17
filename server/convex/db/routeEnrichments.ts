import { v } from 'convex/values'

import {
  routeEnrichmentStatusValidator,
  ROUTE_ENRICHMENT_STATUS,
  routeEnrichmentPhaseValidator,
  type RouteEnrichment,
  type RouteEnrichmentStatus,
} from '../../models/route-enrichments'
import { internal } from '../_generated/api'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, internalQuery, query } from '../_generated/server'

type RouteEnrichmentDoc = Doc<'route_enrichments'>

// ---------------------------------------------------------------------------
// Types for testable handler contexts
// ---------------------------------------------------------------------------

type CreateEnrichmentCtx = {
  db: {
    insert: (table: string, fields: object) => Promise<Id<'route_enrichments'>>
  }
}

type GetEnrichmentCtx = {
  db: {
    get: (id: Id<'route_enrichments'>) => Promise<RouteEnrichmentDoc | null>
  }
}

type UpdateEnrichmentCtx = {
  db: {
    patch: (id: Id<'route_enrichments'>, fields: object) => Promise<void>
  }
}

type CancelEnrichmentCtx = {
  db: {
    get: (id: Id<'route_enrichments'>) => Promise<RouteEnrichmentDoc | null>
    patch: (id: Id<'route_enrichments'>, fields: object) => Promise<void>
  }
  scheduler: {
    cancel: (id: Id<'_scheduled_functions'>) => Promise<void>
  }
}

type FindByRoutePlanCtx = {
  db: {
    query: (table: string) => any
  }
}

type FindByFingerprintCtx = {
  db: {
    query: (table: string) => any
  }
}

type InvalidateStaleEnrichmentsCtx = {
  db: {
    query: (table: string) => any
    patch: (id: Id<'route_enrichments'>, fields: object) => Promise<void>
  }
  scheduler: {
    cancel: (id: Id<'_scheduled_functions'>) => Promise<void>
  }
}

// ---------------------------------------------------------------------------
// Exported handler functions (testable without Convex runtime)
// ---------------------------------------------------------------------------

export const createEnrichmentHandler = async (
  ctx: CreateEnrichmentCtx,
  args: {
    routePlanId: Id<'route_plans'>
    planningSessionId: Id<'planning_sessions'>
    clerkUserId: string
    contentFingerprint: string
    phase: 'fast' | 'extended'
  }
): Promise<{ enrichmentId: Id<'route_enrichments'> }> => {
  const now = Date.now()

  const enrichmentId = await ctx.db.insert('route_enrichments', {
    routePlanId: args.routePlanId,
    planningSessionId: args.planningSessionId,
    clerkUserId: args.clerkUserId,
    contentFingerprint: args.contentFingerprint,
    phase: args.phase,
    status: ROUTE_ENRICHMENT_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  })

  return { enrichmentId }
}

export const getByIdHandler = async (
  ctx: GetEnrichmentCtx,
  args: { enrichmentId: Id<'route_enrichments'> }
): Promise<RouteEnrichmentDoc | null> => {
  return await ctx.db.get(args.enrichmentId)
}

export const updateStatusHandler = async (
  ctx: UpdateEnrichmentCtx,
  args: {
    enrichmentId: Id<'route_enrichments'>
    status: RouteEnrichmentStatus
  }
): Promise<void> => {
  const now = Date.now()

  await ctx.db.patch(args.enrichmentId, {
    status: args.status,
    updatedAt: now,
  })
}

export const updateEnrichmentHandler = async (
  ctx: UpdateEnrichmentCtx,
  args: {
    enrichmentId: Id<'route_enrichments'>
    scheduledJobId: Id<'_scheduled_functions'>
  }
): Promise<void> => {
  const now = Date.now()

  await ctx.db.patch(args.enrichmentId, {
    scheduledJobId: args.scheduledJobId,
    updatedAt: now,
  })
}

export const completeEnrichmentHandler = async (
  ctx: UpdateEnrichmentCtx,
  args: {
    enrichmentId: Id<'route_enrichments'>
    enrichments: RouteEnrichment['enrichments']
  }
): Promise<void> => {
  const now = Date.now()

  await ctx.db.patch(args.enrichmentId, {
    status: ROUTE_ENRICHMENT_STATUS.COMPLETED,
    enrichments: args.enrichments,
    completedAt: now,
    updatedAt: now,
  })
}

export const failEnrichmentHandler = async (
  ctx: UpdateEnrichmentCtx,
  args: {
    enrichmentId: Id<'route_enrichments'>
    error: string
  }
): Promise<void> => {
  const now = Date.now()

  await ctx.db.patch(args.enrichmentId, {
    status: ROUTE_ENRICHMENT_STATUS.FAILED,
    error: args.error,
    updatedAt: now,
  })
}

export const cancelEnrichmentHandler = async (
  ctx: CancelEnrichmentCtx,
  args: { enrichmentId: Id<'route_enrichments'> }
): Promise<void> => {
  const doc = await ctx.db.get(args.enrichmentId)
  if (!doc) return

  // Cancel scheduled job if it exists
  if (doc.scheduledJobId) {
    try {
      await ctx.scheduler.cancel(doc.scheduledJobId)
    } catch {
      // Silently ignore cancellation failures - enrichment should still be marked as cancelled
      // In production, this could be logged to an error tracking service
    }
  }

  const now = Date.now()
  await ctx.db.patch(args.enrichmentId, {
    status: ROUTE_ENRICHMENT_STATUS.CANCELLED,
    updatedAt: now,
  })
}

export const findByRoutePlanIdHandler = async (
  ctx: FindByRoutePlanCtx,
  args: { routePlanId: Id<'route_plans'> }
): Promise<RouteEnrichmentDoc[]> => {
  return await ctx.db
    .query('route_enrichments')
    .withIndex('by_routePlanId', (q: any) => q.eq('routePlanId', args.routePlanId))
    .collect()
}

export const findByContentFingerprintHandler = async (
  ctx: FindByFingerprintCtx,
  args: {
    contentFingerprint: string
    phase: 'fast' | 'extended'
  }
): Promise<RouteEnrichmentDoc | null> => {
  return await ctx.db
    .query('route_enrichments')
    .withIndex('by_contentFingerprint_and_phase', (q: any) =>
      q.eq('contentFingerprint', args.contentFingerprint).eq('phase', args.phase)
    )
    .unique()
}

/**
 * Invalidate stale enrichments when a new route is created in the same session.
 * Cancels scheduled jobs and marks enrichments as cancelled.
 *
 * Uses a single query with the by_planningSessionId_and_status index to avoid N+1 pattern.
 *
 * @param ctx - Database and scheduler context
 * @param args.planningSessionId - The planning session ID
 * @param args.newRoutePlanId - The new route plan ID (exclude from invalidation)
 */
export const invalidateStaleEnrichmentsHandler = async (
  ctx: InvalidateStaleEnrichmentsCtx,
  args: {
    planningSessionId: Id<'planning_sessions'>
    newRoutePlanId: Id<'route_plans'>
  }
): Promise<void> => {
  // Single query: Find all pending/running enrichments for this planning session
  const enrichments = await ctx.db
    .query('route_enrichments')
    .withIndex('by_planningSessionId_and_status', (q: any) =>
      q.eq('planningSessionId', args.planningSessionId)
    )
    .collect()

  // Cancel and mark each stale enrichment (except for the new route plan)
  for (const enrichment of enrichments) {
    // Skip enrichments for the new route plan or already completed/failed ones
    if (
      enrichment.routePlanId === args.newRoutePlanId ||
      enrichment.status === 'completed' ||
      enrichment.status === 'failed' ||
      enrichment.status === 'cancelled'
    ) {
      continue
    }

    // Cancel scheduled job if it exists
    if (enrichment.scheduledJobId) {
      try {
        await ctx.scheduler.cancel(enrichment.scheduledJobId)
      } catch {
        // Silently ignore cancellation failures - enrichment should still be marked as cancelled
        // In production, this could be logged to an error tracking service
      }
    }

    // Mark as cancelled
    await ctx.db.patch(enrichment._id, {
      status: 'cancelled',
      updatedAt: Date.now(),
    })
  }

  return Promise.resolve()
}

// ---------------------------------------------------------------------------
// Convex internal mutations and queries
// ---------------------------------------------------------------------------

// When calling functions defined in the same module, route through a local reference
// to avoid Convex/TS circular inference issues.
const internalRouteEnrichments = (internal as any).db.routeEnrichments

export const createEnrichment = internalMutation({
  args: {
    routePlanId: v.id('route_plans'),
    planningSessionId: v.id('planning_sessions'),
    clerkUserId: v.string(),
    contentFingerprint: v.string(),
    phase: routeEnrichmentPhaseValidator,
  },
  returns: v.object({ enrichmentId: v.id('route_enrichments') }),
  handler: async (ctx, args): Promise<{ enrichmentId: Id<'route_enrichments'> }> => {
    return createEnrichmentHandler(ctx as any, args)
  },
})

export const getById = internalQuery({
  args: { enrichmentId: v.id('route_enrichments') },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args): Promise<RouteEnrichmentDoc | null> => {
    return getByIdHandler(ctx, args)
  },
})

export const updateStatus = internalMutation({
  args: {
    enrichmentId: v.id('route_enrichments'),
    status: routeEnrichmentStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await updateStatusHandler(ctx, args)
    return null
  },
})

export const updateEnrichment = internalMutation({
  args: {
    enrichmentId: v.id('route_enrichments'),
    scheduledJobId: v.id('_scheduled_functions'),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await updateEnrichmentHandler(ctx, args)
    return null
  },
})

export const completeEnrichment = internalMutation({
  args: {
    enrichmentId: v.id('route_enrichments'),
    enrichments: v.optional(
      v.array(
        v.object({
          routeOptionId: v.string(),
          label: v.string(),
          rationale: v.string(),
          highlights: v.array(v.string()),
          elevation: v.optional(v.any()),
          weather: v.optional(v.any()),
        })
      )
    ),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    if (args.enrichments) {
      await completeEnrichmentHandler(ctx as any, { enrichmentId: args.enrichmentId, enrichments: args.enrichments })
    }
    return null
  },
})

export const failEnrichment = internalMutation({
  args: {
    enrichmentId: v.id('route_enrichments'),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await failEnrichmentHandler(ctx, args)
    return null
  },
})

export const cancelEnrichment = internalMutation({
  args: {
    enrichmentId: v.id('route_enrichments'),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await cancelEnrichmentHandler(ctx, args)
    return null
  },
})

export const findByRoutePlanId = internalQuery({
  args: {
    routePlanId: v.id('route_plans'),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args): Promise<RouteEnrichmentDoc[]> => {
    return findByRoutePlanIdHandler(ctx as any, args)
  },
})

/**
 * Public query: Get the most recent enrichment for a route plan
 * Used by the frontend to track enrichment status for route option cards
 */
export const getByRoutePlanId = query({
  args: {
    routePlanId: v.id('route_plans'),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args): Promise<RouteEnrichmentDoc | null> => {
    const enrichments = await findByRoutePlanIdHandler(ctx as any, args)
    // Return the most recent enrichment (sorted by createdAt desc)
    return enrichments.length > 0 ? enrichments[0] : null
  },
})

export const findByContentFingerprint = internalQuery({
  args: {
    contentFingerprint: v.string(),
    phase: routeEnrichmentPhaseValidator,
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args): Promise<RouteEnrichmentDoc | null> => {
    return findByContentFingerprintHandler(ctx as any, args)
  },
})

export const invalidateStaleEnrichments = internalMutation({
  args: {
    planningSessionId: v.id('planning_sessions'),
    newRoutePlanId: v.id('route_plans'),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await invalidateStaleEnrichmentsHandler(ctx as any, args)
    return null
  },
})
