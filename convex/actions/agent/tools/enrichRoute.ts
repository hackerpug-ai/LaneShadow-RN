'use node'

import {
  complete,
  getModel,
  Type,
  type AssistantMessage,
  type Context,
  type Tool,
  type ToolCall,
} from '@mariozechner/pi-ai'
import { OPENAI_API_KEY, AI_MODEL } from '../../../lib/env'
import { withTimeout } from '../lib/reliability'

const ENRICH_TIMEOUT_MS = 10_000

/**
 * TypeBox schema for the enrichment output, exposed to the model as the
 * parameters of a single tool `emit_enrichments`. The model is forced to call
 * this tool, giving us structured output without relying on free-form JSON
 * parsing.
 */
const EnrichmentToolSchema = Type.Object({
  routes: Type.Array(
    Type.Object({
      label: Type.String({
        description: 'Punchy route name (≤8 words) referencing the most iconic waypoint',
      }),
      rationale: Type.String({
        description: '1-2 sentences about why this route is scenic (mention waypoints)',
      }),
      highlights: Type.Array(
        Type.String({ description: 'Short phrase (max 4 words)' })
      ),
    })
  ),
})

export type RouteEnrichment = {
  label: string
  rationale: string
  highlights: string[]
}

export type EnrichRouteInput = {
  routes: Array<{
    waypoints: Array<{ name: string; type: string }>
    stats: { distanceMeters: number; durationSeconds: number }
    preferences?: { scenicBias?: string; avoidHighways?: boolean }
  }>
}

const enrichmentTool: Tool = {
  name: 'emit_enrichments',
  description:
    'Emit enriched names, rationales, and highlights for every supplied route. Call this exactly once with one entry per input route, in the same order.',
  // Cast to `any` for the TypeBox 0.33 (project) vs 0.34 (pi-ai peer) minor
  // API difference. Runtime shapes are identical — AJV resolves both.
  parameters: EnrichmentToolSchema as any,
}

/**
 * Generates human-readable labels and rationale for routes using pi-ai with
 * a forced tool-call as the structured-output mechanism.
 *
 * Falls back to generic labels on any failure — never throws.
 */
export const enrichRoute = async (params: EnrichRouteInput): Promise<RouteEnrichment[]> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set')
    }

    console.info(`[enrichRoute] using model=${AI_MODEL}, routes=${params.routes.length}`)

    const model = getModel('openai', AI_MODEL as any)

    const context: Context = {
      systemPrompt:
        'You are a motorcycle route naming specialist. You receive structured route data and write compelling, accurate names and descriptions. Always respond by calling the emit_enrichments tool exactly once with one entry per input route, in order.',
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(params.routes),
          timestamp: Date.now(),
        },
      ],
      tools: [enrichmentTool],
    }

    const assistant: AssistantMessage = await withTimeout(
      async () => complete(model, context),
      { ms: ENRICH_TIMEOUT_MS, label: 'enrichRoute' }
    )

    const call = assistant.content.find(
      (b): b is ToolCall => b.type === 'toolCall' && b.name === 'emit_enrichments'
    )
    if (!call) {
      throw new Error('Model did not emit enrichments tool call')
    }

    const { routes } = call.arguments as { routes: RouteEnrichment[] }
    if (!Array.isArray(routes) || routes.length === 0) {
      throw new Error('emit_enrichments returned no routes')
    }

    return routes
  } catch (error) {
    console.warn('[enrichRoute] LLM call failed, using fallback labels', error)
    return params.routes.map((_, idx) => fallbackEnrichment(idx))
  }
}

/**
 * Fallback enrichment when LLM fails. Always succeeds.
 */
const fallbackEnrichment = (idx: number): RouteEnrichment => ({
  label: `Route ${idx + 1}`,
  rationale: 'A scenic route through the area.',
  highlights: ['Scenic roads', 'Local character'],
})

/**
 * Builds the user prompt for the LLM with route details.
 */
const buildUserPrompt = (routes: EnrichRouteInput['routes']): string => {
  const parts: string[] = []

  parts.push(`Name and describe these ${routes.length} motorcycle routes.\n`)

  routes.forEach((route, idx) => {
    parts.push(`\nRoute ${idx + 1}:`)
    parts.push(`Waypoints: ${route.waypoints.map((w) => w.name).join(', ')}`)
    parts.push(
      `Distance: ${(route.stats.distanceMeters / 1609.34).toFixed(1)} miles, Duration: ${Math.round(route.stats.durationSeconds / 60)} minutes`
    )

    if (route.preferences?.scenicBias) {
      parts.push(`Preference: scenic bias ${route.preferences.scenicBias}`)
    }
    if (route.preferences?.avoidHighways) {
      parts.push(`Preference: avoid highways`)
    }
  })

  parts.push('\n\nCall emit_enrichments with a name and description for each route.')

  return parts.join('\n')
}
