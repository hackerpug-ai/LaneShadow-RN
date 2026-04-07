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
import { lookupRoad } from './tools/lookupRoad'
import { getCurvature } from './tools/getCurvature'
import { classifySurface } from './tools/checkSurface'
import { getElevation } from './tools/getElevation'
import { searchAlongRoute } from './tools/searchAlongRoute'
import { getRouteWeather } from './tools/getRouteWeather'
import { getUserFavorites } from './tools/getUserFavorites'
import type { UserFavorite } from './tools/getUserFavorites'
import { createGeocodingProvider } from './providers/geocodingProvider'
import { planRideOrchestrator } from './lib/planRideOrchestrator'
import { buildOptionsFromResults } from './planRide'
import { buildInSessionRouteBlock } from './sessionContext'
import { LoopDetector } from './loopDetector'
import { BudgetTracker } from './budgetTracker'
import { summarizeForContext } from './lib/summarizeForContext'
import { runAgent } from './runAgent'
import { OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, ANTHROPIC_API_KEY, AI_MODEL, AI_PROVIDER } from '../../lib/env'
import { api, internal } from '../../_generated/api'
import type { ActionCtx } from '../../_generated/server'
import type { Id } from '../../_generated/dataModel'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const MAX_STEPS = 10
const AGENT_TIMEOUT_MS = 60_000

// -----------------------------------------------------------------------------
// In-Memory Sketch Store (per-session)
// -----------------------------------------------------------------------------

// Session-scoped state for sketch compilation — tracks pending sketches, succeeded
// segment cache, and attempt count for the retry loop.

const MAX_COMPILE_ATTEMPTS = 3

type SegmentIdentity = {
  roadName: string
  fromName: string
  toName: string
}

type CachedSegmentResult = {
  // The original segment index in the sketch passed to the first compileSketch call
  segmentIndex: number
  route: import('./providers/routingProvider').ProviderRouteResponse
  identity: SegmentIdentity
}

type PendingSketchState = {
  sketch: any
  succeededSegments: CachedSegmentResult[]
  attemptCount: number
}

const pendingSketches = new Map<string, PendingSketchState>()

function storePendingSketch(sessionId: string, sketch: any): void {
  // Reset the sketch state when a new sketch is stored (LLM called createRouteSketch again)
  pendingSketches.set(sessionId, { sketch, succeededSegments: [], attemptCount: 0 })
}

function getPendingSketchState(sessionId: string): PendingSketchState | undefined {
  return pendingSketches.get(sessionId)
}

function updatePendingSketchState(sessionId: string, state: PendingSketchState): void {
  pendingSketches.set(sessionId, state)
}

function clearPendingSketch(sessionId: string): void {
  pendingSketches.delete(sessionId)
}

// Legacy accessor — kept for createRouteSketch handler which only needs the sketch
function getPendingSketch(sessionId: string): any | undefined {
  return pendingSketches.get(sessionId)?.sketch
}

/**
 * Segment identity key for change detection.
 * Two segments with the same (roadName, fromName, toName) are considered identical.
 */
function segmentKey(seg: SegmentIdentity): string {
  return `${seg.roadName}||${seg.fromName}||${seg.toName}`
}

/**
 * Find which segments in the new sketch are unchanged compared to previously-succeeded segments.
 * Returns a map from new-sketch-index → cached result for each unchanged segment.
 */
function findUnchangedSegments(
  newSegments: SegmentIdentity[],
  cached: CachedSegmentResult[]
): Map<number, CachedSegmentResult> {
  const cachedByKey = new Map(cached.map((r) => [segmentKey(r.identity), r]))
  const unchanged = new Map<number, CachedSegmentResult>()

  newSegments.forEach((seg, idx) => {
    const hit = cachedByKey.get(segmentKey(seg))
    if (hit) {
      unchanged.set(idx, hit)
    }
  })

  return unchanged
}

/**
 * Merge cached succeeded segments with newly-compiled results into a single ordered array.
 * The result is ordered by segmentIndex (position in the new sketch).
 */
function mergeSegmentResults(
  newSegments: SegmentIdentity[],
  unchanged: Map<number, CachedSegmentResult>,
  newResults: import('./tools/compileSketch').SegmentCompileResult[]
): import('./tools/compileSketch').SegmentCompileResult[] {
  // newResults are indexed relative to the toCompile subset — remap them
  // The compile call was given segments in order; map back to sketch index
  let newResultIdx = 0
  const merged: import('./tools/compileSketch').SegmentCompileResult[] = []

  for (let i = 0; i < newSegments.length; i++) {
    const cached = unchanged.get(i)
    if (cached) {
      merged.push({ status: 'ok', segmentIndex: i, route: cached.route })
    } else {
      // This was a segment we compiled — get from newResults in order
      const r = newResults[newResultIdx++]
      if (r) {
        merged.push({ ...r, segmentIndex: i })
      }
    }
  }

  return merged
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

  return `You are an expert motorcycle navigator with encyclopedic knowledge of road networks and strong opinions about the best routes — think of yourself as a local who has ridden every road in the area. Be concise — 1-2 sentences per response. Use 2nd person ("your ride", "you'll see").

${locationSection}

## Your Job: Author Routes, Don't Just Transcribe Them

For ANY route request — even generic ones like "scenic 2-hour ride" or "take me somewhere fun" — your job is to pick great roads and author a route sketch.

**Workflow**:
1. If the rider names a place (not "here"), call geocode first to get coordinates.
2. For scenic/twisty/exploratory requests: call lookupRoad first to verify candidate roads exist, then checkSurface to confirm they're paved, then getCurvature to score twistiness. THEN author the sketch with verified roads and curvature data in your rationale.
3. For direct A-to-B requests: skip grounding tools, go straight to createRouteSketch.
4. Only fall back to planRoute if you're genuinely uncertain about the road network in that area.

**IMPORTANT: If a tool call fails with a validation error, fix the arguments and retry. Do NOT give up after one failure.**

**How to author a sketch**:
- Fill in segments with specific road names: roadName, fromName, toName
- Use viaNames to include intermediate landmarks along each road — e.g., "Skeggs Point" on Skyline Blvd — these pin the route to the roads you intend
- Add anchorPoints for key junctions, towns, passes, or landmarks along the route
- Each anchorPoint kind MUST be one of: "town", "junction", "landmark", "pass" — use "landmark" for parks, scenic spots, restaurants, or anything that isn't a town/junction/pass

**Avoidances**: When the rider says "avoid Highway 1" or "skip the freeway," route around it in your sketch using alternative roads — no avoidRoads API parameter is needed. Just don't include that road in your segments.

**Uncertainty fallback**: If you're unsure about roads in an area (e.g., rural Montana backroads you don't know well), acknowledge it briefly and fall back to planRoute with appropriate start/end coordinates.

**Segment retry**: If some roads don't work out after compilation, I'll tell you which segments failed and you can revise just those — not the whole route.

**Examples**:
- "Scenic ride to Santa Cruz" → createRouteSketch: segments=[{roadName:"I-280 S", fromName:"SF", toName:"CA-92 junction"}, {roadName:"Skyline Blvd", fromName:"CA-92", toName:"Alice's Restaurant", viaNames:["Skeggs Point"]}, {roadName:"CA-84", fromName:"Alice's Restaurant", toName:"Half Moon Bay"}, {roadName:"CA-1 N", fromName:"Half Moon Bay", toName:"Santa Cruz"}]
- "Avoid Highway 1, get to Santa Cruz" → sketch an inland route via CA-17 and CA-35 instead; no need for avoidRoads
- "Scenic ride through rural Montana" → "I'm not confident about the specific backroads there — let me use planRoute to find options." → call planRoute

## Available Tools — When to Use

### Pre-Sketch Grounding (use for scenic/twisty/exploratory requests)
- **lookupRoad**: Verify a road exists in OSM before including it in your sketch. Returns geometry you can pass to getCurvature.
- **checkSurface**: Confirm a road is paved before recommending it to street bikes. Pass the surface and highway tags from lookupRoad.
- **getCurvature**: Score a road's twistiness using the roadcurvature.com algorithm. Use the geometry returned by lookupRoad.
- **getUserFavorites**: Check if the rider has favorite roads in this region. Pass the bounding box of your planned route area.

### Post-Compilation Enrichment (use after successful compileSketch)
- **getElevation**: Get elevation profile of the compiled route — describe climbs, passes, and grades.
- **searchAlongRoute**: Find gas stations, restaurants, or scenic stops along the compiled route. Use the encoded polyline from compileSketch output.
- **getRouteWeather**: Check weather along the route for the planned departure time. Use the polyline from compileSketch output.

### When to Skip Grounding
Skip lookupRoad/getCurvature/checkSurface for:
- Direct A-to-B requests ("fastest route to SFO")
- Requests naming specific roads ("take Highway 101 to...")
- Re-compilations during retry loops (roads already verified in prior attempt)

**Cite tool data in your response**: When you use grounding tools, reference the data — e.g. "I picked Skyline Blvd (curvature: 2400, paved) over Page Mill Rd (curvature: 800)" — this builds rider trust.

**Presentation**:
- 1-2 sentences, highlight scenic features, road types, rough duration.
- Never expose tool names or technical details to the rider.

**Errors**: suggest what the rider can try next without surfacing internals.`
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
  const sessionId = ctx.planningSessionId

  // Get sketch from args or from pending store
  let sketch = args.sketch
  if (!sketch) {
    sketch = getPendingSketch(sessionId)
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
      planningSessionId: sessionId,
      planInput,
      startLabel: args.start.label ?? undefined,
      endLabel: args.end.label ?? undefined,
    }
  )

  try {
    // Import compilation tools dynamically to avoid circular deps
    const { compileSketch: compileSketchImpl, compileSegments, stitchSegments } = await import('./tools/compileSketch')
    const { normalizeRoute } = await import('./tools/normalizeRoute')
    const { buildOptionsFromResults } = await import('./planRide')

    let providerRoute: import('./providers/routingProvider').ProviderRouteResponse

    if (sketch.segments.length > 0) {
      // Per-segment compilation path (LLM-authored sketches)

      // ------------------------------------------------------------------
      // Retry tracking (US-025)
      // ------------------------------------------------------------------
      // Load current session state (attempt count + previously-succeeded segments)
      const currentState = getPendingSketchState(sessionId)
      const attemptCount = (currentState?.attemptCount ?? 0) + 1
      const cachedSucceeded: CachedSegmentResult[] = currentState?.succeededSegments ?? []

      // Determine which segments need compilation this attempt.
      // Unchanged segments (same roadName+fromName+toName as a cached success) are skipped.
      const newSegments: SegmentIdentity[] = sketch.segments.map(s => ({
        roadName: s.roadName,
        fromName: s.fromName,
        toName: s.toName,
      }))

      const unchanged = findUnchangedSegments(newSegments, cachedSucceeded)
      const toCompile = sketch.segments.filter((_, i) => !unchanged.has(i))

      // ------------------------------------------------------------------
      // Max retries exhausted with persistent failures
      // ------------------------------------------------------------------
      const attemptsRemaining = MAX_COMPILE_ATTEMPTS - attemptCount

      if (attemptCount >= MAX_COMPILE_ATTEMPTS && cachedSucceeded.length > 0 && toCompile.length > 0) {
        // Compile the remaining failed segments one last time to see if any succeed
        const lastResults = await compileSegments({
          planInput,
          sketch: { ...sketch, segments: toCompile },
        })
        const allResults = mergeSegmentResults(newSegments, unchanged, lastResults)
        const stillFailed = allResults.filter(r => r.status === 'failed')
        const nowSucceeded = allResults.filter(r => r.status === 'ok')

        if (stillFailed.length > 0 && nowSucceeded.length > 0) {
          // Build a partial route from the succeeded segments and return it with a message
          const partialRoute = stitchSegments(nowSucceeded)
          const routeSnapshot = await normalizeRoute({ providerRoute: partialRoute, planInput })
          const results = [{ routeSnapshot, sketch }]
          const built = buildOptionsFromResults(results, crypto.randomUUID())

          clearPendingSketch(sessionId)
          await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
            routePlanId,
            status: 'completed',
            result: built,
          })
          await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, {
            clerkUserId: ctx.clerkUserId,
          })

          const failedRoadNames = stillFailed.map(f => newSegments[f.segmentIndex]?.roadName ?? 'unknown road').join(', ')
          return {
            type: 'routes',
            data: {
              ...built,
              message: `I routed most of the trip but couldn't find a path for ${failedRoadNames}. Here's what works.`,
            },
            routePlanId,
          }
        }

        if (stillFailed.length > 0 && nowSucceeded.length === 0) {
          // All remaining segments failed — return a chat message
          clearPendingSketch(sessionId)
          await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
            routePlanId,
            status: 'failed',
            errorMessage: `All segments failed after ${MAX_COMPILE_ATTEMPTS} attempts`,
          })
          const failedRoadNames = stillFailed.map(f => newSegments[f.segmentIndex]?.roadName ?? 'unknown road').join(', ')
          return {
            type: 'chat',
            message: `I wasn't able to find a path for ${failedRoadNames} after several attempts. Try a different route?`,
          }
        }

        // All succeeded on last attempt — fall through to normal success path
        providerRoute = stitchSegments(nowSucceeded)
        clearPendingSketch(sessionId)
        const routeSnapshot = await normalizeRoute({ providerRoute, planInput })
        const results = [{ routeSnapshot, sketch }]
        const built = buildOptionsFromResults(results, crypto.randomUUID())
        await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
          routePlanId, status: 'completed', result: built,
        })
        await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, { clerkUserId: ctx.clerkUserId })
        return { type: 'routes', data: built, routePlanId }
      }

      // ------------------------------------------------------------------
      // Normal compilation attempt (attempt 1..MAX-1, or first attempt with no cache)
      // ------------------------------------------------------------------
      const segmentResults = await compileSegments({
        planInput,
        sketch: { ...sketch, segments: toCompile },
      })

      // Merge new results with cached unchanged segments
      const mergedResults = mergeSegmentResults(newSegments, unchanged, segmentResults)
      const failed = mergedResults.filter(r => r.status === 'failed')
      const succeeded = mergedResults.filter(r => r.status === 'ok')

      if (failed.length > 0) {
        // Update the succeeded segment cache for the next retry attempt
        const newCachedSucceeded: CachedSegmentResult[] = succeeded.map(s => ({
          segmentIndex: s.segmentIndex,
          route: (s as Extract<typeof s, { status: 'ok' }>).route,
          identity: newSegments[s.segmentIndex],
        }))

        updatePendingSketchState(sessionId, {
          sketch,
          succeededSegments: newCachedSucceeded,
          attemptCount,
        })

        await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
          routePlanId,
          status: 'failed',
          errorMessage: `${failed.length} of ${newSegments.length} segments failed`,
        })

        return {
          type: 'error',
          message: `${failed.length} of ${newSegments.length} road segments couldn't be routed.`,
          hint: JSON.stringify({
            type: 'partial_route',
            attemptsRemaining,
            succeeded: succeeded.map(s => ({
              segmentIndex: s.segmentIndex,
              roadName: newSegments[s.segmentIndex].roadName,
            })),
            failed: failed.map(f => ({
              segmentIndex: f.segmentIndex,
              roadName: newSegments[f.segmentIndex].roadName,
              fromName: newSegments[f.segmentIndex].fromName,
              toName: newSegments[f.segmentIndex].toName,
              error: f.status === 'failed' ? f.error : 'unknown',
            })),
            retryGuidance: 'revise_failed_segments',
            hint: 'Revise only the failed segments. Keep succeeded segments unchanged.',
          }),
          retryGuidance: 'revise_failed_segments',
          routePlanId,
        }
      }

      // All segments succeeded — stitch into a single provider route
      providerRoute = stitchSegments(mergedResults)
    } else {
      // Single-shot compilation path (deterministic orchestrator sketches with empty segments)
      providerRoute = await compileSketchImpl({
        planInput,
        sketch,
      })
    }

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
    clearPendingSketch(sessionId)

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

async function runLookupRoad(
  _ctx: AgentContext,
  args: {
    roadName: string
    bbox: { south: number; west: number; north: number; east: number }
  }
): Promise<unknown> {
  return lookupRoad(args)
}

async function runGetCurvature(
  _ctx: AgentContext,
  args: {
    roadName: string
    geometry: Array<{ lat: number; lng: number }>
    surface: string | null
  }
): Promise<unknown> {
  return getCurvature(args)
}

async function runCheckSurface(
  _ctx: AgentContext,
  args: {
    surface: string | null
    highway: string | null
  }
): Promise<unknown> {
  return classifySurface(args)
}

async function runGetElevation(
  _ctx: AgentContext,
  args: { polyline: Array<{ lat: number; lng: number }> }
): Promise<unknown> {
  return getElevation(args)
}

async function runSearchAlongRoute(
  _ctx: AgentContext,
  args: {
    routePolyline: string
    query: string
    originOffset: number | null
  }
): Promise<unknown> {
  return searchAlongRoute({
    routePolyline: args.routePolyline,
    query: args.query,
    originOffset: args.originOffset ?? undefined,
  })
}

async function runGetRouteWeather(
  _ctx: AgentContext,
  args: {
    polyline: Array<{ lat: number; lng: number }>
    departureTimeMs: number
  }
): Promise<unknown> {
  return getRouteWeather(args)
}

async function runGetUserFavorites(
  _ctx: AgentContext,
  args: {
    bbox: { north: number; south: number; east: number; west: number }
  }
): Promise<unknown> {
  // Epic 6 will provide a richer favorite_roads schema with rating/rideCount/lastRidden/lat/lng.
  // Until then, pass an empty list — the tool gracefully returns no favorites.
  const allFavorites: UserFavorite[] = []
  return getUserFavorites(args, allFavorites)
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
    name: 'lookupRoad',
    description:
      'Verify a road exists in OpenStreetMap for a given bounding box. Returns matched road names, highway class, surface type, and simplified geometry. Use before including a road in a sketch for scenic/twisty requests. Pass the returned geometry to getCurvature to score twistiness.',
    parameters: AgentToolSchemas.lookupRoad as any,
    parallelSafe: true,
  },
  {
    name: 'getCurvature',
    description:
      "Score a road's twistiness using the roadcurvature.com circumcircle-radius algorithm. Higher scores mean more curves: 1000+ = very twisty, 600–999 = twisty, 300–599 = moderate, 100–299 = mild, <100 = straight. Use geometry from lookupRoad results. Use to compare candidate roads and pick 'the fun road'.",
    parameters: AgentToolSchemas.getCurvature as any,
    parallelSafe: true,
  },
  {
    name: 'checkSurface',
    description:
      "Classify a road's surface as paved, unpaved, or unknown using OSM surface and highway tags. Use to confirm a road is suitable for street motorcycles before including it in a sketch. Pass surface and highway values from lookupRoad results.",
    parameters: AgentToolSchemas.checkSurface as any,
    parallelSafe: true,
  },
  {
    name: 'getUserFavorites',
    description:
      "Retrieve the rider's favorite roads within a geographic bounding box, sorted by rating and ride count. Use before authoring a sketch to surface roads the rider already loves in this region.",
    parameters: AgentToolSchemas.getUserFavorites as any,
    parallelSafe: true,
  },
  {
    name: 'getElevation',
    description:
      'Get the elevation profile for a route polyline: total gain/loss in feet, max elevation, max grade percentage, and steep segments. Call after successful compileSketch to describe climbs, mountain passes, and challenging grades to the rider.',
    parameters: AgentToolSchemas.getElevation as any,
    parallelSafe: true,
  },
  {
    name: 'searchAlongRoute',
    description:
      "Find places of interest along a compiled route using Google Places. Pass the encoded polyline from compileSketch output. Useful for finding gas stations, restaurants, or scenic stops. Use originOffset (hours) to bias results toward a specific point in the trip.",
    parameters: AgentToolSchemas.searchAlongRoute as any,
    parallelSafe: true,
  },
  {
    name: 'getRouteWeather',
    description:
      'Get weather conditions along a compiled route for the planned departure time. Returns temperature, wind speed, rain probability, and fog by segment, plus a human-readable summary. Call after successful compileSketch to warn riders about adverse conditions.',
    parameters: AgentToolSchemas.getRouteWeather as any,
    parallelSafe: true,
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
      case 'lookupRoad':
        result = await runLookupRoad(ctx, validated)
        break
      case 'getCurvature':
        result = await runGetCurvature(ctx, validated)
        break
      case 'checkSurface':
        result = await runCheckSurface(ctx, validated)
        break
      case 'getElevation':
        result = await runGetElevation(ctx, validated)
        break
      case 'searchAlongRoute':
        result = await runSearchAlongRoute(ctx, validated)
        break
      case 'getRouteWeather':
        result = await runGetRouteWeather(ctx, validated)
        break
      case 'getUserFavorites':
        result = await runGetUserFavorites(ctx, validated)
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
  if (AI_PROVIDER === 'anthropic' && !ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  } else if (AI_PROVIDER === 'google' && !GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured')
  } else if (AI_PROVIDER === 'openai' && !OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  // getModel is typed against the known model map; cast via `as any`
  // since provider/model are runtime strings that may be overridden via env var.
  const model = getModel(AI_PROVIDER as any, AI_MODEL as any)

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
