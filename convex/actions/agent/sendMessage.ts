'use node'

import { v } from 'convex/values'
import { action } from '../../_generated/server'
import { api, internal } from '../../_generated/api'
import { requireIdentity } from '../../guards'
import { executeRidePlanningAgent } from './ridePlanningAgent'
import type { ExecuteContext } from './ridePlanningAgent'
import { PlanningEventEmitter } from './lib/planningEvents'
import type { Id } from '../../_generated/dataModel'
import type { SessionMessageKind } from '../../../models/session-messages'
import type { Message, AssistantMessage, ToolResultMessage } from '@mariozechner/pi-ai'
import { AI_MODEL } from '../../lib/env'

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
  compileSketch: 'routing_card',
}

// ---------------------------------------------------------------------------
// Legacy message reconstruction
// ---------------------------------------------------------------------------

type SessionMessageRow = {
  _id: Id<'session_messages'>
  _creationTime: number
  sessionId: Id<'planning_sessions'>
  role: 'rider' | 'system'
  content: string
  createdAt: number
  kind?: SessionMessageKind
  status?: 'streaming' | 'running' | 'complete' | 'failed'
  piMessage?: unknown
}

/**
 * Reconstruct a pi-ai Message from a legacy session_messages row that has no
 * piMessage field. Only handles 'rider' and 'system' (text-only) rows.
 *
 * Returns null for rows that should be skipped (cards, failed, hidden kinds,
 * empty content).
 */
export function reconstructLegacyPiMessage(row: SessionMessageRow): Message | null {
  // Skip hidden/non-text kinds
  if (row.kind && row.kind !== 'text') return null
  // Skip failed turns
  if (row.status === 'failed') return null
  // Skip empty content
  if (!row.content || !row.content.trim()) return null

  if (row.role === 'rider') {
    return {
      role: 'user',
      content: row.content,
      timestamp: row.createdAt,
    } as Message
  }

  // system role → fabricate AssistantMessage with sentinel metadata
  return {
    role: 'assistant',
    content: [{ type: 'text', text: row.content }],
    api: 'openai-completions',
    provider: 'openai',
    model: AI_MODEL,
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason: 'stop',
    timestamp: row.createdAt,
  } as Message
}

// ---------------------------------------------------------------------------
// Card callback factory
// ---------------------------------------------------------------------------

/**
 * Build the onToolStart / onToolFinish / onAgentTurn / onToolResultPiMessage
 * callbacks for a given session. Extracted as a named function so it can be
 * unit-tested independently.
 *
 * Cards are born complete: onToolStart is a no-op. onToolFinish creates the
 * card row with attachments already set at insert time, then immediately
 * finalizes it — eliminating the empty-placeholder race window.
 *
 * onAgentTurn persists the full AssistantMessage as an agent_turn row so the
 * next session load can reconstruct the full pi-ai Message history.
 *
 * onToolResultPiMessage patches the card row (if any) with the raw
 * ToolResultMessage piMessage for the same reason.
 */
export function buildCardCallbacks(
  sessionId: Id<'planning_sessions'>,
  runMutation: (fn: any, args: any) => Promise<any>
): ExecuteContext {
  // Map from toolCallId → card messageId so onToolResultPiMessage can patch
  // the correct row after onToolFinish creates it.
  const pendingCardMessages = new Map<string, Id<'session_messages'>>()

  return {
    // No-op: card rows are created in onToolFinish once the result is known.
    async onToolStart(_toolName, _args) {
      return undefined
    },

    async onToolFinish(toolCallId, toolName, _messageId, result) {
      // Only card-backed tools (planRoute, compileSketch) produce a card.
      if (!TOOL_TO_CARD_KIND[toolName]) return

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

      // Store the mapping so onToolResultPiMessage can patch this row with the
      // full ToolResultMessage piMessage for multi-turn context.
      pendingCardMessages.set(toolCallId, messageId)

      // Immediately finalize. Both mutations run back-to-back in the same
      // action — clients see running → complete in one reactive tick.
      const isError = (result as any)?.type === 'error'
      await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
        messageId,
        status: isError ? 'failed' : 'complete',
      })
    },

    async onAgentTurn(assistant: AssistantMessage) {
      await runMutation(internal.db.sessionMessages.recordAgentTurn, {
        sessionId,
        piMessage: assistant as any,
      })
    },

    async onToolResultPiMessage(toolCallId: string, result: ToolResultMessage) {
      if (pendingCardMessages.has(toolCallId)) {
        await runMutation(internal.db.sessionMessages.recordToolResult, {
          messageId: pendingCardMessages.get(toolCallId)!,
          piMessage: result as any,
        })
      }
    },
  }
}

/**
 * Build the streaming callbacks that wire the final-turn text deltas into a
 * pending assistant message row. Also handles reasoning (thinking) deltas.
 *
 * The text row is created lazily — only when the first text delta arrives. If
 * the agent errors or produces no final text turn, no row is written and there
 * is nothing to finalize (no orphaned empty avatar in the chat).
 *
 * The reasoning row is also created lazily on the first thinking delta, then
 * subsequent deltas append to it.
 *
 * Returns:
 * - `getMessageId()` — getter that returns the (possibly-undefined) message id
 * - `onTextDelta(delta)` — creates the row on first call, then appends chunk
 * - `onThinkingDelta(delta)` — creates reasoning row on first call, then appends
 * - `finalizeOk(piMessage?)` — no-ops if no row was ever created
 * - `finalizeFail()` — no-ops if no row was ever created
 */
export async function buildStreamingContext(
  sessionId: Id<'planning_sessions'>,
  runMutation: (fn: any, args: any) => Promise<any>
): Promise<{
  getMessageId: () => Id<'session_messages'> | undefined
  onTextDelta: (delta: string) => Promise<void>
  onThinkingDelta: (delta: string) => Promise<void>
  finalizeOk: (piMessage?: unknown, opts?: { kind?: string; attachments?: unknown[] }) => Promise<void>
  finalizeFail: () => Promise<void>
}> {
  let messageId: Id<'session_messages'> | undefined = undefined
  let reasoningMessageId: Id<'session_messages'> | null = null

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

  const onThinkingDelta = async (delta: string): Promise<void> => {
    if (!reasoningMessageId) {
      reasoningMessageId = await runMutation(
        internal.db.sessionMessages.recordReasoning,
        {
          sessionId,
          content: delta,
          piMessage: {},
        }
      )
    } else {
      await runMutation(internal.db.sessionMessages.appendReasoningChunk, {
        messageId: reasoningMessageId,
        delta,
      })
    }
  }

  const finalizeOk = async (
    piMessage?: unknown,
    opts?: { kind?: string; attachments?: unknown[] }
  ): Promise<void> => {
    // Finalize reasoning message first (was left in 'streaming' status)
    if (reasoningMessageId) {
      await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
        messageId: reasoningMessageId,
        status: 'complete',
      })
    }
    if (messageId === undefined) return // agent produced no text, no row to finalize
    const args: Record<string, unknown> = { messageId, status: 'complete' }
    if (piMessage !== undefined) {
      args.piMessage = piMessage
    }
    if (opts?.kind !== undefined) {
      args.kind = opts.kind
    }
    if (opts?.attachments !== undefined) {
      args.attachments = opts.attachments
    }
    await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, args)
  }

  const finalizeFail = async (): Promise<void> => {
    // Finalize reasoning message on failure too
    if (reasoningMessageId) {
      await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
        messageId: reasoningMessageId,
        status: 'failed',
      })
    }
    if (messageId === undefined) return // nothing to finalize
    await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
      messageId,
      status: 'failed',
    })
  }

  return { getMessageId: () => messageId, onTextDelta, onThinkingDelta, finalizeOk, finalizeFail }
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

    // Validates ownership — throws if session does not belong to this user.
    await ctx.runQuery(api.db.planningSessions.getSessionById, {
      sessionId: args.sessionId,
    })

    // Step 1b: Update last known location if provided (deterministic)
    if (args.currentLocation) {
      await ctx.runMutation(internal.db.planningSessions.updateLastKnownLocation, {
        sessionId: args.sessionId,
        lat: args.currentLocation.lat,
        lng: args.currentLocation.lng,
      })
    }

    // Step 2: Persist rider message (deterministic)
    const riderMessageResult = await ctx.runMutation(api.db.sessionMessages.send, {
      sessionId: args.sessionId,
      content: args.content,
    })

    // Step 3: Build pi-ai Message[] history for the agent.
    // We persist the rider message first (step 2) so it survives even if the
    // agent throws, but that means the `listWithPiMessages` query now returns
    // the current turn at the tail. The agent receives the current turn as
    // `userMessage`, so we slice it off here to avoid duplicating it in the
    // LLM context.
    const rows = await ctx.runQuery(internal.db.sessionMessages.listWithPiMessages, {
      sessionId: args.sessionId,
    })

    // Build the pi-ai Message[] from rows, excluding the just-persisted rider turn.
    const piMessages: Message[] = rows
      .slice(0, -1)
      .flatMap((row): Message[] => {
        if (row.piMessage) {
          // Row has a full pi-ai Message stored — use it directly.
          return [row.piMessage as Message]
        }
        // Legacy row — reconstruct from role+content.
        const msg = reconstructLegacyPiMessage(row)
        return msg ? [msg] : []
      })

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
    const { getMessageId: getTextMessageId, onTextDelta, onThinkingDelta, finalizeOk, finalizeFail } =
      await buildStreamingContext(args.sessionId, ctx.runMutation.bind(ctx))

    // Create the planning emitter — always create the row immediately
    const planningEmitter = new PlanningEventEmitter({
      runMutation: ctx.runMutation.bind(ctx),
      sessionId: args.sessionId,
    })
    await planningEmitter.init()

    // Track the final assistant message for piMessage persistence
    let finalAssistantMessage: AssistantMessage | undefined = undefined

    const executeCtx: ExecuteContext = {
      ...cardCallbacks,
      onTextDelta,
      onThinkingDelta,
      onFinalAssistant: async (assistant: AssistantMessage) => {
        finalAssistantMessage = assistant
      },
      // Planning event callbacks — forward to the emitter
      onSubToolPending: (tool, agent) => planningEmitter.toolPending(tool, agent),
      onSubToolComplete: (tool, agent, summary, durationMs) =>
        planningEmitter.toolComplete(tool, agent, summary, durationMs),
      onSubAgentComplete: (agent, summary, durationMs) =>
        planningEmitter.agentComplete(agent, summary, durationMs),
      onSubThinkingDelta: (delta) => planningEmitter.updateThinking(delta),
    }

    let agentResult
    try {
      try {
        agentResult = await executeRidePlanningAgent(
          {
            planningSessionId: args.sessionId,
            clerkUserId,
            piMessages,
            currentLocation: args.currentLocation,
            runQuery: ctx.runQuery.bind(ctx),
            runMutation: ctx.runMutation.bind(ctx),
            runAction: ctx.runAction.bind(ctx),
          },
          args.content,
          executeCtx
        )
        // Step 5a: Finalize the streaming text message as complete, including
        // the final AssistantMessage as piMessage so the next session load has
        // the full pi-ai message stored.
        // If the orchestrator returned location_search attachments, upgrade
        // the text message to a location_search_card with those attachments.
        const searchAttachment = agentResult.attachments?.find(
          (a: { type: string }) => a.type === 'location_search'
        )
        await finalizeOk(
          finalAssistantMessage as unknown,
          searchAttachment
            ? { kind: 'location_search_card', attachments: [searchAttachment] }
            : undefined
        )

        // Record performance metrics
        if (agentResult.metrics) {
          const m = agentResult.metrics
          await ctx.runMutation(internal.db.performance.recordAgentRun, {
            agent: 'orchestrator',
            model: 'claude-opus-4-6',
            sessionId: args.sessionId as unknown as string,
            input: args.content.slice(0, 200),
            output: (agentResult.response ?? '').slice(0, 200),
            steps: m.steps,
            toolCalls: m.toolCalls,
            tools: m.tools,
            durationMs: m.durationMs,
            inputTokens: m.inputTokens,
            outputTokens: m.outputTokens,
            cacheReadTokens: m.cacheReadTokens,
            totalCostUsd: m.totalCostUsd,
            success: true,
          })
        }
      } catch (error: any) {
        // Record failed run
        await ctx.runMutation(internal.db.performance.recordAgentRun, {
          agent: 'orchestrator',
          model: 'claude-opus-4-6',
          sessionId: args.sessionId as unknown as string,
          input: args.content.slice(0, 200),
          steps: 0,
          toolCalls: 0,
          tools: [],
          durationMs: 0,
          success: false,
          error: (error?.message ?? String(error)).slice(0, 500),
        })

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
    } finally {
      // Finalize the planning row — no-op if no events were emitted (simple
      // direct responses that never call tools produce no planning row).
      // Runs on both success and error paths, including early returns in catch.
      await planningEmitter.done()
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
