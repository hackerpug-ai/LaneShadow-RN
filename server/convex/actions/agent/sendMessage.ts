'use node'

import type { AssistantMessage, Message, ToolResultMessage } from '@mariozechner/pi-ai'
import { v } from 'convex/values'
import type { SessionMessageKind } from '../../../models/session-messages'
import { api, internal } from '../../_generated/api'
import type { Id } from '../../_generated/dataModel'
import { action } from '../../_generated/server'
import { requireIdentity } from '../../guards'
import { getAgentModelInfo } from './lib/models'
import { PlanningEventEmitter } from './lib/planningEvents'
import type { ExecuteContext } from './ridePlanningAgent'
import { executeRidePlanningAgent } from './ridePlanningAgent'

// ---------------------------------------------------------------------------
// Card-backed tool mapping
// ---------------------------------------------------------------------------

/**
 * Maps tool names to the session_message card kind they produce.
 * Only tools listed here will have a card message emitted in the transcript.
 * saveRoute is a placeholder stub that returns no real data — it is intentionally
 * excluded to avoid emitting empty card rows.
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
  if (!row.content?.trim()) return null

  if (row.role === 'rider') {
    return {
      role: 'user',
      content: row.content,
      timestamp: row.createdAt,
    } as Message
  }

  // system role → fabricate AssistantMessage with sentinel metadata
  const modelInfo = getAgentModelInfo('high')
  return {
    role: 'assistant',
    content: [{ type: 'text', text: row.content }],
    api: 'openai-completions',
    provider: modelInfo.provider,
    model: modelInfo.model,
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
// Tool summary helpers (US-057)
// ---------------------------------------------------------------------------

/**
 * Generate human-readable summary for tool start.
 */
function summarizeToolStart(toolName: string, args: unknown): string {
  switch (toolName) {
    case 'geocode':
      return `Searching for ${(args as any)?.query ?? 'location'}...`
    case 'planRoute':
      return `Planning route${(args as any)?.end?.label ? ` to ${(args as any).end.label}` : ''}...`
    case 'searchFavorites':
      return 'Searching favorite roads...'
    case 'saveRoute':
      return 'Saving route...'
    default:
      return `Running ${toolName}...`
  }
}

/**
 * Generate human-readable summary for tool finish.
 */
function summarizeToolFinish(toolName: string, result: unknown): string {
  switch (toolName) {
    case 'geocode': {
      const data = result as any
      const count = data?.data?.length ?? data?.results?.length ?? 0
      return `Found ${count} location${count !== 1 ? 's' : ''}`
    }
    case 'planRoute': {
      const data = result as any
      const count = data?.data?.options?.length ?? 0
      return count > 0
        ? `Generated ${count} route option${count !== 1 ? 's' : ''}`
        : 'Route planning complete'
    }
    case 'searchFavorites':
      return 'Favorite roads search complete'
    case 'saveRoute':
      return 'Route saved'
    default:
      return `${toolName} complete`
  }
}

// ---------------------------------------------------------------------------
// Unified agent callback factory (US-057)
// ---------------------------------------------------------------------------

/**
 * Build all agent callbacks for a given session. Merges the former
 * buildStreamingContext and buildCardCallbacks into a single factory that
 * shares a thinkingCardId ref via closure.
 *
 * Manages three message types:
 * 1. Text message (lazy creation on first delta)
 * 2. Thinking card (lazy creation on first thinking delta or tool start)
 * 3. Routing card (eager creation on planRoute tool finish)
 *
 * Returns:
 * - executeCtx: Full ExecuteContext with all callbacks
 * - getTextMessageId(): Getter for the (possibly-undefined) text message id
 * - finalizeOk(piMessage?): Finalizes text and thinking as complete
 * - finalizeFail(): Finalizes text and thinking as failed
 */
export async function buildAgentCallbacks(
  sessionId: Id<'planning_sessions'>,
  runMutation: (fn: any, args: any) => Promise<any>,
): Promise<{
  executeCtx: ExecuteContext
  getTextMessageId: () => Id<'session_messages'> | undefined
  finalizeOk: (piMessage?: unknown) => Promise<void>
  finalizeFail: () => Promise<void>
}> {
  // Shared state via closure
  let textMessageId: Id<'session_messages'> | undefined
  let thinkingCardId: Id<'session_messages'> | undefined

  // Map from toolCallId → card messageId so onToolResultPiMessage can patch
  // the correct row after onToolFinish creates it.
  const pendingCardMessages = new Map<string, Id<'session_messages'>>()

  // Lazy thinking card creation
  const ensureThinkingCard = async (): Promise<Id<'session_messages'>> => {
    if (!thinkingCardId) {
      const result = await runMutation(internal.db.sessionMessages.createThinkingCard, {
        sessionId,
      })
      thinkingCardId = result.messageId
    }
    return thinkingCardId! // Non-null assertion: we just created it if it was undefined
  }

  const onTextDelta = async (delta: string): Promise<void> => {
    if (textMessageId === undefined) {
      const result = await runMutation(internal.db.sessionMessages.createPendingAssistantMessage, {
        sessionId,
        kind: 'text',
      })
      textMessageId = result.messageId
    }
    await runMutation(internal.db.sessionMessages.appendStreamingChunk, {
      messageId: textMessageId,
      delta,
    })
  }

  const onThinkingDelta = async (delta: string): Promise<void> => {
    const cardId = await ensureThinkingCard()
    await runMutation(internal.db.sessionMessages.appendThinkingText, {
      messageId: cardId,
      delta,
    })
  }

  const onToolStart = async (toolName: string, args: unknown) => {
    // Ensure thinking card exists (tool may fire before any thinking deltas)
    const cardId = await ensureThinkingCard()

    // Emit tool_start thinking step
    await runMutation(internal.db.sessionMessages.appendThinkingStep, {
      messageId: cardId,
      step: {
        type: 'tool_start',
        toolName,
        summary: summarizeToolStart(toolName, args),
        timestamp: Date.now(),
      },
    })

    return undefined
  }

  const onToolFinish = async (
    toolCallId: string,
    toolName: string,
    _messageId: Id<'session_messages'> | undefined,
    result: unknown,
  ) => {
    // Ensure thinking card exists
    const cardId = await ensureThinkingCard()

    // Emit tool_finish thinking step
    await runMutation(internal.db.sessionMessages.appendThinkingStep, {
      messageId: cardId,
      step: {
        type: 'tool_finish',
        toolName,
        summary: summarizeToolFinish(toolName, result),
        timestamp: Date.now(),
      },
    })

    // Card-backed tools (planRoute, compileSketch) also get a routing_card row
    if (!TOOL_TO_CARD_KIND[toolName]) return

    const routePlanId = (result as { routePlanId?: Id<'route_plans'> })?.routePlanId

    // If the tool produced no routePlanId there is nothing to render.
    if (!routePlanId) return

    // Create the card row with the attachment already set — no empty placeholder.
    const { messageId } = await runMutation(
      internal.db.sessionMessages.createPendingAssistantMessage,
      {
        sessionId,
        kind: 'routing_card',
        attachments: [{ type: 'route_options', routePlanId }],
      },
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
  }

  const onAgentTurn = async (assistant: AssistantMessage) => {
    await runMutation(internal.db.sessionMessages.recordAgentTurn, {
      sessionId,
      piMessage: assistant as any,
    })
  }

  const onToolResultPiMessage = async (toolCallId: string, result: ToolResultMessage) => {
    if (pendingCardMessages.has(toolCallId)) {
      await runMutation(internal.db.sessionMessages.recordToolResult, {
        messageId: pendingCardMessages.get(toolCallId)!,
        piMessage: result as any,
      })
    }
  }

  const finalizeOk = async (piMessage?: unknown): Promise<void> => {
    // Finalize text message (if any)
    if (textMessageId !== undefined) {
      const args: Record<string, unknown> = { messageId: textMessageId, status: 'complete' }
      if (piMessage !== undefined) {
        args.piMessage = piMessage
      }
      await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, args)
    }

    // Finalize thinking card (if any)
    if (thinkingCardId !== undefined) {
      await runMutation(internal.db.sessionMessages.finalizeThinkingCard, {
        messageId: thinkingCardId,
      })
    }
  }

  const finalizeFail = async (): Promise<void> => {
    // Finalize text message as failed (if any)
    if (textMessageId !== undefined) {
      await runMutation(internal.db.sessionMessages.finalizeAssistantMessage, {
        messageId: textMessageId,
        status: 'failed',
      })
    }

    // Finalize thinking card as complete (not failed — it captured what it could)
    if (thinkingCardId !== undefined) {
      await runMutation(internal.db.sessionMessages.finalizeThinkingCard, {
        messageId: thinkingCardId,
      })
    }
  }

  const executeCtx: ExecuteContext = {
    onToolStart,
    onToolFinish,
    onTextDelta,
    onThinkingDelta,
    onAgentTurn,
    onToolResultPiMessage,
  }

  return {
    executeCtx,
    getTextMessageId: () => textMessageId,
    finalizeOk,
    finalizeFail,
  }
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
      }),
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
        }),
      ),
    ),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
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
      .flatMap((row: (typeof rows)[number]): Message[] => {
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
    //
    // We use buildAgentCallbacks which provides:
    // - Lazy text message creation (only on first delta)
    // - Lazy thinking card creation (on first thinking delta or tool start)
    // - Routing card creation for planRoute tool
    // - Proper finalization for both success and error paths
    const { executeCtx, getTextMessageId, finalizeOk, finalizeFail } = await buildAgentCallbacks(
      args.sessionId,
      ctx.runMutation.bind(ctx),
    )

    // Create the planning emitter — always create the row immediately
    const planningEmitter = new PlanningEventEmitter({
      runMutation: ctx.runMutation.bind(ctx),
      sessionId: args.sessionId,
    })
    await planningEmitter.init()

    // Track the final assistant message for piMessage persistence
    let finalAssistantMessage: AssistantMessage | undefined

    // Add onFinalAssistant and planning callbacks to the execute context
    const augmentedExecuteCtx: ExecuteContext = {
      ...executeCtx,
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
          augmentedExecuteCtx,
        )
        // Step 5a: Finalize the streaming text message as complete, including
        // the final AssistantMessage as piMessage so the next session load has
        // the full pi-ai message stored.
        await finalizeOk(finalAssistantMessage as unknown)

        // Record performance metrics
        if (agentResult.metrics) {
          const m = agentResult.metrics
          const modelInfo = getAgentModelInfo('high')
          await ctx.runMutation(internal.db.performance.recordAgentRun, {
            agent: 'orchestrator',
            model: modelInfo.model,
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
        const modelInfo = getAgentModelInfo('high')
        await ctx.runMutation(internal.db.performance.recordAgentRun, {
          agent: 'orchestrator',
          model: modelInfo.model,
          sessionId: args.sessionId as unknown as string,
          input: args.content.slice(0, 200),
          steps: 0,
          toolCalls: 0,
          tools: [],
          durationMs: 0,
          success: false,
          error: (error?.message ?? String(error)).slice(0, 500),
        })

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
            return 'Request timed out. Please try again.'
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
          },
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
      attachments: agentResult.attachments as
        | { type: string; routePlanId?: Id<'route_plans'> }[]
        | undefined,
    }
  },
})
