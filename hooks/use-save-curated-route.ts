/**
 * SAVE-001: Curated-route save / restore / toggle hooks.
 *
 * Sibling of the planned-route hook family (`hooks/use-saved-routes.ts`). A
 * curated save persists a `saved_routes` row via `curatedRouteRef` ONLY (the
 * DATA-003 XOR — no planInput / routeSnapshot / routeIndex), then fires
 * `recordRouteFeedback('save')` so the data-flywheel sees the bookmark.
 *
 * Anti-pattern (DO NOT): synthesize legs, coerce curated rows through the
 * legacy PlanInput path, or reuse `useSaveRoute` for curated saves.
 *
 * The save + feedback + unsave mutations all run against REAL Convex in
 * production; the jsdom tests mock `convex/react` to assert call args.
 */

import { useMutation, useQuery } from 'convex/react'
import { useCallback, useMemo, useState } from 'react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'

// ---------------------------------------------------------------------------
// useSaveCuratedRoute
// ---------------------------------------------------------------------------

type UseSaveCuratedRouteArgs = {
  /** Convex `_id` of the `curated_routes` document to bookmark. */
  curatedRouteId: string
  /** Display name persisted on the saved_routes row. */
  name: string
}

type SaveCuratedRouteResult = { savedRouteId: string }

/**
 * Persist a curated-route bookmark + fire the 'save' feedback signal.
 *
 * Calls `savedRoutes.saveRoute` with `{ curatedRouteRef, name }` — NO plan
 * payload (the DATA-003 XOR is satisfied by omission). `recordRouteFeedback`
 * fires AFTER a successful save so a feedback failure never blocks the save.
 */
export const useSaveCuratedRoute = ({
  curatedRouteId,
  name,
}: UseSaveCuratedRouteArgs): {
  save: () => Promise<SaveCuratedRouteResult | null>
  isLoading: boolean
} => {
  const saveRoute = useMutation(api.db.savedRoutes.saveRoute)
  const recordFeedback = useMutation(api.db.routeFeedback.recordRouteFeedback)
  const [isLoading, setIsLoading] = useState(false)

  const save = useCallback(async (): Promise<SaveCuratedRouteResult | null> => {
    if (!curatedRouteId) return null
    setIsLoading(true)
    try {
      // DATA-003 XOR: curatedRouteRef set, planInput / routeSnapshot / routeIndex
      // deliberately absent. The convex insertHandler enforces exactly-one-of.
      const result = await saveRoute({
        curatedRouteRef: curatedRouteId as Id<'curated_routes'>,
        name,
      })

      // Fire the flywheel signal. A feedback failure must NOT undo the save —
      // swallow it so the bookmark persists even if feedback is rate-limited.
      try {
        await recordFeedback({ routeId: curatedRouteId, action: 'save' })
      } catch {
        // best-effort — the save already succeeded
      }

      return result
    } catch {
      return null
    } finally {
      setIsLoading(false)
    }
  }, [curatedRouteId, name, saveRoute, recordFeedback])

  return useMemo(() => ({ save, isLoading }), [save, isLoading])
}

// ---------------------------------------------------------------------------
// useUnsaveCuratedRoute
// ---------------------------------------------------------------------------

/**
 * Remove a curated bookmark. Reuses the shared `softDeleteRoute` mutation
 * (consistent with the planned swipe-to-delete UX: a short undo window,
 * then permanent removal). Curated bookmarks pass through identically —
 * a saved_routes row is a saved_routes row.
 */
export const useUnsaveCuratedRoute = (): {
  unsave: (savedRouteId: string) => Promise<{ scheduledDeletionId: string } | null>
  isLoading: boolean
} => {
  const softDelete = useMutation(api.db.savedRoutes.softDeleteRoute)
  const [isLoading, setIsLoading] = useState(false)

  const unsave = useCallback(
    async (savedRouteId: string): Promise<{ scheduledDeletionId: string } | null> => {
      if (!savedRouteId) return null
      setIsLoading(true)
      try {
        return await softDelete({ savedRouteId: savedRouteId as Id<'saved_routes'> })
      } catch {
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [softDelete],
  )

  return useMemo(() => ({ unsave, isLoading }), [unsave, isLoading])
}

// ---------------------------------------------------------------------------
// useIsCuratedRouteSaved
// ---------------------------------------------------------------------------

type UseIsCuratedRouteSavedArgs = {
  /** Convex `_id` of the `curated_routes` document to check. */
  curatedRouteId?: string | null
}

/**
 * Check whether a curated route is already bookmarked by the current user.
 *
 * Mirrors `useIsRouteSaved` (`hooks/use-is-route-saved.ts`): subscribes to the
 * saved-routes list and scans for a row whose `curatedRouteRef` matches.
 *
 * NOTE: `getSavedRoutesList` currently filters to PLANNED rows only (DATA-003
 * kept the planned view clean). Curated-row detection therefore requires the
 * read path to expose `curatedRouteRef` on list rows — the detection LOGIC
 * below is correct and is exercised by the jsdom test with a curated-shape
 * list; live detection returns false until the read path is extended (tracked
 * as a SAVE-001 follow-up — a convex read-path change outside this task's
 * WRITE scope).
 */
export const useIsCuratedRouteSaved = ({
  curatedRouteId,
}: UseIsCuratedRouteSavedArgs): {
  isSaved: boolean
  savedRouteId?: string
} => {
  const data = useQuery(api.db.savedRoutes.getSavedRoutesList, { limit: 100 })

  return useMemo(() => {
    if (!curatedRouteId) return { isSaved: false }
    const routes = (
      data as { routes?: Array<{ curatedRouteRef?: string; savedRouteId?: string }> } | undefined
    )?.routes
    if (!routes) return { isSaved: false }

    const match = routes.find((r) => r.curatedRouteRef === curatedRouteId)
    return match ? { isSaved: true, savedRouteId: match.savedRouteId } : { isSaved: false }
  }, [curatedRouteId, data])
}
