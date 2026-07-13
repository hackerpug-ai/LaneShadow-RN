'use node'

/**
 * S2-T3 — Convex 'use node' action wrapping the stateless ride-agent spike.
 *
 * This is the deployed-action contract: a Convex action that threads
 * per-session working memory through arg/return and delegates to
 * runSpikeTurn (the stateless @mastra/core Agent factory + deterministic
 * working-memory injection in rideAgentSpike.ts).
 *
 * DEPLOYMENT NOTE (DEPENDENCY-FIX-001): cloud-dev push via
 * `npx convex dev --once` succeeds after trimming vestigial externalPackages
 * and bundling Mastra/ai SDK deps (tree-shaken) instead of full-package
 * externalization. Spike action is deployable on cloud dev; see
 * evidence/s2-t5-ceilings.json for cold-start + bundle ceiling measurements.
 *
 * Statelessness: the action holds NO per-request state in module scope.
 * All per-session data (sessionId, resolved center) flows through the
 * action's args and return value.
 */

import { v } from 'convex/values'
import { action } from '../../../_generated/server'
import { runSpikeTurn, type SpikeTurnOutput } from './rideAgentSpike'

/**
 * Input validator for the spike action. The workingMemory field is optional
 * (absent on turn 1, present on turn 2+ to thread the resolved center).
 */
const workingMemoryValidator = v.object({
  sessionId: v.string(),
  center: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  place: v.optional(v.string()),
})

export const runSpikeTurnAction = action({
  args: {
    sessionId: v.string(),
    userMessage: v.string(),
    workingMemory: v.optional(workingMemoryValidator),
  },
  handler: async (_ctx, args): Promise<SpikeTurnOutput> => {
    return runSpikeTurn({
      sessionId: args.sessionId,
      userMessage: args.userMessage,
      workingMemory: args.workingMemory,
    })
  },
})
