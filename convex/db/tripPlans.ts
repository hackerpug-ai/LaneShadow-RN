import { ConvexError, v } from 'convex/values'
import { planInputValidator } from '../../shared/models/saved-routes'
import { type TripPlan, tripPlanValidator } from '../../shared/models/trip-plan'
import type { Doc, Id } from '../_generated/dataModel'
import { internalMutation, mutation, query } from '../_generated/server'
import { ERROR_CODES } from '../errors'
import { requireIdentity } from '../guards'

type TripPlanDoc = Doc<'trip_plans'>

// ---------------------------------------------------------------------------
// Types for testable handler contexts
// ---------------------------------------------------------------------------

type CreateTripPlanCtx = {
  db: {
    insert: (table: string, fields: object) => Promise<Id<'trip_plans'>>
  }
}

type UpdateTripPlanCtx = {
  db: {
    get: (id: Id<'trip_plans'>) => Promise<TripPlanDoc | null>
    patch: (id: Id<'trip_plans'>, fields: object) => Promise<void>
  }
}

type GetTripPlanCtx = {
  db: {
    get: (id: Id<'trip_plans'>) => Promise<TripPlanDoc | null>
  }
}

type ListTripPlansByUserCtx = {
  db: {
    query: (table: string) => any
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isOwnedByUser = (doc: TripPlanDoc, clerkUserId: string): boolean =>
  doc.clerkUserId === clerkUserId

// ---------------------------------------------------------------------------
// Exported handler functions (testable without Convex runtime)
// ---------------------------------------------------------------------------

export const createTripPlanHandler = async (
  ctx: CreateTripPlanCtx,
  args: {
    clerkUserId: string
    planInput: TripPlanDoc['planInput']
  },
): Promise<{ tripPlanId: Id<'trip_plans'> }> => {
  const now = Date.now()
  const tripPlanId = await ctx.db.insert('trip_plans', {
    clerkUserId: args.clerkUserId,
    planInput: args.planInput,
    status: 'pending' as const,
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
  })
  return { tripPlanId }
}

export const updateTripPlanHandler = async (
  ctx: UpdateTripPlanCtx,
  args: {
    tripPlanId: Id<'trip_plans'>
    status?: TripPlanDoc['status']
    result?: TripPlan
    attemptCount?: number
    error?: string
  },
): Promise<void> => {
  const doc = await ctx.db.get(args.tripPlanId)
  if (!doc) {
    throw new ConvexError(ERROR_CODES.PLAN_NOT_FOUND)
  }

  const now = Date.now()
  const patch: Record<string, unknown> = { updatedAt: now }

  if (args.status !== undefined) patch.status = args.status
  if (args.result !== undefined) patch.result = args.result
  if (args.attemptCount !== undefined) patch.attemptCount = args.attemptCount
  if (args.error !== undefined) patch.error = args.error

  await ctx.db.patch(args.tripPlanId, patch)
}

export const getTripPlanHandler = async (
  ctx: GetTripPlanCtx,
  args: { tripPlanId: Id<'trip_plans'> },
  clerkUserId: string,
): Promise<TripPlanDoc> => {
  const doc = await ctx.db.get(args.tripPlanId)
  if (!doc || !isOwnedByUser(doc, clerkUserId)) {
    throw new ConvexError(ERROR_CODES.PLAN_NOT_FOUND)
  }
  return doc
}

export const listTripPlansByUserHandler = async (
  ctx: ListTripPlansByUserCtx,
  clerkUserId: string,
): Promise<TripPlanDoc[]> => {
  return ctx.db
    .query('trip_plans')
    .withIndex('by_user', (q: any) => q.eq('clerkUserId', clerkUserId))
    .order('desc')
    .collect()
}

// ---------------------------------------------------------------------------
// Convex public mutations and queries
// ---------------------------------------------------------------------------

export const createTripPlan = mutation({
  args: {
    planInput: planInputValidator,
  },
  returns: v.object({ tripPlanId: v.id('trip_plans') }),
  handler: async (ctx, args): Promise<{ tripPlanId: Id<'trip_plans'> }> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return createTripPlanHandler(ctx as any, { clerkUserId, planInput: args.planInput })
  },
})

export const updateTripPlan = internalMutation({
  args: {
    tripPlanId: v.id('trip_plans'),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('generating'),
        v.literal('needs_retry'),
        v.literal('completed'),
        v.literal('failed'),
      ),
    ),
    result: v.optional(tripPlanValidator),
    attemptCount: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await updateTripPlanHandler(ctx as any, args)
    return null
  },
})

export const getTripPlan = query({
  args: { tripPlanId: v.id('trip_plans') },
  returns: v.any(),
  handler: async (ctx, args): Promise<TripPlanDoc> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return getTripPlanHandler(ctx as any, args, clerkUserId)
  },
})

export const listTripPlansByUser = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx): Promise<TripPlanDoc[]> => {
    const { clerkUserId } = await requireIdentity(ctx)
    return listTripPlansByUserHandler(ctx as any, clerkUserId)
  },
})
