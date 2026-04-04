/**
 * useChatSession - Manages chat message history for a planning session
 *
 * Provides access to chat messages for the current planning session.
 * Messages are stored in-memory for now (can be persisted to Convex later).
 *
 * This hook is read-only for message display - mutations happen through
 * the useRideFlow state machine (SEND_MESSAGE action).
 */

import { useMemo } from 'react'
import type { RideFlowState } from './use-ride-flow'

/**
 * Chat message types
 */
export type ChatMessage =
  | UserMessage
  | SystemMessage
  | RouteResultMessage

export type UserMessage = {
  id: string
  type: 'user'
  content: string
  timestamp: number
}

export type SystemMessage = {
  id: string
  type: 'system'
  content: string
  timestamp: number
}

export type RouteResultMessage = {
  id: string
  type: 'route-result'
  routeOptions: any // PlannedRouteOptionsView
  timestamp: number
}

/**
 * Hook return value
 */
type UseChatSessionReturn = {
  messages: ChatMessage[]
  isEmpty: boolean
}

/**
 * Main hook - returns messages for current session
 *
 * Usage:
 * ```tsx
 * const { state } = useRideFlow()
 * const { messages, isEmpty } = useChatSession(state.sessionId)
 *
 * {messages.map(msg => (
 *   <ChatMessageBubble key={msg.id} message={msg} />
 * ))}
 * ```
 */
export const useChatSession = (
  sessionId: string | null,
  state: RideFlowState
): UseChatSessionReturn => {
  // For now, we'll derive messages from state
  // In the future, this would query Convex for session history
  const messages = useMemo(() => {
    const msgs: ChatMessage[] = []

    // Add user messages based on state
    // (In a real implementation, these would come from a messages collection)
    if (state.phase === 'ROUTE_RESULTS' || state.phase === 'ROUTE_DETAILS') {
      // Add a simulated user message
      msgs.push({
        id: `msg-${sessionId}-user`,
        type: 'user',
        content: 'Plan a ride', // This would be the actual user message
        timestamp: Date.now(),
      })
    }

    // Add route result message
    if (state.phase === 'ROUTE_RESULTS' || state.phase === 'ROUTE_DETAILS') {
      if ('routeOptions' in state && state.routeOptions) {
        msgs.push({
          id: `msg-${sessionId}-routes`,
          type: 'route-result',
          routeOptions: state.routeOptions,
          timestamp: Date.now(),
        })
      }
    }

    return msgs
  }, [sessionId, state])

  const isEmpty = messages.length === 0

  return {
    messages,
    isEmpty,
  }
}
