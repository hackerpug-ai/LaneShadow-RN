'use node'

import {
  getModel,
  validateToolCall,
  type Tool,
  type ToolCall,
} from '@mariozechner/pi-ai'
import { AgentToolSchemas } from '../lib/piTools'
import { lookupRoad } from '../tools/lookupRoad'
import { getCurvature } from '../tools/getCurvature'
import { classifySurface } from '../tools/checkSurface'
import { getElevation } from '../tools/getElevation'
import { searchAlongRoute } from '../tools/searchAlongRoute'
import { getRouteWeather } from '../tools/getRouteWeather'
import { getUserFavorites } from '../tools/getUserFavorites'
import type { UserFavorite } from '../tools/getUserFavorites'
import { buildInSessionRouteBlock } from '../sessionContext'
import { runAgent } from '../runAgent'
import type { AgentContext, ExecuteContext } from '../ridePlanningAgent'
import type { EnrichmentAgentResult, SubAgentConfig } from './types'

// -----------------------------------------------------------------------------
// Tool definitions (all 7 enrichment tools — all parallel-safe)
// -----------------------------------------------------------------------------

type ToolWithParallelSafe = Tool & { parallelSafe: boolean }

const enrichmentTools: ToolWithParallelSafe[] = [
  {
    name: 'lookupRoad',
    description:
      'Verify a road exists in OpenStreetMap for a given bounding box. Returns matched road names, highway class, surface type, and simplified geometry. Use to verify road details before answering questions about surface or twistiness.',
    parameters: AgentToolSchemas.lookupRoad as any,
    parallelSafe: true,
  },
  {
    name: 'getCurvature',
    description:
      "Score a road's twistiness using the roadcurvature.com circumcircle-radius algorithm. Higher scores mean more curves: 1000+ = very twisty, 600–999 = twisty, 300–599 = moderate, 100–299 = mild, <100 = straight. Use geometry from lookupRoad results. Use to answer 'is it twisty?' questions.",
    parameters: AgentToolSchemas.getCurvature as any,
    parallelSafe: true,
  },
  {
    name: 'checkSurface',
    description:
      "Classify a road's surface as paved, unpaved, or unknown using OSM surface and highway tags. Use to answer questions about road surface quality. Pass surface and highway values from lookupRoad results.",
    parameters: AgentToolSchemas.checkSurface as any,
    parallelSafe: true,
  },
  {
    name: 'getElevation',
    description:
      'Get the elevation profile for a route polyline: total gain/loss in feet, max elevation, max grade percentage, and steep segments. Use to describe climbs, mountain passes, and challenging grades.',
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
      'Get weather conditions along a compiled route for the planned departure time. Returns temperature, wind speed, rain probability, and fog by segment, plus a human-readable summary. Use to answer weather questions.',
    parameters: AgentToolSchemas.getRouteWeather as any,
    parallelSafe: true,
  },
  {
    name: 'getUserFavorites',
    description:
      "Retrieve the rider's favorite roads within a geographic bounding box, sorted by rating and ride count. Use to answer questions about saved or favorite roads in the area.",
    parameters: AgentToolSchemas.getUserFavorites as any,
    parallelSafe: true,
  },
]

const enrichmentToolNames = new Set(enrichmentTools.map(t => t.name))

// -----------------------------------------------------------------------------
// Tool handler functions (extracted from ridePlanningAgent.ts)
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Tool Executor Dispatch
// -----------------------------------------------------------------------------

export async function executeEnrichmentTool(
  ctx: AgentContext,
  call: ToolCall
): Promise<unknown> {
  const validated = validateToolCall(enrichmentTools, call)

  switch (call.name) {
    case 'lookupRoad':
      return runLookupRoad(ctx, validated)
    case 'getCurvature':
      return runGetCurvature(ctx, validated)
    case 'checkSurface':
      return runCheckSurface(ctx, validated)
    case 'getElevation':
      return runGetElevation(ctx, validated)
    case 'searchAlongRoute':
      return runSearchAlongRoute(ctx, validated)
    case 'getRouteWeather':
      return runGetRouteWeather(ctx, validated)
    case 'getUserFavorites':
      return runGetUserFavorites(ctx, validated)
    default:
      return { type: 'error', message: `Unknown enrichment tool: ${call.name}` }
  }
}

// -----------------------------------------------------------------------------
// Enrichment Prompt
// -----------------------------------------------------------------------------

/**
 * Build the Phase 2 enrichment system prompt.
 * Maps question types to the appropriate tools.
 * Does NOT include route authoring guidance.
 */
export function buildEnrichmentPrompt(ctx: AgentContext, routeBlock: string): string {
  return `You are a motorcycle route enrichment assistant. A route has already been planned and you answer specific questions about it.

${routeBlock}

## Your Job: Answer Route Questions with Data

Use the right tool for each question type:

- **"Is it twisty?" / "How curvy?"** → lookupRoad (get geometry) then getCurvature (score twistiness)
- **"What's the surface like?" / "Is it paved?"** → lookupRoad (get surface tag) then checkSurface (classify)
- **"What's the elevation like?" / "Any big climbs?"** → getElevation (get profile and grades)
- **"Where can I get gas?" / "Any food stops?"** → searchAlongRoute (find places along route)
- **"What's the weather?" / "Will it rain?"** → getRouteWeather (conditions for departure time)
- **"Do I have any saved roads nearby?"** → getUserFavorites (check saved roads in area)

Be concise — 1-2 sentences. Answer with data from the tool results.`
}

// -----------------------------------------------------------------------------
// Enrichment Agent Entry Point
// -----------------------------------------------------------------------------

/**
 * Execute the enrichment sub-agent.
 *
 * Short-circuits with not_applicable if no route exists in this session.
 * Uses Haiku model — bounded task with minimal reasoning required.
 * Gets NO conversation history — only the userMessage from SubAgentConfig.
 */
export async function executeEnrichmentAgent(
  config: SubAgentConfig
): Promise<EnrichmentAgentResult> {
  const { ctx, executeCtx, budgetTracker, userMessage } = config

  // Short-circuit: no route to enrich
  const routeBlock = await buildInSessionRouteBlock(
    { runQuery: ctx.runQuery },
    ctx.planningSessionId
  )

  if (!routeBlock) {
    return {
      status: 'not_applicable',
      reason: 'No route has been planned in this session yet. Plan a route first, then ask questions about it.',
    }
  }

  const model = getModel('anthropic', 'claude-haiku-4-5-20251001')

  const systemPrompt = buildEnrichmentPrompt(ctx, routeBlock)

  // Sub-agent gets NO conversation history — only the current userMessage
  const agentContext = {
    systemPrompt,
    messages: [
      {
        role: 'user' as const,
        content: [{ type: 'text' as const, text: userMessage }],
        timestamp: Date.now(),
      },
    ],
    tools: enrichmentTools,
  }

  // Forward only onAgentTurn and onToolResultPiMessage — no card callbacks
  const enrichmentCallbacks: ExecuteContext | undefined = executeCtx
    ? {
        onAgentTurn: executeCtx.onAgentTurn,
        onToolResultPiMessage: executeCtx.onToolResultPiMessage,
      }
    : undefined

  try {
    const result = await runAgent({
      model,
      context: agentContext,
      executor: (call) => executeEnrichmentTool(ctx, call),
      callbacks: enrichmentCallbacks,
      maxSteps: 20, // uncapped for now — levelsetting resource needs
      timeoutMs: 300_000, // 5 min — uncapped for levelsetting
      budgetTracker,
      parallelSafeTools: enrichmentToolNames,
    })

    // Build EnrichmentAgentResult from runAgent output
    if (result.toolResults.length > 0) {
      return {
        status: 'answered',
        data: result.toolResults,
        summary: result.response,
      }
    }

    // Agent responded without calling any tools — still considered answered
    if (result.response) {
      return {
        status: 'answered',
        data: null,
        summary: result.response,
      }
    }

    return {
      status: 'not_applicable',
      reason: 'The enrichment agent could not answer the question.',
    }
  } catch (err) {
    return {
      status: 'not_applicable',
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}
