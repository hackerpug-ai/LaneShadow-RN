'use node'

import type { AssistantMessage, Context, Message } from '@mariozechner/pi-ai'
import { complete, getModel } from '@mariozechner/pi-ai'
import { v } from 'convex/values'
import { planInputValidator } from '../../../models/saved-routes'
import type { TripLeg, TripPlan } from '../../../models/trip-plan'
import { agentTripPlanSchema } from '../../../models/trip-plan'
import { api, internal } from '../../_generated/api'
import type { Id } from '../../_generated/dataModel'
import { action } from '../../_generated/server'
import { getAgentModel, getAgentModelInfo } from './lib/models'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 3

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert motorcycle and scenic drive guide with encyclopedic knowledge of roads in the United States. You give directions like a knowledgeable local — specific road names, highway numbers, and key transition points.

RULES:
- Each leg = one road or one road transition. A leg ends when you change roads.
- Use real road names and highway numbers (e.g. "CA-1", "Sloat Blvd", "US-101 BUS")
- googleMapsQuery must be a string Google Maps can resolve (e.g. "Pacifica CA to Half Moon Bay CA via CA-1")
- confidence: "high" for well-known roads, "medium" if less certain, "low" if guessing
- character: 1-2 sentences on what makes this leg worth riding
- Set status to "generated" on all legs initially
- failureReason and persistedWaypoint should be omitted unless relevant
- Return ONLY valid JSON matching the TripPlan schema. No prose, no markdown fences.`

// ---------------------------------------------------------------------------
// User message builder
// ---------------------------------------------------------------------------

type GenerateContext = {
  previousPlanSummary?: string
  suggestedWaypoints?: string[]
}

function buildUserMessage(
  planInput: {
    start: { label?: string; lat: number; lng: number }
    end: { label?: string; lat: number; lng: number }
    nlpText?: string
    preferences?: { avoidHighways?: boolean; avoidTolls?: boolean }
  },
  context?: GenerateContext,
): string {
  const startLabel = planInput.start.label ?? `${planInput.start.lat},${planInput.start.lng}`
  const endLabel = planInput.end.label ?? `${planInput.end.lat},${planInput.end.lng}`

  const parts: string[] = [`Plan a scenic ride from ${startLabel} to ${endLabel}.`]

  if (planInput.nlpText) {
    parts.push(`Additional context: ${planInput.nlpText}`)
  }

  if (planInput.preferences?.avoidHighways) {
    parts.push('Avoid highways and freeways.')
  }

  if (planInput.preferences?.avoidTolls) {
    parts.push('Avoid toll roads.')
  }

  if (context?.previousPlanSummary) {
    parts.push(`Prior route context: ${context.previousPlanSummary}`)
  }

  if (context?.suggestedWaypoints && context.suggestedWaypoints.length > 0) {
    parts.push(
      `If these waypoints are naturally along your route, use them as leg transition points (omit silently if off-route): ${context.suggestedWaypoints.join(', ')}`,
    )
  }

  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// Structural validation
// ---------------------------------------------------------------------------

type LegValidationFailure = {
  legIndex: number
  failureReason: string
}

function validateLegs(legs: TripLeg[]): LegValidationFailure[] {
  const failures: LegValidationFailure[] = []
  const seenVia = new Set<string>()

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i]
    const reasons: string[] = []

    // googleMapsQuery non-empty
    if (!leg.googleMapsQuery || leg.googleMapsQuery.trim() === '') {
      reasons.push('googleMapsQuery is empty')
    }

    // from !== to
    if (leg.from === leg.to) {
      reasons.push('from and to are identical')
    }

    // via non-empty
    if (!leg.via || leg.via.trim() === '') {
      reasons.push('via is empty')
    }

    // legIndex is 0-based sequential
    if (leg.legIndex !== i) {
      reasons.push(`legIndex is ${leg.legIndex}, expected ${i}`)
    }

    // geographic continuity: leg[n].to === leg[n+1].from
    if (i < legs.length - 1 && leg.to !== legs[i + 1].from) {
      reasons.push(`leg.to "${leg.to}" does not match next leg.from "${legs[i + 1].from}"`)
    }

    // no duplicate via values
    if (leg.via) {
      if (seenVia.has(leg.via)) {
        reasons.push(`duplicate via value "${leg.via}"`)
      } else {
        seenVia.add(leg.via)
      }
    }

    if (reasons.length > 0) {
      failures.push({ legIndex: i, failureReason: reasons.join('; ') })
    }
  }

  return failures
}

// ---------------------------------------------------------------------------
// Retry prompt builder
// ---------------------------------------------------------------------------

function buildRetryMessage(
  failures: LegValidationFailure[],
  currentPlan: TripPlan,
  isFinalAttempt: boolean,
): string {
  const failureLines = failures.map(
    (f) =>
      `Leg ${f.legIndex}: '${currentPlan.legs[f.legIndex]?.googleMapsQuery ?? ''}' — ${f.failureReason}`,
  )

  const parts = [
    'The following legs failed validation:',
    ...failureLines,
    'Replace only these legs. Keep all others identical. Return the full corrected TripPlan.',
  ]

  if (isFinalAttempt) {
    parts.push('Use only well-known numbered highways and named roads you are certain exist.')
  }

  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// Waypoint persistence tagging
// ---------------------------------------------------------------------------

function tagPersistedWaypoints(legs: TripLeg[], suggestedWaypoints: string[]): TripLeg[] {
  if (!suggestedWaypoints.length) return legs

  return legs.map((leg) => {
    for (const waypoint of suggestedWaypoints) {
      const waypointLower = waypoint.toLowerCase()
      // Check from, to, and tokens within via
      const matchesFrom = leg.from.toLowerCase().includes(waypointLower)
      const matchesTo = leg.to.toLowerCase().includes(waypointLower)
      const viaTokens = leg.via.split(/[\s,/]+/)
      const matchesVia = viaTokens.some(
        (token) =>
          token.toLowerCase().includes(waypointLower) ||
          waypointLower.includes(token.toLowerCase()),
      )

      if (matchesFrom || matchesTo || matchesVia) {
        return { ...leg, persistedWaypoint: waypoint }
      }
    }
    return leg
  })
}

// ---------------------------------------------------------------------------
// LLM call
// ---------------------------------------------------------------------------

function extractTextFromAssistant(msg: AssistantMessage): string {
  return msg.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join('')
}

async function callLLM(piMessages: Message[]): Promise<string> {
  const model = getAgentModel('high')

  const context: Context = {
    systemPrompt: SYSTEM_PROMPT,
    messages: piMessages,
  }

  const response = await complete(model, context)
  return extractTextFromAssistant(response)
}

// ---------------------------------------------------------------------------
// JSON parse + schema parse
// ---------------------------------------------------------------------------

function parseTripPlan(rawText: string): TripPlan {
  // Strip any accidental markdown fences
  const cleaned = rawText
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()
  const parsed = JSON.parse(cleaned)
  return agentTripPlanSchema.parse(parsed) as TripPlan
}

// ---------------------------------------------------------------------------
// Public action
// ---------------------------------------------------------------------------

export const generateTripPlan = action({
  args: {
    planInput: planInputValidator,
    context: v.optional(
      v.object({
        previousPlanSummary: v.optional(v.string()),
        suggestedWaypoints: v.optional(v.array(v.string())),
      }),
    ),
  },
  returns: v.id('trip_plans'),
  handler: async (ctx, args): Promise<Id<'trip_plans'>> => {
    // Step 1: Create initial trip_plans record with status 'generating'
    const { tripPlanId } = await ctx.runMutation(api.db.tripPlans.createTripPlan, {
      planInput: args.planInput,
    })

    // Immediately update status to 'generating'
    await ctx.runMutation(internal.db.tripPlans.updateTripPlan, {
      tripPlanId,
      status: 'generating',
      attemptCount: 0,
    })

    const suggestedWaypoints = args.context?.suggestedWaypoints ?? []
    const piMessages: Message[] = []

    let tripPlan: TripPlan | null = null
    let attemptCount = 0

    try {
      // Step 2: Attempt loop (max 3 attempts)
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        attemptCount = attempt

        await ctx.runMutation(internal.db.tripPlans.updateTripPlan, {
          tripPlanId,
          attemptCount,
        })

        // Build message for this attempt
        let userMessageText: string
        if (attempt === 1) {
          userMessageText = buildUserMessage(args.planInput, args.context)
        } else {
          // Retry: build from failed legs of the current plan
          const failures = tripPlan ? validateLegs(tripPlan.legs) : []
          if (failures.length === 0) {
            // No failures to retry — shouldn't happen but break cleanly
            break
          }
          userMessageText = buildRetryMessage(failures, tripPlan!, attempt === MAX_ATTEMPTS)
        }

        piMessages.push({ role: 'user', content: userMessageText, timestamp: Date.now() })

        // Call LLM
        let rawResponse: string
        try {
          rawResponse = await callLLM(piMessages)
        } catch (llmError) {
          const errMsg = llmError instanceof Error ? llmError.message : String(llmError)
          console.error('[generateTripPlan] LLM call failed', { attempt, error: errMsg })
          // Drop the user message we added (can't continue this turn) and continue
          piMessages.pop()
          continue
        }

        // Push a minimal assistant message to maintain conversation history for retries
        const modelInfo = getAgentModelInfo('high')
        piMessages.push({
          role: 'assistant',
          content: [{ type: 'text', text: rawResponse }],
          api: 'anthropic',
          provider: modelInfo.provider,
          model: modelInfo.model,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
          },
          stopReason: 'stop',
          timestamp: Date.now(),
        } as AssistantMessage)

        // Parse response
        let parsed: TripPlan
        try {
          parsed = parseTripPlan(rawResponse)
        } catch (parseError) {
          const errMsg = parseError instanceof Error ? parseError.message : String(parseError)
          console.error('[generateTripPlan] Parse failed', { attempt, error: errMsg })
          // Treat all legs as failed — add correction request if more attempts remain
          if (attempt < MAX_ATTEMPTS) {
            piMessages.push({
              role: 'user',
              content:
                'Your response was not valid JSON matching the TripPlan schema. Return ONLY valid JSON, no prose or markdown fences.',
              timestamp: Date.now(),
            })
          }
          continue
        }

        tripPlan = parsed

        // Validate legs
        const failures = validateLegs(tripPlan.legs)

        if (failures.length === 0) {
          // All legs valid — success
          break
        }

        // Some legs failed — mark them on the plan for context
        tripPlan = {
          ...tripPlan,
          failedLegIndexes: failures.map((f) => f.legIndex),
          legs: tripPlan.legs.map((leg) => {
            const failure = failures.find((f) => f.legIndex === leg.legIndex)
            if (failure) {
              return { ...leg, status: 'failed' as const, failureReason: failure.failureReason }
            }
            return leg
          }),
        }

        if (attempt === MAX_ATTEMPTS) {
          // Exhausted retries
          break
        }
      }

      // Step 3: Evaluate final result
      if (!tripPlan) {
        await ctx.runMutation(internal.db.tripPlans.updateTripPlan, {
          tripPlanId,
          status: 'failed',
          error: 'Failed to generate a valid trip plan after all attempts',
          attemptCount,
        })
        return tripPlanId
      }

      const finalFailures = validateLegs(tripPlan.legs)

      if (finalFailures.length > 0) {
        // Still has failures after max attempts
        await ctx.runMutation(internal.db.tripPlans.updateTripPlan, {
          tripPlanId,
          status: 'failed',
          error: `Leg validation failed after ${MAX_ATTEMPTS} attempts: ${finalFailures.map((f) => `leg ${f.legIndex}: ${f.failureReason}`).join('; ')}`,
          attemptCount,
        })
        return tripPlanId
      }

      // Step 4: Tag persisted waypoints
      const taggedLegs = tagPersistedWaypoints(tripPlan.legs, suggestedWaypoints)
      const finalPlan: TripPlan = {
        ...tripPlan,
        legs: taggedLegs,
        generationAttempt: attemptCount,
        failedLegIndexes: undefined,
      }

      // Step 5: Write completed result
      await ctx.runMutation(internal.db.tripPlans.updateTripPlan, {
        tripPlanId,
        status: 'completed',
        result: finalPlan,
        attemptCount,
      })

      return tripPlanId
    } catch (unexpectedError) {
      // Ensure we never leave the record in a stuck state
      const errMsg =
        unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError)
      console.error('[generateTripPlan] Unexpected error', { error: errMsg })

      await ctx.runMutation(internal.db.tripPlans.updateTripPlan, {
        tripPlanId,
        status: 'failed',
        error: errMsg,
        attemptCount,
      })

      throw unexpectedError
    }
  },
})
