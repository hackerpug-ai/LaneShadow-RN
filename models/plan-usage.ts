import { Infer, v } from 'convex/values'

/**
 * Plan Usage Model
 *
 * Tracks monthly route plan usage per user for rate limiting.
 * Free tier: 5 plans per month.
 */

export const PLAN_USAGE_FIELDS = {
  clerkUserId: v.string(),
  month: v.string(), // Format: "YYYY-MM" (e.g., "2026-04")
  planCount: v.number(),
} as const

export const planUsageValidator = v.object(PLAN_USAGE_FIELDS)
export type PlanUsage = Infer<typeof planUsageValidator>

/**
 * Rate limit configuration
 * Future tiers will increase this limit
 */
export const FREE_TIER_MONTHLY_LIMIT = 5

/**
 * Type for usage check response
 */
export interface UsageCheckResult {
  count: number
  limit: number
  allowed: boolean
  remaining: number
}

/**
 * Conversational error messages for rate limiting scenarios
 */
export const RATE_LIMIT_MESSAGES = {
  EXCEEDED: `You've reached your monthly limit of 5 route plans. Upgrade to Premium for unlimited plans!`,
  APPROACHING: (remaining: number) =>
    `You have ${remaining} route plan${remaining > 1 ? 's' : ''} remaining this month.`,
  RESET_INFO: (month: string) =>
    `Your plan count resets at the end of ${month}.`,
} as const
