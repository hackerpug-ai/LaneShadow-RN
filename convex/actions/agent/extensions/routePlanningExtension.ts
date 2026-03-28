'use node'

import type { ActionCtx } from '../../../_generated/server'
import { compileSketch } from '../tools/compileSketch'
import { computeRouteIndex } from '../tools/computeRouteIndex'
import { mapConditions } from '../tools/mapConditions'
import { normalizeRoute } from '../tools/normalizeRoute'
import { probeConditions } from '../tools/probeConditions'
import { createWeatherProvider } from '../providers/weatherProvider'
import { RoutePlanningValidators } from '../lib/piTools'

/**
 * Route planning extension for pi AgentSession.
 *
 * This extension:
 * - Provides system prompt for route sketching behavior
 * - Exposes all route planning tools to the agent
 * - Handles provider initialization (weather, routing)
 */
export const createRoutePlanningExtension = (ctx: ActionCtx) => {
  const weatherProvider = createWeatherProvider()

  const tools = [
    {
      name: 'compileSketch',
      label: 'Compile Route Sketch',
      description: 'Convert a route sketch into a provider route by calling routing API. Returns route geometry, legs, bounds, and metadata.',
      parameters: RoutePlanningValidators.PlanInput,
      execute: async (_toolCallId: string, params: any, _signal?: AbortSignal) => {
        const result = await compileSketch({ planInput: params, sketch: params })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
          details: result,
        }
      },
    },

    {
      name: 'normalizeRoute',
      label: 'Normalize Route',
      description: 'Normalize a provider route into a standard RouteSnapshot format with consistent geometry, legs, and metadata.',
      parameters: RoutePlanningValidators.RouteSnapshot,
      execute: async (_toolCallId: string, params: any, _signal?: AbortSignal) => {
        const result = await normalizeRoute({ providerRoute: params.providerRoute, planInput: params.planInput })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
          details: result,
        }
      },
    },

    {
      name: 'computeRouteIndex',
      label: 'Compute Route Index',
      description: 'Build a spatial index for a route by sampling points along the route geometry. Returns fingerprint and sampled points for conditions mapping.',
      parameters: RoutePlanningValidators.RouteSnapshot,
      execute: async (_toolCallId: string, params: any, _signal?: AbortSignal) => {
        const result = await computeRouteIndex(params)
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
          details: result,
        }
      },
    },

    {
      name: 'probeConditions',
      label: 'Probe Weather Conditions',
      description: 'Probe weather conditions (wind, temperature) at points along the route. Returns wind samples for each probed point.',
      parameters: RoutePlanningValidators.RouteIndex,
      execute: async (_toolCallId: string, params: any, _signal?: AbortSignal) => {
        const result = await probeConditions({ routeIndex: params.routeIndex, departureTimeMs: params.departureTimeMs, weatherProvider })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
          details: result,
        }
      },
    },

    {
      name: 'mapConditions',
      label: 'Map Weather Conditions',
      description: 'Map probed weather conditions onto route legs as segments with wind levels (low/moderate/high). Returns wind overlay with legend and by-leg segments.',
      parameters: RoutePlanningValidators.ProbedConditions,
      execute: async (_toolCallId: string, params: any, _signal?: AbortSignal) => {
        const result = await mapConditions({ routeSnapshot: params.routeSnapshot, routeIndex: params.routeIndex, probed: params.probed })
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
          details: result,
        }
      },
    },
  ]

  const systemPrompt = buildSystemPrompt()

  return {
    name: 'routePlanning',
    tools,
    systemPrompt,
  }
}

/**
 * System prompt for route planning agent.
 */
const buildSystemPrompt = (): string => {
  return [
    'You are a motorcycle route planning agent.',
    '',
    'Your task is to generate 2-3 scenic route options based on user input.',
    '',
    'Route Planning Process:',
    '1. Generate route sketches with label, rationale, segments, and anchorPoints',
    '2. For each sketch:',
    '   - Call compileSketch to convert to provider route',
    '   - Call normalizeRoute to standardize format',
    '   - Call computeRouteIndex to build spatial index',
    '   - Call probeConditions to fetch weather data',
    '   - Call mapConditions to apply wind overlays',
    '3. Return structured route options with stats and overlays',
    '',
    'Route Sketch Format:',
    '- label: Human-readable route name',
    '- rationale: Why this route is scenic',
    '- segments: Array of {roadName, fromName, toName, viaNames?}',
    '- anchorPoints: Array of {name, kind, lat?, lng?}',
    '',
    'Constraints:',
    '- Maximum 10 segments per sketch',
    '- Prefer anchorPoints with lat/lng coordinates',
    '- Avoid highways and major roads for scenic routes',
    '- Consider elevation changes (passes, vistas)',
    '',
    'Error Handling:',
    '- If compileSketch fails, skip that sketch',
    '- If probeConditions fails, return route without weather data',
    '- Always return at least 1 valid route option',
  ].join('\n')
}
