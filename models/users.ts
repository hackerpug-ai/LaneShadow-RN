import { Infer, v } from 'convex/values'

/**
 * Convex-validator-first model for User.
 *
 * Notes:
 * - Convex `v.string()` does not validate formats (like email) by itself.
 * - Enforce stricter validation (email format, etc.) at function boundaries
 *   in `convex/*` handlers as needed.
 */
export const USER_FIELDS = {
  clerkUserId: v.string(),
  email: v.string(),
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
} as const

export const userValidator = v.object(USER_FIELDS)
export type User = Infer<typeof userValidator>
