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
 *
 * Optimistic UI: Messages appear immediately in the UI with client-generated
 * temp IDs, then are replaced with server-confirmed messages. This provides
 * instant feedback while preventing race conditions via the isSending flag.
 */

import { useAction, useMutation, useQuery } from 'convex/react'
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { api } from '../../server/convex/_generated/api'
import type { Id } from '../../server/convex/_generated/dataModel'
import { useSelectedRoute } from '../contexts/selected-route'
import type { RideFlowAction } from './use-ride-flow'

/**
 * Type for sendMessage action result
 */
/**
 * Optimistic message type (client-side only)
 */
type OptimisticMessage = {
  id: string // Temp ID like 'temp-1234567890'
  role: 'rider' | 'agent'
  content: string
  timestamp: Date
  isOptimistic: true
}

/**
 * Main hook - orchestrates chat planning flow
 *
 * Usage:
 * ```tsx
 * const { state, dispatch } = useRideFlow()
 * const { sendPlanningMessage, cancel, sessionId, isSending, optimisticMessages } = useChatPlanning(dispatch)
 * const isPlanning = messages?.some(m => m.status === 'running' || m.status === 'streaming') ?? false
 *
 * await sendPlanningMessage('Plan a ride from SF to LA')
 * if (isPlanning) cancel()
 * ```
 */
export const useChatPlanning = (
  dispatch: (action: RideFlowAction) => void,
): {
  sessionId: Id<'planning_sessions'> | null
  sendPlanningMessage: (
    message: string,
    currentLocation?: { lat: number; lng: number },
  ) => Promise<void>
  cancel: () => void
  resetSession: () => void
  isSending: boolean | null
  optimisticMessages: OptimisticMessage[]
} => {
  const router = useRouter()

  // Track AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null)
  // Remember the last session we created so callers can consume it
  const [sessionId, setSessionId] = useState<Id<'planning_sessions'> | null>(null)
  // Track sending state to prevent race conditions
  const [isSending, setIsSending] = useState<boolean | null>(null)
  // Track optimistic messages (client-side only)
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])

  // Backend functions
  const createSession = useMutation(api.db.planningSessions.createSession)
  const sendMessage = useAction(api.actions.agent.sendMessage.sendMessage)
  const cancelPlan = useMutation(api.db.routePlans.cancelPlan)
  const getActiveRoutePlansForSession = useQuery(
    api.db.routePlans.getActiveRoutePlansForSession,
    sessionId !== null ? { sessionId } : 'skip',
  )

  // Reset displayed route when starting a new plan so newest shows
  const { setDisplayedRoutePlanId } = useSelectedRoute()

  /**
   * Send planning message - creates a session (if needed) then invokes the
   * backend agent action. The per-message running/streaming lifecycle is
   * owned by the backend and observed via the session_messages query.
   *
   * Optimistic UI pattern:
   * - Show message immediately with temp ID
   * - Send to server (create session if needed)
   * - Replace optimistic message with real message
   * - Revert on error
   *
   * Session reuse logic:
   * - If we already have a sessionId from a previous message, reuse it (refinement)
   * - Otherwise, create a new session (first message or after error/new session)
   */
  const sendPlanningMessage = useCallback(
    async (message: string, currentLocation?: { lat: number; lng: number }) => {
      // Prevent race conditions - don't allow concurrent sends
      if (isSending) {
        return
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      // Generate temp ID for optimistic message
      const tempId = `temp-${Date.now()}`

      try {
        // Reset displayed route so newest plan shows
        setDisplayedRoutePlanId(null)

        // Show optimistic message immediately
        const optimisticMessage: OptimisticMessage = {
          id: tempId,
          role: 'rider',
          content: message,
          timestamp: new Date(),
          isOptimistic: true,
        }
        setOptimisticMessages((prev) => [...prev, optimisticMessage])
        setIsSending(true)

        // Dispatch user message to state machine (kept so the ride-flow
        // reducer still sees the rider turn)
        dispatch({
          type: 'SEND_MESSAGE',
          content: message,
        })

        // Step 1: Create session if needed, or reuse existing session
        let sessionIdToUse: Id<'planning_sessions'>
        let isNewSession = false

        if (sessionId) {
          // Reuse existing session for refinement
          sessionIdToUse = sessionId
        } else {
          // Create new session for first message (without firstMessage in create call)
          const sessionResult = await createSession({ firstMessage: '' })
          sessionIdToUse = sessionResult.sessionId
          setSessionId(sessionIdToUse)
          isNewSession = true
        }

        // Check if aborted
        if (signal.aborted) {
          throw new Error('Aborted')
        }

        // Step 2: Send message to backend agent. The action persists the rider
        // message immediately (before agent processing starts), so it appears
        // in the transcript right away.
        await sendMessage({
          sessionId: sessionIdToUse,
          content: message,
          currentLocation,
        })

        // Replace optimistic message with real message (remove from optimistic list)
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId))

        // If this was a new session, update URL to include the session ID
        if (isNewSession && sessionIdToUse) {
          // Update the current route's search params with the session ID
          router.setParams({ sessionId: sessionIdToUse } as any)
        }

        if (signal.aborted) {
          throw new Error('Aborted')
        }
      } catch (error) {
        // Remove optimistic message on error
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId))

        // Ignore cancelled requests
        if (signal.aborted || (error as Error).name === 'AbortError') {
          return
        }

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
      } finally {
        setIsSending(false)
      }
    },
    [dispatch, createSession, sendMessage, sessionId, isSending, router, setDisplayedRoutePlanId],
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
        getActiveRoutePlansForSession.map((plan: { _id: Id<'route_plans'> }) =>
          cancelPlan({ routePlanId: plan._id }),
        ),
      )
    }

    // Clear optimistic messages on cancel
    setOptimisticMessages([])
    setIsSending(false)

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
    setOptimisticMessages([])
    setIsSending(null)
  }, [])

  return {
    sessionId,
    sendPlanningMessage,
    cancel,
    resetSession,
    isSending,
    optimisticMessages,
  }
}
