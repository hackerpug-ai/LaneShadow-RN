'use node'

import { generateText, type LanguageModel, NoObjectGeneratedError, Output } from 'ai'
import { z } from 'zod'
import { getAgentLanguageModel, getAgentLanguageModelInfo } from './models'
import { parseZaiFallback } from './zaiProvider'

const anchorSchema = z.object({
  query: z.string().min(1),
  why: z.string().min(1),
  /** Position in the ordered start→end sequence (0-indexed). */
  order: z.number().int().nonnegative(),
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
  /** Intelligence tier resolved through the model layer. Default: 'high'. */
  intelligenceLevel?: 'high' | 'low'
}

/** @deprecated Prefer getAgentLanguageModel('high') from models.ts */
export const createDefaultAnchorExtractionModel = (): LanguageModel => {
  return getAgentLanguageModel('high')
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
- Only use points the description supports. Do not invent scenic detours.
- Assign each anchor an integer "order" field starting at 0 and increasing by 1 (0 = start, last = end).
- Respond as JSON matching: {"anchors":[{"query":"...","why":"...","order":0}],"confidence":"high"|"medium"|"low","roadChain":["..."]}${feedbackBlock}`
}

/**
 * Normalize anchors so order is contiguous and ascending from 0.
 * If the model omitted/scrambled order, fall back to array index.
 */
export const normalizeAnchorOrder = (anchors: EmitAnchors['anchors']): EmitAnchors['anchors'] => {
  const sorted = [...anchors].sort((a, b) => a.order - b.order)
  return sorted.map((anchor, index) => ({ ...anchor, order: index }))
}

/**
 * Coerce a partially-valid model payload into emitAnchorsSchema shape by
 * assigning order from array index when missing. Never invents anchors.
 */
const coercePartialAnchors = (raw: unknown): EmitAnchors | null => {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.anchors) || obj.anchors.length === 0) return null

  const anchors = obj.anchors.map((item, index) => {
    const a = (item ?? {}) as Record<string, unknown>
    const query = typeof a.query === 'string' ? a.query : ''
    const why = typeof a.why === 'string' && a.why.length > 0 ? a.why : 'extracted'
    const order = typeof a.order === 'number' && Number.isFinite(a.order) ? a.order : index
    return { query, why, order }
  })

  const confidence =
    obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low'
      ? obj.confidence
      : 'medium'
  const roadChain = Array.isArray(obj.roadChain)
    ? obj.roadChain.filter((s): s is string => typeof s === 'string' && s.length > 0)
    : []

  const candidate = { anchors, confidence, roadChain }
  const validated = emitAnchorsSchema.safeParse(candidate)
  if (!validated.success) return null
  return {
    ...validated.data,
    anchors: normalizeAnchorOrder(validated.data.anchors),
  }
}

export const extractAnchors = async (
  route: AnchorExtractionRouteInput,
  options?: ExtractAnchorsOptions,
): Promise<EmitAnchors> => {
  const level = options?.intelligenceLevel ?? 'high'
  // Resolve through the model layer — never hardcode provider/model at call sites.
  const modelInfo = getAgentLanguageModelInfo(level)
  void modelInfo
  const model = options?.model ?? getAgentLanguageModel(level)
  const prompt = buildAnchorExtractionPrompt(route, options?.feedback)

  let rawText: string | undefined

  try {
    const result = await generateText({
      model,
      output: Output.object({ schema: emitAnchorsSchema }),
      prompt,
    })

    if (result.output) {
      const validated = emitAnchorsSchema.safeParse(result.output)
      if (validated.success) {
        return {
          ...validated.data,
          anchors: normalizeAnchorOrder(validated.data.anchors),
        }
      }
      // Structured path produced output that failed re-validation — try coerce.
      const coerced = coercePartialAnchors(result.output)
      if (coerced) return coerced
    }

    rawText = result.text
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      rawText = error.text
    } else {
      throw error
    }
  }

  // Text-mode JSON fallback ladder — never silently return an empty anchor array.
  const fallback = parseZaiFallback(rawText ?? '', emitAnchorsSchema)
  if (fallback.ok) {
    return {
      ...fallback.object,
      anchors: normalizeAnchorOrder(fallback.object.anchors),
    }
  }

  // Last chance: coerce partial JSON without full schema compliance on order.
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText)
      const coerced = coercePartialAnchors(parsed)
      if (coerced) return coerced
    } catch {
      // fall through to typed error
    }
  }

  throw new Error(
    'Anchor extraction failed: structured output and text-mode JSON fallback both failed (empty or invalid anchors)',
  )
}
