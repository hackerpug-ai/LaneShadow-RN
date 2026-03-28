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
 * Parse agent response into PlannedRouteOptionsView.
 */
const parseAgentResponse = (agentResponse: string): PlannedRouteOptionsView => {
  try {
    const parsed = JSON.parse(agentResponse)

    if (!parsed.options || !Array.isArray(parsed.options)) {
      throw new Error('Invalid agent response: missing options array')
    }

    return {
      planId: parsed.planId ?? randomUUID(),
      options: parsed.options,
    }
  } catch (error) {
    backend.error('convex.action', 'Failed to parse agent response', error as Error, {
      responseLength: agentResponse.length,
    })
    throw new Error('AGENT_RESPONSE_INVALID')
  }
}

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
    let favoriteGeometries: string[] = []
    if (args.planInput.includeFavorites) {
      // Note: internal.favoriteRoads.list will be available after convex dev generates the API
      // For now, we'll comment this out until the API is regenerated
      // const favorites = await ctx.runQuery(internal.favoriteRoads.list)
      // favoriteGeometries = favorites.map((f) => f.geometry)
    }

    // Create pi AgentSession with route planning extension
    const agentSession = await createAgentSession(ctx)

    // Build user prompt from PlanInput
    const userPrompt = buildUserPrompt(args.planInput)

    // Wait for agent to complete and capture final response
    let finalResponse: string | null = null
    let resolveResponse: ((value: string) => void) | null = null
    const responsePromise = new Promise<string>((resolve) => {
      resolveResponse = resolve
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
            finalResponse = textContent.text
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

      // Wait for agent_end event and extract response
      const agentResponse = await responsePromise

      // Parse agent response into PlannedRouteOptionsView
      const result = parseAgentResponse(agentResponse)

      if (!result.options.length) {
        backend.error('convex.action', 'Agent produced no route options', new Error('NO_ROUTES_GENERATED'), {
          userId: session.user._id,
        })
        throw new Error('NO_ROUTES_GENERATED')
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
