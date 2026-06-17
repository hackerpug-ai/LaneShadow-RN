/**
 * Hook to detect if the current route has been saved by the user.
 *
 * Uses the routeFingerprint (routeOptionId) to check against saved routes.
 * This allows us to show visual feedback (like a highlighted bookmark button)
 * when the user is viewing a route they've previously saved.
 */

import { useQuery } from 'convex/react'
import { useMemo } from 'react'
import { api } from '../convex/_generated/api'

/**
 * Check if a route with the given fingerprint exists in the user's saved routes.
 *
 * @param routeFingerprint - The routeOptionId to check against saved routes
 * @returns true if this route has been saved by the user
 */
export function useIsRouteSaved(routeFingerprint?: string | null): boolean {
  // Fetch all saved routes for the current user
  const savedRoutesData = useQuery(api.db.savedRoutes.getSavedRoutesList, {
    limit: 100, // Get more routes to check against
  })

  return useMemo(() => {
    if (!routeFingerprint || !savedRoutesData?.routes) {
      return false
    }

    // Check if any saved route has a matching routeFingerprint
    return savedRoutesData.routes.some(
      (route: { routeIndex?: { routeFingerprint?: string } | null }) => {
        // The routeFingerprint is stored in the routeIndex
        return route.routeIndex?.routeFingerprint === routeFingerprint
      },
    )
  }, [routeFingerprint, savedRoutesData])
}
