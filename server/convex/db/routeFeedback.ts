/**
 * Route Feedback Mutations
 *
 * Handles user feedback on curated routes (save, hide, complete, rate).
 * This is the data flywheel input — user feedback drives continuous
 * improvement of route quality scoring and discovery ranking.
 */

import { ConvexError, v } from 'convex/values'

import type { Doc, Id } from '../_generated/dataModel'
import { mutation } from '../_generated/server'
import { requireIdentity } from '../guards'

type RouteFeedbackDoc = Doc<'route_feedback'>

// ---------------------------------------------------------------------------
// Exported validators (used in tests and Convex function definitions)
// ---------------------------------------------------------------------------

export const routeFeedbackActionValidator = v.union(
  v.literal('save'),
  v.literal('hide'),
  v.literal('complete'),
  v.literal('rate')
)

export const recordRouteFeedbackInputValidator = v.object({
  routeId: v.string(),
  action: routeFeedbackActionValidator,
  rating: v.optional(v.number()),
  locationLat: v.optional(v.number()),
  locationLng: v.optional(v.number()),
  archetypeFilter: v.optional(v.string()),
})

// ---------------------------------------------------------------------------
// Exported pure helpers (testable without Convex runtime)
// ---------------------------------------------------------------------------

type InsertCtx = {
  db: { insert: (table: string, fields: object) => Promise<Id<'route_feedback'>> }
}

export const recordRouteFeedbackHandler = async (
  ctx: InsertCtx,
  args: {
    routeId: string
    action: 'save' | 'hide' | 'complete' | 'rate'
    rating?: number
    locationLat?: number
    locationLng?: number
    archetypeFilter?: string
  },
  userId: string
): Promise<{ feedbackId: Id<'route_feedback'> }> => {
  // Validate rating rules
  if (args.action === 'rate') {
    if (!args.rating || args.rating < 1 || args.rating > 5) {
      throw new ConvexError('INVALID_RATING')
    }
  } else {
    if (args.rating !== undefined) {
      throw new ConvexError('RATING_ONLY_ALLOWED_ON_RATE')
    }
  }

  const feedbackId = await ctx.db.insert('route_feedback', {
    routeId: args.routeId,
    userId, // from auth, NEVER from args
    action: args.action,
    rating: args.rating ?? undefined,
    locationLat: args.locationLat ?? undefined,
    locationLng: args.locationLng ?? undefined,
    archetypeFilter: args.archetypeFilter ?? undefined,
    timestamp: Date.now(), // server-generated, NEVER from args
  })

  return { feedbackId }
}

// ---------------------------------------------------------------------------
// Exported Convex functions
// ---------------------------------------------------------------------------

export const recordRouteFeedback = mutation({
  args: recordRouteFeedbackInputValidator,
  returns: v.object({ feedbackId: v.id('route_feedback') }),
  handler: async (ctx, args) => {
    const { clerkUserId } = await requireIdentity(ctx)
    return recordRouteFeedbackHandler(ctx as any, args, clerkUserId)
  },
})
