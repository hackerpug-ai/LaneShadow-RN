/**
 * Users API - Demo functions showing Convex `v` validator-first pattern
 *
 * Shows how to:
 * - Use `query` and `mutation` with Convex `v` validators for args/returns
 * - Import and use validators from models/
 * - Add any extra runtime validation inside handlers when needed
 */

import { v } from 'convex/values'
import { USER_FIELDS, type User } from '../shared/models/users'
import type { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'

/**
 * List all users (demo query)
 * Returns array of users from the database
 */
type ListedUser = User & {
  _id: Id<'users'>
  _creationTime: number
}

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      ...USER_FIELDS,
    }),
  ),
  handler: async (ctx): Promise<ListedUser[]> => {
    const users: ListedUser[] = await ctx.db.query('users').collect()
    return users
  },
})

const assertLooksLikeEmail = (email: string): void => {
  // Minimal guard: Convex `v.string()` doesn't validate formats.
  // Tighten this as needed, but keep it deterministic and fast.
  const looksValid = /^\S+@\S+\.\S+$/.test(email)
  if (!looksValid) {
    throw new Error('Invalid email address')
  }
}

/**
 * Create a new user (demo mutation)
 * Validates inputs using Convex validators + minimal runtime checks,
 * returns inserted user ID
 */
export const create = mutation({
  args: { email: v.string(), name: v.string() },
  returns: v.object({ id: v.id('users') }),
  handler: async (ctx, args): Promise<{ id: Id<'users'> }> => {
    assertLooksLikeEmail(args.email)

    const now = Date.now()
    const id: Id<'users'> = await ctx.db.insert('users', {
      clerkUserId: 'demo-clerk-user',
      email: args.email,
      name: args.name,
      createdAt: now,
      updatedAt: now,
      lastLocalUpdateAt: now,
    })

    return { id }
  },
})
