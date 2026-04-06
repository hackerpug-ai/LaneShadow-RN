'use node'

import {
  getModel,
  validateToolCall,
  type AssistantMessage,
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
import { buildInSessionRouteBlock } from './sessionContext'
import { LoopDetector } from './loopDetector'
import { BudgetTracker } from './budgetTracker'
import { summarizeForContext } from './lib/summarizeForContext'
import { runAgent } from './runAgent'
import { OPENAI_API_KEY, AI_MODEL } from '../../lib/env'
import { FREE_TIER_MONTHLY_LIMIT } from '../../../models/plan-usage'
import { api, internal } from '../../_generated/api'
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
  planningSessionId: Id<'planning_sessions'>
  clerkUserId: string
  piMessages: Message[]
  currentLocation?: { lat: number; lng: number }
  runQuery: ActionCtx['runQuery']
  runMutation: ActionCtx['runMutation']
}

export type ToolResult =
  | { type: 'routes'; data: { planId: string; options: any[] }; routePlanId: Id<'route_plans'> }
  | { type: 'error'; message: string; hint?: string; retryGuidance?: string; routePlanId?: Id<'route_plans'> }
  | { type: 'confirmation'; message: string }
  | { type: 'search_results'; data: any[] }
  | { type: 'weather'; data: any }
  | { type: 'chat'; message: string; hint?: string; retryGuidance?: string }

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
  /** Called for each thinking/reasoning delta when the model emits extended
   *  thinking tokens (e.g. Claude 3.7 Sonnet with thinking enabled). Fires
   *  once per reasoning chunk in stream order, before the associated text. */
  onThinkingDelta?: (delta: string) => Promise<void>
  /** Called when the model begins emitting a tool call from the stream,
   *  before arguments are populated. Provides the tool name so the UI can
   *  show a pending indicator. Full arguments arrive via onToolStart when
   *  the tool actually executes. */
  onToolPending?: (partial: { name: string }) => Promise<void>
  /** Called at the start of each ReAct step before the model is invoked.
   *  Provides the current step index (0-based) and the configured maximum so
   *  callers can render a progress indicator or enforce step budgets. */
  onStepStart?: (step: number, maxSteps: number) => Promise<void>
  /** Called once after each complete assistant turn (after the full
   *  AssistantMessage has been assembled from the stream). Useful for
   *  persisting the raw pi-ai message or emitting an agent-turn card. */
  onAgentTurn?: (assistant: AssistantMessage) => Promise<void>
  /** Called after each tool result is appended to the conversation context.
   *  Provides the tool call ID and the full ToolResultMessage so callers can
   *  persist raw pi-ai messages or trigger downstream card updates. */
  onToolResultPiMessage?: (toolCallId: string, result: ToolResultMessage) => Promise<void>
  /** Called once for the final (non-tool) assistant turn after the full
   *  AssistantMessage has been assembled from the stream. Useful for
   *  persisting the final pi-ai AssistantMessage alongside the text row. */
  onFinalAssistant?: (assistant: AssistantMessage) => Promise<void>
}

// -----------------------------------------------------------------------------
// System Prompt
// -----------------------------------------------------------------------------

export const buildSystemPrompt = async (ctx: AgentContext): Promise<string> => {
  let locBlock: string
  if (ctx.currentLocation) {
    locBlock = `The rider's current location is lat=${ctx.currentLocation.lat}, lng=${ctx.currentLocation.lng}. Use this as the default origin when the rider asks for a route without specifying where they're starting from. Do NOT ask "where are you starting from?" when this location is available — just use it.`
  } else {
    // Try lastKnownLocation fallback from the planning session
    const session = await ctx.runQuery(api.db.planningSessions.getSessionById, {
      sessionId: ctx.planningSessionId,
    })
    if (session.lastKnownLocation) {
      locBlock = `The rider's last known location is lat=${session.lastKnownLocation.lat}, lng=${session.lastKnownLocation.lng} (may be stale). Use this as the default origin but mention it may not be current.`
    } else {
      locBlock = `Rider's current location: unknown — ask where they are starting from before planning a route.`
    }
  }

  const routeBlock = await buildInSessionRouteBlock(
    { runQuery: ctx.runQuery },
    ctx.planningSessionId,
  )

  const locationSection = `${locBlock}${routeBlock ? '\n\n' + routeBlock : ''}`

  return `You are a motorcycle ride planning assistant. Be concise — 1-2 sentences per response. Use 2nd person ("your ride", "you'll see").

${locationSection}

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
  if (results.length === 0) {
    return {
      type: 'error',
      message: `No results found for "${args.query}"`,
      hint: 'Try a more specific query with city/state, e.g. "Santa Cruz, CA" instead of "Santa Cruz"',
      retryGuidance: 'different_args',
    }
  }
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
      hint: 'Do not attempt another planRoute call — the user is rate-limited.',
      retryGuidance: 'stop',
    }
  }

  // Persist a route_plans row up front so the reactive RoutingCard in the
  // chat transcript can subscribe to status/phase/result updates. The agent
  // runs the orchestrator inline (unlike the scheduled createPlan flow), so
  // we insert with status='running' and finalize once the orchestrator
  // returns.
  const planInput = {
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
  }

  const { routePlanId } = await ctx.runMutation(
    internal.db.routePlans.createForAgentInternal,
    {
      clerkUserId: ctx.clerkUserId,
      planningSessionId: ctx.planningSessionId,
      planInput,
      startLabel: args.start.label ?? undefined,
      endLabel: args.end.label ?? undefined,
    }
  )

  try {
    const results = await planRideOrchestrator({
      planInput,
      departureTimeMs: args.departureTime,
    })
    const built = buildOptionsFromResults(results, crypto.randomUUID())

    // Finalize the route_plans row with the orchestrator output so RoutingCard
    // can transition into its CompletedCard state with the route options.
    await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
      routePlanId,
      status: 'completed',
      result: built,
    })

    // Increment usage (deterministic action)
    await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, {
      clerkUserId: ctx.clerkUserId,
    })

    return { type: 'routes', data: built, routePlanId }
  } catch (error) {
    console.error('[runPlanRoute] Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
      routePlanId,
      status: 'failed',
      errorMessage,
    })
    return {
      type: 'error',
      message: "I couldn't plan your route right now. Please try again.",
      hint: error instanceof Error && error.message.includes('timeout')
        ? 'The route calculation timed out. Try a shorter distance or simpler route.'
        : 'Suggest an alternate destination or relax preferences (e.g. remove avoid-highways).',
      retryGuidance: 'ask_rider',
      routePlanId,
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

type ToolWithParallelSafe = Tool & { parallelSafe: boolean }

const tools: ToolWithParallelSafe[] = [
  {
    name: 'geocode',
    description:
      "Look up coordinates for a place name, address, or landmark. Use before planRoute when the rider names somewhere other than \"here\". Results are biased toward the rider's current location.",
    parameters: AgentToolSchemas.geocode as any,
    parallelSafe: true,
  },
  {
    name: 'planRoute',
    description:
      "Plan a motorcycle route with 2-3 scenic options. Call geocode first if you need coordinates for the start or end. Use the rider's current location (given in the system prompt) as start when they say \"here\" or don't specify. For refinements, call this again with updated preferences.",
    parameters: AgentToolSchemas.planRoute as any,
    parallelSafe: false,
  },
  {
    name: 'fetchWeather',
    description: 'Get weather information for the planned route.',
    parameters: AgentToolSchemas.fetchWeather as any,
    parallelSafe: true,
  },
  {
    name: 'saveRoute',
    description: 'Save the current route to favorites.',
    parameters: AgentToolSchemas.saveRoute as any,
    parallelSafe: false,
  },
  {
    name: 'searchFavorites',
    description: 'Search saved routes by query.',
    parameters: AgentToolSchemas.searchFavorites as any,
    parallelSafe: true,
  },
]

const safeToolNames = new Set(tools.filter(t => t.parallelSafe).map(t => t.name))

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
        hint: "An unexpected error occurred. Ask the rider what they'd like to do.",
        retryGuidance: 'ask_rider',
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
  toolResults: { toolName: string; result: unknown }[]
): { type: string; routePlanId?: Id<'route_plans'> }[] {
  const attachments: { type: string; routePlanId?: Id<'route_plans'> }[] = []

  for (const tr of toolResults) {
    if (tr.toolName === 'planRoute') {
      const result = tr.result as any
      // Prefer the real Convex route_plans document id (added by runPlanRoute
      // when it persists the plan). `result.data.planId` is a legacy UUID
      // string and is NOT a valid v.id('route_plans') — never emit it through
      // the action's returns validator.
      if (result?.type === 'routes' && result?.routePlanId) {
        attachments.push({
          type: 'route_options',
          routePlanId: result.routePlanId,
        })
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
): Promise<{ response: string; attachments?: { type: string; routePlanId?: Id<'route_plans'> }[] }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  // getModel is typed against the known model map; cast AI_MODEL via `as any`
  // since it's a runtime string that may be overridden via env var.
  const model = getModel('openai', AI_MODEL as any)

  const context: Context = {
    systemPrompt: await buildSystemPrompt(ctx),
    messages: [
      ...ctx.piMessages,
      { role: 'user', content: userMessage, timestamp: Date.now() } as Message,
    ],
    tools,
  }

  const result = await runAgent({
    model,
    context,
    executor: (call: ToolCall) => executeTool(ctx, call, executeCtx),
    callbacks: executeCtx,
    maxSteps: MAX_STEPS,
    timeoutMs: AGENT_TIMEOUT_MS,
    loopDetector: new LoopDetector(3),
    budgetTracker: new BudgetTracker(0.25),
    summarizeForContext,
    parallelSafeTools: safeToolNames,
  })

  const attachments = extractRouteAttachments(result.toolResults)
  let responseText = result.response
  if (!responseText && attachments.length > 0) {
    responseText = 'Here are your route options!'
  }

  return {
    response: responseText,
    attachments: attachments.length > 0 ? attachments : undefined,
  }
}
