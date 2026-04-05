'use node'

import { v } from 'convex/values'
import { action } from '../../_generated/server'
import { api, internal } from '../../_generated/api'
import { requireIdentity } from '../../guards'
import { executeRidePlanningAgent } from './ridePlanningAgent'
import type { Id } from '../../_generated/dataModel'

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
    // This is where the agent decides what to do
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
        args.content
      )
    } catch (error) {
      // Convert agent errors to conversational messages
      console.error('[sendMessage] Agent error:', error)

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
    }

    // Step 5: Persist system response (deterministic)
    // This ALWAYS happens, even if agent produced an error
    const systemMessageResult: { messageId: Id<'session_messages'> } = await ctx.runMutation(
      internal.db.sessionMessages.addSystemMessage,
      {
        sessionId: args.sessionId,
        content: agentResult.response,
        attachments: agentResult.attachments as Array<{ type: 'route_options'; routePlanId: Id<'route_plans'> }> | undefined,
      }
    )

    // Step 6: Return response to client
    return {
      response: agentResult.response,
      messageId: systemMessageResult.messageId,
      attachments: agentResult.attachments as Array<{ type: string; routePlanId?: Id<'route_plans'> }> | undefined,
    }
  },
})
