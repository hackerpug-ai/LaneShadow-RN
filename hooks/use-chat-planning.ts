/**
 * useChatPlanning - Orchestrates chat-to-planning flow
 *
 * Manages the flow from user message to route options:
 * - Creates planning session if needed
 * - Sends user message to backend agent
 * - Polls for route plan completion
 * - Dispatches PLANNING_SUCCESS when routes are ready
 * - Dispatches PLANNING_ERROR on backend failures
 * - Supports cancellation via AbortController
 *
 * This hook orchestrates the planning pipeline but doesn't render UI.
 * All state is managed through the useRideFlow state machine.
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import type { Id } from '../convex/_generated/dataModel'
import type { RideFlowAction } from './use-ride-flow'
import type { PlannedRouteOptionsView } from '../types/routes'
import { api } from '../convex/_generated/api'

/**
 * Type for sendMessage action result
 */
type SendMessageResult = {
  response: string
  messageId: Id<'session_messages'>
  attachments?: Array<{ type: string; routePlanId?: Id<'route_plans'> }>
}

/**
 * Type for route plan document
 */
type RoutePlanDoc = {
  _id: Id<'route_plans'>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: PlannedRouteOptionsView
  errorMessage?: string
}

/**
 * Planning phases for progress tracking
 */
type PlanningPhase =
  | null // Not planning
  | 'planning' // Agent is processing request
  | 'complete' // Done

/**
 * Planning state returned by the hook
 */
type PlanningState = {
  isPlanning: boolean
  currentPhase: PlanningPhase
  sessionId: string | null
  routePlanId: Id<'route_plans'> | null
}

/**
 * Hook return value
 */
type UseChatPlanningReturn = {
  // State
  isPlanning: boolean
  currentPhase: PlanningPhase
  sessionId: string | null

  // Actions
  sendPlanningMessage: (
    message: string,
    currentLocation?: { lat: number; lng: number }
  ) => Promise<void>
  cancel: () => void
}

const POLL_INTERVAL_MS = 1000 // Poll every second for plan completion

/**
 * Main hook - orchestrates chat planning flow
 *
 * Usage:
 * ```tsx
 * const { state, dispatch } = useRideFlow()
 * const { sendPlanningMessage, cancel, isPlanning, currentPhase } = useChatPlanning(dispatch)
 *
 * // Send user message
 * await sendPlanningMessage('Plan a ride from SF to LA')
 *
 * // Cancel if needed
 * if (isPlanning) {
 *   cancel()
 * }
 * ```
 */
export const useChatPlanning = (dispatch: (action: RideFlowAction) => void): UseChatPlanningReturn => {
  // Track AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  // Local state for phase tracking
  const [planningState, setPlanningState] = useState<PlanningState>({
    isPlanning: false,
    currentPhase: null,
    sessionId: null,
    routePlanId: null,
  })

  // Backend functions
  const createSession = useMutation(api.db.planningSessions.createSession)
  const sendMessage = useAction(api.actions.agent.sendMessage.sendMessage)

  // Query for route plan status (when we have a planId)
  // Note: When routePlanId is null, pass 'skip' to avoid the query
  const routePlan = useQuery(
    api.db.routePlans.getPlanById,
    planningState.routePlanId ?? ('skip' as any)
  ) as RoutePlanDoc | null | undefined

  /**
   * Poll for plan completion
   */
  useEffect(() => {
    if (!planningState.routePlanId || !planningState.isPlanning) {
      return
    }

    // Check if plan is ready
    if (routePlan) {
      if (routePlan.status === 'completed' && routePlan.result) {
        // Plan is complete - dispatch success
        dispatch({
          type: 'PLANNING_SUCCESS',
          routeOptions: routePlan.result as PlannedRouteOptionsView,
        })

        // Reset planning state
        setPlanningState({
          isPlanning: false,
          currentPhase: 'complete',
          sessionId: planningState.sessionId,
          routePlanId: planningState.routePlanId,
        })
      } else if (routePlan.status === 'failed') {
        // Plan failed - dispatch error
        dispatch({
          type: 'PLANNING_ERROR',
          error: routePlan.errorMessage || 'Route planning failed',
        })

        // Reset planning state
        setPlanningState({
          isPlanning: false,
          currentPhase: null,
          sessionId: null,
          routePlanId: null,
        })
      }
      // If status is 'running', continue polling
    }
  }, [routePlan, planningState, dispatch])

  /**
   * Send planning message - starts the full pipeline
   */
  const sendPlanningMessage = useCallback(
    async (message: string, currentLocation?: { lat: number; lng: number }) => {
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      try {
        // Dispatch user message to state machine
        dispatch({
          type: 'SEND_MESSAGE',
          content: message,
        })

        // Start planning state
        setPlanningState({
          isPlanning: true,
          currentPhase: 'planning',
          sessionId: null,
          routePlanId: null,
        })

        // Step 1: Create session if needed
        const sessionResult = await createSession({ firstMessage: message })
        const sessionId = sessionResult.sessionId

        // Update state with real sessionId
        setPlanningState((prev) => ({
          ...prev,
          sessionId,
        }))

        // Check if aborted
        if (signal.aborted) {
          throw new Error('Aborted')
        }

        // Step 2: Send message to backend agent
        const result = await sendMessage({
          sessionId,
          content: message,
          currentLocation,
        }) as SendMessageResult

        // Check if aborted again
        if (signal.aborted) {
          throw new Error('Aborted')
        }

        // Step 3: Handle response with route attachments
        if (result.attachments && result.attachments.length > 0) {
          // Find route attachment
          const routeAttachment = result.attachments.find((a) => a.type === 'route_options')

          if (routeAttachment?.routePlanId) {
            // Set routePlanId to trigger polling
            setPlanningState((prev) => ({
              ...prev,
              routePlanId: routeAttachment.routePlanId,
            }))

            // The useEffect will handle the rest when the plan is ready
            return
          }
        }

        // No route attachments - just a text response
        // This is still a success, just without routes
        setPlanningState({
          isPlanning: false,
          currentPhase: 'complete',
          sessionId,
          routePlanId: null,
        })
      } catch (error) {
        // Check if aborted
        if (signal.aborted || (error as Error).name === 'AbortError') {
          console.log('Planning cancelled')
          return
        }

        // Handle error - dispatch error action
        console.error('Planning failed:', error)

        // Reset state on error
        setPlanningState({
          isPlanning: false,
          currentPhase: null,
          sessionId: null,
          routePlanId: null,
        })

        // Dispatch error action to state machine
        // Include the actual error message from backend (already conversational)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Check if this is a backend conversational error or a technical error
        const isConversational =
          errorMessage.includes('monthly limit') ||
          errorMessage.includes('could not understand') ||
          errorMessage.includes('could not generate') ||
          errorMessage.includes('timed out') ||
          errorMessage.includes('try again')

        // Use the backend message if it's conversational, otherwise use generic
        const displayMessage = isConversational
          ? errorMessage
          : "I'm having trouble right now. Could you try again?"

        dispatch({
          type: 'PLANNING_ERROR',
          error: displayMessage,
        })
      }
    },
    [dispatch, createSession, sendMessage]
  )

  /**
   * Cancel in-flight planning
   */
  const cancel = useCallback(() => {
    // Abort the request
    abortControllerRef.current?.abort()
    abortControllerRef.current = null

    // Reset state
    setPlanningState({
      isPlanning: false,
      currentPhase: null,
      sessionId: null,
      routePlanId: null,
    })

    // Dispatch new session to reset state machine
    dispatch({
      type: 'NEW_SESSION',
    })
  }, [dispatch])

  return {
    isPlanning: planningState.isPlanning,
    currentPhase: planningState.currentPhase,
    sessionId: planningState.sessionId,
    sendPlanningMessage,
    cancel,
  }
}
