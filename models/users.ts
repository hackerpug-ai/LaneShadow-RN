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
  /**
   * Timestamp of the latest local (app-driven) profile edit.
   * Webhook updates from Clerk should not overwrite values newer than this.
   */
  lastLocalUpdateAt: v.number(),
} as const

export const userValidator = v.object({
  ...USER_FIELDS,
  _id: v.id('users'),
})
export type User = Infer<typeof userValidator>

export const sessionValidator = v.object({
  user: userValidator,
})

export type Session = Infer<typeof sessionValidator>
