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
import { api, internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import type { Id } from '../../_generated/dataModel'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const MAX_STEPS = 10
const AGENT_TIMEOUT_MS = 30_000

// -----------------------------------------------------------------------------
// In-Memory Sketch Store (per-session)
// -----------------------------------------------------------------------------

// Temporary store for pending sketches between createRouteSketch and compileSketch calls
// In production, this should be stored in the planning session or a similar persistent store
const pendingSketches = new Map<string, any>()

function storePendingSketch(sessionId: string, sketch: any): void {
  pendingSketches.set(sessionId, sketch)
}

function getPendingSketch(sessionId: string): any | undefined {
  return pendingSketches.get(sessionId)
}

function clearPendingSketch(sessionId: string): void {
  pendingSketches.delete(sessionId)
}

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
  /** Called after tool execution completes (success or error).
   *  Receives the toolCallId so callers can correlate with onToolResultPiMessage. */
  onToolFinish?: (toolCallId: string, toolName: string, messageId: Id<'session_messages'> | undefined, result: unknown) => Promise<void>
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

  return `You are a motorcycle ride planning assistant with deep knowledge of road networks. Be concise — 1-2 sentences per response. Use 2nd person ("your ride", "you'll see").

${locationSection}

**Route Planning Approach:**

You have TWO ways to plan routes:

**Option 1: Deterministic (planRoute)**
- Use for standard requests without specific road constraints
- Call planRoute with start/end coordinates and preferences
- Returns 2-3 scenic route variants automatically

**Option 2: LLM-Authored (createRouteSketch + compileSketch)**
- Use when the rider specifies roads to avoid or preferred routes
- YOU author the high-level itinerary (e.g., "take Highway 280 to Skyline Blvd")
- Google Maps validates and provides precise geometry
- If Google Maps says roads don't connect, revise your sketch and try again

**When to use LLM-authored routes:**
- Rider names specific roads: "avoid Highway 1", "take Market Street", "include Skyline Blvd"
- Rider wants to avoid a specific area: "don't go through Santa Cruz"
- Rider requests a particular route: "take the coast road", "use the mountain pass"

**LLM-Authored Workflow:**
1. Call createRouteSketch with your planned route segments and waypoints
   - segments: Array of road segments (roadName, fromName, toName, viaNames)
   - anchorPoints: Key waypoints (towns, junctions, landmarks, passes)
2. Call geocode if you need coordinates for start/end
3. Call compileSketch with start/end coordinates and your sketch
4. If compileSketch fails with routing error, revise your sketch and try again

**Example: Rider says "avoid Highway 1"**
- Create sketch with segments: [{roadName: "Highway 280", fromName: "San Jose", toName: "San Bruno"}, {roadName: "Skyline Blvd", fromName: "San Bruno", toName: "Half Moon Bay"}]
- Add anchorPoints for key junctions
- Call compileSketch to validate and get geometry

**Refinement Rules:**
- ALWAYS carry forward ALL prior constraints unless explicitly revoked
- Check the session context for previous routes and their preferences
- Keep the same start/end unless the rider changes them

**Presentation:**
- 1-2 sentences, highlight scenic features, road types, rough duration
- Explain WHY you chose this route (e.g., "This takes Highway 280 to Skyline Blvd for mountain views without Highway 1 traffic")
- Never expose tool names or technical details

**Errors:** If compileSketch fails, explain conversationally and try a different route.

Do not call fetchWeather, saveRoute, or searchFavorites — these features are coming soon.`
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
  // Rate-limit check (limit configurable via RATE_LIMIT_OVERRIDE env var; 0 = unlimited)
  const usage = await ctx.runQuery(internal.db.planUsage.checkUsageInternal, {
    clerkUserId: ctx.clerkUserId,
  })

  if (!usage.allowed) {
    return {
      type: 'chat',
      message: `You've reached your monthly limit of ${usage.limit} route plans. Upgrade to Premium for unlimited plans!`,
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

async function runCreateRouteSketch(
  ctx: AgentContext,
  args: {
    label: string
    rationale: string
    segments: Array<{
      roadName: string
      fromName: string
      toName: string
      viaNames: string[] | null
    }>
    anchorPoints: Array<{
      name: string
      kind: 'town' | 'junction' | 'landmark' | 'pass'
      lat: number | null
      lng: number | null
    }>
  }
): Promise<unknown> {
  // Store the sketch for use with compileSketch
  const sessionId = ctx.planningSessionId
  const sketch = {
    label: args.label,
    rationale: args.rationale,
    segments: args.segments.map(s => ({
      roadName: s.roadName,
      fromName: s.fromName,
      toName: s.toName,
      viaNames: s.viaNames || undefined,
    })),
    anchorPoints: args.anchorPoints,
  }
  storePendingSketch(sessionId, sketch)

  // Return success so the agent knows the sketch was created
  return {
    type: 'sketch_created',
    sketch,
    message: `Route sketch "${args.label}" created. Now call compileSketch with start/end coordinates to generate the route.`,
  }
}

async function runCompileSketch(
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
    sketch?: {
      label: string
      rationale: string
      segments: Array<{
        roadName: string
        fromName: string
        toName: string
        viaNames?: string[]
      }>
      anchorPoints: Array<{
        name: string
        kind: 'town' | 'junction' | 'landmark' | 'pass'
        lat?: number
        lng?: number
      }>
    }
  }
): Promise<unknown> {
  // Get sketch from args or from pending store
  let sketch = args.sketch
  if (!sketch) {
    sketch = getPendingSketch(ctx.planningSessionId)
    if (!sketch) {
      return {
        type: 'error',
        message: "No route sketch found. Call createRouteSketch first to define your route itinerary.",
        hint: "Use createRouteSketch to specify the roads and waypoints for your route.",
        retryGuidance: 'create_sketch',
      }
    }
  }

  // Rate-limit check
  const usage = await ctx.runQuery(internal.db.planUsage.checkUsageInternal, {
    clerkUserId: ctx.clerkUserId,
  })

  if (!usage.allowed) {
    return {
      type: 'chat',
      message: `You've reached your monthly limit of ${usage.limit} route plans. Upgrade to Premium for unlimited plans!`,
      hint: 'Do not attempt another planRoute call — the user is rate-limited.',
      retryGuidance: 'stop',
    }
  }

  // Persist a route_plans row up front
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
    // Import compileSketch dynamically to avoid circular deps
    const { compileSketch: compileSketchImpl } = await import('./tools/compileSketch')
    const { normalizeRoute } = await import('./tools/normalizeRoute')
    const { buildOptionsFromResults } = await import('./planRide')

    // Compile the sketch to get Google Maps geometry
    const providerRoute = await compileSketchImpl({
      planInput,
      sketch,
    })

    // Normalize the route
    const routeSnapshot = await normalizeRoute({
      providerRoute,
      planInput,
    })

    // Build the result
    const results = [{
      routeSnapshot,
      sketch,
    }]
    const built = buildOptionsFromResults(results, crypto.randomUUID())

    // Clear the pending sketch after successful compilation
    clearPendingSketch(ctx.planningSessionId)

    // Finalize the route_plans row
    await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
      routePlanId,
      status: 'completed',
      result: built,
    })

    // Increment usage
    await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, {
      clerkUserId: ctx.clerkUserId,
    })

    return { type: 'routes', data: built, routePlanId }
  } catch (error) {
    console.error('[runCompileSketch] Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if it's a routing compilation error (e.g., invalid road, no connection)
    const isRoutingError = errorMessage.includes('ROUTING_COMPILE_FAILED') ||
                          errorMessage.includes('ZERO_RESULTS') ||
                          errorMessage.includes('NOT_FOUND')

    await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
      routePlanId,
      status: 'failed',
      errorMessage,
    })

    if (isRoutingError) {
      return {
        type: 'error',
        message: "I couldn't route that way — the roads may not connect or one might not exist. Let me try a different approach.",
        hint: `The route sketch "${sketch.label}" couldn't be compiled. Try using different roads or check if they connect.`,
        retryGuidance: 'revise_sketch',
        routePlanId,
      }
    }

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
      "Look up coordinates for a place name, address, or landmark. Use before planRoute or compileSketch when the rider names somewhere other than \"here\". Results are biased toward the rider's current location.",
    parameters: AgentToolSchemas.geocode as any,
    parallelSafe: true,
  },
  {
    name: 'createRouteSketch',
    description:
      "Create a high-level route itinerary by specifying road segments (think \"take Highway 5 to Highway 405 to PCH\"). Use this when the rider asks to avoid specific roads (\"avoid Highway 1\") or requests a particular route (\"take Skyline Blvd\"). After creating the sketch, call compileSketch with start/end coordinates to generate the precise route.",
    parameters: AgentToolSchemas.createRouteSketch as any,
    parallelSafe: true,
  },
  {
    name: 'compileSketch',
    description:
      "Convert a route sketch into a precise route with geometry from Google Maps. Call geocode first if you need coordinates for start/end points. This validates that your sketch roads actually connect and returns detailed turn-by-turn geometry. If routing fails, revise your sketch and try again.",
    parameters: AgentToolSchemas.compileSketch as any,
    parallelSafe: false,
  },
  {
    name: 'planRoute',
    description:
      "Plan a motorcycle route with 2-3 scenic options using the deterministic orchestrator. Call geocode first if you need coordinates for the start or end. Use the rider's current location (given in the system prompt) as start when they say \"here\" or don't specify. For refinements, consider using createRouteSketch + compileSketch for more control.",
    parameters: AgentToolSchemas.planRoute as any,
    parallelSafe: false,
  },
  {
    name: 'fetchWeather',
    description: 'Get weather information for the planned route. NOTE: Not yet implemented — do not call this tool.',
    parameters: AgentToolSchemas.fetchWeather as any,
    parallelSafe: true,
  },
  {
    name: 'saveRoute',
    description: 'Save the current route to favorites. NOTE: Not yet implemented — do not call this tool.',
    parameters: AgentToolSchemas.saveRoute as any,
    parallelSafe: false,
  },
  {
    name: 'searchFavorites',
    description: 'Search saved routes by query. NOTE: Not yet implemented — do not call this tool.',
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
      case 'createRouteSketch':
        result = await runCreateRouteSketch(ctx, validated)
        break
      case 'compileSketch':
        result = await runCompileSketch(ctx, validated)
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
      await executeCtx.onToolFinish(call.id, call.name, pendingMessageId, {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
        hint: "An unexpected error occurred. Ask the rider what they'd like to do.",
        retryGuidance: 'ask_rider',
      })
    }
    throw err
  }

  if (executeCtx?.onToolFinish) {
    await executeCtx.onToolFinish(call.id, call.name, pendingMessageId, result)
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
