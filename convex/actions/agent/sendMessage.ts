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
 * fetchWeather and saveRoute are placeholder stubs that return no real data —
 * they are intentionally excluded to avoid emitting empty card rows.
 */
export const TOOL_TO_CARD_KIND: Record<string, SessionMessageKind> = {
  planRoute: 'routing_card',
}

// ---------------------------------------------------------------------------
// Card callback factory
// ---------------------------------------------------------------------------

/**
 * Build the onToolStart / onToolFinish callbacks for a given session.
 * Extracted as a named function so it can be unit-tested independently.
 *
 * Cards are born complete: onToolStart is a no-op. onToolFinish creates the
 * card row with attachments already set at insert time, then immediately
 * finalizes it — eliminating the empty-placeholder race window.
 */
export function buildCardCallbacks(
  sessionId: Id<'planning_sessions'>,
  runMutation: (fn: any, args: any) => Promise<any>
): ExecuteContext {
  return {
    // No-op: card rows are created in onToolFinish once the result is known.
    async onToolStart(_toolName, _args) {
      return undefined
    },

    async onToolFinish(toolName, _messageId, result) {
      // Only planRoute produces a card. For all other tools, do nothing.
      if (toolName !== 'planRoute') return

      const routePlanId = (result as { routePlanId?: Id<'route_plans'> })
        ?.routePlanId

      // If the tool produced no routePlanId there is nothing to render.
      if (!routePlanId) return

      // Create the card row with the attachment already set — no empty placeholder.
      const { messageId } = await runMutation(
        internal.db.sessionMessages.createPendingAssistantMessage,
        {
          sessionId,
          kind: 'routing_card',
          attachments: [{ type: 'route_options', routePlanId }],
        }
      )

      // Immediately finalize. Both mutations run back-to-back in the same
      // action — clients see running → complete in one reactive tick.
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
 * The row is created lazily — only when the first text delta arrives. If the
 * agent errors or produces no final text turn, no row is written and there is
 * nothing to finalize (no orphaned empty avatar in the chat).
 *
 * Returns:
 * - `getMessageId()` — getter that returns the (possibly-undefined) message id
 * - `onTextDelta(delta)` — creates the row on first call, then appends chunk
 * - `finalizeOk()` — no-ops if no row was ever created
 * - `finalizeFail()` — no-ops if no row was ever created
 */
export async function buildStreamingContext(
  sessionId: Id<'planning_sessions'>,
  runMutation: (fn: any, args: any) => Promise<any>
): Promise<{
  getMessageId: () => Id<'session_messages'> | undefined
  onTextDelta: (delta: string) => Promise<void>
  finalizeOk: () => Promise<void>
  finalizeFail: () => Promise<void>
}> {
  let messageId: Id<'session_messages'> | undefined = undefined

  const onTextDelta = async (delta: string): Promise<void> => {
    if (messageId === undefined) {
      const result = await runMutation(
        internal.db.sessionMessages.createPendingAssistantMessage,
        { sessionId, kind: 'text' }
      )
      messageId = result.messageId
    }
    await runMutation(internal.db.sessionMessages.appendStreamingChunk, {
      messageId,
      delta,
    })
  }

  const finalizeOk = async (): Promise<void> => {
    if (messageId === undefined) return // agent produced no text, no row to finalize
    await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
      messageId,
      status: 'complete',
    })
  }

  const finalizeFail = async (): Promise<void> => {
    if (messageId === undefined) return // nothing to finalize
    await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
      messageId,
      status: 'failed',
    })
  }

  return { getMessageId: () => messageId, onTextDelta, finalizeOk, finalizeFail }
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
    attachments?: { type: string; routePlanId?: Id<'route_plans'> }[]
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
      .filter((msg) => {
        // Cards carry their data in `attachments`, not `content`. The LLM
        // only understands text turns, so skip any row with a kind != 'text'.
        if (msg.kind && msg.kind !== 'text') return false
        // Failed turns represent broken flows and confuse the LLM.
        if (msg.status === 'failed') return false
        // Empty/whitespace-only content contributes nothing and can look
        // like an empty assistant turn to the model.
        if (!msg.content || !msg.content.trim()) return false
        return true
      })
      .map((msg) => ({
        role: msg.role, // 'rider' or 'system'
        content: msg.content,
      }))

    // Step 4: Run agent with session context (probabilistic)
    // This is where the agent decides what to do.
    // We pass card-emission callbacks so card-backed tools (planRoute) create
    // their card row in onToolFinish — with attachments already set at insert
    // time — eliminating the empty-placeholder race window.
    //
    // We also wire a lazy streaming context so that a pending `text` assistant
    // message row is created only when the first text delta arrives. If the
    // agent produces no text (or errors before any delta), no row is written.
    const cardCallbacks = buildCardCallbacks(args.sessionId, ctx.runMutation.bind(ctx))
    const { getMessageId: getTextMessageId, onTextDelta, finalizeOk, finalizeFail } =
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
    const textMessageId = getTextMessageId()
    return {
      response: agentResult.response,
      messageId: textMessageId ?? riderMessageResult.messageId,
      attachments: agentResult.attachments as { type: string; routePlanId?: Id<'route_plans'> }[] | undefined,
    }
  },
})
