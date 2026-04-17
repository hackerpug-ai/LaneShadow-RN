/**
 * useActiveSessionRoute - Fetches the active route plan for a planning session
 *
 * Returns the route plan from the newest routing_card message in the session.
 * If displayedRoutePlanId is provided, returns that specific route plan instead.
 */

import { useQuery } from 'convex/react'
import { api } from '../../server/convex/_generated/api'
import type { Id } from '../../server/convex/_generated/dataModel'
import { useSelectedRoute } from '../contexts/selected-route'

type RoutePlanResult = {
  routePlanId: Id<'route_plans'> | null
  newestRoutePlanId: Id<'route_plans'> | null
  routePlan: any
  activeOption: any
}

/**
 * Get the active route plan for a session.
 *
 * If displayedRoutePlanId is provided in SelectedRouteContext, returns that specific plan.
 * Otherwise, returns the newest route plan from the session (based on routing_card messages).
 *
 * Also returns the selected route option within that plan (based on selectedRouteId).
 */
export const useActiveSessionRoute = (
  sessionId: Id<'planning_sessions'> | null,
): RoutePlanResult => {
  const { selectedRouteId, displayedRoutePlanId } = useSelectedRoute()

  // Fetch messages to find the newest routing_card
  const messages = useQuery(api.db.sessionMessages.list, sessionId ? { sessionId } : 'skip')

  // Always find the newest routing_card message (independent of display override)
  let newestRoutePlanId: Id<'route_plans'> | null = null
  if (messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.kind === 'routing_card' && msg.attachments?.[0]?.routePlanId) {
        newestRoutePlanId = msg.attachments[0].routePlanId
        break
      }
    }
  }

  // Determine which route plan ID to fetch
  let targetRoutePlanId: Id<'route_plans'> | null = null

  if (displayedRoutePlanId) {
    // Use the overridden route plan (cast to Id type)
    targetRoutePlanId = displayedRoutePlanId as Id<'route_plans'>
  } else {
    // No override - use the newest plan
    targetRoutePlanId = newestRoutePlanId
  }

  // Fetch the route plan using the public query (requires auth)
  const routePlan = useQuery(
    api.db.routePlans.getPlanById,
    targetRoutePlanId ? { routePlanId: targetRoutePlanId } : 'skip',
  )

  // Session isolation: only return the route plan if it belongs to the current session
  // This prevents plans from rendering on wrong/new sessions
  const isValidRoutePlan =
    routePlan &&
    (!sessionId || // No session filter needed if we're not in a session
      routePlan.planningSessionId === sessionId) // Plan must belong to current session
  const validatedRoutePlan = isValidRoutePlan ? routePlan : null

  // Determine the active route option
  let activeOption: RoutePlanResult['activeOption'] = null
  if (validatedRoutePlan?.result?.options) {
    const options = validatedRoutePlan.result.options as { routeOptionId: string }[]
    if (options.length > 0) {
      if (selectedRouteId === null) {
        // No selection - use the first option
        activeOption = options[0]
      } else {
        // Find the selected option
        const selected = options.find((opt) => opt.routeOptionId === selectedRouteId)
        activeOption = selected ?? options[0]
      }
    }
  } else {
  }

  return {
    routePlanId: targetRoutePlanId,
    newestRoutePlanId,
    routePlan: validatedRoutePlan,
    activeOption,
  }
}
