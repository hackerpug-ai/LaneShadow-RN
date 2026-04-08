/**
 * useRideFlow - Pure state machine hook for ride planning flow
 *
 * Manages the entire ride planning flow with 6 states:
 * - IDLE: Initial state, no active planning
 * - PLANNING: Processing a natural language request
 * - ROUTE_RESULTS: Displaying route options
 * - ROUTE_DETAILS: Viewing specific route details
 * - SESSION_HISTORY: Viewing conversation history
 * - NAVIGATION_EXPORT: Exporting route to navigation app
 *
 * This is a pure state machine - no UI rendering, no side effects.
 * All transitions are guarded and type-safe.
 *
 * Drop-in replacement for the existing planningReducer.
 */

import { useReducer } from 'react'
import type { PlannedRouteOptionsView } from '../types/routes'

/**
 * State discriminators - each state has a unique phase
 */
export type RideFlowState =
  | IdleState
  | PlanningState
  | ErrorState
  | RouteResultsState
  | RouteDetailsState
  | SessionHistoryState
  | NavigationExportState

export type IdleState = {
  phase: 'IDLE'
  sessionId: string | null
  routeOptions: PlannedRouteOptionsView | null
  selectedRouteId: string | null
}

export type PlanningState = {
  phase: 'PLANNING'
  sessionId: string
  planId: string | null
  currentPhase: string
  routeOptions: PlannedRouteOptionsView | null
  selectedRouteId: string | null
}

export type ErrorState = {
  phase: 'ERROR'
  errorMessage: string
  sessionId: string | null
}

export type RouteResultsState = {
  phase: 'ROUTE_RESULTS'
  sessionId: string
  routeOptions: PlannedRouteOptionsView
  selectedRouteId: string | null
}

export type RouteDetailsState = {
  phase: 'ROUTE_DETAILS'
  sessionId: string
  routeOptions: PlannedRouteOptionsView
  selectedRouteId: string
}

export type SessionHistoryState = {
  phase: 'SESSION_HISTORY'
  sessionId: string
  routeOptions: PlannedRouteOptionsView
  selectedRouteId: string | null
}

export type NavigationExportState = {
  phase: 'NAVIGATION_EXPORT'
  sessionId: string
  routeOptions: PlannedRouteOptionsView
  selectedRouteId: string
}

/**
 * All possible actions in the state machine
 */
export type RideFlowAction =
  | SendMessageAction
  | PlanningSuccessAction
  | PlanningErrorAction
  | CancelPlanningAction
  | SelectRouteAction
  | ViewHistoryAction
  | CloseHistoryAction
  | NavigateExportAction
  | CloseExportAction
  | NewSessionAction
  | LoadSessionAction

export type SendMessageAction = {
  type: 'SEND_MESSAGE'
  content: string
}

export type PlanningSuccessAction = {
  type: 'PLANNING_SUCCESS'
  routeOptions: PlannedRouteOptionsView
}

export type PlanningErrorAction = {
  type: 'PLANNING_ERROR'
  error: string
}

export type CancelPlanningAction = {
  type: 'CANCEL_PLANNING'
}

export type SelectRouteAction = {
  type: 'SELECT_ROUTE'
  routeId: string
}

export type ViewHistoryAction = {
  type: 'VIEW_HISTORY'
}

export type CloseHistoryAction = {
  type: 'CLOSE_HISTORY'
}

export type NavigateExportAction = {
  type: 'NAVIGATE_EXPORT'
}

export type CloseExportAction = {
  type: 'CLOSE_EXPORT'
}

export type NewSessionAction = {
  type: 'NEW_SESSION'
}

export type LoadSessionAction = {
  type: 'LOAD_SESSION'
  sessionId: string
  routeOptions: PlannedRouteOptionsView
  selectedRouteId?: string
}

/**
 * Initial state
 */
const initialState: IdleState = {
  phase: 'IDLE',
  sessionId: null,
  routeOptions: null,
  selectedRouteId: null,
}

/**
 * State transition guards
 */
const guards = {
  canSendMessage: (content: string): boolean => {
    return content.trim().length > 0
  },

  canNavigateToExport: (selectedRouteId: string | null): boolean => {
    return selectedRouteId !== null
  },

  canViewHistory: (sessionId: string | null): boolean => {
    return sessionId !== null
  },
}

/**
 * Generate a unique session ID
 */
const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Pure state machine reducer
 * No side effects, no async operations, just state transitions
 */
const rideFlowReducer = (
  state: RideFlowState,
  action: RideFlowAction
): RideFlowState => {
  switch (state.phase) {
    case 'IDLE':
      return handleIdleState(state, action)

    case 'PLANNING':
      return handlePlanningState(state, action)

    case 'ERROR':
      return handleErrorState(state, action)

    case 'ROUTE_RESULTS':
      return handleRouteResultsState(state, action)

    case 'ROUTE_DETAILS':
      return handleRouteDetailsState(state, action)

    case 'SESSION_HISTORY':
      return handleSessionHistoryState(state, action)

    case 'NAVIGATION_EXPORT':
      return handleNavigationExportState(state, action)

    default:
      // Exhaustive check - should never reach here
      const _exhaustiveCheck: never = state
      return _exhaustiveCheck
  }
}

/**
 * IDLE state handlers
 */
const handleIdleState = (
  state: IdleState,
  action: RideFlowAction
): RideFlowState => {
  switch (action.type) {
    case 'SEND_MESSAGE':
      // Guard: Must have content
      if (!guards.canSendMessage(action.content)) {
        return state
      }
      return {
        phase: 'PLANNING',
        sessionId: generateSessionId(),
        planId: null,
        currentPhase: 'analyzing',
        routeOptions: null,
        selectedRouteId: null,
      }

    case 'LOAD_SESSION':
      return {
        phase: 'ROUTE_RESULTS',
        sessionId: action.sessionId,
        routeOptions: action.routeOptions,
        selectedRouteId: action.selectedRouteId ?? null,
      }

    case 'NEW_SESSION':
      return initialState

    default:
      // No-op for unhandled actions
      return state
  }
}

/**
 * PLANNING state handlers
 */
const handlePlanningState = (
  state: PlanningState,
  action: RideFlowAction
): RideFlowState => {
  switch (action.type) {
    case 'PLANNING_SUCCESS':
      return {
        phase: 'ROUTE_RESULTS',
        sessionId: state.sessionId,
        routeOptions: action.routeOptions,
        selectedRouteId: action.routeOptions.options?.[0]?.routeOptionId ?? null,
      }

    case 'PLANNING_ERROR':
      // On error, transition to ERROR state with message
      return {
        phase: 'ERROR',
        errorMessage: action.error,
        sessionId: state.sessionId,
      }

    case 'CANCEL_PLANNING':
      // If we have existing route options (refinement was cancelled),
      // return to ROUTE_RESULTS with existing data
      if (state.routeOptions) {
        return {
          phase: 'ROUTE_RESULTS',
          sessionId: state.sessionId,
          routeOptions: state.routeOptions,
          selectedRouteId: state.selectedRouteId,
        }
      }
      // No existing routes (initial plan was cancelled), reset to IDLE
      return initialState

    case 'NEW_SESSION':
      return initialState

    default:
      // No-op for unhandled actions
      return state
  }
}

/**
 * ERROR state handlers
 */
const handleErrorState = (
  state: ErrorState,
  action: RideFlowAction
): RideFlowState => {
  switch (action.type) {
    case 'SEND_MESSAGE':
      // Try again - transition to PLANNING
      if (!guards.canSendMessage(action.content)) {
        return state
      }
      return {
        phase: 'PLANNING',
        sessionId: generateSessionId(),
        planId: null,
        currentPhase: 'analyzing',
        routeOptions: null,
        selectedRouteId: null,
      }

    case 'NEW_SESSION':
      return initialState

    default:
      // No-op for unhandled actions
      return state
  }
}

/**
 * ROUTE_RESULTS state handlers
 */
const handleRouteResultsState = (
  state: RouteResultsState,
  action: RideFlowAction
): RideFlowState => {
  switch (action.type) {
    case 'SEND_MESSAGE':
      // Refinement: transition to PLANNING but KEEP the existing sessionId
      if (!guards.canSendMessage(action.content)) {
        return state
      }
      return {
        phase: 'PLANNING',
        sessionId: state.sessionId,
        planId: null,
        currentPhase: 'analyzing',
        routeOptions: state.routeOptions,
        selectedRouteId: state.selectedRouteId,
      }

    case 'SELECT_ROUTE':
      return {
        phase: 'ROUTE_DETAILS',
        sessionId: state.sessionId,
        routeOptions: state.routeOptions,
        selectedRouteId: action.routeId,
      }

    case 'NAVIGATE_EXPORT':
      // Guard: Must have selected route
      if (!guards.canNavigateToExport(state.selectedRouteId)) {
        return state // Stay in ROUTE_RESULTS
      }
      return {
        phase: 'NAVIGATION_EXPORT',
        sessionId: state.sessionId,
        routeOptions: state.routeOptions,
        selectedRouteId: state.selectedRouteId!,
      }

    case 'VIEW_HISTORY':
      if (!guards.canViewHistory(state.sessionId)) {
        return state
      }
      return {
        phase: 'SESSION_HISTORY',
        sessionId: state.sessionId,
        routeOptions: state.routeOptions,
        selectedRouteId: state.selectedRouteId,
      }

    case 'NEW_SESSION':
      return initialState

    default:
      // No-op for unhandled actions
      return state
  }
}

/**
 * ROUTE_DETAILS state handlers
 */
const handleRouteDetailsState = (
  state: RouteDetailsState,
  action: RideFlowAction
): RideFlowState => {
  switch (action.type) {
    case 'SEND_MESSAGE':
      // Refinement: transition to PLANNING but KEEP the existing sessionId
      if (!guards.canSendMessage(action.content)) {
        return state
      }
      return {
        phase: 'PLANNING',
        sessionId: state.sessionId,
        planId: null,
        currentPhase: 'analyzing',
        routeOptions: state.routeOptions,
        selectedRouteId: state.selectedRouteId,
      }

    case 'SELECT_ROUTE':
      // Allow changing selected route
      return {
        ...state,
        selectedRouteId: action.routeId,
      }

    case 'NAVIGATE_EXPORT':
      return {
        phase: 'NAVIGATION_EXPORT',
        sessionId: state.sessionId,
        routeOptions: state.routeOptions,
        selectedRouteId: state.selectedRouteId,
      }

    case 'VIEW_HISTORY':
      return {
        phase: 'SESSION_HISTORY',
        sessionId: state.sessionId,
        routeOptions: state.routeOptions,
        selectedRouteId: state.selectedRouteId,
      }

    case 'NEW_SESSION':
      return initialState

    default:
      // No-op for unhandled actions
      return state
  }
}

/**
 * SESSION_HISTORY state handlers
 */
const handleSessionHistoryState = (
  state: SessionHistoryState,
  action: RideFlowAction
): RideFlowState => {
  switch (action.type) {
    case 'CLOSE_HISTORY':
      // Return to ROUTE_RESULTS if we have routes, otherwise IDLE
      if (state.routeOptions) {
        return {
          phase: 'ROUTE_RESULTS',
          sessionId: state.sessionId,
          routeOptions: state.routeOptions,
          selectedRouteId: state.selectedRouteId,
        }
      }
      return {
        phase: 'IDLE',
        sessionId: state.sessionId,
        routeOptions: null,
        selectedRouteId: null,
      }

    case 'SELECT_ROUTE':
      // Allow selecting a route from history
      return {
        phase: 'ROUTE_DETAILS',
        sessionId: state.sessionId,
        routeOptions: state.routeOptions,
        selectedRouteId: action.routeId,
      }

    case 'NEW_SESSION':
      return initialState

    default:
      // No-op for unhandled actions
      return state
  }
}

/**
 * NAVIGATION_EXPORT state handlers
 */
const handleNavigationExportState = (
  state: NavigationExportState,
  action: RideFlowAction
): RideFlowState => {
  switch (action.type) {
    case 'CLOSE_EXPORT':
      return {
        phase: 'ROUTE_DETAILS',
        sessionId: state.sessionId,
        routeOptions: state.routeOptions,
        selectedRouteId: state.selectedRouteId,
      }

    case 'NEW_SESSION':
      return initialState

    default:
      // No-op for unhandled actions
      return state
  }
}

/**
 * Main hook - returns state and dispatch
 *
 * Usage:
 * ```tsx
 * const { state, dispatch } = useRideFlow()
 *
 * // Start planning
 * dispatch({ type: 'SEND_MESSAGE', content: 'Plan a ride from A to B' })
 *
 * // Check state
 * if (state.phase === 'PLANNING') {
 *   // Show loading indicator
 * }
 * ```
 */
export const useRideFlow = () => {
  const [state, dispatch] = useReducer(rideFlowReducer, initialState)

  return {
    state,
    dispatch,
  }
}

// Export reducer and initialState for testing
export { rideFlowReducer, initialState }

/**
 * Type guards for state checking
 */
export const isIdle = (state: RideFlowState): state is IdleState => {
  return state.phase === 'IDLE'
}

export const isPlanning = (state: RideFlowState): state is PlanningState => {
  return state.phase === 'PLANNING'
}

export const isError = (state: RideFlowState): state is ErrorState => {
  return state.phase === 'ERROR'
}

export const isRouteResults = (
  state: RideFlowState
): state is RouteResultsState => {
  return state.phase === 'ROUTE_RESULTS'
}

export const isRouteDetails = (
  state: RideFlowState
): state is RouteDetailsState => {
  return state.phase === 'ROUTE_DETAILS'
}

export const isSessionHistory = (
  state: RideFlowState
): state is SessionHistoryState => {
  return state.phase === 'SESSION_HISTORY'
}

export const isNavigationExport = (
  state: RideFlowState
): state is NavigationExportState => {
  return state.phase === 'NAVIGATION_EXPORT'
}
