/**
 * useCuratedRouteDetail
 *
 * Typed wrapper over `api.curatedRoutes.getCuratedRouteDetail` (DATA-006).
 *
 * Returns the LEAN curated-route detail payload (normalized 0–1 scores,
 * `routePolyline: string | null`, computed bounds, centroid, summary/name
 * headline). Mirrors the `useSavedRouteDetail` hook shape so the detail
 * screen can reuse the saved-route scaffold (loading → skeleton, null →
 * fallback, data → name + map).
 *
 * The query is skipped when no routeId is supplied (deep-link / param-missing
 * guard) so the hook never fires with an empty key.
 */

import { useQuery } from 'convex/react'
import type { FunctionReturnType } from 'convex/server'
import { useMemo } from 'react'
import { api } from '../convex/_generated/api'

export type CuratedRouteDetail = FunctionReturnType<typeof api.curatedRoutes.getCuratedRouteDetail>

export interface UseCuratedRouteDetailResult {
  /** Lean detail payload, or null when the query resolves to no row. */
  detail: CuratedRouteDetail | null
  /** True while the query is in flight (data === undefined). */
  isLoading: boolean
}

/**
 * Subscribe to a single curated route's lean detail.
 *
 * @param routeId - the curated `routeId` (NOT the internal `_id`). When null
 *                  the query is skipped and `detail` is null / not loading.
 */
export const useCuratedRouteDetail = (routeId: string | null): UseCuratedRouteDetailResult => {
  const data = useQuery(api.curatedRoutes.getCuratedRouteDetail, routeId ? { routeId } : 'skip')

  const isLoading = data === undefined

  return useMemo(
    () => ({
      detail: (data as CuratedRouteDetail | null) ?? null,
      isLoading,
    }),
    [data, isLoading],
  )
}
