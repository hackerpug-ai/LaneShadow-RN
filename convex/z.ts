/**
 * Zod-wrapped Convex function helpers
 *
 * Wraps Convex's query, mutation, and action with Zod validation
 * Enables arguments to be defined as Zod schemas instead of Convex v validators
 *
 * Usage:
 * ```typescript
 * export const getUser = zQuery({
 *   args: { userId: zid('users') },
 *   returns: z.object({ id: z.string(), name: z.string() }),
 *   handler: async (ctx, args) => {
 *     const user = await ctx.db.get(args.userId)
 *     return user ? { id: user._id, name: user.name } : null
 *   }
 * })
 * ```
 *
 * See: https://stack.convex.dev/typescript-zod-function-validation
 */

import { query, mutation, action } from './_generated/server'
import { zCustomQuery, zCustomMutation, zCustomAction, zid } from 'convex-helpers/server/zod'
import { NoOp } from 'convex-helpers/server/customFunctions'

/**
 * Zod-validated query
 * Define args as Zod schema, receives auto-validation before handler
 */
export const zQuery = zCustomQuery(query, NoOp)

/**
 * Zod-validated mutation
 * Define args as Zod schema, receives auto-validation before handler
 */
export const zMutation = zCustomMutation(mutation, NoOp)

/**
 * Zod-validated action
 * Define args as Zod schema, receives auto-validation before handler
 */
export const zAction = zCustomAction(action, NoOp)

/**
 * Zod validator for Convex Document IDs
 * Validates that string is a valid Convex ID for the given table
 * Translates to v.id() under the hood for Convex validation
 *
 * Usage: zid('users') in args
 */
export { zid }
