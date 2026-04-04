'use node'

import { v } from 'convex/values'
import { action } from '../../_generated/server'
import { internal } from '../../_generated/api'
import { requireIdentity } from '../../guards'
import { executeRidePlanningAgent } from './ridePlanningAgent'
import { sendHandler, listHandler } from '../../db/sessionMessages'
import { getSessionByIdHandler } from '../../db/planningSessions'
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
    const { clerkUserId } = await requireIdentity(ctx)

    const session = await getSessionByIdHandler(
      ctx as any,
      { sessionId: args.sessionId },
      clerkUserId
    )

    // Step 2: Persist rider message (deterministic)
    const riderMessageResult = await sendHandler(
      ctx as any,
      { sessionId: args.sessionId, content: args.content },
      clerkUserId
    )

    // Step 3: Build conversation context for the agent
    const messages = await listHandler(
      ctx as any,
      { sessionId: args.sessionId },
      clerkUserId
    )

    // Convert to agent format (role: content:)
    const conversationHistory = messages.map((msg) => ({
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
      agentResult = {
        response: "I'm having trouble right now. Could you try again?",
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
