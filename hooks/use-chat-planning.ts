/**
 * useChatPlanning - Orchestrates chat-to-planning flow
 *
 * Simplified responsibility: create a session if needed, forward the rider's
 * message to the backend agent action, and surface session-creation errors.
 *
 * Per-message lifecycle (running/streaming/complete/failed) is tracked in
 * `session_messages` and surfaced inline by the transcript, so this hook no
 * longer maintains a global isPlanning flag or polls route_plans — callers
 * derive isPlanning from the Convex messages query instead. Route-plan
 * polling lives in the RoutingCard component.
 */

import { useRef, useCallback, useState } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import type { Id } from '../convex/_generated/dataModel'
import type { RideFlowAction } from './use-ride-flow'
import { api } from '../convex/_generated/api'
import { useSelectedRoute } from '../contexts/selected-route'

/**
 * Type for sendMessage action result
 */
type SendMessageResult = {
  response: string
  messageId: Id<'session_messages'>
  attachments?: { type: string; routePlanId?: Id<'route_plans'> }[]
}

/**
 * Main hook - orchestrates chat planning flow
 *
 * Usage:
 * ```tsx
 * const { state, dispatch } = useRideFlow()
 * const { sendPlanningMessage, cancel, sessionId } = useChatPlanning(dispatch)
 * const isPlanning = messages?.some(m => m.status === 'running' || m.status === 'streaming') ?? false
 *
 * await sendPlanningMessage('Plan a ride from SF to LA')
 * if (isPlanning) cancel()
 * ```
 */
export const useChatPlanning = (
  dispatch: (action: RideFlowAction) => void
): {
  sessionId: Id<'planning_sessions'> | null
  sendPlanningMessage: (
    message: string,
    currentLocation?: { lat: number; lng: number }
  ) => Promise<void>
  cancel: () => void
  resetSession: () => void
} => {
  // Track AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null)
  // Remember the last session we created so callers can consume it
  const [sessionId, setSessionId] = useState<Id<'planning_sessions'> | null>(null)

  // Backend functions
  const createSession = useMutation(api.db.planningSessions.createSession)
  const sendMessage = useAction(api.actions.agent.sendMessage.sendMessage)
  const cancelPlan = useMutation(api.db.routePlans.cancelPlan)
  const getActiveRoutePlansForSession = useQuery(
    api.db.routePlans.getActiveRoutePlansForSession,
    sessionId !== null ? { sessionId } : 'skip'
  )

  // Reset displayed route when starting a new plan so newest shows
  const { setDisplayedRoutePlanId } = useSelectedRoute()

  /**
   * Send planning message - creates a session (if needed) then invokes the
   * backend agent action. The per-message running/streaming lifecycle is
   * owned by the backend and observed via the session_messages query.
   *
   * Session reuse logic:
   * - If we already have a sessionId from a previous message, reuse it (refinement)
   * - Otherwise, create a new session (first message or after error/new session)
   */
  const sendPlanningMessage = useCallback(
    async (message: string, currentLocation?: { lat: number; lng: number }) => {
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      try {
        // Reset displayed route so newest plan shows
        setDisplayedRoutePlanId(null)

        // Dispatch user message to state machine (kept so the ride-flow
        // reducer still sees the rider turn)
        dispatch({
          type: 'SEND_MESSAGE',
          content: message,
        })

        // Step 1: Create session if needed, or reuse existing session
        let sessionIdToUse: Id<'planning_sessions'>
        if (sessionId) {
          // Reuse existing session for refinement
          sessionIdToUse = sessionId
        } else {
          // Create new session for first message
          const sessionResult = await createSession({ firstMessage: message })
          sessionIdToUse = sessionResult.sessionId
          setSessionId(sessionIdToUse)
        }

        // Check if aborted
        if (signal.aborted) {
          throw new Error('Aborted')
        }

        // Step 2: Send message to backend agent. The action writes pending
        // assistant rows and finalizes them; we just await completion.
        await sendMessage({
          sessionId: sessionIdToUse,
          content: message,
          currentLocation,
        }) as SendMessageResult

        if (signal.aborted) {
          throw new Error('Aborted')
        }
      } catch (error) {
        // Ignore cancelled requests
        if (signal.aborted || (error as Error).name === 'AbortError') {
          console.log('Planning cancelled')
          return
        }

        console.error('Planning failed:', error)

        // Surface errors that happen BEFORE the backend has had a chance to
        // write a failed message row (e.g. createSession failure, network
        // error) so the UI still shows something. Per-message failures are
        // already surfaced by the transcript via message.status='failed'.
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const isConversational =
          errorMessage.includes('monthly limit') ||
          errorMessage.includes('could not understand') ||
          errorMessage.includes('could not generate') ||
          errorMessage.includes('timed out') ||
          errorMessage.includes('try again')

        const displayMessage = isConversational
          ? errorMessage
          : "I'm having trouble right now. Could you try again?"

        dispatch({
          type: 'PLANNING_ERROR',
          error: displayMessage,
        })
      }
    },
    [dispatch, createSession, sendMessage, sessionId]
  )

  /**
   * Cancel in-flight planning
   */
  const cancel = useCallback(async () => {
    // Abort the frontend request
    abortControllerRef.current?.abort()
    abortControllerRef.current = null

    // Cancel any active route plans on the backend
    if (sessionId && getActiveRoutePlansForSession) {
      await Promise.all(
        getActiveRoutePlansForSession.map((plan) => cancelPlan({ routePlanId: plan._id }))
      )
    }

    // Preserve sessionId for potential follow-up messages.
    // Only the explicit "new ride" button (NEW_SESSION) should nullify session.
    dispatch({ type: 'CANCEL_PLANNING' })
  }, [dispatch, cancelPlan, getActiveRoutePlansForSession, sessionId])

  /**
   * Reset session — call when starting a new session so the next message
   * creates a fresh session instead of reusing the old one.
   */
  const resetSession = useCallback(() => {
    setSessionId(null)
  }, [])

  return {
    sessionId,
    sendPlanningMessage,
    cancel,
    resetSession,
  }
}
