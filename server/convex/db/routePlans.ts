import { ConvexError, v } from 'convex/values'

import {
  routePlanStatusValidator,
  ROUTE_PLAN_STATUS,
  type RoutePlanStatus,
  type RoutePlan,
} from '../../models/route-plans'
import { planInputValidator, planPreferencesValidator } from '../../models/saved-routes'
import { internal } from '../_generated/api'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, internalQuery, mutation, query } from '../_generated/server'
import { requireIdentity } from '../guards'
import { ERROR_CODES } from '../errors'
import { checkUsage, incrementUsage } from './planUsage'

type RoutePlanDoc = Doc<'route_plans'>

// ---------------------------------------------------------------------------
// Types for testable handler contexts
// ---------------------------------------------------------------------------

type IndexQueryResult = {
  withIndex: (indexName: string, range: (q: any) => any) => {
    filter: (pred: (q: any) => any) => {
      first: () => Promise<RoutePlanDoc | null>
    }
  }
}

type CreatePlanCtx = {
  db: {
    query: (table: string) => IndexQueryResult
    insert: (table: string, fields: object) => Promise<Id<'route_plans'>>
    patch: (id: Id<'route_plans'>, fields: object) => Promise<void>
  }
  scheduler: {
    runAfter: (ms: number, fn: unknown, args: object) => Promise<Id<'_scheduled_functions'>>
  }
}

type GetActivePlanCtx = {
  db: {
    query: (table: string) => IndexQueryResult
  }
}

type ListBySessionCtx = {
  db: {
    query: (table: string) => any
  }
}

type GetPlanByIdCtx = {
  db: {
    get: (id: Id<'route_plans'>) => Promise<RoutePlanDoc | null>
  }
}

type UpdatePlanStatusCtx = {
  db: {
    get: (id: Id<'route_plans'>) => Promise<RoutePlanDoc | null>
    patch: (id: Id<'route_plans'>, fields: object) => Promise<void>
  }
}

type CancelPlanCtx = {
  db: {
    get: (id: Id<'route_plans'>) => Promise<RoutePlanDoc | null>
    patch: (id: Id<'route_plans'>, fields: object) => Promise<void>
  }
  scheduler: {
    cancel: (id: Id<'_scheduled_functions'>) => Promise<void>
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isOwnedByUser = (doc: RoutePlanDoc, clerkUserId: string): boolean =>
  doc.clerkUserId === clerkUserId

const queryFirstByStatus = async (
  ctx: GetActivePlanCtx,
  clerkUserId: string,
  status: RoutePlanStatus
): Promise<RoutePlanDoc | null> => {
  return ctx.db
    .query('route_plans')
    .withIndex('by_clerkUserId_and_status', (q: any) =>
      q.eq('clerkUserId', clerkUserId).eq('status', status)
    )
    .filter((_q: any) => _q.eq(true, true))
    .first()
}

// ---------------------------------------------------------------------------
// Exported handler functions (testable without Convex runtime)
// ---------------------------------------------------------------------------

export const createPlanHandler = async (
  ctx: CreatePlanCtx,
  args: {
    planInput: RoutePlan['planInput']
    startLabel?: string
    endLabel?: string
  },
  clerkUserId: string
): Promise<{ routePlanId: Id<'route_plans'> }> => {
  // Check usage rate limit before creating plan
  const usageCheck = await checkUsage(ctx as unknown as any, clerkUserId)
  if (!usageCheck.allowed) {
    throw new ConvexError(ERROR_CODES.RATE_LIMIT_EXCEEDED)
  }

  // Check no active (pending or running) plan already exists
  const pendingPlan = await queryFirstByStatus(ctx as unknown as GetActivePlanCtx, clerkUserId, ROUTE_PLAN_STATUS.PENDING)
  if (pendingPlan) {
    throw new ConvexError(ERROR_CODES.PLAN_ALREADY_ACTIVE)
  }

  const runningPlan = await queryFirstByStatus(ctx as unknown as GetActivePlanCtx, clerkUserId, ROUTE_PLAN_STATUS.RUNNING)
  if (runningPlan) {
    throw new ConvexError(ERROR_CODES.PLAN_ALREADY_ACTIVE)
  }

  const now = Date.now()

  const routePlanId = await ctx.db.insert('route_plans', {
    clerkUserId,
    planInput: args.planInput,
    startLabel: args.startLabel,
    endLabel: args.endLabel,
    status: ROUTE_PLAN_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
  })

  // Increment usage after successful plan creation
  await incrementUsage(ctx as unknown as any, clerkUserId)

  // Schedule execution
  const scheduledActionId = await ctx.scheduler.runAfter(0, internal.actions.agent.planRide.executePlan, {
    routePlanId,
  })

  await ctx.db.patch(routePlanId, { scheduledActionId })

  return { routePlanId }
}

export const getActivePlanHandler = async (
  ctx: GetActivePlanCtx,
  clerkUserId: string
): Promise<RoutePlanDoc | null> => {
  const pending = await queryFirstByStatus(ctx, clerkUserId, ROUTE_PLAN_STATUS.PENDING)
  if (pending) return pending

  const running = await queryFirstByStatus(ctx, clerkUserId, ROUTE_PLAN_STATUS.RUNNING)
  return running ?? null
}

export const getPlanByIdHandler = async (
  ctx: GetPlanByIdCtx,
  args: { routePlanId: Id<'route_plans'> },
  clerkUserId: string
): Promise<RoutePlanDoc> => {
  const doc = await ctx.db.get(args.routePlanId)
  if (!doc || !isOwnedByUser(doc, clerkUserId)) {
    throw new ConvexError(ERROR_CODES.PLAN_NOT_FOUND)
  }
  return doc
}

export const updatePlanStatusHandler = async (
  ctx: UpdatePlanStatusCtx,
  args: {
    routePlanId: Id<'route_plans'>
    status: RoutePlanStatus
    statusMessage?: string
    result?: unknown
    errorCode?: string
    errorMessage?: string
  }
): Promise<void> => {
  const now = Date.now()
  const isTerminal =
    args.status === ROUTE_PLAN_STATUS.COMPLETED || args.status === ROUTE_PLAN_STATUS.FAILED

  const patch: Record<string, unknown> = {
    status: args.status,
    updatedAt: now,
  }

  if (args.statusMessage !== undefined) patch.statusMessage = args.statusMessage
  if (args.result !== undefined) patch.result = args.result
  if (args.errorCode !== undefined) patch.errorCode = args.errorCode
  if (args.errorMessage !== undefined) patch.errorMessage = args.errorMessage
  if (isTerminal) patch.completedAt = now

  await ctx.db.patch(args.routePlanId, patch)
}

export const cancelPlanHandler = async (
  ctx: CancelPlanCtx,
  args: { routePlanId: Id<'route_plans'> },
  clerkUserId: string
): Promise<void> => {
  const doc = await ctx.db.get(args.routePlanId)
  if (!doc || !isOwnedByUser(doc, clerkUserId)) {
    throw new ConvexError(ERROR_CODES.PLAN_NOT_FOUND)
  }

  const isActive =
    doc.status === ROUTE_PLAN_STATUS.PENDING || doc.status === ROUTE_PLAN_STATUS.RUNNING

  if (isActive && doc.scheduledActionId) {
    await ctx.scheduler.cancel(doc.scheduledActionId)
  }

  await ctx.db.patch(args.routePlanId, {
    status: ROUTE_PLAN_STATUS.CANCELLED,
    updatedAt: Date.now(),
  })
}

// ---------------------------------------------------------------------------
// Convex public mutations and queries
// ---------------------------------------------------------------------------

// When calling functions defined in the same module, route through a local reference
// to avoid Convex/TS circular inference issues.
const internalRoutePlans = (internal as any).db.routePlans

export const createPlan = mutation({
  args: {
    planInput: planInputValidator,
    startLabel: v.optional(v.string()),
    endLabel: v.optional(v.string()),
  },
  returns: v.object({ routePlanId: v.id('route_plans') }),
  handler: async (ctx, args): Promise<{ routePlanId: Id<'route_plans'> }> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return createPlanHandler(ctx as any, args as any, clerkUserId)
  },
})

export const getActivePlan = query({
  args: {},
  returns: v.union(v.null(), v.any()),
  handler: async (ctx): Promise<RoutePlanDoc | null> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return getActivePlanHandler(ctx as any, clerkUserId)
  },
})

export const getPlanById = query({
  args: { routePlanId: v.id('route_plans') },
  returns: v.any(),
  handler: async (ctx, args): Promise<RoutePlanDoc> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return getPlanByIdHandler(ctx as any, args, clerkUserId)
  },
})

export const updatePlanStatus = internalMutation({
  args: {
    routePlanId: v.id('route_plans'),
    status: routePlanStatusValidator,
    statusMessage: v.optional(v.string()),
    result: v.optional(v.any()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await updatePlanStatusHandler(ctx as any, args)
    return null
  },
})

export const cancelPlan = mutation({
  args: { routePlanId: v.id('route_plans') },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const { clerkUserId } = await requireIdentity(ctx)
    await cancelPlanHandler(ctx as any, args, clerkUserId)
    return null
  },
})

/**
 * Create a route_plans row for the pi-ai agent's inline planRoute tool.
 *
 * Unlike `createPlan`, this does NOT schedule a separate executePlan action
 * (the agent runs the orchestrator synchronously in-process) and does NOT
 * enforce the single-active-plan guard (the agent may replan mid-conversation).
 * Usage metering is handled by the agent via `planUsage.incrementUsageInternal`.
 */
export const createForAgentInternal = internalMutation({
  args: {
    clerkUserId: v.string(),
    planningSessionId: v.optional(v.id('planning_sessions')),
    planInput: planInputValidator,
    startLabel: v.optional(v.string()),
    endLabel: v.optional(v.string()),
  },
  returns: v.object({ routePlanId: v.id('route_plans') }),
  handler: async (ctx, args): Promise<{ routePlanId: Id<'route_plans'> }> => {
    const now = Date.now()

    // Supersede any previous failed plans in the same session so the UI
    // transitions them to "Cancelled" instead of showing a stale red error
    // card while the new attempt runs.
    if (args.planningSessionId) {
      const previousPlans = await ctx.db
        .query('route_plans')
        .filter((q) =>
          q.and(
            q.eq(q.field('planningSessionId'), args.planningSessionId),
            q.eq(q.field('status'), ROUTE_PLAN_STATUS.FAILED)
          )
        )
        .collect()

      for (const plan of previousPlans) {
        await ctx.db.patch(plan._id, {
          status: ROUTE_PLAN_STATUS.CANCELLED,
          updatedAt: now,
        })
      }
    }

    const routePlanId = await ctx.db.insert('route_plans', {
      clerkUserId: args.clerkUserId,
      planningSessionId: args.planningSessionId,
      planInput: args.planInput,
      startLabel: args.startLabel,
      endLabel: args.endLabel,
      status: ROUTE_PLAN_STATUS.RUNNING,
      createdAt: now,
      updatedAt: now,
    })
    return { routePlanId }
  },
})

export const getPlanByIdInternal = internalQuery({
  args: { routePlanId: v.id('route_plans') },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args): Promise<RoutePlanDoc | null> => {
    return ctx.db.get(args.routePlanId)
  },
})

// ---------------------------------------------------------------------------
// Agent-context query: summarized rows by planning session
// ---------------------------------------------------------------------------

export type RoutePlanSummary = {
  _id: Id<'route_plans'>
  _creationTime: number
  startLabel?: string
  endLabel?: string
  preferences: RoutePlan['planInput']['preferences']
  status: RoutePlanStatus
  distanceMeters?: number
  durationSeconds?: number
  routeLabel?: string
  routeRationale?: string
}

const DEFAULT_LIST_BY_SESSION_LIMIT = 5

const toRoutePlanSummary = (doc: RoutePlanDoc): RoutePlanSummary => {
  const firstOption = (doc.result as any)?.options?.[0]
  const stats = firstOption?.stats as
    | { distanceMeters?: number; durationSeconds?: number }
    | undefined
  return {
    _id: doc._id,
    _creationTime: doc._creationTime,
    startLabel: doc.startLabel,
    endLabel: doc.endLabel,
    preferences: doc.planInput.preferences,
    status: doc.status,
    distanceMeters: stats?.distanceMeters,
    durationSeconds: stats?.durationSeconds,
    routeLabel: firstOption?.label,
    routeRationale: firstOption?.rationale,
  }
}

export const listBySessionHandler = async (
  ctx: ListBySessionCtx,
  args: {
    sessionId: Id<'planning_sessions'>
    limit?: number
    status?: RoutePlanStatus
  }
): Promise<RoutePlanSummary[]> => {
  const limit = args.limit ?? DEFAULT_LIST_BY_SESSION_LIMIT
  const docs: RoutePlanDoc[] = await ctx.db
    .query('route_plans')
    .withIndex('by_planningSessionId_and_status', (q: any) => {
      const base = q.eq('planningSessionId', args.sessionId)
      if (args.status !== undefined) {
        return base.eq('status', args.status)
      }
      return base
    })
    .order('desc')
    .take(limit)

  return docs.map(toRoutePlanSummary)
}

export const listBySession = internalQuery({
  args: {
    sessionId: v.id('planning_sessions'),
    limit: v.optional(v.number()),
    status: v.optional(routePlanStatusValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id('route_plans'),
      _creationTime: v.number(),
      startLabel: v.optional(v.string()),
      endLabel: v.optional(v.string()),
      preferences: planPreferencesValidator,
      status: routePlanStatusValidator,
      distanceMeters: v.optional(v.number()),
      durationSeconds: v.optional(v.number()),
      routeLabel: v.optional(v.string()),
      routeRationale: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args): Promise<RoutePlanSummary[]> => {
    return listBySessionHandler(ctx as any, args)
  },
})

/**
 * Merge enrichment data into route plan options.
 *
 * Updates the route_plans.result.options array with enrichment data from background jobs.
 * Each option is enriched if a matching enrichment exists by routeOptionId.
 * Also applies AI-generated leg labels to route legs.
 *
 * @param ctx - Database context
 * @param args.routePlanId - The route plan to enrich
 * @param args.enrichments - Array of enrichment data to merge
 */
export const mergeEnrichmentHandler = async (
  ctx: {
    db: {
      get: (id: Id<'route_plans'>) => Promise<RoutePlanDoc | null>
      patch: (id: Id<'route_plans'>, fields: object) => Promise<void>
    }
  },
  args: {
    routePlanId: Id<'route_plans'>
    enrichments: {
      routeOptionId: string
      label?: string
      rationale?: string
      highlights: string[]
      legLabels?: string[]
      elevation?: unknown
      weather?: unknown
    }[]
  }
): Promise<void> => {
  const plan = await ctx.db.get(args.routePlanId)
  if (!plan || !plan.result) {
    return
  }

  // Type guard for result structure
  const result = plan.result as { options: { routeOptionId: string; map?: { legs?: unknown[] } }[] }
  if (!result.options || !Array.isArray(result.options)) {
    return
  }

  // Merge enrichment into route options
  const enrichedOptions = result.options.map((option) => {
    const enrichment = args.enrichments.find((e) => e.routeOptionId === option.routeOptionId)

    if (!enrichment) {
      return option
    }

    const enrichedOption: any = {
      ...option,
      ...(enrichment.label && { label: enrichment.label }),
      ...(enrichment.rationale && { rationale: enrichment.rationale }),
      enrichment: {
        highlights: enrichment.highlights,
        elevation: enrichment.elevation,
        weather: enrichment.weather,
      },
    }

    // Apply AI-generated leg labels if available
    if (enrichment.legLabels && Array.isArray(enrichment.legLabels) && option.map?.legs) {
      const legs = option.map.legs as any[]
      enrichedOption.map = {
        ...option.map,
        legs: legs.map((leg, idx) => {
          if (idx >= enrichment.legLabels!.length) {
            return leg
          }

          const legLabel = enrichment.legLabels![idx]
          const [fromLabel, toLabel] = legLabel.split(' → ').map((s: string) => s.trim())

          return {
            ...leg,
            start: {
              ...leg.start,
              ...(fromLabel && { label: fromLabel }),
            },
            end: {
              ...leg.end,
              ...(toLabel && { label: toLabel }),
            },
          }
        }),
      }
    }

    return enrichedOption
  })

  // Patch the route plan with enriched options
  await ctx.db.patch(args.routePlanId, {
    result: {
      ...result,
      options: enrichedOptions,
    },
  })
}

export const mergeEnrichment = internalMutation({
  args: {
    routePlanId: v.id('route_plans'),
    enrichments: v.array(
      v.object({
        routeOptionId: v.string(),
        label: v.optional(v.string()),
        rationale: v.optional(v.string()),
        highlights: v.array(v.string()),
        legLabels: v.optional(v.array(v.string())),
        elevation: v.optional(v.any()),
        weather: v.optional(v.any()),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await mergeEnrichmentHandler(ctx as any, args)
    return null
  },
})

/**
 * Get active (pending or running) route plans for a session.
 * Public query for frontend cancellation support.
 */
export const getActiveRoutePlansForSession = query({
  args: {
    sessionId: v.id('planning_sessions'),
  },
  returns: v.array(
    v.object({
      _id: v.id('route_plans'),
      status: routePlanStatusValidator,
    })
  ),
  handler: async (ctx, args): Promise<{ _id: Id<'route_plans'>; status: RoutePlanStatus }[]> => {
    const docs = await ctx.db
      .query('route_plans')
      .withIndex('by_planningSessionId_and_status', (q) =>
        q.eq('planningSessionId', args.sessionId)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'running')
        )
      )
      .collect()

    return docs.map((doc) => ({
      _id: doc._id,
      status: doc.status,
    }))
  },
})
