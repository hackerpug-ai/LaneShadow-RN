'use node'

import {
  complete,
  stream,
  getModel,
  validateToolCall,
  type AssistantMessage,
  type AssistantMessageEvent,
  type Context,
  type Message,
  type Tool,
  type ToolCall,
  type ToolResultMessage,
} from '@mariozechner/pi-ai'
import { AgentToolSchemas } from './lib/piTools'
import { createGeocodingProvider } from './providers/geocodingProvider'
import { planRideOrchestrator } from './lib/planRideOrchestrator'
import { buildOptionsFromResults } from './planRide'
import { OPENAI_API_KEY, AI_MODEL } from '../../lib/env'
import { FREE_TIER_MONTHLY_LIMIT } from '../../../models/plan-usage'
import { ERROR_CODES } from '../../errors'
import { internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import type { Id } from '../../_generated/dataModel'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const MAX_STEPS = 10
const AGENT_TIMEOUT_MS = 30_000

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type AgentContext = {
  sessionId: Id<'planning_sessions'>
  clerkUserId: string
  conversationHistory: Array<{ role: string; content: string }>
  currentLocation?: { lat: number; lng: number }
  runQuery: ActionCtx['runQuery']
  runMutation: ActionCtx['runMutation']
}

export type ToolResult =
  | { type: 'routes'; data: { planId: string; options: Array<any> } }
  | { type: 'error'; message: string }
  | { type: 'confirmation'; message: string }
  | { type: 'search_results'; data: Array<any> }
  | { type: 'weather'; data: any }
  | { type: 'chat'; message: string }

/**
 * Optional callbacks that callers can inject into executeTool to observe
 * tool dispatch lifecycle events (e.g. to emit card messages). The agent
 * logic itself stays unaware of cards — it just invokes the callbacks when
 * provided.
 */
export type ExecuteContext = {
  /** Called immediately before tool execution begins. May return a messageId
   *  for a pending card that was created, which will be forwarded to onToolFinish. */
  onToolStart?: (toolName: string, args: unknown) => Promise<{ messageId: Id<'session_messages'> } | void>
  /** Called after tool execution completes (success or error). */
  onToolFinish?: (toolName: string, messageId: Id<'session_messages'> | undefined, result: unknown) => Promise<void>
  /** Called for each text delta emitted during the final streaming turn.
   *  Only invoked on the last (non-tool) turn when the model produces text. */
  onTextDelta?: (delta: string) => Promise<void>
}

// -----------------------------------------------------------------------------
// System Prompt
// -----------------------------------------------------------------------------

export const buildSystemPrompt = (ctx: AgentContext): string => {
  const locBlock = ctx.currentLocation
    ? `The rider's current location is lat=${ctx.currentLocation.lat}, lng=${ctx.currentLocation.lng}. Use this as the default origin when the rider asks for a route without specifying where they're starting from. Do NOT ask "where are you starting from?" when this location is available — just use it.`
    : `Rider's current location: unknown — ask where they are starting from before planning a route.`

  return `You are a motorcycle ride planning assistant. Be concise — 1-2 sentences per response. Use 2nd person ("your ride", "you'll see").

${locBlock}

Workflow:
1. If the rider names a place (not "here"), call geocode first to get coordinates.
2. Call planRoute with structured start, end, departureTime (default: now + 3600000 ms), and preferences.
3. For refinements ("make it shorter", "avoid highways"): call planRoute again with updated preferences and the same endpoints.

Presentation:
- 1-2 sentences, highlight scenic features, road types, rough duration.
- Never expose tool names or technical details.

Errors: suggest what the rider can try next without surfacing internals.`
}

// -----------------------------------------------------------------------------
// Tool Handlers
// -----------------------------------------------------------------------------

async function runGeocode(
  ctx: AgentContext,
  args: { query: string }
): Promise<unknown> {
  const provider = createGeocodingProvider()
  const results = await provider.geocode(args.query, ctx.currentLocation)
  return { results: results.slice(0, 3) }
}

async function runPlanRoute(
  ctx: AgentContext,
  args: {
    start: { lat: number; lng: number; label: string | null }
    end: { lat: number; lng: number; label: string | null }
    departureTime: number
    preferences: {
      scenicBias: 'default' | 'high'
      avoidHighways: boolean
      avoidTolls: boolean
    }
  }
): Promise<unknown> {
  // Rate-limit check
  const usage = await ctx.runQuery(internal.db.planUsage.checkUsageInternal, {
    clerkUserId: ctx.clerkUserId,
  })

  if (!usage.allowed) {
    return {
      type: 'chat',
      message: `You've reached your monthly limit of ${FREE_TIER_MONTHLY_LIMIT} route plans. Upgrade to Premium for unlimited plans!`,
    }
  }

  try {
    const results = await planRideOrchestrator({
      planInput: {
        start: {
          lat: args.start.lat,
          lng: args.start.lng,
          label: args.start.label ?? undefined,
        },
        end: {
          lat: args.end.lat,
          lng: args.end.lng,
          label: args.end.label ?? undefined,
        },
        departureTime: args.departureTime,
        preferences: args.preferences,
      },
      departureTimeMs: args.departureTime,
    })
    const built = buildOptionsFromResults(results, crypto.randomUUID())

    // Increment usage (deterministic action)
    await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, {
      clerkUserId: ctx.clerkUserId,
    })

    return { type: 'routes', data: built }
  } catch (error) {
    console.error('[runPlanRoute] Error:', error)
    return {
      type: 'error',
      message: "I couldn't plan your route right now. Please try again.",
    }
  }
}

async function runFetchWeather(
  _ctx: AgentContext,
  _args: { location: string | null }
): Promise<unknown> {
  return {
    type: 'weather',
    data: {
      summary: 'Weather information will be available soon.',
      temperature: '--',
      conditions: 'unknown',
    },
  }
}

async function runSaveRoute(
  _ctx: AgentContext,
  args: { routeIndex: number | null; name: string | null }
): Promise<unknown> {
  const routeName = args.name ?? 'Your planned route'
  return {
    type: 'confirmation',
    message: `I've noted that you want to save "${routeName}". Saving routes will be available soon!`,
  }
}

async function runSearchFavorites(
  _ctx: AgentContext,
  args: { query: string }
): Promise<unknown> {
  return {
    type: 'chat',
    message: `Searching your saved routes for "${args.query}" — this feature will be available soon!`,
  }
}

// -----------------------------------------------------------------------------
// Tool Registry
// -----------------------------------------------------------------------------

// Cast schemas to `any` to bridge the TypeBox 0.33 (project) vs 0.34 (pi-ai
// peer dep) minor API difference at the TypeScript type level. The runtime
// shapes are identical — both produce plain objects with a `Symbol(TypeBox.Kind)`
// symbol property that AJV resolves correctly.
const tools: Tool[] = [
  {
    name: 'geocode',
    description:
      "Look up coordinates for a place name, address, or landmark. Use before planRoute when the rider names somewhere other than \"here\". Results are biased toward the rider's current location.",
    parameters: AgentToolSchemas.geocode as any,
  },
  {
    name: 'planRoute',
    description:
      "Plan a motorcycle route with 2-3 scenic options. Call geocode first if you need coordinates for the start or end. Use the rider's current location (given in the system prompt) as start when they say \"here\" or don't specify. For refinements, call this again with updated preferences.",
    parameters: AgentToolSchemas.planRoute as any,
  },
  {
    name: 'fetchWeather',
    description: 'Get weather information for the planned route.',
    parameters: AgentToolSchemas.fetchWeather as any,
  },
  {
    name: 'saveRoute',
    description: 'Save the current route to favorites.',
    parameters: AgentToolSchemas.saveRoute as any,
  },
  {
    name: 'searchFavorites',
    description: 'Search saved routes by query.',
    parameters: AgentToolSchemas.searchFavorites as any,
  },
]

// -----------------------------------------------------------------------------
// Tool Executor Dispatch
// -----------------------------------------------------------------------------

async function executeTool(
  ctx: AgentContext,
  call: ToolCall,
  executeCtx?: ExecuteContext
): Promise<unknown> {
  const validated = validateToolCall(tools, call)

  // Notify caller that tool is starting; capture any pending card messageId
  let pendingMessageId: Id<'session_messages'> | undefined
  if (executeCtx?.onToolStart) {
    const startResult = await executeCtx.onToolStart(call.name, validated)
    if (startResult) {
      pendingMessageId = startResult.messageId
    }
  }

  let result: unknown
  try {
    switch (call.name) {
      case 'geocode':
        result = await runGeocode(ctx, validated)
        break
      case 'planRoute':
        result = await runPlanRoute(ctx, validated)
        break
      case 'fetchWeather':
        result = await runFetchWeather(ctx, validated)
        break
      case 'saveRoute':
        result = await runSaveRoute(ctx, validated)
        break
      case 'searchFavorites':
        result = await runSearchFavorites(ctx, validated)
        break
      default:
        result = { type: 'error', message: `Unknown tool: ${call.name}` }
    }
  } catch (err) {
    // Re-throw after notifying so the agent loop's error handler still fires
    if (executeCtx?.onToolFinish) {
      await executeCtx.onToolFinish(call.name, pendingMessageId, {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
    throw err
  }

  if (executeCtx?.onToolFinish) {
    await executeCtx.onToolFinish(call.name, pendingMessageId, result)
  }

  return result
}

// -----------------------------------------------------------------------------
// Attachment Extraction Helper (testable)
// -----------------------------------------------------------------------------

/**
 * Extract route plan IDs from tool results.
 * Pure function — testable independently.
 */
export function extractRouteAttachments(
  toolResults: Array<{ toolName: string; result: unknown }>
): Array<{ type: string; routePlanId?: string }> {
  const attachments: Array<{ type: string; routePlanId?: string }> = []

  for (const tr of toolResults) {
    if (tr.toolName === 'planRoute') {
      const result = tr.result as any
      if (result?.type === 'routes' && result?.data?.planId) {
        attachments.push({ type: 'route', routePlanId: result.data.planId })
      }
    }
  }

  return attachments
}

// -----------------------------------------------------------------------------
// Main Entry Point
// -----------------------------------------------------------------------------

/**
 * Execute the ride planning agent with tools.
 * This is the probabilistic part — the agent decides which tools to call.
 *
 * @param executeCtx - Optional callbacks for observing tool dispatch lifecycle
 *   (e.g. emitting card messages). The agent logic itself is unaware of cards.
 */
export async function executeRidePlanningAgent(
  ctx: AgentContext,
  userMessage: string,
  executeCtx?: ExecuteContext
): Promise<{ response: string; attachments?: Array<{ type: string; routePlanId?: string }> }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  // getModel is typed against the known model map; cast AI_MODEL via `as any`
  // since it's a runtime string that may be overridden via env var.
  const model = getModel('openai', AI_MODEL as any)

  const toolResultsTracker: Array<{ toolName: string; result: unknown }> = []

  // Build conversation history from stored role+content pairs.
  // UserMessage is straightforward. AssistantMessage requires metadata fields
  // (api, provider, model, usage, stopReason) that aren't stored in history —
  // we populate them with sentinel values so the LLM receives the prior turn
  // context correctly.
  const historyMessages: Message[] = ctx.conversationHistory.map((m): Message => {
    if (m.role === 'rider') {
      return {
        role: 'user',
        content: m.content,
        timestamp: Date.now(),
      }
    }
    return {
      role: 'assistant',
      content: [{ type: 'text', text: m.content }],
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
      timestamp: Date.now(),
    }
  })

  const context: Context = {
    systemPrompt: buildSystemPrompt(ctx),
    messages: [
      ...historyMessages,
      { role: 'user', content: userMessage, timestamp: Date.now() } as Message,
    ],
    tools,
  }

  // Agent loop — run until stop or max steps
  const deadline = Date.now() + AGENT_TIMEOUT_MS

  for (let step = 0; step < MAX_STEPS; step++) {
    if (Date.now() > deadline) {
      throw new Error(ERROR_CODES.AGENT_TIMEOUT)
    }

    // Determine whether to stream with delta forwarding.
    // Strategy: always stream (so we can capture deltas), but only forward
    // text_delta events to onTextDelta if the turn ends as a final (non-tool)
    // turn. We buffer deltas in-flight and flush them when we see the `done`
    // event with a non-toolUse stop reason.
    let assistant: AssistantMessage

    if (executeCtx?.onTextDelta) {
      const eventStream = stream(model, context)
      const bufferedDeltas: string[] = []

      for await (const event of eventStream) {
        const ev = event as AssistantMessageEvent
        if (ev.type === 'text_delta') {
          bufferedDeltas.push(ev.delta)
        }
        // When the stream ends as a final (text) turn, flush buffered deltas.
        if (ev.type === 'done' && ev.reason !== 'toolUse') {
          for (const delta of bufferedDeltas) {
            await executeCtx.onTextDelta!(delta)
          }
        }
      }

      assistant = await eventStream.result()
    } else {
      assistant = await complete(model, context)
    }

    context.messages.push(assistant)

    if (assistant.stopReason !== 'toolUse') break

    const toolCalls = assistant.content.filter(
      (b): b is ToolCall => b.type === 'toolCall'
    )
    if (toolCalls.length === 0) break

    for (const call of toolCalls) {
      let result: unknown
      let isError = false
      try {
        result = await executeTool(ctx, call, executeCtx)
      } catch (err) {
        result = {
          type: 'error',
          message: err instanceof Error ? err.message : String(err),
        }
        isError = true
      }

      toolResultsTracker.push({ toolName: call.name, result })

      const toolResultMsg: ToolResultMessage = {
        role: 'toolResult',
        toolCallId: call.id,
        toolName: call.name,
        content: [{ type: 'text', text: JSON.stringify(result) }],
        isError,
        timestamp: Date.now(),
      }
      context.messages.push(toolResultMsg)
    }
  }

  // Extract final text from the last assistant message
  const last = context.messages[context.messages.length - 1]
  let responseText = ''
  if (last && last.role === 'assistant') {
    const assistantLast = last as AssistantMessage
    responseText = assistantLast.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('')
  }

  const attachments = extractRouteAttachments(toolResultsTracker)
  if (!responseText && attachments.length > 0) {
    responseText = 'Here are your route options!'
  }

  return {
    response: responseText,
    attachments: attachments.length > 0 ? attachments : undefined,
  }
}
