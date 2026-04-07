'use node'

import {
  getModel,
  validateToolCall,
  type Tool,
  type ToolCall,
} from '@mariozechner/pi-ai'
import { AgentToolSchemas } from '../lib/piTools'
import { searchNearby } from '../tools/searchNearby'
import { webSearch } from '../tools/webSearch'
import { runGeocode } from './routingAgent'
import { runAgent } from '../runAgent'
import type { AgentContext, ExecuteContext } from '../ridePlanningAgent'
import type { SearchAgentResult, SubAgentConfig } from './types'

// -----------------------------------------------------------------------------
// Tool definitions (all 3 search tools — all parallel-safe)
// -----------------------------------------------------------------------------

type ToolWithParallelSafe = Tool & { parallelSafe: boolean }

const searchTools: ToolWithParallelSafe[] = [
  {
    name: 'searchNearby',
    description:
      'Find nearby places of interest (gas stations, restaurants, viewpoints, etc.) around a lat/lng center point. Use when the rider asks about nearby POIs.',
    parameters: AgentToolSchemas.searchNearby as any,
    parallelSafe: true,
  },
  {
    name: 'webSearch',
    description:
      'Search the web for current, real-time information — road closures, construction, speed limits, current events.',
    parameters: AgentToolSchemas.webSearch as any,
    parallelSafe: true,
  },
  {
    name: 'geocode',
    description:
      'Resolve a place name or address to GPS coordinates. Use when the rider references a place by name and you need coordinates for a subsequent searchNearby.',
    parameters: AgentToolSchemas.geocode as any,
    parallelSafe: true,
  },
]

const searchToolNames = new Set(searchTools.filter(t => t.parallelSafe).map(t => t.name))

// -----------------------------------------------------------------------------
// Search Prompt
// -----------------------------------------------------------------------------

export function buildSearchPrompt(ctx: AgentContext): string {
  const locationLine = ctx.currentLocation
    ? `The rider's current location is lat=${ctx.currentLocation.lat}, lng=${ctx.currentLocation.lng}.`
    : `The rider's current location is unknown — ask if you need it for a nearby search.`

  return `You are a helpful motorcycle assistant that answers questions about places, current road conditions, and general motorcycle knowledge.

${locationLine}

## Tools and When to Use Them

- **searchNearby**: Use for place/POI questions ("gas station nearby?", "any viewpoints around here?", "restaurant close to me?"). Use the rider's current location as the default center.
- **webSearch**: Use for current information the LLM can't know from training data ("road closures on Highway 1", "current speed limit on PCH", "construction on I-5 this week").
- **geocode**: Use when the rider names a place and you need coordinates before calling searchNearby (e.g. "gas stations near Carmel" → geocode("Carmel, CA") → searchNearby).

## When NOT to Use Tools

For general knowledge questions ("how many gallons does a typical motorcycle tank hold?", "what does a blinking ABS light mean?"), answer directly from your knowledge. Do not call a tool unless you genuinely need current or location-specific data.

## Response Style

Be concise — 1-2 sentences. Speak directly to the rider ("There's a Shell station 0.8 miles north of you"). Present tool results conversationally, not as raw data.`
}

// -----------------------------------------------------------------------------
// Tool Handlers
// -----------------------------------------------------------------------------

async function runSearchNearby(
  _ctx: AgentContext,
  args: { query: string; location: { lat: number; lng: number }; radiusMeters?: number | null }
): Promise<unknown> {
  return searchNearby(args)
}

async function runWebSearch(
  _ctx: AgentContext,
  args: { query: string; maxResults?: number | null }
): Promise<unknown> {
  return webSearch(args)
}

// -----------------------------------------------------------------------------
// Tool Dispatcher
// -----------------------------------------------------------------------------

export async function executeSearchTool(
  ctx: AgentContext,
  call: ToolCall
): Promise<unknown> {
  const validated = validateToolCall(searchTools, call)

  switch (call.name) {
    case 'searchNearby':
      return runSearchNearby(ctx, validated as any)
    case 'webSearch':
      return runWebSearch(ctx, validated as any)
    case 'geocode':
      return runGeocode(ctx, validated as { query: string })
    default:
      return { type: 'error', message: `Unknown search tool: ${call.name}` }
  }
}

// -----------------------------------------------------------------------------
// Main Entry Point
// -----------------------------------------------------------------------------

/**
 * Execute the search sub-agent.
 *
 * Answers the rider's question using searchNearby, webSearch, or geocode as
 * needed — or responds directly from general motorcycle knowledge.
 *
 * - No conversation history: only userMessage is provided to the agent.
 * - Does NOT forward card callbacks (search results don't emit cards).
 * - Forwards onAgentTurn and onToolResultPiMessage for message persistence.
 */
export async function executeSearchAgent(
  config: SubAgentConfig
): Promise<SearchAgentResult> {
  const { ctx, executeCtx, budgetTracker, userMessage } = config

  const model = getModel('anthropic', 'claude-haiku-4-5-20251001')

  const systemPrompt = buildSearchPrompt(ctx)

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
    tools: searchTools,
  }

  // Forward only onAgentTurn and onToolResultPiMessage — no card callbacks
  const searchCallbacks: ExecuteContext | undefined = executeCtx
    ? {
        onAgentTurn: executeCtx.onAgentTurn,
        onToolResultPiMessage: executeCtx.onToolResultPiMessage,
      }
    : undefined

  try {
    const result = await runAgent({
      model,
      context: agentContext,
      executor: (call) => executeSearchTool(ctx, call),
      callbacks: searchCallbacks,
      maxSteps: 20, // uncapped for now — levelsetting resource needs
      timeoutMs: 300_000, // 5 min — uncapped for levelsetting
      budgetTracker,
      parallelSafeTools: searchToolNames,
    })

    if (result.toolResults.length > 0) {
      return {
        status: 'answered',
        data: result.toolResults,
        summary: result.response,
      }
    }

    if (result.response) {
      return {
        status: 'answered',
        data: null,
        summary: result.response,
      }
    }

    return {
      status: 'not_applicable',
      reason: 'The search agent could not answer the question.',
    }
  } catch (err) {
    return {
      status: 'not_applicable',
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}
