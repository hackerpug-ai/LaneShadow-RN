'use node'

/**
 * S2-T3 — Convex 'use node' action wrapping the stateless ride-agent spike.
 *
 * This is the deployed-action contract: a Convex action that threads
 * per-session working memory through arg/return and delegates to
 * runSpikeTurn (the stateless @mastra/core Agent factory + deterministic
 * working-memory injection in rideAgentSpike.ts).
 *
 * DEPLOYMENT NOTE: The spike action is FULLY deployable on cloud dev with
 * working tool calls. Three fixes landed to reach this state:
 *   - DEPENDENCY-FIX-001: trimmed vestigial externalPackages + bundled
 *     Mastra/ai SDK deps (tree-shaken) — resolved the 62.79 MiB > 42.92 MiB
 *     ModulesTooLarge error.
 *   - S2-T5-COLDSTART-FIX: serialized the action return to strip Mastra
 *     FullOutput Date objects (Convex wire-format incompatible).
 *   - REDHAT-RH001: replaced the execSync('npx convex run') CLI bridge with
 *     a ctx.runQuery seam — tool calls now work inside the 'use node' sandbox.
 * See evidence/s2-t5-ceilings.json: coldStartMs=2165ms, status='pass'.
 *
 * Statelessness: the action holds NO per-request state in module scope.
 * All per-session data (sessionId, resolved center) flows through the
 * action's args and return value.
 *
 * SERIALIZATION (S2-T5-COLDSTART-FIX): the action returns a Convex-wire-safe
 * shape — { text, workingMemory, tripwireHandled } — NOT Mastra's rich
 * FullOutput. FullOutput embeds `messages[].createdAt` as JS Date objects,
 * which Convex's wire format rejects ("Date is not a supported Convex type").
 * runSpikeTurn (the internal library call) still returns the rich type; only
 * this ACTION boundary strips it. See serializeSpikeTurnOutput below.
 */

import { v } from 'convex/values'
import { internal } from '../../../_generated/api'
import { action } from '../../../_generated/server'
import { runSpikeTurn, type SpikeTurnOutput, type WorkingMemory } from './rideAgentSpike'
import type { QueryNearestCuratedRoutesFn } from './spikeTools'

/**
 * Input validator for the spike action. The workingMemory field is optional
 * (absent on turn 1, present on turn 2+ to thread the resolved center).
 */
const workingMemoryValidator = v.object({
  sessionId: v.string(),
  center: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  place: v.optional(v.string()),
})

/**
 * The Convex-serializable return shape of the spike action. This is the
 * CONTRACT callers see across the wire — it deliberately omits Mastra's
 * FullOutput (which carries non-serializable Date objects).
 */
export type SpikeTurnActionResult = {
  text: string
  workingMemory: WorkingMemory
  tripwireHandled: boolean
}

/**
 * Pure transform: strip a SpikeTurnOutput down to the Convex-wire-safe
 * SpikeTurnActionResult. Mastra's FullOutput embeds `messages[].createdAt`
 * as JS Date objects; Convex's wire format cannot transport Dates, so only
 * the three fields the caller needs cross the boundary.
 *
 * Pure (zero I/O): same input always produces the same output. Unit-tested
 * directly in rideAgentSpikeAction.serialization.test.ts.
 *
 * Edge case: if `result.text` is undefined (a Mastra edge case), defaults
 * to empty string — never throws at the serialization boundary.
 */
export function serializeSpikeTurnOutput(output: SpikeTurnOutput): SpikeTurnActionResult {
  return {
    text: output.result.text ?? '',
    workingMemory: output.workingMemory,
    tripwireHandled: output.tripwireHandled,
  }
}

export const runSpikeTurnAction = action({
  args: {
    sessionId: v.string(),
    userMessage: v.string(),
    workingMemory: v.optional(workingMemoryValidator),
  },
  handler: async (ctx, args): Promise<SpikeTurnActionResult> => {
    // REDHAT-RH001: Create the ctx.runQuery seam for searchCuratedRoutes.
    // This replaces the execSync('npx convex run') CLI bridge that fails
    // inside the Convex 'use node' action sandbox (npx is not available).
    // The query function is threaded: action → runSpikeTurn →
    // createRideAgentSpike → createSearchCuratedRoutes → tool.execute.
    const queryNearestCuratedRoutes: QueryNearestCuratedRoutesFn = async (queryArgs) => {
      return await ctx.runQuery(internal.curatedRoutes.listCuratedRoutesInternal, {
        center: queryArgs.center,
        sort: 'nearest',
        limit: queryArgs.limit,
      })
    }

    const raw = await runSpikeTurn({
      sessionId: args.sessionId,
      userMessage: args.userMessage,
      workingMemory: args.workingMemory,
      queryNearestCuratedRoutes,
    })
    // Strip Mastra's FullOutput (Date-laden) to a Convex-serializable shape
    // BEFORE it crosses the wire.
    return serializeSpikeTurnOutput(raw)
  },
})
