import { ConvexError } from 'convex/values'

import type { Session } from '../models/users'
import { api, internal } from './_generated/api'
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server'

type Ctx = QueryCtx | MutationCtx | ActionCtx

type Identity = {
  clerkUserId: string
  tokenIdentifier: string | null
}

export const requireIdentity = async (ctx: Ctx): Promise<Identity> => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError('Authentication required')
  }

  // SavedRoute.ownerId / createdByUserId store this viewerUserId (Clerk user id).
  return {
    clerkUserId: identity.subject,
    tokenIdentifier: identity.tokenIdentifier ?? null,
  }
}

/**
 * ACTION-ONLY guard. Resolves the session for the authenticated Clerk user,
 * creating the Convex user record via upsertCurrent if it doesn't exist yet
 * (handles the webhook race condition where Clerk fires before the DB is synced).
 */
export const ensureSession = async (ctx: ActionCtx): Promise<Session> => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError('Authentication required')
  }

  const clerkUserId = identity.subject
  const email = (identity.email as string | undefined) ?? undefined
  const name =
    (identity.name as string | undefined) ??
    (identity.given_name as string | undefined) ??
    undefined

  const existing = await ctx.runQuery(api.db.users.getSession)
  if (existing) {
    return existing
  }

  await ctx.runMutation(internal.db.users.upsertCurrent, {
    clerkUserId,
    email,
    name,
  })

  const session = await ctx.runQuery(api.db.users.getSession)
  if (!session) {
    throw new ConvexError('SESSION_REQUIRED')
  }
  return session
}

export const requireSession = async (ctx: Ctx, devBypassKey?: string): Promise<Session> => {
  // Dev-only auth bypass: if DEV_AUTH_BYPASS_KEY is set and matches, use first user in DB
  if (devBypassKey) {
    const expectedKey = process.env.DEV_AUTH_BYPASS_KEY
    if (expectedKey && devBypassKey === expectedKey) {
      const response = await (ctx as any).runQuery(internal.db.users.getFirstUser)
      if (response) return response
    }
  }

  try {
    const response = await ctx.runQuery(api.db.users.getSession)
    if (!response) {
      throw new Error('SESSION_REQUIRED')
    }
    return response
  } catch (_error) {
    throw new Error('SESSION_REQUIRED')
  }
}
