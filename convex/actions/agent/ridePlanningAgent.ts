'use node'

import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { v } from 'convex/values'

import { OPENAI_API_KEY, AI_MODEL } from '../../lib/env'
import { parseNaturalLanguageInput } from './tools/parseNaturalLanguageInput'
import { planRideOrchestrator } from './lib/planRideOrchestrator'
import { buildOptionsFromResults } from './planRide'
import { FREE_TIER_MONTHLY_LIMIT } from '../../../models/plan-usage'
import { ERROR_CODES } from '../../errors'
import type { Id } from '../../_generated/dataModel'
import type { ActionCtx } from '../../_generated/server'
import { internal } from '../../_generated/api'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Tool Implementations
// -----------------------------------------------------------------------------

/**
 * planRoute tool - Plan a new route based on natural language input
 * Checks rate limits, parses input, and calls the orchestrator
 */
export async function planRoute(
  ctx: AgentContext,
  input: { request: string; currentLocation: { lat: number; lng: number } }
): Promise<ToolResult> {
  try {
    // Check rate limit using internal query
    const usage = await ctx.runQuery(internal.db.planUsage.checkUsageInternal, {
      clerkUserId: ctx.clerkUserId,
    })

    if (!usage.allowed) {
      return {
        type: 'chat',
        message: `You've reached your monthly limit of ${FREE_TIER_MONTHLY_LIMIT} route plans. Upgrade to Premium for unlimited plans!`,
      }
    }

    // Parse natural language input
    const parseResult = await parseNaturalLanguageInput({
      text: input.request,
      currentLocation: input.currentLocation,
      departureTime: Date.now() + 3_600_000, // 1 hour from now
      previousMessages: ctx.conversationHistory,
    })

    if (parseResult.confidence === 'low' && parseResult.warnings.length > 0) {
      return {
        type: 'chat',
        message: `I'm having trouble understanding your request. ${parseResult.warnings[0]}`,
      }
    }

    // Call the deterministic orchestrator directly
    const results = await planRideOrchestrator({
      planInput: parseResult.planInput,
      departureTimeMs: parseResult.planInput.departureTime,
    })
    const result = buildOptionsFromResults(results, crypto.randomUUID())

    // Increment usage (deterministic action)
    await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, {
      clerkUserId: ctx.clerkUserId,
    })

    return {
      type: 'routes',
      data: result,
    }
  } catch (error) {
    console.error('[planRoute] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to plan your route'

    if (message.includes(ERROR_CODES.RATE_LIMIT_EXCEEDED)) {
      return {
        type: 'chat',
        message: `You've reached your monthly limit of ${FREE_TIER_MONTHLY_LIMIT} route plans.`,
      }
    }

    return {
      type: 'error',
      message: "I couldn't plan your route right now. Please try again.",
    }
  }
}

/**
 * refineRoute tool - Refine an existing route with new preferences
 */
export async function refineRoute(
  ctx: AgentContext,
  input: { refinement: string }
): Promise<ToolResult> {
  try {
    // Check if there's a previous route to refine
    const lastSystemMessage = ctx.conversationHistory
      .filter((m) => m.role === 'system')
      .pop()

    if (!lastSystemMessage) {
      return {
        type: 'chat',
        message: "I don't have a route to refine yet. Let's plan one first!",
      }
    }

    // Parse the refinement request
    const parseResult = await parseNaturalLanguageInput({
      text: input.refinement,
      currentLocation: ctx.currentLocation || { lat: 37.7749, lng: -122.4194 },
      departureTime: Date.now() + 3_600_000,
      previousMessages: ctx.conversationHistory,
    })

    // Check rate limit
    const usage = await ctx.runQuery(internal.db.planUsage.checkUsageInternal, {
      clerkUserId: ctx.clerkUserId,
    })

    if (!usage.allowed) {
      return {
        type: 'chat',
        message: `You've reached your monthly limit of ${FREE_TIER_MONTHLY_LIMIT} route plans.`,
      }
    }

    // Call orchestrator with updated preferences directly
    const results = await planRideOrchestrator({
      planInput: parseResult.planInput,
      departureTimeMs: parseResult.planInput.departureTime,
    })
    const result = buildOptionsFromResults(results, crypto.randomUUID())

    // Increment usage
    await ctx.runMutation(internal.db.planUsage.incrementUsageInternal, {
      clerkUserId: ctx.clerkUserId,
    })

    return {
      type: 'routes',
      data: result,
    }
  } catch (error) {
    console.error('[refineRoute] Error:', error)
    return {
      type: 'error',
      message: "I couldn't refine your route. Could you try rephrasing that?",
    }
  }
}

/**
 * fetchWeather tool - Get weather information for route locations
 */
export async function fetchWeather(
  ctx: AgentContext,
  input: { location?: string }
): Promise<ToolResult> {
  try {
    // For now, return a placeholder weather response
    // This would be expanded in a future story to integrate with a weather API
    return {
      type: 'weather',
      data: {
        summary: 'Weather information will be available soon.',
        temperature: '--',
        conditions: 'unknown',
      },
    }
  } catch (error) {
    console.error('[fetchWeather] Error:', error)
    return {
      type: 'error',
      message: "I couldn't fetch the weather right now.",
    }
  }
}

/**
 * saveRoute tool - Save the current route to favorites
 */
export async function saveRoute(
  ctx: AgentContext,
  input: { routeIndex?: number; name?: string }
): Promise<ToolResult> {
  try {
    // Find the most recent route plan in the conversation
    const lastSystemMessage = ctx.conversationHistory
      .filter((m) => m.role === 'system')
      .pop()

    if (!lastSystemMessage) {
      return {
        type: 'chat',
        message: "I don't see a route to save yet. Let's plan one first!",
      }
    }

    // This would integrate with saved routes in a future story
    // For now, return a conversational response
    const routeName = input.name || 'Your planned route'
    return {
      type: 'confirmation',
      message: `I've noted that you want to save "${routeName}". Saving routes will be available soon!`,
    }
  } catch (error) {
    console.error('[saveRoute] Error:', error)
    return {
      type: 'error',
      message: "I couldn't save your route right now.",
    }
  }
}

/**
 * searchFavorites tool - Search saved routes by query
 */
export async function searchFavorites(
  ctx: AgentContext,
  input: { query: string }
): Promise<ToolResult> {
  try {
    // This would integrate with saved routes search in a future story
    // For now, return a placeholder response
    return {
      type: 'chat',
      message: `Searching your saved routes for "${input.query}" — this feature will be available soon!`,
    }
  } catch (error) {
    console.error('[searchFavorites] Error:', error)
    return {
      type: 'error',
      message: "I couldn't search your routes right now.",
    }
  }
}

// -----------------------------------------------------------------------------
// Attachment Extraction Helper (testable)
// -----------------------------------------------------------------------------

/**
 * Extract route plan IDs from tool results
 * This is a pure function that can be tested independently
 */
export function extractRouteAttachments(
  toolResults: Array<{ toolName: string; result: string }>
): Array<{ type: string; routePlanId?: string }> {
  const attachments: Array<{ type: string; routePlanId?: string }> = []

  for (const toolResult of toolResults) {
    if (toolResult.toolName === 'planRoute' || toolResult.toolName === 'refineRoute') {
      try {
        const parsedResult = JSON.parse(toolResult.result)
        if (parsedResult.type === 'routes' && parsedResult.data.planId) {
          attachments.push({
            type: 'route',
            routePlanId: parsedResult.data.planId,
          })
        }
      } catch (error) {
        console.error('[extractRouteAttachments] Error parsing tool result:', error)
      }
    }
  }

  return attachments
}

// -----------------------------------------------------------------------------
// Agent Execution
// -----------------------------------------------------------------------------

/**
 * System prompt for the ride planning agent
 */
const SYSTEM_PROMPT = `You are a motorcycle ride planning assistant. Be concise — 1-2 sentences per response. Use 2nd person ("your ride", "you'll see").

When planning routes:
- Present 2-3 options with brief descriptions
- Highlight key features (scenic views, road types, estimated time)
- Ask clarifying questions if the request is unclear

When refining routes:
- Acknowledge what changed ("Updated to avoid highways")
- Present new options briefly

For errors:
- Be helpful and conversational
- Never expose technical details or tool names
- Suggest what the user can try next

Remember: You're helping plan motorcycle adventures. Keep it friendly and efficient.`

/**
 * Execute the ride planning agent with tools
 * This is the probabilistic part — the agent decides which tools to call
 */
export async function executeRidePlanningAgent(
  ctx: AgentContext,
  userMessage: string
): Promise<{ response: string; attachments?: Array<{ type: string; routePlanId?: string }> }> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  // Track tool results for attachments
  const toolResultsTracker: Array<{ toolName: string; result: string }> = []

  const tools = {
    planRoute: {
      description: 'Plan a new motorcycle route based on natural language input',
      inputSchema: z.object({
        request: z.string().describe('The natural language ride request'),
        currentLocation: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .describe('Current GPS coordinates'),
      }),
      execute: async (args: { request: string; currentLocation: { lat: number; lng: number } }) => {
        const result = await planRoute(ctx, args)
        const resultString = JSON.stringify(result)
        // Track the result for attachments
        toolResultsTracker.push({ toolName: 'planRoute', result: resultString })
        if (result.type === 'routes') {
          return JSON.stringify({
            type: 'routes',
            planId: result.data.planId,
            options: result.data.options.map((opt: any) => ({
              label: opt.label,
              rationale: opt.rationale,
              distance: `${Math.round(opt.stats.distanceMeters / 1000)}km`,
              duration: `${Math.round(opt.stats.durationSeconds / 60)}min`,
            })),
          })
        } else if (result.type === 'chat') {
          return JSON.stringify({ type: 'chat', message: result.message })
        } else if (result.type === 'error') {
          return JSON.stringify({ type: 'error', message: result.message })
        }
        return JSON.stringify({ type: 'unknown' })
      },
    },
    refineRoute: {
      description: 'Refine the current route with new preferences or constraints',
      inputSchema: z.object({
        refinement: z.string().describe('The refinement request (e.g., "avoid highways", "make it shorter")'),
      }),
      execute: async (args: { refinement: string }) => {
        const result = await refineRoute(ctx, args)
        const resultString = JSON.stringify(result)
        // Track the result for attachments
        toolResultsTracker.push({ toolName: 'refineRoute', result: resultString })
        if (result.type === 'routes') {
          return JSON.stringify({
            type: 'routes',
            planId: result.data.planId,
            options: result.data.options.map((opt: any) => ({
              label: opt.label,
              rationale: opt.rationale,
              distance: `${Math.round(opt.stats.distanceMeters / 1000)}km`,
              duration: `${Math.round(opt.stats.durationSeconds / 60)}min`,
            })),
          })
        } else if (result.type === 'chat') {
          return JSON.stringify({ type: 'chat', message: result.message })
        } else if (result.type === 'error') {
          return JSON.stringify({ type: 'error', message: result.message })
        }
        return JSON.stringify({ type: 'unknown' })
      },
    },
    fetchWeather: {
      description: 'Get weather information for the planned route',
      inputSchema: z.object({
        location: z.string().optional().describe('Optional location to check weather for'),
      }),
      execute: async (args: { location?: string }) => {
        const result = await fetchWeather(ctx, args)
        return JSON.stringify(result)
      },
    },
    saveRoute: {
      description: 'Save the current route to favorites',
      inputSchema: z.object({
        routeIndex: z.number().optional().describe('Index of the route to save (0-based)'),
        name: z.string().optional().describe('Custom name for the saved route'),
      }),
      execute: async (args: { routeIndex?: number; name?: string }) => {
        const result = await saveRoute(ctx, args)
        return JSON.stringify(result)
      },
    },
    searchFavorites: {
      description: 'Search saved routes by query',
      inputSchema: z.object({
        query: z.string().describe('Search query for saved routes'),
      }),
      execute: async (args: { query: string }) => {
        const result = await searchFavorites(ctx, args)
        return JSON.stringify(result)
      },
    },
  } as const

  // Build conversation history for the agent
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...ctx.conversationHistory.map((m) => ({
      role: (m.role === 'rider' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  // Execute the agent with timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(ERROR_CODES.AGENT_TIMEOUT)), AGENT_TIMEOUT_MS)
  })

  const result = await Promise.race([
    generateText({
      model: openai(AI_MODEL),
      messages,
      tools,
      toolChoice: 'auto',
      temperature: 0.7,
      stopWhen: stepCountIs(10),
    }),
    timeoutPromise,
  ])

  // Build response and extract attachments from tracked tool results
  let responseText = result.text
  const attachments = extractRouteAttachments(toolResultsTracker)

  // If agent didn't generate text but we have routes, add a default message
  if (!responseText && attachments.length > 0) {
    responseText = "Here are your route options!"
  }

  return {
    response: responseText,
    attachments: attachments.length > 0 ? attachments : undefined,
  }
}
