/**
 * useActiveSessionRoute - Bridges agent chat output to UI consumers.
 *
 * Subscribes to the active planning session's newest routing_card message,
 * resolves its route_plans attachment, and exposes the available route options
 * plus the currently-selected route option from SelectedRoute context.
 *
 * Consumers:
 * - Home map screen (route polyline rendering, task #258)
 * - CompletedCard selection wiring (task #257)
 */

import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useSelectedRoute } from '../contexts/selected-route'
import type { PlannedRouteOptionView, PlannedRouteOptionsView } from '../types/routes'

type RoutePlanDoc = {
  _id: Id<'route_plans'>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: PlannedRouteOptionsView
  [key: string]: unknown
}

type UseActiveSessionRouteResult = {
  routePlan: RoutePlanDoc | null | undefined // undefined = loading
  options: PlannedRouteOptionView[]
  activeOption: PlannedRouteOptionView | null
  selectedRouteId: string | null
  selectRoute: (routeOptionId: string) => void
}

const EMPTY_RESULT: UseActiveSessionRouteResult = {
  routePlan: null,
  options: [],
  activeOption: null,
  selectedRouteId: null,
  selectRoute: () => {},
}

const LOADING_RESULT: UseActiveSessionRouteResult = {
  routePlan: undefined,
  options: [],
  activeOption: null,
  selectedRouteId: null,
  selectRoute: () => {},
}

/**
 * Resolves the active route plan and selected option for a planning session.
 *
 * If `sessionId` is omitted, the hook picks the most recent session from
 * `listSessions`. Pass an explicit `sessionId` to pin to a specific session.
 */
export function useActiveSessionRoute(
  sessionId?: Id<'planning_sessions'>
): UseActiveSessionRouteResult {
  // Step 1: Resolve sessionId — if not provided, fetch the most recent session
  const sessions = useQuery(
    api.db.planningSessions.listSessions,
    sessionId === undefined ? {} : 'skip'
  )

  const resolvedSessionId: Id<'planning_sessions'> | undefined =
    sessionId ?? sessions?.[0]?._id

  // Step 2: Subscribe to session messages
  const messages = useQuery(
    api.db.sessionMessages.list,
    resolvedSessionId ? { sessionId: resolvedSessionId } : 'skip'
  )

  // Step 3: Find the newest routing_card message with a routePlanId
  // messages are sorted oldest-first by listHandler, so we reverse to find newest
  let routePlanId: Id<'route_plans'> | undefined
  if (messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.kind === 'routing_card' && msg.attachments?.[0]?.routePlanId) {
        routePlanId = msg.attachments[0].routePlanId
        break
      }
    }
  }

  // Step 4: Subscribe to the route plan doc
  const routePlan = useQuery(
    api.db.routePlans.getPlanById,
    routePlanId ? { routePlanId } : 'skip'
  ) as RoutePlanDoc | null | undefined

  // Step 5: Compute options from route plan result
  const options: PlannedRouteOptionView[] = routePlan?.result?.options ?? []

  // Step 6: Read selection from SelectedRoute context
  const { selectedRouteId, setSelectedRouteId } = useSelectedRoute()

  // Step 7: Compute the active option
  // If selectedRouteId matches an option, use that. Otherwise default to first option.
  const activeOption: PlannedRouteOptionView | null =
    options.find((opt) => opt.routeOptionId === selectedRouteId) ?? options[0] ?? null

  // Step 8: Expose selectRoute callback
  const selectRoute = (id: string) => {
    setSelectedRouteId(id)
  }

  // Handle loading states — queries return undefined while loading
  if (sessionId === undefined) {
    // Still waiting for sessions list to load
    if (sessions === undefined) {
      return { ...LOADING_RESULT, selectedRouteId, selectRoute }
    }
    // Sessions list loaded but empty — no sessions exist
    if (sessions.length === 0) {
      return { ...EMPTY_RESULT, selectedRouteId, selectRoute }
    }
  }

  // Messages query is still loading
  if (resolvedSessionId && messages === undefined) {
    return { ...LOADING_RESULT, selectedRouteId, selectRoute }
  }

  // No routing_card message found
  if (!routePlanId) {
    return { routePlan: null, options: [], activeOption: null, selectedRouteId, selectRoute }
  }

  // Route plan query is still loading
  if (routePlan === undefined) {
    return { ...LOADING_RESULT, selectedRouteId, selectRoute }
  }

  // Step 9: Return the full result
  return {
    routePlan: routePlan ?? null,
    options,
    activeOption,
    selectedRouteId,
    selectRoute,
  }
}
