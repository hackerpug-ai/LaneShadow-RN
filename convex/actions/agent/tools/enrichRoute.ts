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
      legLabels: Type.Array(
        Type.String({
          description: 'Descriptive label for each leg (max 6 words). Use place names, road names, or landmarks. Format as "From → To". NEVER use "waypoint" as a label.',
        })
      ),
    })
  ),
})

export type RouteEnrichment = {
  label: string
  rationale: string
  highlights: string[]
  legLabels: string[]
}

export type EnrichRouteInput = {
  routes: {
    waypoints: { name: string; type: string }[]
    legContext?: {
      index: number
      fromName?: string
      toName?: string
      roadName?: string
      distance: number
    }[]
    stats: { distanceMeters: number; durationSeconds: number }
    preferences?: { scenicBias?: string; avoidHighways?: boolean }
    existingLegLabels?: string[] // Pre-existing labels from sketch (skip LLM generation)
  }[]
}

const enrichmentTool: Tool = {
  name: 'emit_enrichments',
  description:
    'Emit enriched names, rationales, highlights, and leg labels for every supplied route. Call this exactly once with one entry per input route, in the same order.',
  // Cast to `any` for the TypeBox 0.33 (project) vs 0.34 (pi-ai peer) minor
  // API difference. Runtime shapes are identical — AJV resolves both.
  parameters: EnrichmentToolSchema as any,
}

/**
 * Generates human-readable labels and rationale for routes using pi-ai with
 * a forced tool-call as the structured-output mechanism.
 *
 * Falls back to generic labels on any failure — never throws.
 *
 * When existingLegLabels are provided, skips LLM leg label generation and uses
 * the existing labels directly (preserving sketch-generated labels).
 */
export const enrichRoute = async (params: EnrichRouteInput): Promise<RouteEnrichment[]> => {
  // Check if we have existing leg labels from sketch
  const hasExistingLabels = params.routes.some(r => r.existingLegLabels && r.existingLegLabels.length > 0)

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set')
    }

    console.info(`[enrichRoute] using model=${AI_MODEL}, routes=${params.routes.length}`)

    const model = getModel('openai', AI_MODEL as any)

    const context: Context = {
      systemPrompt:
        'You are a motorcycle route specialist. You receive structured route data and write compelling, accurate names and descriptions.\n\n' +
        '## Labeling Rules\n\n' +
        '### Route-Level Labels\n' +
        '- Punchy, memorable names referencing iconic waypoints\n' +
        '- Max 8 words\n' +
        '- Examples: "Pacific Coast Highway Dream", "Sierra Nevada Sweep"\n\n' +
        (hasExistingLabels
          ? '### Leg Labels\n' +
            '- SKIP leg label generation - existing labels from the route sketch will be used\n' +
            '- Only generate route-level labels, rationales, and highlights\n'
          : '### Leg Labels\n' +
            '- Describe the FROM → TO of each leg segment\n' +
            '- Use place names (cities, towns, landmarks)\n' +
            '- Use road names for highway segments\n' +
            '- NEVER use "waypoint" as a label\n' +
            '- Max 6 words per label\n' +
            '- Examples: "San Francisco → Daly City", "Highway 1 → Santa Cruz", "Golden Gate Bridge → Sausalito"\n'
        ) +
        'Always respond by calling the emit_enrichments tool exactly once with one entry per input route, in order.',
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(params.routes, hasExistingLabels),
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

    // If we have existing labels, replace LLM-generated labels with existing ones
    if (hasExistingLabels) {
      return routes.map((enrichment, idx) => ({
        ...enrichment,
        legLabels: params.routes[idx].existingLegLabels || enrichment.legLabels,
      }))
    }

    return routes
  } catch (error) {
    console.warn('[enrichRoute] LLM call failed, using fallback labels', error)
    return params.routes.map((route, idx) =>
      fallbackEnrichment(idx, route.legContext?.length ?? 0, route.existingLegLabels)
    )
  }
}

/**
 * Fallback enrichment when LLM fails. Always succeeds.
 */
const fallbackEnrichment = (
  idx: number,
  legCount: number,
  existingLegLabels?: string[]
): RouteEnrichment => ({
  label: `Route ${idx + 1}`,
  rationale: 'A scenic route through the area.',
  highlights: ['Scenic roads', 'Local character'],
  legLabels: existingLegLabels || Array.from({ length: legCount }, (_, i) => `Leg ${i + 1}`),
})

/**
 * Builds the user prompt for the LLM with route details.
 */
const buildUserPrompt = (routes: EnrichRouteInput['routes'], hasExistingLabels: boolean): string => {
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

    // Only add leg context if we don't have existing labels
    if (!hasExistingLabels && route.legContext && route.legContext.length > 0) {
      parts.push(`\nLegs (${route.legContext.length}):`)
      route.legContext.forEach((leg) => {
        const from = leg.fromName || `Point ${leg.index}`
        const to = leg.toName || `Point ${leg.index + 1}`
        const road = leg.roadName ? ` via ${leg.roadName}` : ''
        parts.push(`  - Leg ${leg.index + 1}: ${from} → ${to}${road}`)
      })
    }

    // If we have existing labels, mention them
    if (hasExistingLabels && route.existingLegLabels && route.existingLegLabels.length > 0) {
      parts.push(`\nExisting leg labels (will be preserved):`)
      route.existingLegLabels.forEach((label, i) => {
        parts.push(`  - Leg ${i + 1}: ${label}`)
      })
    }
  })

  parts.push(
    '\n\nCall emit_enrichments with a name, description' +
    (hasExistingLabels ? ' and highlights' : ', leg labels, and highlights') +
    ' for each route.'
  )

  return parts.join('\n')
}
