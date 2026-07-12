'use node'

import { anthropic } from '@ai-sdk/anthropic'
import { generateText, type LanguageModel, Output } from 'ai'
import { z } from 'zod'
import { ANTHROPIC_API_KEY } from '../../../lib/env'

const anchorSchema = z.object({
  query: z.string().min(1),
  why: z.string().min(1),
})

export const emitAnchorsSchema = z.object({
  anchors: z.array(anchorSchema).min(1),
  confidence: z.enum(['high', 'medium', 'low']),
  roadChain: z.array(z.string().min(1)),
})

export type EmitAnchors = z.infer<typeof emitAnchorsSchema>

export type AnchorExtractionRouteInput = {
  routeId?: string
  name: string
  state: string
  lengthMiles: number
  centroidLat: number
  centroidLng: number
  oneLiner?: string
  summary?: string
  description?: string
}

export type ExtractAnchorsOptions = {
  model?: LanguageModel
  feedback?: string
}

const DEFAULT_MODEL_ID = 'claude-sonnet-4-6'

export const createDefaultAnchorExtractionModel = (): LanguageModel => {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Missing required environment variable: ANTHROPIC_API_KEY')
  }

  return anthropic(DEFAULT_MODEL_ID)
}

const formatDescription = (route: AnchorExtractionRouteInput): string => {
  const parts = [route.oneLiner, route.summary, route.description].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  )

  return parts.join('\n')
}

export const buildAnchorExtractionPrompt = (
  route: AnchorExtractionRouteInput,
  feedback?: string,
): string => {
  const feedbackBlock = feedback
    ? `

PREVIOUS ATTEMPT FAILED VALIDATION — fix it:
${feedback}
Diagnose which anchors are wrong (bad geocode, wrong place, causes detour/backtrack) and emit a corrected anchor list. Prefer plain road-intersection queries over business/POI names. Drop anchors that add ambiguity.`
    : ''

  const description = formatDescription(route)

  return `You reconstruct motorcycle route geometry from ride descriptions.

ROUTE: "${route.name}" in ${route.state}
CLAIMED LENGTH: ${route.lengthMiles} miles
APPROX CENTER: lat ${route.centroidLat}, lng ${route.centroidLng}
DESCRIPTION:
${description}

Extract an ORDERED list of geocodable anchor points tracing this exact route, start to end.
Rules:
- Use road-intersection queries ("Redwood Rd & Pinehurst Rd, Castro Valley, CA") or "place, city, state" queries a geocoder can resolve.
- One anchor at the start, one at each described turn/junction (so the router is forced onto the described roads), one at the end.
- Always append city/region + state abbreviation to every query.
- If the description says a road "turns into" another, add the transition point as an anchor.
- For loops, the last anchor must return to the first.
- Only use points the description supports. Do not invent scenic detours.${feedbackBlock}`
}

export const extractAnchors = async (
  route: AnchorExtractionRouteInput,
  options?: ExtractAnchorsOptions,
): Promise<EmitAnchors> => {
  const model = options?.model ?? createDefaultAnchorExtractionModel()
  const prompt = buildAnchorExtractionPrompt(route, options?.feedback)

  const result = await generateText({
    model,
    output: Output.object({ schema: emitAnchorsSchema }),
    prompt,
  })

  if (!result.output) {
    throw new Error('Anchor extraction failed: model returned no structured output')
  }

  const validated = emitAnchorsSchema.safeParse(result.output)
  if (!validated.success) {
    throw new Error(`Anchor extraction validation failed: ${validated.error.message}`)
  }

  return validated.data
}
