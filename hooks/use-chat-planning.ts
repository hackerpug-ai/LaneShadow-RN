/**
 * useChatPlanning - Orchestrates chat-to-planning flow
 *
 * Manages the flow from user message to route options:
 * - Sends user message to state machine
 * - Calls parseNaturalLanguageInput to extract route parameters
 * - Calls createPlan to start route planning
 * - Subscribes to plan status for phase updates
 * - Dispatches PLANNING_SUCCESS when routes are ready
 * - Supports cancellation via AbortController
 *
 * This hook orchestrates the planning pipeline but doesn't render UI.
 * All state is managed through the useRideFlow state machine.
 *
 * Time-based phase fallback (2s/phase) ensures UX works even when
 * real-time status is unavailable.
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import type { RideFlowAction } from './use-ride-flow'
import type { PlannedRouteOptionsView } from '../types/routes'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'

/**
 * Planning phases for progress tracking
 */
type PlanningPhase =
  | null // Not planning
  | 'analyzing' // Parsing natural language input
  | 'routing' // Computing routes
  | 'enriching' // Adding weather/conditions overlays
  | 'complete' // Done

/**
 * Planning state returned by the hook
 */
type PlanningState = {
  isPlanning: boolean
  currentPhase: PlanningPhase
  planId: string | null
  sessionId: string | null
}

/**
 * Hook return value
 */
type UseChatPlanningReturn = {
  // State
  isPlanning: boolean
  currentPhase: PlanningPhase
  planId: string | null
  sessionId: string | null

  // Actions
  sendPlanningMessage: (message: string) => Promise<void>
  cancel: () => void
}

const PHASE_FALLBACK_DURATION_MS = 2000 // 2 seconds per phase

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
    planId: null,
    sessionId: null,
  })

  // Backend functions (these will be stubbed for now - US-009 implements parseNaturalLanguageInput)
  // TODO: Replace with actual Convex actions when available
  // const parseNaturalLanguageInput = useAction(api.db.schedule.parseNaturalLanguageInput)
  // const createPlan = useAction(api.db.plans.createPlan)
  // const getPlanStatus = useQuery(api.db.sessions.getPlanStatus)

  /**
   * Update phase with time-based fallback
   */
  const updatePhase = useCallback((phase: PlanningPhase) => {
    setPlanningState((prev) => ({ ...prev, currentPhase: phase }))
  }, [])

  /**
   * Start time-based phase progression (fallback when getPlanStatus unavailable)
   */
  useEffect(() => {
    if (!planningState.isPlanning || planningState.currentPhase === 'complete') {
      return
    }

    const phaseProgression: PlanningPhase[] = ['analyzing', 'routing', 'enriching', 'complete']
    const currentIndex = phaseProgression.indexOf(planningState.currentPhase)

    if (currentIndex === -1 || currentIndex === phaseProgression.length - 1) {
      return
    }

    const timer = setTimeout(() => {
      updatePhase(phaseProgression[currentIndex + 1])
    }, PHASE_FALLBACK_DURATION_MS)

    return () => clearTimeout(timer)
  }, [planningState.isPlanning, planningState.currentPhase, updatePhase])

  /**
   * Send planning message - starts the full pipeline
   */
  const sendPlanningMessage = useCallback(
    async (message: string) => {
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
        const sessionId = `session-${Date.now()}`
        setPlanningState({
          isPlanning: true,
          currentPhase: 'analyzing',
          planId: null,
          sessionId,
        })

        // TODO: Step 1 - Parse natural language input (US-009)
        // const parseResult = await parseNaturalLanguageInput(
        //   { message },
        //   { signal }
        // )
        //
        // if (signal.aborted) throw new Error('Aborted')
        //
        // updatePhase('routing')

        // TODO: Step 2 - Create plan (US-006)
        // const planResult = await createPlan(
        //   {
        //     planInput: parseResult.planInput,
        //     startLabel: parseResult.startLabel,
        //     endLabel: parseResult.endLabel,
        //   },
        //   { signal }
        // )
        //
        // if (signal.aborted) throw new Error('Aborted')
        //
        // setPlanningState((prev) => ({ ...prev, planId: planResult.planId }))
        // updatePhase('enriching')

        // TODO: Step 3 - Subscribe to plan status for real-time updates
        // This would use useQuery to track plan status and update phases

        // TODO: Step 4 - Wait for completion and get routes
        // For now, simulate completion after phases
        setTimeout(() => {
          if (!signal.aborted) {
            // Simulated route options - replace with actual backend data
            const mockRouteOptions: PlannedRouteOptionsView = {
              planId: 'mock-plan-id',
              options: [],
            }

            // Dispatch success to state machine
            dispatch({
              type: 'PLANNING_SUCCESS',
              routeOptions: mockRouteOptions,
            })

            // Reset planning state
            setPlanningState({
              isPlanning: false,
              currentPhase: 'complete',
              planId: 'mock-plan-id',
              sessionId,
            })
          }
        }, PHASE_FALLBACK_DURATION_MS * 3) // After all phases
      } catch (error) {
        // Check if aborted
        if (signal.aborted) {
          console.log('Planning cancelled')
          return
        }

        // Handle error - dispatch error action
        console.error('Planning failed:', error)

        // Reset state on error
        setPlanningState({
          isPlanning: false,
          currentPhase: null,
          planId: null,
          sessionId: null,
        })

        // TODO: Dispatch error action to state machine
        // dispatch({
        //   type: 'PLANNING_ERROR',
        //   error: error instanceof Error ? error.message : 'Unknown error',
        // })
      }
    },
    [dispatch]
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
      planId: null,
      sessionId: null,
    })

    // Dispatch new session to reset state machine
    dispatch({
      type: 'NEW_SESSION',
    })
  }, [dispatch])

  return {
    isPlanning: planningState.isPlanning,
    currentPhase: planningState.currentPhase,
    planId: planningState.planId,
    sessionId: planningState.sessionId,
    sendPlanningMessage,
    cancel,
  }
}
