import { v } from 'convex/values'
import { sessionValidator } from '../../shared/models/users'
import type { Id } from '../_generated/dataModel'
import { internalMutation, internalQuery, query } from '../_generated/server'
import { requireIdentity } from '../guards'

type UserDoc = {
  _id: Id<'users'>
  _creationTime: number
  clerkUserId: string
  email: string
  name: string
  createdAt: number
  updatedAt: number
  lastLocalUpdateAt: number
}

type GetCurrentUserCtx = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>
  }
  db: {
    query: (table: 'users') => {
      withIndex: (
        indexName: 'by_clerkUserId',
        cb: (q: { eq: (field: 'clerkUserId', value: string) => unknown }) => unknown,
      ) => { unique: () => Promise<UserDoc | null> }
    }
  }
}

export const getCurrentUserFromIdentityHandler = async (
  ctx: GetCurrentUserCtx,
  identity: { subject: string } | null,
): Promise<UserDoc | null> => {
  if (!identity) {
    return null
  }
  return await getCurrentUserHandler(ctx, identity.subject)
}

export const getCurrentUserHandler = async (
  ctx: GetCurrentUserCtx,
  clerkUserId: string,
): Promise<UserDoc | null> => {
  return await ctx.db
    .query('users')
    .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
    .unique()
}

export const getCurrentUser = query({
  args: {},
  returns: v.union(v.any(), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    return await getCurrentUserFromIdentityHandler(
      ctx as unknown as GetCurrentUserCtx,
      identity ? { subject: identity.subject } : null,
    )
  },
})

export const getSession = query({
  args: {},
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx) => {
    const { clerkUserId } = await requireIdentity(ctx)

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
      .unique()

    if (!user) {
      return null
    }

    const { _creationTime, ...userWithoutSystemFields } = user
    return { user: userWithoutSystemFields }
  },
})

export const upsertCurrent = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  returns: v.object({ userId: v.id('users') }),
  handler: async (ctx, args) => {
    const { clerkUserId, email, name } = args
    const now = Date.now()

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: email ?? existing.email,
        name: name ?? existing.name,
        updatedAt: now,
        clerkUserId: clerkUserId,
        lastLocalUpdateAt: now,
      })
      return { userId: existing._id }
    }

    const userId = await ctx.db.insert('users', {
      clerkUserId,
      email: email ?? 'unknown@example.com',
      name: name ?? 'Unknown User',
      createdAt: now,
      updatedAt: now,
      lastLocalUpdateAt: now,
    } as any)

    return { userId }
  },
})

/** Dev-only: get first user for auth bypass testing */
export const getFirstUser = internalQuery({
  args: {},
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx) => {
    const user = await ctx.db.query('users').first()
    if (!user) return null
    const { _creationTime, ...userWithoutSystemFields } = user
    return { user: userWithoutSystemFields }
  },
})

export const getUserIdByClerkId = internalQuery({
  args: { clerkUserId: v.string() },
  returns: v.object({ userId: v.id('users') }),
  handler: async (ctx, { clerkUserId }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
      .unique()

    if (!existing) {
      throw new Error('USER_NOT_FOUND')
    }

    return { userId: existing._id }
  },
})
