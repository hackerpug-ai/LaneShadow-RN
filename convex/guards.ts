import { Session } from '../models/users'
import { api } from './_generated/api'
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server'

type Ctx = QueryCtx | MutationCtx | ActionCtx

type Identity = {
  clerkUserId: string
  tokenIdentifier: string | null
}

export const requireIdentity = async (ctx: Ctx): Promise<Identity> => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('AUTH_REQUIRED')
  }

  // SavedRoute.ownerId / createdByUserId store this viewerUserId (Clerk user id).
  return {
    clerkUserId: identity.subject,
    tokenIdentifier: identity.tokenIdentifier ?? null,
  }
}

export const requireSession = async (ctx: Ctx): Promise<Session> => {
  try {
    const response = await ctx.runQuery(api.db.users.getSession)
    if (!response) {
      throw new Error('SESSION_REQUIRED')
    }
    return response
  } catch (error) {
    console.error(error)
    throw new Error('SESSION_REQUIRED')
  }
}
