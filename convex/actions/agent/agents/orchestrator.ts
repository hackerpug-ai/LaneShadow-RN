'use node'

import {
  type Context,
  type Message,
  type Tool,
  type ToolCall,
  validateToolCall,
} from '@mariozechner/pi-ai'
import type { Id } from '../../../_generated/dataModel'
import { BudgetTracker } from '../budgetTracker'
import { getAgentModel } from '../lib/models'
import { summarizeToolResult } from '../lib/summarizeToolResult'
import type { PlaceResult } from '../providers/placesProvider'
import type { AgentContext, ExecuteContext } from '../ridePlanningAgent'
import { runAgent } from '../runAgent'
import { buildInSessionRouteBlock } from '../sessionContext'
import { executeDiscoverCuratedRoutes } from '../tools/discoverCuratedRoutes'
import { executeEnrichmentAgent } from './enrichmentAgent'
import { executeRoutingAgent, getPendingSketchState } from './routingAgent'
import { executeSearchAgent } from './searchAgent'
import type { RoutingAgentResult, SearchAgentResult } from './types'

// -----------------------------------------------------------------------------
// Result type
// -----------------------------------------------------------------------------

export type OrchestratorAttachment =
  | { type: 'route_options'; routePlanId: Id<'route_plans'> }
  | {
      type: 'location_search'
      searchQuery: string
      results: {
        id: string
        name: string
        address: string
        types?: string[]
        location: { lat: number; lng: number }
        detourMinutes?: number
        distanceMeters?: number
      }[]
    }

export type OrchestratorResult = {
  response: string
  attachments?: OrchestratorAttachment[]
  metrics?: import('../runAgent').RunAgentMetrics
}

// -----------------------------------------------------------------------------
// Tool availability logic (deterministic — pure function, fully testable)
// -----------------------------------------------------------------------------

/**
 * Determine which orchestrator tools are available given the session state.
 *
 * | State                            | Available tools                              |
 * |----------------------------------|----------------------------------------------|
 * | No routes, no pending sketch     | routing_agent, search_agent                  |
 * | Has routes, no pending sketch    | routing_agent, search_agent, enrichment_agent|
 * | Has pending sketch with failures | routing_agent only                           |
 */
export function determineAvailableTools(hasRoutes: boolean, hasPendingSketch: boolean): Tool[] {
  if (hasPendingSketch) {
    return [routingAgentTool]
  }
  if (hasRoutes) {
    return [routingAgentTool, searchAgentTool, enrichmentAgentTool, discoveryAgentTool]
  }
  return [routingAgentTool, searchAgentTool, discoveryAgentTool]
}

// -----------------------------------------------------------------------------
// Sub-agent tool definitions (orchestrator sees 3 "meta-tools")
// -----------------------------------------------------------------------------

const subAgentQuerySchema = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: "The rider's request, verbatim or closely paraphrased.",
    },
  },
  required: ['query'],
} as any

const routingAgentTool: Tool = {
  name: 'routing_agent',
  description:
    'Specialist for planning motorcycle routes. Call when the rider asks to go somewhere, wants a route, or needs navigation. Handles geocoding, route sketching, and compilation.',
  parameters: subAgentQuerySchema,
}

const searchAgentTool: Tool = {
  name: 'search_agent',
  description:
    'Specialist for nearby places, web search, and general motorcycle knowledge. Call for nearby POI questions ("gas station?"), real-time info ("road closures?"), or general questions the LLM can\'t answer from training data.',
  parameters: subAgentQuerySchema,
}

const enrichmentAgentTool: Tool = {
  name: 'enrichment_agent',
  description:
    'Specialist for analyzing existing routes: road surface, curvature, elevation, weather, and places along the route. Only available when a route exists in the session.',
  parameters: subAgentQuerySchema,
}

const discoveryAgentTool: Tool = {
  name: 'discovery_agent',
  description:
    'Specialist for discovering curated motorcycle routes based on rider preferences and location. Call when the rider wants to explore routes matching specific archetypes or in certain areas.',
  parameters: subAgentQuerySchema,
}

// -----------------------------------------------------------------------------
// Orchestrator prompt (~15 lines)
// -----------------------------------------------------------------------------

/**
 * Build the orchestrator system prompt.
 * Injects current location, in-session route block, and dynamic tool list.
 */
export function buildOrchestratorPrompt(ctx: AgentContext, availableTools: string[]): string {
  const locBlock = ctx.currentLocation
    ? `The rider's current location is lat=${ctx.currentLocation.lat}, lng=${ctx.currentLocation.lng}. This is always available — destination-only requests like "day trip to Santa Cruz" are COMPLETE route requests (current location is the origin). Route them to routing_agent immediately; never ask the rider where they're starting from.`
    : `The rider's current location is unknown.`

  const toolLines = availableTools
    .map((name) => {
      if (name === 'routing_agent') return '- routing_agent: plan or refine a route'
      if (name === 'search_agent')
        return '- search_agent: nearby places, web search, general questions'
      if (name === 'enrichment_agent')
        return '- enrichment_agent: analyze the existing route (surface, weather, elevation, etc.)'
      if (name === 'discovery_agent')
        return '- discovery_agent: discover curated routes by archetype/location'
      return `- ${name}`
    })
    .join('\n')

  return `You are a motorcycle ride planning assistant. Your job is to understand rider intent and pick the right specialist.

${locBlock}

## Available specialists
${toolLines}

## How to use them
- Route requests ("take me somewhere", "plan a ride to X") → routing_agent
- Nearby places, road closures, general knowledge → search_agent
- Questions about an existing route (twisty? surface? weather?) → enrichment_agent
- Route discovery ("twisties near Asheville", "scenic routes in Oregon") → discovery_agent
- If the rider asks for multiple things, handle them one at a time — observe results before deciding the next step
- Greetings, thanks, and off-topic messages → respond directly, no specialist needed

## IMPORTANT: Always use your tools
When the rider asks for a route, search, question about a route, or route discovery — you MUST call the appropriate specialist tool. Do NOT respond with text instead of calling a tool. Your text response comes AFTER the tool returns results.

## Thinking style
When reasoning (in extended thinking / chain-of-thought), use plain rider-friendly language — your thinking is displayed as a planning indicator. Say "scenic coastal route via Big Sur" not "calling routing_agent with geocoded coordinates".

## Presentation rules
Respond in 1-2 sentences, 2nd person. Never expose tool names or technical details to the rider.`
}

// -----------------------------------------------------------------------------
// Orchestrator tool executor
// -----------------------------------------------------------------------------

async function executeOrchestratorTool(
  ctx: AgentContext,
  call: ToolCall,
  executeCtx: ExecuteContext | undefined,
): Promise<unknown> {
  const validated = validateToolCall(
    [routingAgentTool, searchAgentTool, enrichmentAgentTool, discoveryAgentTool],
    call,
  )
  const query = (validated as { query: string }).query

  // Each sub-agent gets its own BudgetTracker slice (log mode — shared parent tracks overall)
  const subBudget = new BudgetTracker(0.25, { mode: 'log' })

  /**
   * Build a sub-agent ExecuteContext that wraps tool callbacks to intercept
   * tool lifecycle events and emit planning events via the parent executeCtx's
   * onSubToolPending / onSubToolComplete callbacks.
   */
  function buildSubAgentCtx(agentName: string, baseCtx: Partial<ExecuteContext>): ExecuteContext {
    if (!executeCtx) return baseCtx as ExecuteContext

    // Per-tool start time map for duration tracking
    const toolStartTimes = new Map<string, number>()

    return {
      ...baseCtx,
      // Sub-agent thinking is NOT forwarded — orchestrator-only thinking
      // streams to the planning row (avoids technical noise + dedup)
      onToolStart: async (toolName: string, args: unknown) => {
        toolStartTimes.set(toolName, Date.now())
        // planRoute now emits its own deterministic pipeline progress.
        if (toolName !== 'planRoute') {
          await executeCtx.onSubToolPending?.(toolName, agentName)
        }
        // Forward to base callback if present
        return baseCtx.onToolStart?.(toolName, args)
      },
      onToolFinish: async (toolCallId: string, toolName: string, messageId, result: unknown) => {
        const t0 = toolStartTimes.get(toolName) ?? Date.now()
        const durationMs = Date.now() - t0
        toolStartTimes.delete(toolName)
        const summary = summarizeToolResult(toolName, result)
        if (toolName !== 'planRoute') {
          await executeCtx.onSubToolComplete?.(toolName, agentName, summary, durationMs)
        }
        // Forward to base callback if present
        return baseCtx.onToolFinish?.(toolCallId, toolName, messageId, result)
      },
    }
  }

  const agentStart = Date.now()

  switch (call.name) {
    case 'routing_agent': {
      // Routing agent needs card callbacks (onToolStart/onToolFinish) forwarded
      const subCtx = buildSubAgentCtx('routing', {
        onToolStart: executeCtx?.onToolStart,
        onToolFinish: executeCtx?.onToolFinish,
        onAgentTurn: executeCtx?.onAgentTurn,
        onToolResultPiMessage: executeCtx?.onToolResultPiMessage,
        onSubToolPending: executeCtx?.onSubToolPending,
        onSubToolComplete: executeCtx?.onSubToolComplete,
      })
      const result = await executeRoutingAgent({
        ctx,
        executeCtx: executeCtx ? subCtx : undefined,
        budgetTracker: subBudget,
        userMessage: query,
      })
      const summary = summarizeToolResult('routing_agent', result)
      await executeCtx?.onSubAgentComplete?.('routing', summary, Date.now() - agentStart)
      return result
    }
    case 'search_agent': {
      const subCtx = buildSubAgentCtx('search', {
        onAgentTurn: executeCtx?.onAgentTurn,
        onToolResultPiMessage: executeCtx?.onToolResultPiMessage,
      })
      const result = await executeSearchAgent({
        ctx,
        executeCtx: executeCtx ? subCtx : undefined,
        budgetTracker: subBudget,
        userMessage: query,
      })
      const summary = summarizeToolResult('search_agent', result)
      await executeCtx?.onSubAgentComplete?.('search', summary, Date.now() - agentStart)
      return result
    }
    case 'enrichment_agent': {
      const subCtx = buildSubAgentCtx('enrichment', {
        onAgentTurn: executeCtx?.onAgentTurn,
        onToolResultPiMessage: executeCtx?.onToolResultPiMessage,
      })
      const result = await executeEnrichmentAgent({
        ctx,
        executeCtx: executeCtx ? subCtx : undefined,
        budgetTracker: subBudget,
        userMessage: query,
      })
      const summary = summarizeToolResult('enrichment_agent', result)
      await executeCtx?.onSubAgentComplete?.('enrichment', summary, Date.now() - agentStart)
      return result
    }
    case 'discovery_agent': {
      const subCtx = buildSubAgentCtx('discovery', {
        onAgentTurn: executeCtx?.onAgentTurn,
        onToolResultPiMessage: executeCtx?.onToolResultPiMessage,
      })

      // Extract intent from the natural language query
      const q = query.toLowerCase()
      const archetypes: string[] = []
      if (q.includes('twisties') || q.includes('twisty')) archetypes.push('twisties')
      if (q.includes('scenic')) archetypes.push('scenic')
      if (q.includes('technical')) archetypes.push('technical')
      if (q.includes('cruising')) archetypes.push('cruising')
      if (q.includes('adventure')) archetypes.push('adventure')

      // Extract state if mentioned (basic matching)
      const stateMatch = q.match(/\b(near|in)\s+([a-z\s]+?)(?:\b|$)/)
      const intent: Record<string, unknown> = {
        archetypes: archetypes.length > 0 ? archetypes : undefined,
      }
      if (stateMatch) {
        intent.state = stateMatch[2].trim().charAt(0).toUpperCase() + stateMatch[2].trim().slice(1)
      }

      const result = await executeDiscoverCuratedRoutes(ctx, {
        type: 'toolCall',
        id: 'discovery-' + Date.now(),
        name: 'discoverCuratedRoutes',
        arguments: { intent },
      } as any)

      const summary = summarizeToolResult('discovery_agent', result)
      await executeCtx?.onSubAgentComplete?.('discovery', summary, Date.now() - agentStart)
      return result
    }
    default:
      return { type: 'error', message: `Unknown orchestrator tool: ${call.name}` }
  }
}

// -----------------------------------------------------------------------------
// Attachment extraction from orchestrator tool results
// -----------------------------------------------------------------------------

/**
 * Extract PlaceResult[] from the search agent's raw toolResults data.
 * The data is `{ toolName: string; result: unknown }[]` where searchNearby
 * results are PlaceResult[] arrays.
 */
function extractPlaceResults(data: unknown): PlaceResult[] {
  if (!Array.isArray(data)) return []
  const places: PlaceResult[] = []

  for (const tr of data) {
    if (
      tr &&
      typeof tr === 'object' &&
      'toolName' in tr &&
      (tr.toolName === 'searchNearby' || tr.toolName === 'searchAlongRoute') &&
      'result' in tr &&
      Array.isArray(tr.result)
    ) {
      for (const place of tr.result) {
        if (place && typeof place === 'object' && 'name' in place) {
          places.push(place as PlaceResult)
        }
      }
    }
  }

  return places
}

function extractOrchestratorAttachments(
  toolResults: { toolName: string; result: unknown }[],
): OrchestratorAttachment[] {
  const attachments: OrchestratorAttachment[] = []

  for (const tr of toolResults) {
    if (tr.toolName === 'routing_agent') {
      const result = tr.result as RoutingAgentResult
      if (result?.status === 'route_ready' && result.routePlanId) {
        attachments.push({
          type: 'route_options',
          routePlanId: result.routePlanId,
        })
      }
    }

    if (tr.toolName === 'search_agent') {
      const result = tr.result as SearchAgentResult
      if (result?.status === 'answered' && result.data) {
        const placeResults = extractPlaceResults(result.data)
        // Only create attachment when we have places with coordinates
        const withLocation = placeResults.filter(
          (p) => p.location !== undefined && p.location !== null,
        )
        if (withLocation.length > 0) {
          attachments.push({
            type: 'location_search',
            searchQuery: '', // populated by the orchestrator caller if needed
            results: withLocation.map((p, i) => ({
              id: `search-${i}`,
              name: p.name,
              address: p.address,
              types: p.types,
              location: p.location!,
              detourMinutes: p.detourMinutes,
              distanceMeters: p.distanceMeters ?? p.distanceFromRouteMeters,
            })),
          })
        }
      }
    }
  }

  return attachments
}

// -----------------------------------------------------------------------------
// Main Entry Point
// -----------------------------------------------------------------------------

/**
 * Execute the orchestrator — a hybrid ReAct loop over 3 sub-agent tools.
 *
 * Deterministic pre-check gates which tools are available, then the LLM
 * reasons freely about which specialist(s) to call and in what order.
 */
export async function executeOrchestrator(
  ctx: AgentContext,
  userMessage: string,
  executeCtx?: ExecuteContext,
): Promise<OrchestratorResult> {
  // -------------------------------------------------------------------------
  // 1. DETERMINISTIC PRE-CHECK: query session state before entering the loop
  // -------------------------------------------------------------------------
  const routeBlock = await buildInSessionRouteBlock(
    { runQuery: ctx.runQuery },
    ctx.planningSessionId,
  )
  const hasRoutes = routeBlock.length > 0

  const pendingSketch = getPendingSketchState(ctx.planningSessionId)
  const hasPendingSketch = pendingSketch !== undefined

  const availableTools = determineAvailableTools(hasRoutes, hasPendingSketch)
  const availableToolNames = availableTools.map((t) => t.name)

  // -------------------------------------------------------------------------
  // 2. BUILD ORCHESTRATOR CONTEXT
  // -------------------------------------------------------------------------
  // High-reasoning model for orchestrator — intent classification and multi-agent coordination
  const model = getAgentModel('high')
  const systemPrompt = buildOrchestratorPrompt(ctx, availableToolNames)

  const context: Context = {
    systemPrompt,
    messages: [
      // Pass full conversation history so the orchestrator has multi-turn context
      ...ctx.piMessages,
      { role: 'user', content: userMessage, timestamp: Date.now() } as Message,
    ],
    tools: availableTools,
  }

  // -------------------------------------------------------------------------
  // 3. SHARED BUDGET TRACKER (log mode — orchestrator spans all sub-agents)
  // -------------------------------------------------------------------------
  const budgetTracker = new BudgetTracker(0.5, { mode: 'log' })

  // -------------------------------------------------------------------------
  // 4. REACT LOOP
  // -------------------------------------------------------------------------
  const result = await runAgent({
    model,
    context,
    executor: (call: ToolCall) => executeOrchestratorTool(ctx, call, executeCtx),
    callbacks: executeCtx
      ? {
          onTextDelta: executeCtx.onTextDelta,
          onThinkingDelta: async (delta: string) => {
            // Fan out: reasoning card + planning status line
            await executeCtx.onThinkingDelta?.(delta)
            await executeCtx.onSubThinkingDelta?.(delta)
          },
          onFinalAssistant: executeCtx.onFinalAssistant,
          onAgentTurn: executeCtx.onAgentTurn,
          onStepStart: executeCtx.onStepStart,
          onToolPending: executeCtx.onToolPending,
          onToolResultPiMessage: executeCtx.onToolResultPiMessage,
        }
      : undefined,
    maxSteps: 20, // uncapped for now — levelsetting resource needs
    timeoutMs: 300_000, // 5 min — uncapped for levelsetting
    budgetTracker,
    parallelSafeTools: new Set<string>(), // sub-agents are NOT parallel-safe
  })

  // -------------------------------------------------------------------------
  // 5. EXTRACT ATTACHMENTS AND RETURN
  // -------------------------------------------------------------------------
  const attachments = extractOrchestratorAttachments(result.toolResults)

  return {
    response: result.response || (attachments.length > 0 ? 'Here are your route options!' : ''),
    attachments: attachments.length > 0 ? attachments : undefined,
    metrics: result.metrics,
  }
}
