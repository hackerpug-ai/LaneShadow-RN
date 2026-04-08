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
import { internalMutation, internalQuery } from '../_generated/server'

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

// ---------------------------------------------------------------------------
// Exported handler functions (testable without Convex runtime)
// ---------------------------------------------------------------------------

export const createEnrichmentHandler = async (
  ctx: CreateEnrichmentCtx,
  args: {
    routePlanId: Id<'route_plans'>
    clerkUserId: string
    contentFingerprint: string
    phase: 'fast' | 'extended'
  }
): Promise<{ enrichmentId: Id<'route_enrichments'> }> => {
  const now = Date.now()

  const enrichmentId = await ctx.db.insert('route_enrichments', {
    routePlanId: args.routePlanId,
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
    await ctx.scheduler.cancel(doc.scheduledJobId)
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

// ---------------------------------------------------------------------------
// Convex internal mutations and queries
// ---------------------------------------------------------------------------

// When calling functions defined in the same module, route through a local reference
// to avoid Convex/TS circular inference issues.
const internalRouteEnrichments = (internal as any).db.routeEnrichments

export const createEnrichment = internalMutation({
  args: {
    routePlanId: v.id('route_plans'),
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
    return findByRoutePlanIdHandler(ctx, args)
  },
})

export const findByContentFingerprint = internalQuery({
  args: {
    contentFingerprint: v.string(),
    phase: routeEnrichmentPhaseValidator,
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args): Promise<RouteEnrichmentDoc | null> => {
    return findByContentFingerprintHandler(ctx, args)
  },
})
