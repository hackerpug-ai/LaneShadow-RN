'use node'

/**
 * S2-T3 — Convex 'use node' action wrapping the stateless ride-agent spike.
 *
 * This is the deployed-action contract: a Convex action that threads
 * per-session working memory through arg/return and delegates to
 * runSpikeTurn (the stateless @mastra/core Agent factory + deterministic
 * working-memory injection in rideAgentSpike.ts).
 *
 * ⚠️  DEPLOYMENT NOTE: `npx convex dev` is currently broken (ModulesTooLarge
 * — 61.82 MiB > 42.92 MiB max, a pre-existing infra blocker from S2-T1's
 * large externalPackages additions). This action CANNOT be deployed to the
 * dev deployment yet. The integration tests in
 * __tests__/rideAgentSpike.integration.test.ts construct the Agent in-process
 * (Node.js context) and call runSpikeTurn directly — proving the Mastra
 * Agent works with the orchestrator tier and S2-T2's tools, even though
 * this Convex action can't be deployed yet. Once the ModulesTooLarge blocker
 * is resolved, this action will be deployable as-is.
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
