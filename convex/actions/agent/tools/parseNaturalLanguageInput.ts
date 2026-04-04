'use node'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { OPENAI_API_KEY, AI_MODEL } from '../../../lib/env'
import { withTimeout } from '../lib/reliability'
import type { PlanInput } from '../../../../models/saved-routes'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const LLM_TIMEOUT_MS = 10_000
const DEFAULT_DEPARTURE_OFFSET_MS = 3_600_000 // 1 hour from now

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ParseResult = {
  planInput: PlanInput
  confidence: 'high' | 'medium' | 'low'
  isRefinement: boolean
  warnings: Array<string>
}

export type ParseNaturalLanguageInputArgs = {
  text: string
  currentLocation: { lat: number; lng: number }
  departureTime: number
  previousMessages?: Array<{ role: string; content: string }>
}

// -----------------------------------------------------------------------------
// LLM Structured Output Schema
// -----------------------------------------------------------------------------

const ParsedInputSchema = z.object({
  origin: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().optional(),
    placeId: z.string().optional(),
  }),
  destination: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    label: z.string().optional(),
    placeId: z.string().optional(),
  }),
  departureTime: z.number().optional(), // Unix timestamp in ms
  preferences: z.object({
    scenicBias: z.union([z.literal('default'), z.literal('high')]).optional(),
    avoidHighways: z.boolean().optional(),
    avoidTolls: z.boolean().optional(),
  }),
  isRefinement: z.boolean(),
  confidence: z.union([z.literal('high'), z.literal('medium'), z.literal('low')]),
  warnings: z.array(z.string()),
})

type ParsedInput = z.infer<typeof ParsedInputSchema>

// -----------------------------------------------------------------------------
// Coordinate Validation
// -----------------------------------------------------------------------------

const validateCoordinateBounds = (lat: number, lng: number): void => {
  if (lat < -90 || lat > 90) {
    throw new Error('INVALID_COORDINATES: Latitude must be between -90 and 90')
  }
  if (lng < -180 || lng > 180) {
    throw new Error('INVALID_COORDINATES: Longitude must be between -180 and 180')
  }
}

// -----------------------------------------------------------------------------
// LLM Prompt Building
// -----------------------------------------------------------------------------

const buildSystemPrompt = (): string => {
  return [
    'You are a motorcycle ride planning assistant.',
    'Extract structured ride information from natural language input.',
    '',
    'Rules:',
    '- Coordinates MUST be valid: lat ∈ [-90, 90], lng ∈ [-180, 180]',
    '- If origin/destination are unclear, set confidence to "low" and add warnings',
    '- If the input is a refinement (e.g., "make it shorter"), set isRefinement to true',
    '- Default departureTime to 1 hour from now if not specified',
    '- Default scenicBias to "high" for scenic rides, "default" otherwise',
    '- Return all coordinates as decimal degrees',
  ].join('\n')
}

const buildUserPrompt = (
  text: string,
  currentLocation: { lat: number; lng: number },
  departureTime: number,
  previousMessages?: Array<{ role: string; content: string }>
): string => {
  const parts: string[] = []

  parts.push('Current location:')
  parts.push(`Latitude: ${currentLocation.lat}`)
  parts.push(`Longitude: ${currentLocation.lng}`)
  parts.push(`Departure time: ${new Date(departureTime).toISOString()}`)

  if (previousMessages && previousMessages.length > 0) {
    parts.push('')
    parts.push('Conversation history:')
    previousMessages.forEach((msg) => {
      parts.push(`${msg.role}: ${msg.content}`)
    })
  }

  parts.push('')
  parts.push('Parse this ride request:')
  parts.push(`"${text}"`)

  parts.push('')
  parts.push('Return structured JSON with origin, destination, departureTime, preferences, confidence, isRefinement, and warnings.')

  return parts.join('\n')
}

// -----------------------------------------------------------------------------
// Implementation
// -----------------------------------------------------------------------------

/**
 * Parses natural language input into structured PlanInput using AI SDK with structured output.
 * Uses current location and departure time as context for better parsing.
 *
 * @param args.text - Natural language input from user
 * @param args.currentLocation - Current GPS coordinates
 * @param args.departureTime - Planned departure time (Unix timestamp in ms)
 * @param args.previousMessages - Optional conversation history for context
 * @returns Parsed ride plan with confidence score and warnings
 */
export async function parseNaturalLanguageInput(
  args: ParseNaturalLanguageInputArgs
): Promise<ParseResult> {
  // Check for API key
  if (!OPENAI_API_KEY) {
    throw new Error('AGENTIC_PARSE_FAILED: OpenAI API key not configured')
  }

  // Handle empty input
  if (!args.text.trim()) {
    return {
      planInput: {
        start: { lat: args.currentLocation.lat, lng: args.currentLocation.lng },
        end: { lat: args.currentLocation.lat, lng: args.currentLocation.lng },
        departureTime: args.departureTime,
        preferences: { scenicBias: 'default' },
        nlpText: args.text,
      },
      confidence: 'low',
      isRefinement: false,
      warnings: ['Empty input provided'],
    }
  }

  try {
    const result = await withTimeout(
      async () => {
        return generateObject({
          model: openai(AI_MODEL),
          schema: ParsedInputSchema,
          prompt: buildUserPrompt(args.text, args.currentLocation, args.departureTime, args.previousMessages),
          system: buildSystemPrompt(),
        })
      },
      { ms: LLM_TIMEOUT_MS, label: 'parseNaturalLanguageInput' }
    )

    const parsed = result.object

    // Validate coordinate bounds
    validateCoordinateBounds(parsed.origin.lat, parsed.origin.lng)
    validateCoordinateBounds(parsed.destination.lat, parsed.destination.lng)

    // Build PlanInput with nlpText set
    const planInput: PlanInput = {
      start: {
        lat: parsed.origin.lat,
        lng: parsed.origin.lng,
        label: parsed.origin.label,
        placeId: parsed.origin.placeId,
      },
      end: {
        lat: parsed.destination.lat,
        lng: parsed.destination.lng,
        label: parsed.destination.label,
        placeId: parsed.destination.placeId,
      },
      departureTime: parsed.departureTime ?? args.departureTime + DEFAULT_DEPARTURE_OFFSET_MS,
      preferences: {
        scenicBias: parsed.preferences.scenicBias ?? 'default',
        avoidHighways: parsed.preferences.avoidHighways,
        avoidTolls: parsed.preferences.avoidTolls,
      },
      nlpText: args.text, // CRITICAL: Set nlpText to preserve original input
    }

    return {
      planInput,
      confidence: parsed.confidence,
      isRefinement: parsed.isRefinement,
      warnings: parsed.warnings,
    }
  } catch (error) {
    // Fallback on any error
    console.warn('[parseNaturalLanguageInput] LLM call failed, using fallback', error)
    return {
      planInput: {
        start: { lat: args.currentLocation.lat, lng: args.currentLocation.lng },
        end: { lat: args.currentLocation.lat, lng: args.currentLocation.lng },
        departureTime: args.departureTime,
        preferences: { scenicBias: 'default' },
        nlpText: args.text,
      },
      confidence: 'low',
      isRefinement: false,
      warnings: ['Failed to parse input, using current location as default'],
    }
  }
}
