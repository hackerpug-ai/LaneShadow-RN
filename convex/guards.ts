import { ConvexError } from 'convex/values'

import type { Session } from '../shared/models/users'
import { api, internal } from './_generated/api'
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server'
import { ERROR_CODES } from './errors'

type Ctx = QueryCtx | MutationCtx | ActionCtx

/** Mutation/Query context only (has db access for role lookup). */
type DbCtx = QueryCtx | MutationCtx

type Identity = {
  clerkUserId: string
  tokenIdentifier: string | null
}

type RoleIdentity = Identity & { role: 'founder' | 'operator' | 'rider' }

export const requireIdentity = async (ctx: Ctx): Promise<Identity> => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new ConvexError({
      code: ERROR_CODES.UNAUTHENTICATED,
      message: 'Authentication required',
    })
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
    throw new ConvexError({
      code: ERROR_CODES.UNAUTHENTICATED,
      message: 'Authentication required',
    })
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

// ────────────────────────────────────────────────────────────────────────────
// REDHAT-FIX-06: Role-based authorization guards
// ────────────────────────────────────────────────────────────────────────────

/** Allowed operational roles (founder can do everything operator can). */
const OPERATOR_ROLES: ReadonlySet<string> = new Set(['founder', 'operator'])

/**
 * Resolve the authenticated identity's role from the users table.
 * Falls back to 'rider' for records without a role field (backward compat).
 * Server-owned: never accepts a role from the client.
 */
async function resolveRole(ctx: DbCtx, clerkUserId: string): Promise<RoleIdentity> {
  const identity: Identity = { clerkUserId, tokenIdentifier: null }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
    .unique()

  const role: 'founder' | 'operator' | 'rider' =
    user?.role === 'founder' || user?.role === 'operator' ? user.role : 'rider'

  return { ...identity, role }
}

/**
 * Require founder role. Throws FORBIDDEN if the authenticated user is not a founder.
 */
export const requireFounder = async (ctx: DbCtx): Promise<RoleIdentity> => {
  const base = await requireIdentity(ctx)
  const resolved = await resolveRole(ctx, base.clerkUserId)

  if (resolved.role !== 'founder') {
    throw new ConvexError({
      code: ERROR_CODES.FORBIDDEN,
      message: 'Founder role required',
    })
  }

  return resolved
}

/**
 * Require operator or founder role. Throws FORBIDDEN if the authenticated user
 * is neither a founder nor an operator.
 */
export const requireOperator = async (ctx: DbCtx): Promise<RoleIdentity> => {
  const base = await requireIdentity(ctx)
  const resolved = await resolveRole(ctx, base.clerkUserId)

  if (!OPERATOR_ROLES.has(resolved.role)) {
    throw new ConvexError({
      code: ERROR_CODES.FORBIDDEN,
      message: 'Operator or founder role required',
    })
  }

  return resolved
}

// ──────────────────────────────────────────────────────────────────────────────
// REDHAT-FIX-01: Test-seam subject gating
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Identity subjects permitted to invoke deterministic test seams
 * (lever2FixedGeometry, simulateRateLimitFailures, skipSleep). Real Clerk user
 * subjects and the gate closeout subject (e.g. 's4-human-gate') do NOT match,
 * so a production closeout cannot fall back to the deterministic reconstruct
 * seam — it must exercise real Lever-2 LLM reconstruction on live providers.
 */
export const TEST_SUBJECT_PREFIXES = [
  's4t6-',
  's4t5-',
  's4t4-',
  's4t3-',
  's4t2-',
  's4t1-',
  'test:',
  'dev-',
] as const

/**
 * Throw FORBIDDEN unless the caller's subject is a known test identity. Gates
 * deterministic test seams so they are unreachable from a production closeout
 * identity (REDHAT-FIX-01).
 */
export const assertTestSubjectOrThrow = (clerkUserId: string): void => {
  const isTestSubject = TEST_SUBJECT_PREFIXES.some((p) => clerkUserId.startsWith(p))
  if (!isTestSubject) {
    throw new ConvexError({
      code: ERROR_CODES.FORBIDDEN,
      message:
        'Test-only seam requested by a non-test identity — production closeout must use real providers',
    })
  }
}
