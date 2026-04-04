import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { internalMutation, internalQuery } from '../_generated/server'
import { v, ConvexError } from 'convex/values'
import {
  type UsageCheckResult,
  FREE_TIER_MONTHLY_LIMIT,
  type PlanUsage,
  isValidMonth,
} from '../../models/plan-usage'
import { ERROR_CODES } from '../errors'

/**
 * Utility function to get current month in YYYY-MM format
 * @param date - Date object (defaults to current time)
 * @returns Month string in "YYYY-MM" format
 */
export function getCurrentMonth(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7)
}

/**
 * Check user's current plan usage for the specified month
 * @param ctx - Query context
 * @param clerkUserId - User's Clerk ID
 * @param month - Month string in "YYYY-MM" format (defaults to current month)
 * @returns Usage check result with count, limit, allowed status, and remaining
 */
export async function checkUsage(
  ctx: QueryCtx,
  clerkUserId: string,
  month: string = getCurrentMonth()
): Promise<UsageCheckResult> {
  // AC-3: Validate month format
  if (!isValidMonth(month)) {
    throw new ConvexError(ERROR_CODES.INVALID_CONTENT)
  }

  const record = await ctx.db
    .query('plan_usage')
    .withIndex('by_clerkUserId_and_month', (q) =>
      q.eq('clerkUserId', clerkUserId).eq('month', month)
    )
    .unique()

  const count = record?.planCount ?? 0
  const limit = FREE_TIER_MONTHLY_LIMIT
  const allowed = count < limit
  const remaining = Math.max(0, limit - count)

  return {
    count,
    limit,
    allowed,
    remaining,
  }
}

/**
 * Increment user's plan usage for the specified month
 * Creates a new record if none exists, otherwise increments atomically
 * @param ctx - Mutation context
 * @param clerkUserId - User's Clerk ID
 * @param month - Month string in "YYYY-MM" format (defaults to current month)
 * @returns Updated usage check result after increment
 */
export async function incrementUsage(
  ctx: MutationCtx,
  clerkUserId: string,
  month: string = getCurrentMonth()
): Promise<UsageCheckResult> {
  // AC-3: Validate month format
  if (!isValidMonth(month)) {
    throw new ConvexError(ERROR_CODES.INVALID_CONTENT)
  }

  const record = await ctx.db
    .query('plan_usage')
    .withIndex('by_clerkUserId_and_month', (q) =>
      q.eq('clerkUserId', clerkUserId).eq('month', month)
    )
    .unique()

  if (record) {
    // Atomically increment existing record
    const newCount = record.planCount + 1
    await ctx.db.patch(record._id, {
      planCount: newCount,
    })

    const limit = FREE_TIER_MONTHLY_LIMIT
    const allowed = newCount < limit
    const remaining = Math.max(0, limit - newCount)

    return {
      count: newCount,
      limit,
      allowed,
      remaining,
    }
  } else {
    // Create new record with first plan
    await ctx.db.insert('plan_usage', {
      clerkUserId,
      month,
      planCount: 1,
    })

    const limit = FREE_TIER_MONTHLY_LIMIT
    const remaining = limit - 1

    return {
      count: 1,
      limit,
      allowed: remaining > 0,
      remaining,
    }
  }
}

// ---------------------------------------------------------------------------
// Internal query/mutation for agent usage
// ---------------------------------------------------------------------------

/**
 * Internal query to check usage from actions/agents
 */
export const checkUsageInternal = internalQuery({
  args: { clerkUserId: v.string() },
  returns: v.object({
    count: v.number(),
    limit: v.number(),
    allowed: v.boolean(),
    remaining: v.number(),
  }),
  handler: async (ctx, args) => {
    return checkUsage(ctx, args.clerkUserId)
  },
})

/**
 * Internal mutation to increment usage from actions/agents
 */
export const incrementUsageInternal = internalMutation({
  args: { clerkUserId: v.string() },
  returns: v.object({
    count: v.number(),
    limit: v.number(),
    allowed: v.boolean(),
    remaining: v.number(),
  }),
  handler: async (ctx, args) => {
    return incrementUsage(ctx, args.clerkUserId)
  },
})
