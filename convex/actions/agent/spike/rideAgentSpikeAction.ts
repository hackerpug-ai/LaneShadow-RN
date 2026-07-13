'use node'

/**
 * S2-T3 — Convex 'use node' action wrapping the stateless ride-agent spike.
 *
 * This is the deployed-action contract: a Convex action that threads
 * per-session working memory through arg/return and delegates to
 * runObservedSpikeTurn (the stateless @mastra/core Agent factory +
 * deterministic working-memory injection in rideAgentSpike.ts).
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
 * The action/tool path is deployable on cloud dev. The latest cold-start
 * evidence is honestly recorded as status='adjust' (coldStartMs=9490ms,
 * above the 8s ceiling); this action does not claim that ceiling is passed.
 *
 * Statelessness: the action holds NO per-request state in module scope.
 * All per-session data (sessionId, resolved center) flows through the
 * action's args and return value.
 *
 * SERIALIZATION (S2-T5-COLDSTART-FIX): the action returns a Convex-wire-safe
 * shape — { text, workingMemory, tripwireHandled } — NOT Mastra's rich
 * FullOutput. FullOutput embeds `messages[].createdAt` as JS Date objects,
 * which Convex's wire format rejects ("Date is not a supported Convex type").
 * runObservedSpikeTurn (the internal library call) still returns the rich type; only
 * this ACTION boundary strips it. See serializeSpikeTurnOutput below.
 */

import { createHash } from 'node:crypto'
import { v } from 'convex/values'
import { internal } from '../../../_generated/api'
import { type ActionCtx, action } from '../../../_generated/server'
import { runObservedSpikeTurn, type SpikeTurnOutput, type WorkingMemory } from './rideAgentSpike'
import {
  createSpikeObservability,
  SPIKE_PROMPT_VERSION,
  SPIKE_TIER,
  type SpikeObservabilityBundle,
} from './spikeObservability'
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

export type SpikeTurnActionArgs = {
  sessionId: string
  userMessage: string
  workingMemory?: WorkingMemory
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

/**
 * Stable OTLP trace ID for a session. The action is stateless: this is a pure
 * derivation, not a module-level session map. A namespaced SHA-256 digest keeps
 * the trace ID stable across turns/deploy invocations while avoiding collisions
 * with unrelated traces; Mastra receives the first 16 bytes as OTLP hex.
 */
export function stableSpikeTraceId(sessionId: string): string {
  return createHash('sha256')
    .update('laneshadow:mastra-spike:session:v1:')
    .update(sessionId)
    .digest('hex')
    .slice(0, 32)
}

/**
 * Flush the conversation's real exporters before the Convex action returns.
 * Observability.flush() drains the exporter bus, while the explicit OTLP flush
 * makes the serverless delivery guarantee visible and testable. Shutdown then
 * releases the per-request observability instance without retaining session
 * state in module scope.
 */
export type FlushableSpikeObservabilityBundle = Pick<
  SpikeObservabilityBundle,
  'observability' | 'otlpExporter'
>

export async function flushSpikeObservability(
  bundle: FlushableSpikeObservabilityBundle,
): Promise<void> {
  let failure: unknown

  try {
    await bundle.observability.flush()
  } catch (error) {
    failure = error
  }

  try {
    await bundle.otlpExporter.flush()
  } catch (error) {
    failure ??= error
  }

  try {
    await bundle.observability.shutdown()
  } catch (error) {
    failure ??= error
  }

  if (failure !== undefined) throw failure
}

export type SpikeActionDependencies = {
  createObservability: typeof createSpikeObservability
  runObservedTurn: typeof runObservedSpikeTurn
  flushObservability: typeof flushSpikeObservability
}

const defaultSpikeActionDependencies: SpikeActionDependencies = {
  createObservability: createSpikeObservability,
  runObservedTurn: runObservedSpikeTurn,
  flushObservability: flushSpikeObservability,
}

/**
 * Build the action handler with injectable seams for deterministic tests.
 * Production uses the real Observability factory, observed Mastra turn path,
 * and exporter flush helper; tests can observe wiring without mocking Mastra
 * or LangSmith itself.
 */
export function createRunSpikeTurnActionHandler(
  overrides: Partial<SpikeActionDependencies> = {},
): (ctx: ActionCtx, args: SpikeTurnActionArgs) => Promise<SpikeTurnActionResult> {
  const dependencies = { ...defaultSpikeActionDependencies, ...overrides }

  return async (ctx, args): Promise<SpikeTurnActionResult> => {
    const observabilityBundle = dependencies.createObservability()

    // REDHAT-RH001: Create the ctx.runQuery seam for searchCuratedRoutes.
    // This replaces the execSync('npx convex run') CLI bridge that fails
    // inside the Convex 'use node' action sandbox (npx is not available).
    // The query function is threaded: action → runObservedSpikeTurn →
    // createRideAgentSpike → createSearchCuratedRoutes → tool.execute.
    const queryNearestCuratedRoutes: QueryNearestCuratedRoutesFn = async (queryArgs) => {
      return await ctx.runQuery(internal.curatedRoutes.listCuratedRoutesInternal, {
        center: queryArgs.center,
        sort: 'nearest',
        limit: queryArgs.limit,
      })
    }

    let primaryFailed = false
    let primaryError: unknown
    let result: SpikeTurnActionResult | undefined

    try {
      const raw = await dependencies.runObservedTurn({
        sessionId: args.sessionId,
        userMessage: args.userMessage,
        workingMemory: args.workingMemory,
        observability: observabilityBundle.observability,
        traceId: stableSpikeTraceId(args.sessionId),
        promptVersion: SPIKE_PROMPT_VERSION,
        tier: SPIKE_TIER,
        queryNearestCuratedRoutes,
      })

      // Strip Mastra's FullOutput (Date-laden) to a Convex-serializable shape
      // BEFORE it crosses the wire.
      result = serializeSpikeTurnOutput(raw)
    } catch (error) {
      // Preserve the model/tool/serialization failure as the action's primary
      // error. If telemetry cleanup also fails, it is attached as `cause`
      // below instead of masking the actionable request failure.
      primaryFailed = true
      primaryError = error
    }

    // Telemetry delivery is awaited before either success or failure leaves
    // the action. This prevents a serverless runtime from dropping spans.
    let flushFailed = false
    let flushError: unknown
    try {
      await dependencies.flushObservability(observabilityBundle)
    } catch (error) {
      flushFailed = true
      flushError = error
    }

    if (primaryFailed) {
      // Preserve the primary error identity for callers/tests while keeping
      // telemetry failure available to diagnostics when the primary error is
      // an Error object. Primitive throws cannot carry a cause safely.
      if (flushFailed && primaryError instanceof Error && !('cause' in primaryError)) {
        Object.defineProperty(primaryError, 'cause', {
          configurable: true,
          enumerable: false,
          value: flushError,
        })
      }
      throw primaryError
    }

    // A successful turn must still surface a failed real exporter; callers
    // should never receive a false-success response when telemetry delivery
    // was rejected.
    if (flushFailed) throw flushError
    return result as SpikeTurnActionResult
  }
}

export const runSpikeTurnActionHandler = createRunSpikeTurnActionHandler()

export const runSpikeTurnAction = action({
  args: {
    sessionId: v.string(),
    userMessage: v.string(),
    workingMemory: v.optional(workingMemoryValidator),
  },
  handler: runSpikeTurnActionHandler,
})
