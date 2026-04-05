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
import { useAction, useMutation } from 'convex/react'
import type { Id } from '../convex/_generated/dataModel'
import type { RideFlowAction } from './use-ride-flow'
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
 * Hook return value
 */
type UseChatPlanningReturn = {
  sessionId: string | null
  sendPlanningMessage: (
    message: string,
    currentLocation?: { lat: number; lng: number }
  ) => Promise<void>
  cancel: () => void
}

/**
 * Main hook - orchestrates chat planning flow
 *
 * Usage:
 * ```tsx
 * const { state, dispatch } = useRideFlow()
 * const { sendPlanningMessage, cancel } = useChatPlanning(dispatch)
 * const isPlanning = messages?.some(m => m.status === 'running' || m.status === 'streaming') ?? false
 *
 * await sendPlanningMessage('Plan a ride from SF to LA')
 * if (isPlanning) cancel()
 * ```
 */
export const useChatPlanning = (
  dispatch: (action: RideFlowAction) => void
): UseChatPlanningReturn => {
  // Track AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null)
  // Remember the last session we created so callers can consume it
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Backend functions
  const createSession = useMutation(api.db.planningSessions.createSession)
  const sendMessage = useAction(api.actions.agent.sendMessage.sendMessage)

  /**
   * Send planning message - creates a session (if needed) then invokes the
   * backend agent action. The per-message running/streaming lifecycle is
   * owned by the backend and observed via the session_messages query.
   */
  const sendPlanningMessage = useCallback(
    async (message: string, currentLocation?: { lat: number; lng: number }) => {
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      try {
        // Dispatch user message to state machine (kept so the ride-flow
        // reducer still sees the rider turn)
        dispatch({
          type: 'SEND_MESSAGE',
          content: message,
        })

        // Step 1: Create session if needed
        const sessionResult = await createSession({ firstMessage: message })
        const newSessionId = sessionResult.sessionId
        setSessionId(newSessionId)

        // Check if aborted
        if (signal.aborted) {
          throw new Error('Aborted')
        }

        // Step 2: Send message to backend agent. The action writes pending
        // assistant rows and finalizes them; we just await completion.
        await sendMessage({
          sessionId: newSessionId,
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
    [dispatch, createSession, sendMessage]
  )

  /**
   * Cancel in-flight planning
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setSessionId(null)

    // Dispatch new session to reset state machine
    dispatch({
      type: 'NEW_SESSION',
    })
  }, [dispatch])

  return {
    sessionId,
    sendPlanningMessage,
    cancel,
  }
}
