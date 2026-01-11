import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server'

type Ctx = QueryCtx | MutationCtx | ActionCtx

export const requireAuth = async (
  ctx: Ctx
): Promise<{ viewerUserId: string; tokenIdentifier: string | null }> => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('AUTH_REQUIRED')
  }

  // SavedRoute.ownerId / createdByUserId store this viewerUserId (Clerk user id).
  return {
    viewerUserId: identity.subject,
    tokenIdentifier: identity.tokenIdentifier ?? null,
  }
}
