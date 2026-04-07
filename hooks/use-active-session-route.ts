/**
 * useActiveSessionRoute - Fetches the active route plan for a planning session
 *
 * Returns the route plan from the newest routing_card message in the session.
 * If displayedRoutePlanId is provided, returns that specific route plan instead.
 */

import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useSelectedRoute } from '../contexts/selected-route'

type RoutePlanResult = {
  routePlanId: Id<'route_plans'> | null
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
export const useActiveSessionRoute = (sessionId: Id<'planning_sessions'> | null): RoutePlanResult => {
  const { selectedRouteId, displayedRoutePlanId } = useSelectedRoute()

  // Fetch messages to find the newest routing_card
  const messages = useQuery(
    api.db.sessionMessages.list,
    sessionId ? { sessionId } : 'skip'
  )

  // Determine which route plan ID to fetch
  let targetRoutePlanId: Id<'route_plans'> | null = null

  if (displayedRoutePlanId) {
    // Use the overridden route plan (cast to Id type)
    targetRoutePlanId = displayedRoutePlanId as Id<'route_plans'>
  } else if (messages) {
    // Find the newest routing_card message
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.kind === 'routing_card' && msg.attachments?.[0]?.routePlanId) {
        targetRoutePlanId = msg.attachments[0].routePlanId
        break
      }
    }
  }

  // Fetch the route plan using the public query (requires auth)
  const routePlan = useQuery(
    api.db.routePlans.getPlanById,
    targetRoutePlanId ? { routePlanId: targetRoutePlanId } : 'skip'
  )

  // Determine the active route option
  let activeOption: RoutePlanResult['activeOption'] = null
  if (routePlan?.result?.options) {
    const options = routePlan.result.options as Array<{ routeOptionId: string }>
    console.info('[useActiveSessionRoute] Route plan data:', {
      routePlanId: routePlan._id,
      status: routePlan.status,
      hasResult: !!routePlan.result,
      optionsCount: options.length,
      firstOption: options[0] ? {
        routeOptionId: options[0].routeOptionId,
        hasMap: !!(options[0] as any).map,
        hasOverviewGeometry: !!(options[0] as any).map?.overviewGeometry,
        legsCount: (options[0] as any).map?.legs?.length,
      } : null,
    })
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
    console.info('[useActiveSessionRoute] No route plan or options:', {
      hasRoutePlan: !!routePlan,
      status: routePlan?.status,
      hasResult: !!routePlan?.result,
      hasOptions: !!routePlan?.result?.options,
    })
  }

  return {
    routePlanId: targetRoutePlanId,
    routePlan,
    activeOption,
  }
}
