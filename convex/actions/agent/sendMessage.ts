'use node'

import { v } from 'convex/values'
import { action } from '../../_generated/server'
import { api, internal } from '../../_generated/api'
import { requireIdentity } from '../../guards'
import { executeRidePlanningAgent } from './ridePlanningAgent'
import type { ExecuteContext } from './ridePlanningAgent'
import type { Id } from '../../_generated/dataModel'
import type { SessionMessageKind } from '../../../models/session-messages'

// ---------------------------------------------------------------------------
// Card-backed tool mapping
// ---------------------------------------------------------------------------

/**
 * Maps tool names to the session_message card kind they produce.
 * Only tools listed here will have a card message emitted in the transcript.
 */
export const TOOL_TO_CARD_KIND: Record<string, SessionMessageKind> = {
  planRoute: 'routing_card',
  fetchWeather: 'weather_card',
  saveRoute: 'saved_route_card',
}

// ---------------------------------------------------------------------------
// Card callback factory
// ---------------------------------------------------------------------------

/**
 * Build the onToolStart / onToolFinish callbacks for a given session.
 * Extracted as a named function so it can be unit-tested independently.
 */
export function buildCardCallbacks(
  sessionId: Id<'planning_sessions'>,
  runMutation: (fn: any, args: any) => Promise<any>
): ExecuteContext {
  return {
    async onToolStart(toolName, _args) {
      const kind = TOOL_TO_CARD_KIND[toolName]
      if (!kind) return // non-card tool — do nothing

      const { messageId } = await runMutation(
        internal.db.sessionMessages.createPendingAssistantMessage,
        { sessionId, kind }
      )
      return { messageId }
    },

    async onToolFinish(toolName, messageId, result) {
      if (messageId === undefined) return // no card was created

      const isError = (result as any)?.type === 'error'
      await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
        messageId,
        status: isError ? 'failed' : 'complete',
      })
    },
  }
}

/**
 * Build the streaming callbacks that wire the final-turn text deltas into a
 * pending assistant message row.
 *
 * Returns:
 * - `executeCtxPatch` — an `onTextDelta` callback to merge into ExecuteContext
 * - `messageId` — the pending message row created before streaming starts
 * - `finalizeOk()` — call after the agent succeeds
 * - `finalizeFail()` — call when the agent throws
 */
export async function buildStreamingContext(
  sessionId: Id<'planning_sessions'>,
  runMutation: (fn: any, args: any) => Promise<any>
): Promise<{
  messageId: Id<'session_messages'>
  onTextDelta: (delta: string) => Promise<void>
  finalizeOk: () => Promise<void>
  finalizeFail: () => Promise<void>
}> {
  const { messageId } = await runMutation(
    internal.db.sessionMessages.createPendingAssistantMessage,
    { sessionId, kind: 'text' }
  )

  const onTextDelta = async (delta: string): Promise<void> => {
    await runMutation(internal.db.sessionMessages.appendStreamingChunk, {
      messageId,
      delta,
    })
  }

  const finalizeOk = async (): Promise<void> => {
    await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
      messageId,
      status: 'complete',
    })
  }

  const finalizeFail = async (): Promise<void> => {
    await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
      messageId,
      status: 'failed',
    })
  }

  return { messageId, onTextDelta, finalizeOk, finalizeFail }
}

/**
 * sendMessage - Single client entry point for the ride planning agent
 *
 * This is the orchestrator that:
 * 1. Validates session ownership (deterministic)
 * 2. Persists rider message (deterministic)
 * 3. Runs agent with session context (probabilistic)
 * 4. Persists system response (deterministic)
 * 5. Returns response to client
 *
 * All guaranteed actions (saving, state transitions) happen in deterministic code.
 * The agent is probabilistic and may produce different results each run.
 */
export const sendMessage = action({
  args: {
    sessionId: v.id('planning_sessions'),
    content: v.string(),
    currentLocation: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
  },
  returns: v.object({
    response: v.string(),
    messageId: v.id('session_messages'),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.string(),
          routePlanId: v.optional(v.id('route_plans')),
        })
      )
    ),
  }),
  handler: async (ctx, args): Promise<{
    response: string
    messageId: Id<'session_messages'>
    attachments?: Array<{ type: string; routePlanId?: Id<'route_plans'> }>
  }> => {
    // Step 1: Validate session ownership (deterministic)
    // Actions have no direct `ctx.db`; we must go through the public
    // query/mutation wrappers which re-check auth on their own.
    const { clerkUserId } = await requireIdentity(ctx)

    const session = await ctx.runQuery(api.db.planningSessions.getSessionById, {
      sessionId: args.sessionId,
    })

    // Step 2: Persist rider message (deterministic)
    const riderMessageResult = await ctx.runMutation(api.db.sessionMessages.send, {
      sessionId: args.sessionId,
      content: args.content,
    })

    // Step 3: Build conversation context for the agent.
    // We persist the rider message first (step 2) so it survives even if the
    // agent throws, but that means the `list` query now returns the current
    // turn at the tail. The agent receives the current turn as `userMessage`,
    // so we slice it off here to avoid duplicating it in the LLM context.
    const messages = await ctx.runQuery(api.db.sessionMessages.list, {
      sessionId: args.sessionId,
    })

    // Convert to agent format (role: content:), excluding the just-persisted
    // rider turn — it flows through `args.content` directly.
    const conversationHistory = messages
      .slice(0, -1)
      .map((msg) => ({
        role: msg.role, // 'rider' or 'system'
        content: msg.content,
      }))

    // Step 4: Run agent with session context (probabilistic)
    // This is where the agent decides what to do.
    // We pass card-emission callbacks so card-backed tools (planRoute, etc.)
    // emit a pending card message into session_messages before the tool runs
    // and finalize it (complete/failed) after the tool returns.
    //
    // We also create a pending `text` assistant message row up front so the
    // client can see `status: 'streaming'` while the model is generating, then
    // stream text deltas into it via appendStreamingChunk, and finalize it when
    // the agent loop completes.
    const cardCallbacks = buildCardCallbacks(args.sessionId, ctx.runMutation.bind(ctx))
    const { messageId: textMessageId, onTextDelta, finalizeOk, finalizeFail } =
      await buildStreamingContext(args.sessionId, ctx.runMutation.bind(ctx))

    const executeCtx = { ...cardCallbacks, onTextDelta }

    let agentResult
    try {
      agentResult = await executeRidePlanningAgent(
        {
          sessionId: args.sessionId,
          clerkUserId,
          conversationHistory,
          currentLocation: args.currentLocation,
          runQuery: ctx.runQuery.bind(ctx),
          runMutation: ctx.runMutation.bind(ctx),
        },
        args.content,
        executeCtx
      )
      // Step 5a: Finalize the streaming text message as complete
      await finalizeOk()
    } catch (error) {
      // Convert agent errors to conversational messages
      console.error('[sendMessage] Agent error:', error)

      // Finalize the streaming text message as failed before building the
      // fallback response — the fallback will be stored in a new message below.
      await finalizeFail()

      // Extract error code from error if available
      const errorMessage = error instanceof Error ? error.message : String(error)

      // Map error codes to helpful, conversational messages
      const getConversationalErrorMessage = (error: string): string => {
        // Rate limit errors
        if (
          error.includes('RATE_LIMIT_EXCEEDED') ||
          error.includes('PLAN_LIMIT_EXCEEDED') ||
          errorMessage.includes('monthly limit')
        ) {
          return "You've used all 5 monthly plans. Upgrade to Premium for unlimited planning!"
        }

        // Parse/understanding errors
        if (
          error.includes('AGENTIC_PARSE_FAILED') ||
          error.includes('LOW_CONFIDENCE_PARSE') ||
          errorMessage.includes('understanding') ||
          errorMessage.includes('parse')
        ) {
          return "I couldn't understand that location. Try 'scenic ride to Santa Cruz' instead."
        }

        // Route generation errors
        if (
          error.includes('GENERATION_FAILED') ||
          error.includes('NO_ROUTES_GENERATED') ||
          errorMessage.includes('generate') ||
          errorMessage.includes('routes')
        ) {
          return "I couldn't generate a route for that request. Try a different destination."
        }

        // Timeout errors
        if (
          error.includes('AGENT_TIMEOUT') ||
          error.includes('NETWORK_TIMEOUT') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('timed out')
        ) {
          return "Request timed out. Please try again."
        }

        // Generic fallback
        return "I'm having trouble right now. Could you try again?"
      }

      agentResult = {
        response: getConversationalErrorMessage(errorMessage),
        attachments: undefined,
      }

      // Persist the fallback error response as a new system message
      const fallbackResult: { messageId: Id<'session_messages'> } = await ctx.runMutation(
        internal.db.sessionMessages.addSystemMessage,
        {
          sessionId: args.sessionId,
          content: agentResult.response,
        }
      )

      return {
        response: agentResult.response,
        messageId: fallbackResult.messageId,
        attachments: undefined,
      }
    }

    // Step 6: Return response to client
    return {
      response: agentResult.response,
      messageId: textMessageId,
      attachments: agentResult.attachments as Array<{ type: string; routePlanId?: Id<'route_plans'> }> | undefined,
    }
  },
})
