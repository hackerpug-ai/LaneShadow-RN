'use node'

import { randomUUID } from 'crypto'
import { v } from 'convex/values'
import { action } from '../../_generated/server'

import {
  boundsValidator,
  conditionsStatusValidator,
  planInputValidator,
  polylineGeometryValidator,
  routeLegValidator,
  windSummaryValidator,
} from '../../../models/saved-routes'
import type { PlannedRouteOptionsView } from '../../../types/routes'
import { requireIdentity, requireSession } from '../../guards'
import { internal } from '../../_generated/api'
import { backend } from '../../lib/logger'
import { createAgentSession } from './lib/piSession'
import { ERROR_CODES } from '../../errors'

const plannedRouteOptionValidator = v.object({
  routeOptionId: v.string(),
  label: v.string(),
  rationale: v.string(),
  stats: v.object({
    distanceMeters: v.number(),
    durationSeconds: v.number(),
    legsCount: v.number(),
  }),
  map: v.object({
    bounds: boundsValidator,
    overviewGeometry: polylineGeometryValidator,
    legs: v.array(routeLegValidator),
  }),
  overlaysPreview: v.object({
    windSummary: windSummaryValidator,
    conditionsStatus: conditionsStatusValidator,
  }),
})

const plannedRouteOptionsViewValidator = v.object({
  planId: v.string(),
  options: v.array(plannedRouteOptionValidator),
})

/**
 * Build user prompt from PlanInput for agent.
 */
const buildUserPrompt = (planInput: any): string => {
  const parts = [
    'Plan a scenic motorcycle route.',
    '',
    'Route Details:',
    `- Start: ${planInput.start.label ?? `${planInput.start.lat},${planInput.start.lng}`}`,
    `- End: ${planInput.end.label ?? `${planInput.end.lat},${planInput.end.lng}`}`,
    `- Departure: ${new Date(planInput.departureTime).toISOString()}`,
    '',
    'Preferences:',
    `- Scenic bias: ${planInput.preferences?.scenicBias ?? 'default'}`,
    '',
    'Generate 2-3 route options using the available tools.',
    'Each option should include a label, rationale, and complete route geometry.',
  ]
  return parts.join('\n')
}

/**
 * Parse and validate agent response into PlannedRouteOptionsView.
 * @throws {Error} ERROR_CODES.AGENT_RESPONSE_INVALID if JSON parsing fails
 * @throws {Error} ERROR_CODES.INVALID_AGENT_RESPONSE_STRUCTURE if validation fails
 */
const parseAgentResponse = (agentResponse: string): PlannedRouteOptionsView => {
  try {
    const parsed = JSON.parse(agentResponse)

    if (!parsed.options || !Array.isArray(parsed.options)) {
      backend.error('convex.action', 'Invalid agent response structure', new Error('missing options array'), {
        responseLength: agentResponse.length,
      })
      throw new Error(ERROR_CODES.INVALID_AGENT_RESPONSE_STRUCTURE)
    }

    // Validate response structure using Convex validator
    try {
      plannedRouteOptionsViewValidator(parsed)
    } catch (validationError) {
      backend.error('convex.action', 'Agent response validation failed', validationError as Error, {
        responseLength: agentResponse.length,
      })
      throw new Error(ERROR_CODES.INVALID_AGENT_RESPONSE_STRUCTURE)
    }

    return {
      planId: parsed.planId ?? randomUUID(),
      options: parsed.options,
    }
  } catch (error) {
    if (error instanceof Error && error.message === ERROR_CODES.INVALID_AGENT_RESPONSE_STRUCTURE) {
      throw error
    }
    backend.error('convex.action', 'Failed to parse agent response', error as Error, {
      responseLength: agentResponse.length,
    })
    throw new Error(ERROR_CODES.AGENT_RESPONSE_INVALID)
  }
}

/**
 * Plan a motorcycle ride route using AI agent.
 *
 * @param ctx - Convex action context
 * @param args.planInput - Route planning input including start/end points, departure time, and preferences
 * @returns Promise<PlannedRouteOptionsView> - Generated route options with geometry and conditions
 * @throws {Error} ERROR_CODES.SESSION_REQUIRED if user is not authenticated
 * @throws {Error} ERROR_CODES.AGENT_TIMEOUT if agent does not respond within 55 seconds
 * @throws {Error} ERROR_CODES.AGENT_RESPONSE_INVALID if agent response cannot be parsed
 * @throws {Error} ERROR_CODES.NO_ROUTES_GENERATED if agent produces no route options
 */
export const planRide = action({
  args: { planInput: planInputValidator },
  returns: plannedRouteOptionsViewValidator,
  handler: async (ctx, args): Promise<PlannedRouteOptionsView> => {
    const session = await requireSession(ctx)

    backend.info('convex.action', 'planRide started', {
      userId: session.user._id,
      start: args.planInput.start,
      end: args.planInput.end,
      departureTime: args.planInput.departureTime,
      includeFavorites: args.planInput.includeFavorites,
    })

    // Fetch favorites if includeFavorites is true
    // TODO: Implement favorites integration (US-047)
    // Note: internal.favoriteRoads.list will be available after convex dev generates the API
    let favoriteGeometries: string[] = []
    if (args.planInput.includeFavorites) {
      // const favorites = await ctx.runQuery(internal.favoriteRoads.list)
      // favoriteGeometries = favorites.map((f) => f.geometry)
    }

    // Create pi AgentSession with route planning extension
    const agentSession = await createAgentSession(ctx)

    // Build user prompt from PlanInput
    const userPrompt = buildUserPrompt(args.planInput)

    // Set up response promise with timeout (Convex has 60s limit, use 55s for safety)
    let resolveResponse: ((value: string) => void) | null = null
    const responsePromise = new Promise<string>((resolve) => {
      resolveResponse = resolve
    })

    // Create timeout promise
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error(ERROR_CODES.AGENT_TIMEOUT))
      }, 55000) // 55 seconds
    })

    // Subscribe to agent events to capture final response
    const unsubscribe = agentSession.subscribe((event) => {
      if (event.type === 'agent_end') {
        // Extract the final assistant message containing the route options
        const lastAssistantMessage = event.messages
          .filter((m) => m.role === 'assistant')
          .pop()

        if (lastAssistantMessage && 'content' in lastAssistantMessage) {
          const textContent = lastAssistantMessage.content.find((c: any) => c.type === 'text')
          if (textContent && 'text' in textContent) {
            const finalResponse = textContent.text
            if (resolveResponse) {
              resolveResponse(finalResponse)
            }
          }
        }
      }
    })

    try {
      // Prompt agent to plan route (returns void, response comes via events)
      await agentSession.prompt(userPrompt)

      // Wait for agent_end event with timeout to prevent hanging
      const agentResponse = await Promise.race([responsePromise, timeoutPromise])

      // Parse and validate agent response into PlannedRouteOptionsView
      const result = parseAgentResponse(agentResponse)

      if (!result.options.length) {
        backend.error('convex.action', 'Agent produced no route options', new Error(ERROR_CODES.NO_ROUTES_GENERATED), {
          userId: session.user._id,
        })
        throw new Error(ERROR_CODES.NO_ROUTES_GENERATED)
      }

      backend.info('convex.action', 'planRide completed successfully', {
        userId: session.user._id,
        optionsCount: result.options.length,
        planId: result.planId,
      })

      return result
    } catch (error) {
      backend.error('convex.action', 'Agent execution failed', error as Error, {
        userId: session.user._id,
      })
      throw error
    } finally {
      // Clean up event subscription
      unsubscribe()
    }
  },
})
