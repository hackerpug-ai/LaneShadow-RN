'use node'

import { withTimeout } from '../lib/reliability'

const ENRICH_TIMEOUT_MS = 10_000
const DEFAULT_MODEL = 'gpt-4o-mini'

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

/**
 * Generates human-readable labels and rationale for routes using OpenAI.
 * Called AFTER routes are compiled — receives structured data (real waypoint names,
 * stats, preferences) and returns NL copy.
 *
 * Falls back to generic labels on any failure — never throws.
 *
 * @param params.routes - Array of routes with waypoint names, stats, and preferences
 * @returns Array of enrichment objects with label, rationale, and highlights
 */
export const enrichRoute = async (
  params: EnrichRouteInput
): Promise<RouteEnrichment[]> => {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set')
    }

    const enrichModel = process.env.ENRICH_MODEL
    const model = enrichModel != null ? enrichModel : 'gpt-4o-mini'

    const result = await withTimeout(
      async (signal) => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'You are a motorcycle route naming specialist. You receive structured route data and write compelling, accurate names and descriptions. Output JSON only.',
              },
              {
                role: 'user',
                content: buildUserPrompt(params.routes),
              },
            ],
            max_tokens: 500,
          }),
          signal,
        })

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
        }

        return response.json()
      },
      { ms: ENRICH_TIMEOUT_MS, label: 'enrichRoute' }
    )

    const content = result.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content)
    const routes = (parsed.routes ?? []) as any[]

    return routes.map((r: any, idx: number) => ({
      label: r.label ?? `Route ${idx + 1}`,
      rationale: r.rationale ?? '',
      highlights: Array.isArray(r.highlights) ? r.highlights : [],
    }))
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
      `Distance: ${(route.stats.distanceMeters / 1609.34).toFixed(1)} miles, Duration: ${Math.round(
        route.stats.durationSeconds / 60
      )} minutes`
    )

    if (route.preferences?.scenicBias) {
      parts.push(`Preference: scenic bias ${route.preferences.scenicBias}`)
    }
    if (route.preferences?.avoidHighways) {
      parts.push(`Preference: avoid highways`)
    }
  })

  parts.push(
    '\n\nOutput JSON with "routes" array. Each route has: label (≤8 words), rationale (1-2 sentences), highlights (2-4 short phrases).'
  )

  return parts.join('\n')
}
