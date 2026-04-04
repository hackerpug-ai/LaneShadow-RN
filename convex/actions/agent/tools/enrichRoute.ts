'use node'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { OPENAI_API_KEY, AI_MODEL } from '../../../lib/env'
import { withTimeout } from '../lib/reliability'

const ENRICH_TIMEOUT_MS = 10_000

/**
 * Zod schema for route enrichment output.
 * aisdk will automatically validate the LLM response against this schema.
 */
const RouteEnrichmentSchema = z.object({
  routes: z.array(
    z.object({
      label: z.string().describe('Punchy route name (≤8 words) referencing the most iconic waypoint'),
      rationale: z.string().describe('1-2 sentences about why this route is scenic (mention waypoints)'),
      highlights: z.array(z.string().describe('Short phrases (max 4 words each)')),
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

/**
 * Generates human-readable labels and rationale for routes using aisdk with structured output.
 * Uses AI_MODEL for all OpenAI calls (single interface).
 *
 * Falls back to generic labels on any failure — never throws.
 *
 * @param params.routes - Array of routes with waypoint names, stats, and preferences
 * @returns Array of enrichment objects with label, rationale, and highlights
 */
export const enrichRoute = async (params: EnrichRouteInput): Promise<RouteEnrichment[]> => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set')
    }

    const model = AI_MODEL
    console.log(`[enrichRoute] using model=${model}, routes=${params.routes.length}`)

    const result = await withTimeout(
      async () => {
        return generateObject({
          model: openai(model),
          schema: RouteEnrichmentSchema,
          prompt: buildUserPrompt(params.routes),
        })
      },
      { ms: ENRICH_TIMEOUT_MS, label: 'enrichRoute' }
    )

    return result.object.routes
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

  parts.push(
    'You are a motorcycle route naming specialist. You receive structured route data and write compelling, accurate names and descriptions.'
  )
  parts.push(`\nName and describe these ${routes.length} motorcycle routes.\n`)

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

  parts.push('\n\nGenerate a name and description for each route.')

  return parts.join('\n')
}
