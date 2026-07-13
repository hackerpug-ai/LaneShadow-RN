'use node'

/**
 * S2-T3 — Stateless @mastra/core Agent for the Mastra-in-Convex spike.
 *
 * This module proves @mastra/core's Agent runs correctly when constructed
 * inside a Convex 'use node' action (rideAgentSpikeAction.ts): a stateless
 * Agent on the orchestrator tier (ModelRouter string from lib/models.ts)
 * with S2-T2's tools (geocodePlace + searchCuratedRoutes) and memory:undefined.
 *
 * STATELESSNESS CONTRACT (risk #17 — the pendingSketches singleton-bleed
 * anti-pattern in routingAgent.ts:70-95 is the cited precedent we DO NOT
 * repeat):
 *
 *   The Agent singleton holds ZERO per-request state. All per-session data
 *   (sessionId, resolved center, prior turns) flows through RequestContext
 *   (per-call) and the working-memory seam (arg/return). No per-request
 *   identifier lives in module scope.
 *
 * 2-TURN CENTER INHERITANCE (risk #16 — memory:undefined, deterministic
 * working memory rides the session):
 *
 *   After turn 1 resolves the Ogden center via the real geocodePlace tool,
 *   the center is captured in a per-session WorkingMemory object threaded
 *   through the action (arg/return). Turn 2 receives this WorkingMemory,
 *   injects the center into a RequestContext, and the Agent's instructions
 *   function reads it to build a dynamic prompt block — "USE THIS INHERITED
 *   CENTER for searchCuratedRoutes." No @mastra/memory adapter is involved.
 *
 * TRIPWIRE HANDLING:
 *
 *   Every agent.generate call site checks result.tripwire (and
 *   result.finishReason === 'other'). A blocked turn is surfaced via
 *   tripwireHandled=true — never silently treated as a normal reply.
 *
 * ESCAPE HATCH (constraint #8):
 *
 *   If the orchestrator tier ModelRouter string doesn't resolve (throws
 *   during generate), runSpikeTurn catches the error and retries with an
 *   explicit AI-SDK model instance: anthropic('claude-sonnet-4-6') from
 *   the already-installed @ai-sdk/anthropic.
 */

import { anthropic } from '@ai-sdk/anthropic'
import { Mastra } from '@mastra/core'
import { Agent } from '@mastra/core/agent'
import { RequestContext } from '@mastra/core/request-context'
import type { FullOutput } from '@mastra/core/stream'
import type { Observability } from '@mastra/observability'
import { getOrchestratorModel } from '../lib/models'
import {
  createSearchCuratedRoutes,
  geocodePlace,
  type QueryNearestCuratedRoutesFn,
} from './spikeTools'

// ─────────────────────────────────────────────────────────────────────────
// Types — the deterministic working-memory seam
// ─────────────────────────────────────────────────────────────────────────

export type GeoPoint = { lat: number; lng: number }

/**
 * Per-session deterministic working memory — threaded through the action
 * (arg/return), NEVER stored in module scope. This replaces @mastra/memory
 * for the spike: the resolved center from turn 1 is captured here and
 * injected into turn 2 via RequestContext.
 */
export type WorkingMemory = {
  sessionId: string
  center?: GeoPoint
  place?: string
}

export type SpikeTurnInput = {
  sessionId: string
  userMessage: string
  /** Threaded from a prior turn's output — carries the resolved center. */
  workingMemory?: WorkingMemory
  /**
   * Escape hatch: an explicit AI-SDK model instance (e.g.
   * anthropic('claude-sonnet-4-6')). When provided, the Agent uses this
   * instead of the orchestrator tier ModelRouter string.
   */
  modelOverride?: Parameters<typeof anthropic>[0] extends string ? never : never
  /**
   * REDHAT-RH001: Query function for searchCuratedRoutes. When provided
   * (deployed action), the tool uses `ctx.runQuery` for a direct in-runtime
   * call. When omitted (vitest), falls back to the CLI bridge.
   */
  queryNearestCuratedRoutes?: QueryNearestCuratedRoutesFn
}

export type SpikeTurnOutput = {
  result: FullOutput<undefined>
  workingMemory: WorkingMemory
  /** True when result.tripwire was set (or finishReason === 'other'). */
  tripwireHandled: boolean
}

// ─────────────────────────────────────────────────────────────────────────
// Stateless Agent singleton
// ─────────────────────────────────────────────────────────────────────────

/**
 * The stateless Agent singleton. Cached at module level — but holds ZERO
 * per-request state. The model, tools, and instructions function are all
 * stateless. Per-request data (sessionId, resolved center) flows through
 * RequestContext on each generate() call.
 *
 * This is NOT the pendingSketches anti-pattern: that Map stored per-session
 * mutable state in module scope. This singleton stores nothing per-request —
 * it's just the Agent configuration.
 */
let agentSingleton: Agent | undefined

/**
 * Factory for the stateless ride-agent spike.
 *
 * @param modelOverride — when provided, returns a NEW Agent instance using
 *   the explicit AI-SDK model instance (the escape hatch). When omitted,
 *   returns the cached singleton using the orchestrator tier string.
 * @param queryNearestCuratedRoutes — REDHAT-RH001: when provided (deployed
 *   action), the searchCuratedRoutes tool uses `ctx.runQuery` for a direct
 *   in-runtime call. When omitted (vitest), falls back to the CLI bridge.
 *   A non-undefined value forces a fresh Agent (no singleton cache) so the
 *   ctx.runQuery seam is always wired.
 */
export function createRideAgentSpike(
  modelOverride?: unknown,
  queryNearestCuratedRoutes?: QueryNearestCuratedRoutesFn,
): Agent {
  const tools = {
    geocodePlace,
    searchCuratedRoutes: createSearchCuratedRoutes(queryNearestCuratedRoutes),
  }

  // Escape hatch: explicit AI-SDK model instance
  if (modelOverride !== undefined) {
    return new Agent({
      id: 'ride-agent-spike' as const,
      name: 'Ride Agent Spike',
      instructions: ({ requestContext }) => buildInstructions(requestContext),
      model: modelOverride as any,
      tools,
      memory: undefined,
    })
  }

  // REDHAT-RH001: when a queryFn is provided (deployed action), always
  // create a fresh Agent so the ctx.runQuery seam is wired. The singleton
  // cache is only safe for the default vitest path (CLI bridge, no queryFn).
  if (queryNearestCuratedRoutes !== undefined) {
    return new Agent({
      id: 'ride-agent-spike' as const,
      name: 'Ride Agent Spike',
      instructions: ({ requestContext }) => buildInstructions(requestContext),
      model: getOrchestratorModel(),
      tools,
      memory: undefined,
    })
  }

  if (!agentSingleton) {
    agentSingleton = new Agent({
      id: 'ride-agent-spike' as const,
      name: 'Ride Agent Spike',
      instructions: ({ requestContext }) => buildInstructions(requestContext),
      // The orchestrator tier ModelRouter STRING from S2-T1's getOrchestratorModel().
      // No provider/model literal outside the tier map (constraint #2).
      model: getOrchestratorModel(),
      tools,
      // memory: undefined — NO @mastra/memory anywhere (risk #16 resolution).
      // Deterministic working memory rides the session via RequestContext.
      memory: undefined,
    })
  }
  return agentSingleton
}

// ─────────────────────────────────────────────────────────────────────────
// Dynamic instructions — the deterministic working-memory injection seam
// ─────────────────────────────────────────────────────────────────────────

/**
 * Build the agent instructions dynamically from the per-call RequestContext.
 *
 * When a resolved center is present (turn 2+), it is injected as a dynamic
 * prompt block telling the agent to use the INHERITED CENTER — not re-geocode
 * and not fall back to a statewide/national search. This is the deterministic
 * working-memory seam: the center flows requestContext → instructions → prompt.
 *
 * No @mastra/memory involved. The instructions function is pure: same
 * requestContext always produces the same prompt.
 */
function buildInstructions(requestContext: RequestContext): string {
  const sessionId = requestContext.get('sessionId') as string | undefined
  const resolvedCenter = requestContext.get('resolvedCenter') as GeoPoint | undefined

  const base = `You are a motorcycle route discovery assistant for the LaneShadow app.

WORKFLOW (always follow this order):
1. If the rider names a place, call geocodePlace with the place name to resolve it to a lat/lng center.
2. Then call searchCuratedRoutes with the resolved center and radiusMi=50.
3. Present the results concisely (1-2 sentences).

CRITICAL RULES:
- ALWAYS pass the resolved center to searchCuratedRoutes — NEVER omit it. A missing center causes a silent statewide/national fallback (the original bug we are fixing).
- If the rider says "what's scenic" or "show me options" without naming a NEW place, use the INHERITED CENTER from prior context (provided below) — do NOT re-geocode.
- radiusMi should be 50 unless the rider specifies otherwise.
- After presenting results, stop — do not call more tools than needed.`

  if (resolvedCenter) {
    return `${base}

INHERITED CENTER (session ${sessionId ?? 'unknown'}):
The rider's previous turn resolved a center at lat ${resolvedCenter.lat}, lng ${resolvedCenter.lng}.
For this follow-up turn, USE THIS INHERITED CENTER for searchCuratedRoutes — do NOT call geocodePlace again unless the rider explicitly names a DIFFERENT place.
Pass center: { lat: ${resolvedCenter.lat}, lng: ${resolvedCenter.lng} } to searchCuratedRoutes.`
  }

  return base
}

// ─────────────────────────────────────────────────────────────────────────
// runSpikeTurn — the core turn logic (stateless, per-call)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Run one turn of the ride-agent spike.
 *
 * Fully stateless: all per-session data (sessionId, resolved center) flows
 * through the input args and the per-call RequestContext. The working memory
 * is threaded through arg/return — never module scope.
 *
 * Tripwire handling: checks result.tripwire (and finishReason === 'other')
 * on every generate. A blocked turn returns tripwireHandled=true.
 *
 * Escape hatch: if the orchestrator tier string doesn't resolve (throws
 * during generate), retries with anthropic('claude-sonnet-4-6').
 */
export async function runSpikeTurn(input: SpikeTurnInput): Promise<SpikeTurnOutput> {
  // Build per-session working memory (threaded through arg/return, NOT module scope)
  const workingMemory: WorkingMemory = input.workingMemory
    ? { ...input.workingMemory }
    : { sessionId: input.sessionId }

  // Build per-call RequestContext — carries sessionId + resolved center
  // into the instructions function. This is the deterministic working-memory
  // injection seam.
  const requestContext = new RequestContext()
  requestContext.set('sessionId', input.sessionId)
  if (workingMemory.center) {
    requestContext.set('resolvedCenter', workingMemory.center)
  }

  // Get the stateless agent (singleton by default, override for escape hatch)
  let agent = createRideAgentSpike(input.modelOverride, input.queryNearestCuratedRoutes)
  let result: FullOutput<undefined>

  try {
    result = await agent.generate(input.userMessage, {
      requestContext,
      maxSteps: 5,
    })
  } catch (err) {
    // Escape hatch (constraint #8): if the orchestrator tier ModelRouter
    // string doesn't resolve, retry with an explicit AI-SDK model instance.
    const errorMessage = err instanceof Error ? err.message : String(err)
    const isModelResolutionError =
      errorMessage.toLowerCase().includes('model') ||
      errorMessage.toLowerCase().includes('provider') ||
      errorMessage.toLowerCase().includes('resolve') ||
      errorMessage.toLowerCase().includes('unsupported')

    if (!isModelResolutionError) {
      throw err
    }

    agent = createRideAgentSpike(anthropic('claude-sonnet-4-6'), input.queryNearestCuratedRoutes)
    result = await agent.generate(input.userMessage, {
      requestContext,
      maxSteps: 5,
    })
  }

  // Handle tripwire at the call site (never silently drop — constraint #7)
  const tripwireHandled = Boolean(result.tripwire) || result.finishReason === 'other'

  // Extract resolved center from geocodePlace tool result, update working memory.
  // The geocodePlace tool returns { ok: true, center: {lat, lng}, formattedAddress }
  // via its errors-as-data contract.
  if (!tripwireHandled) {
    for (const toolResult of result.toolResults ?? []) {
      const payload = (toolResult as { payload?: { toolName?: string; result?: unknown } }).payload
      if (!payload) continue
      if (payload.toolName === 'geocodePlace') {
        const geocodeResult = payload.result as
          | { ok: true; center: GeoPoint; formattedAddress: string }
          | { ok: false; errorCode: string; message: string }
          | undefined
        if (geocodeResult?.ok === true) {
          workingMemory.center = geocodeResult.center
          workingMemory.place = geocodeResult.formattedAddress
        }
        break
      }
    }
  }

  return { result, workingMemory, tripwireHandled }
}

// ─────────────────────────────────────────────────────────────────────────
// S2-T4 — Observed spike turn (Mastra Observability attached)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Input for an observed spike turn — same as SpikeTurnInput but with the
 * Observability instance and trace stamping parameters.
 */
export type ObservedSpikeTurnInput = {
  sessionId: string
  userMessage: string
  /** Threaded from a prior turn's output — carries the resolved center. */
  workingMemory?: WorkingMemory
  /** The Observability bundle to attach (from createSpikeObservability). */
  observability: Observability
  /** OTLP-compatible trace ID (32 hex chars) — shared across both turns. */
  traceId: string
  /** Prompt version stamp — emitted on every span via requestContextKeys. */
  promptVersion: string
  /** Tier stamp — emitted on every span via requestContextKeys. */
  tier: string
  /**
   * REDHAT-RH001: Query function for searchCuratedRoutes. When provided
   * (deployed action), uses ctx.runQuery. When omitted (vitest), CLI bridge.
   */
  queryNearestCuratedRoutes?: QueryNearestCuratedRoutesFn
}

/**
 * Cached Mastra instance keyed by the Observability object. Creating a new
 * Mastra on every turn would re-register the agent singleton unnecessarily.
 * The WeakMap ensures the cache doesn't leak when the observability is GC'd.
 */
const observedMastraCache = new WeakMap<Observability, Mastra>()

/**
 * Get (or create) a Mastra instance with the spike Agent registered and the
 * given Observability attached. The Mastra constructor wires the observability
 * to the Agent — after that, agent.generate() emits spans through both
 * exporters (OTLP→LangSmith + TestExporter capture).
 */
function getObservedMastra(
  observability: Observability,
  queryFn?: QueryNearestCuratedRoutesFn,
): Mastra {
  let mastra = observedMastraCache.get(observability)
  if (!mastra) {
    mastra = new Mastra({
      agents: {
        rideAgent: createRideAgentSpike(undefined, queryFn),
      },
      observability,
    })
    observedMastraCache.set(observability, mastra)
  }
  return mastra
}

/**
 * Run one turn of the ride-agent spike WITH Mastra Observability attached.
 *
 * This is the S2-T4 observed path — the same stateless Agent + tools +
 * deterministic working-memory seam as runSpikeTurn, but wrapped in a Mastra
 * instance with Observability (OTLP→LangSmith + SensitiveDataFilter + capture).
 *
 * Spans are emitted for:
 * - agent_run (root): input/reply sizes, finishReason, step count
 * - model_generation (model): model id, tokens, cost, latency
 * - tool_call (tool): name, arg/result sizes, latency, error code
 *
 * Each span is stamped with promptVersion/sessionId/tier via the
 * requestContextKeys config on the Observability instance.
 *
 * The traceId is shared across both turns so the entire 2-turn conversation
 * exports as a SINGLE trace to LangSmith.
 */
export async function runObservedSpikeTurn(
  input: ObservedSpikeTurnInput,
): Promise<SpikeTurnOutput> {
  const mastra = getObservedMastra(input.observability, input.queryNearestCuratedRoutes)
  const agent = mastra.getAgent('rideAgent')

  // Build per-session working memory (threaded through arg/return, NOT module scope)
  const workingMemory: WorkingMemory = input.workingMemory
    ? { ...input.workingMemory }
    : { sessionId: input.sessionId }

  // Build per-call RequestContext — carries sessionId + resolved center +
  // the promptVersion/tier stamps that the observability's requestContextKeys
  // will auto-extract as metadata on ALL spans.
  const requestContext = new RequestContext()
  requestContext.set('sessionId', input.sessionId)
  requestContext.set('promptVersion', input.promptVersion)
  requestContext.set('tier', input.tier)
  if (workingMemory.center) {
    requestContext.set('resolvedCenter', workingMemory.center)
  }

  let result: FullOutput<undefined>

  try {
    result = await agent.generate(input.userMessage, {
      requestContext,
      maxSteps: 5,
      tracingOptions: {
        traceId: input.traceId,
        metadata: {
          promptVersion: input.promptVersion,
          sessionId: input.sessionId,
          tier: input.tier,
        },
      },
    })
  } catch (err) {
    // Escape hatch (constraint #8): if the orchestrator tier ModelRouter
    // string doesn't resolve, retry with an explicit AI-SDK model instance.
    const errorMessage = err instanceof Error ? err.message : String(err)
    const isModelResolutionError =
      errorMessage.toLowerCase().includes('model') ||
      errorMessage.toLowerCase().includes('provider') ||
      errorMessage.toLowerCase().includes('resolve') ||
      errorMessage.toLowerCase().includes('unsupported')

    if (!isModelResolutionError) {
      throw err
    }

    // Create a fresh agent with the escape-hatch model, still under the
    // observed Mastra instance so spans are emitted.
    const escapeAgent = new Agent({
      id: 'ride-agent-spike' as const,
      name: 'Ride Agent Spike',
      instructions: ({ requestContext: rc }) => buildInstructions(rc),
      model: anthropic('claude-sonnet-4-6'),
      tools: {
        geocodePlace,
        searchCuratedRoutes: createSearchCuratedRoutes(input.queryNearestCuratedRoutes),
      },
      memory: undefined,
    })

    result = await escapeAgent.generate(input.userMessage, {
      requestContext,
      maxSteps: 5,
      tracingOptions: {
        traceId: input.traceId,
        metadata: {
          promptVersion: input.promptVersion,
          sessionId: input.sessionId,
          tier: input.tier,
        },
      },
    })
  }

  // Handle tripwire at the call site (never silently drop — constraint #7)
  const tripwireHandled = Boolean(result.tripwire) || result.finishReason === 'other'

  // Extract resolved center from geocodePlace tool result, update working memory
  if (!tripwireHandled) {
    for (const toolResult of result.toolResults ?? []) {
      const payload = (toolResult as { payload?: { toolName?: string; result?: unknown } }).payload
      if (!payload) continue
      if (payload.toolName === 'geocodePlace') {
        const geocodeResult = payload.result as
          | { ok: true; center: GeoPoint; formattedAddress: string }
          | { ok: false; errorCode: string; message: string }
          | undefined
        if (geocodeResult?.ok === true) {
          workingMemory.center = geocodeResult.center
          workingMemory.place = geocodeResult.formattedAddress
        }
        break
      }
    }
  }

  return { result, workingMemory, tripwireHandled }
}
