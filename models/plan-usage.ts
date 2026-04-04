import { Infer, v } from 'convex/values'

/**
 * Plan Usage Model
 *
 * Tracks monthly route plan usage per user for rate limiting.
 * Free tier: 5 plans per month.
 */

// Month validation regex: YYYY-MM format (e.g., "2026-04")
const MONTH_REGEX = /^(\d{4})-(\d{2})$/

/**
 * Validates month string in YYYY-MM format
 * @param month - Month string to validate
 * @returns true if valid, false otherwise
 */
export function isValidMonth(month: string): boolean {
  const match = month.match(MONTH_REGEX)
  if (!match) return false

  const year = parseInt(match[1], 10)
  const monthNum = parseInt(match[2], 10)

  // Validate month is in range 01-12
  return monthNum >= 1 && monthNum <= 12 && year >= 2000 && year <= 2100
}

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
