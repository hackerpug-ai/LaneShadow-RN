/**
 * Intent Extraction Action
 *
 * Converts user intent strings into validated IntentParams objects.
 * Uses getAgentModel('low') for LLM calls with temperature=0.
 * Results are cached in intent_param_cache for performance.
 */

'use node'

import { v } from 'convex/values'

import { action } from '../../_generated/server'
import { requireIdentity } from '../../guards'

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

export const intentParamsValidator = v.object({
  archetype: v.optional(v.string()),
  state: v.optional(v.string()),
  min_length_mi: v.optional(v.number()),
  max_length_mi: v.optional(v.number()),
  max_technical: v.optional(v.number()),
  min_traffic_score: v.optional(v.number()),
  min_remoteness: v.optional(v.number()),
  max_distance_mi: v.optional(v.number()),
  season: v.optional(v.string()),
  sort_by: v.optional(v.string()),
})

// ---------------------------------------------------------------------------
// Intent Extraction Action (CONVEX-006)
// ---------------------------------------------------------------------------

export const extractIntentParams = action({
  args: {
    intent: v.string(),
  },
  returns: v.object({
    params: intentParamsValidator,
    schemaVersion: v.string(),
    latencyMs: v.number(),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now()

    // TODO: Implement actual LLM extraction using getAgentModel('low')
    // For now, return a placeholder response
    const params = {
      archetype: undefined,
      state: undefined,
      min_length_mi: undefined,
      max_length_mi: undefined,
      max_technical: undefined,
      min_traffic_score: undefined,
      min_remoteness: undefined,
      max_distance_mi: undefined,
      season: undefined,
      sort_by: undefined,
    }

    const latencyMs = Date.now() - startTime

    return {
      params,
      schemaVersion: '1.0.0',
      latencyMs,
    }
  },
})
