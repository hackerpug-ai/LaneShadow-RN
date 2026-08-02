/**
 * Auth-gated Convex useQuery.
 *
 * Public queries that call requireIdentity throw UNAUTHENTICATED when the
 * Convex JWT is not yet attached (Clerk can already show signed-in). This
 * hook skips the query until useConvexAuth reports isAuthenticated, and
 * surfaces auth loading / auth-required for non-blank recovery UI.
 *
 * Skip uses Convex auth only — never Clerk isSignedIn alone (JWT can lag).
 */
import { useConvexAuth, useQuery } from 'convex/react'
import type { FunctionReference } from 'convex/server'

export type UseAuthQueryResult<T> = {
  /** Query data, or undefined while skipped / loading. */
  data: T | undefined
  /** Convex auth token still resolving. */
  authLoading: boolean
  /** Convex session is authenticated (JWT present). */
  isAuthenticated: boolean
  /**
   * Auth finished and user is not authenticated — surfaces should recover
   * (redirect / sign-in) rather than treat this as an empty catalog.
   */
  authRequired: boolean
  /** True while auth is loading OR the underlying query has not resolved. */
  isLoading: boolean
}

type QueryArgs = Record<string, unknown> | 'skip'

/**
 * Like useQuery, but never fires while Convex auth is loading or unauthenticated.
 * When `args` is already `'skip'`, that skip is preserved.
 */
export function useAuthQuery<T = unknown>(
  query: FunctionReference<'query'>,
  args: QueryArgs,
): UseAuthQueryResult<T> {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth()
  const callerSkipped = args === 'skip'
  const authSkip = authLoading || !isAuthenticated
  const effectiveArgs: QueryArgs = authSkip || callerSkipped ? 'skip' : args

  const data = useQuery(query, effectiveArgs as never) as T | undefined

  const authRequired = !authLoading && !isAuthenticated
  const isLoading = authLoading || (!authRequired && !callerSkipped && data === undefined)

  return {
    data,
    authLoading,
    isAuthenticated,
    authRequired,
    isLoading,
  }
}
