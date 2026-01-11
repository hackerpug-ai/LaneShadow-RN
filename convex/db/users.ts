import { v } from 'convex/values'
import { mutation, query } from '../_generated/server'
import { userValidator } from '../../models/users'

export const getSession = query({
  args: {},
  returns: v.union(
    v.object({
      user: v.any(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', identity.subject))
      .unique()

    if (!user) {
      return null
    }

    return { user }
  },
})

export const upsertCurrent = mutation({
  args: {},
  returns: v.object({ userId: v.id('users') }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('AUTH_REQUIRED')
    }

    const now = Date.now()

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', identity.subject))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: identity.email ?? existing.email,
        name: identity.name ?? existing.name,
        updatedAt: now,
      })
      return { userId: existing._id }
    }

    const userId = await ctx.db.insert('users', {
      clerkUserId: identity.subject,
      email: identity.email ?? 'unknown@example.com',
      name: identity.name ?? 'Unknown User',
      createdAt: now,
      updatedAt: now,
    } as any)

    return { userId }
  },
})
