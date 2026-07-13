/**
 * S2-T3 — Integration tests for the stateless @mastra/core ride-agent spike.
 *
 * REAL SERVICES ONLY — no mocks. AC-1..AC-4 hit the REAL Anthropic API
 * (orchestrator tier ModelRouter string from lib/models.ts), the REAL Google
 * Geocoding API (via geocodePlace from S2-T2's spikeTools), and the REAL
 * Convex cloud-dev deployment's curated_routes catalog (via searchCuratedRoutes
 * from S2-T2's spikeTools). The deployed action now uses an injected
 * `ctx.runQuery` callback for its tool path; these Vitest tests run the Agent
 * loop in-process and use the documented CLI fallback for the same catalog.
 *
 * Deployment status: the cloud-dev action and its tool-call path are working
 * after the dependency and action-return serialization fixes. Keeping these
 * assertions in-process makes the Mastra loop and tool-call arguments easy to
 * inspect without changing the deployed-action evidence.
 *
 * Statelessness contract (risk #17): the Agent singleton holds ZERO per-request
 * state. All per-session data (sessionId, resolved center) flows through
 * RequestContext and per-call messages. AC-3 proves this by running two
 * concurrent sessions through the same agent instance and verifying no bleed.
 *
 * Reference: .spec/prds/route-agent-quality/tasks/sprint-02-mastra-reference-spike/
 *            S2-T3-rideagentspike-ts-stateless-mastra-core-agent-in-a-use-node-action-2-turn-ogden-.md
 *
 * Environment: @vitest-environment node — geocodePlace makes a real un-mocked
 * fetch() and jsdom's AbortSignal identity doesn't match Node's undici fetch
 * (same quirk as S2-T2's spikeTools.integration.test.ts).
 */
// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { ANTHROPIC_API_KEY } from '../../../../lib/env'
import { createRideAgentSpike, runSpikeTurn } from '../rideAgentSpike'

const hasAnthropicKey = Boolean(ANTHROPIC_API_KEY)

// Real Anthropic + real Google + real Convex cloud-dev catalog round-trip — generous timeout.
const REAL_SERVICE_TIMEOUT_MS = 120_000

// Ogden center bounds (from the task's MUST_OBSERVE)
const OGDEN_LAT_MIN = 41.1
const OGDEN_LAT_MAX = 41.35
const OGDEN_LNG_MIN = -112.1
const OGDEN_LNG_MAX = -111.85

// Sacramento center bounds (from AC-3 MUST_OBSERVE)
const SAC_LAT_MIN = 38.4
const SAC_LAT_MAX = 38.75

/**
 * Extract the searchCuratedRoutes tool-call's center argument from a
 * Mastra FullOutput. Returns the FIRST searchCuratedRoutes call whose args
 * contain a center object, or undefined if none.
 *
 * We assert on the TOOL-CALL ARGUMENTS (engine outcome), never the assistant
 * prose — per the E2E constitution (task MUST_NOT_OBSERVE: "read/assert on
 * the reply PROSE for the center").
 */
function extractSearchCenter(result: {
  toolCalls: Array<{ payload: { toolName: string; args?: unknown } }>
}): { lat: number; lng: number } | undefined {
  for (const call of result.toolCalls ?? []) {
    if (call.payload.toolName === 'searchCuratedRoutes') {
      const args = call.payload.args as { center?: { lat: number; lng: number } } | undefined
      if (
        args?.center &&
        typeof args.center.lat === 'number' &&
        typeof args.center.lng === 'number'
      ) {
        return args.center
      }
    }
  }
  return undefined
}

/**
 * Extract the geocodePlace tool-call's place argument.
 */
function extractGeocodePlace(result: {
  toolCalls: Array<{ payload: { toolName: string; args?: unknown } }>
}): string | undefined {
  for (const call of result.toolCalls ?? []) {
    if (call.payload.toolName === 'geocodePlace') {
      const args = call.payload.args as { place?: string } | undefined
      return args?.place
    }
  }
  return undefined
}

describe('S2-T3 rideAgentSpike — stateless @mastra/core Agent, 2-turn Ogden center inheritance', () => {
  if (!hasAnthropicKey) {
    it.skip('SKIP: ANTHROPIC_API_KEY is absent — integration test requires real Anthropic API', () => {})
    return
  }

  // -------------------------------------------------------------------------
  // AC-1 — Turn 1 'twisty roads near Ogden' geocodes Ogden and calls
  // searchCuratedRoutes with the resolved Ogden center.
  // -------------------------------------------------------------------------
  describe('AC-1: turn 1 grounds the search in the resolved Ogden center', () => {
    it(
      'calls geocodePlace then searchCuratedRoutes with center resolved to Ogden',
      async () => {
        const { result, workingMemory } = await runSpikeTurn({
          sessionId: 'spike-ogden-1',
          userMessage: 'twisty roads near Ogden',
        })

        // MUST_OBSERVE: geocodePlace was called with a place containing "Ogden"
        const geocodePlaceArg = extractGeocodePlace(result)
        expect(geocodePlaceArg).toBeDefined()
        expect(geocodePlaceArg!.toLowerCase()).toContain('ogden')

        // MUST_OBSERVE: searchCuratedRoutes tool-call center is in Ogden bounds
        const searchCenter = extractSearchCenter(result)
        expect(searchCenter, 'searchCuratedRoutes tool-call must carry a center').toBeDefined()
        expect(searchCenter!.lat).toBeGreaterThanOrEqual(OGDEN_LAT_MIN)
        expect(searchCenter!.lat).toBeLessThanOrEqual(OGDEN_LAT_MAX)
        expect(searchCenter!.lng).toBeGreaterThanOrEqual(OGDEN_LNG_MIN)
        expect(searchCenter!.lng).toBeLessThanOrEqual(OGDEN_LNG_MAX)

        // MUST_OBSERVE: finishReason is a real terminal reason
        expect(['stop', 'tool-calls']).toContain(result.finishReason)

        // MUST_OBSERVE: at least one tool-call was made (the agent loop ran)
        expect(result.toolCalls.length).toBeGreaterThanOrEqual(1)

        // MUST_NOT_OBSERVE: searchCuratedRoutes center === undefined
        expect(searchCenter, 'center must NOT be undefined (no statewide devolution)').toBeDefined()

        // Working memory captured the resolved Ogden center
        expect(workingMemory.center).toBeDefined()
        expect(workingMemory.center!.lat).toBeGreaterThanOrEqual(OGDEN_LAT_MIN)
        expect(workingMemory.center!.lat).toBeLessThanOrEqual(OGDEN_LAT_MAX)

        // EVIDENCE: seeded MUST_OBSERVE values for scenario validation
        // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-1 scenario
        console.log(
          JSON.stringify({
            ac: 'AC-1',
            geocodePlaceArg,
            searchCenter,
            workingMemoryCenter: workingMemory.center,
            finishReason: result.finishReason,
            toolCallCount: result.toolCalls.length,
            toolCallNames: result.toolCalls.map((c: any) => c.payload.toolName),
          }),
        )
      },
      REAL_SERVICE_TIMEOUT_MS,
    )
  })

  // -------------------------------------------------------------------------
  // AC-2 — Turn 2 'OK what's scenic' in the same session inherits the Ogden
  // center via deterministic working memory (memory: undefined).
  // -------------------------------------------------------------------------
  describe('AC-2: turn 2 inherits the Ogden center via deterministic working memory', () => {
    it(
      'turn 2 searchCuratedRoutes carries inherited Ogden center; memory===undefined',
      async () => {
        // Turn 1 — resolve Ogden
        const turn1 = await runSpikeTurn({
          sessionId: 'spike-ogden-1',
          userMessage: 'twisty roads near Ogden',
        })
        expect(turn1.workingMemory.center, 'turn 1 must resolve a center').toBeDefined()

        const turn1Center = turn1.workingMemory.center!

        // Turn 2 — thread turn-1 working memory into the same session
        const { result: turn2Result, workingMemory: turn2WorkingMemory } = await runSpikeTurn({
          sessionId: 'spike-ogden-1',
          userMessage: "OK what's scenic",
          workingMemory: turn1.workingMemory,
        })

        // MUST_OBSERVE: turn 2's searchCuratedRoutes tool-call carries the
        // inherited Ogden center (not undefined / statewide devolution)
        const turn2SearchCenter = extractSearchCenter(turn2Result)
        expect(
          turn2SearchCenter,
          'turn 2 must call searchCuratedRoutes with a center',
        ).toBeDefined()
        expect(turn2SearchCenter!.lat).toBeGreaterThanOrEqual(OGDEN_LAT_MIN)
        expect(turn2SearchCenter!.lat).toBeLessThanOrEqual(OGDEN_LAT_MAX)
        expect(turn2SearchCenter!.lng).toBeGreaterThanOrEqual(OGDEN_LNG_MIN)
        expect(turn2SearchCenter!.lng).toBeLessThanOrEqual(OGDEN_LNG_MAX)

        // MUST_OBSERVE: persisted working-memory center within 0.05 deg of turn 1
        expect(turn2WorkingMemory.center).toBeDefined()
        expect(Math.abs(turn2WorkingMemory.center!.lat - turn1Center.lat)).toBeLessThanOrEqual(0.05)
        expect(Math.abs(turn2WorkingMemory.center!.lng - turn1Center.lng)).toBeLessThanOrEqual(0.05)

        // MUST_OBSERVE: agent.memory === undefined (no @mastra/memory adapter)
        const agent = createRideAgentSpike()
        expect((agent as any).memory).toBeUndefined()
        expect(agent.hasOwnMemory()).toBe(false)
        expect(await agent.getMemory()).toBeUndefined()

        // MUST_NOT_OBSERVE: turn 2 center === undefined (statewide devolution)
        expect(turn2SearchCenter, 'turn 2 center must NOT be undefined').toBeDefined()

        // EVIDENCE
        // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-2 scenario
        console.log(
          JSON.stringify({
            ac: 'AC-2',
            turn1Center,
            turn2SearchCenter,
            turn2WorkingMemoryCenter: turn2WorkingMemory.center,
            centerDeltaLat: Math.abs(turn2WorkingMemory.center!.lat - turn1Center.lat),
            centerDeltaLng: Math.abs(turn2WorkingMemory.center!.lng - turn1Center.lng),
            agentMemoryUndefined: (agent as any).memory === undefined,
            agentHasOwnMemory: agent.hasOwnMemory(),
            finishReason: turn2Result.finishReason,
          }),
        )
      },
      REAL_SERVICE_TIMEOUT_MS * 2,
    )
  })

  // -------------------------------------------------------------------------
  // AC-3 — Concurrent Sacramento session does NOT inherit Ogden.
  // Both sessions run through the SAME module-level Agent singleton.
  // -------------------------------------------------------------------------
  describe('AC-3: concurrent sessions do not bleed center through the singleton', () => {
    it(
      'Sacramento resolves ~38.58 while Ogden stays ~41.22 — centers differ by >2 deg',
      async () => {
        // Run both sessions concurrently through the same agent instance.
        // Promise.all truly interleaves them — the strongest test of no-bleed.
        const [ogdenResult, sacResult] = await Promise.all([
          runSpikeTurn({
            sessionId: 'spike-ogden-1',
            userMessage: 'twisty roads near Ogden',
          }),
          runSpikeTurn({
            sessionId: 'spike-sac-2',
            userMessage: 'scenic roads near Sacramento',
          }),
        ])

        // MUST_OBSERVE: Sacramento session resolves Sacramento
        const sacCenter = sacResult.workingMemory.center
        expect(sacCenter, 'Sacramento session must resolve a center').toBeDefined()
        expect(sacCenter!.lat).toBeGreaterThanOrEqual(SAC_LAT_MIN)
        expect(sacCenter!.lat).toBeLessThanOrEqual(SAC_LAT_MAX)

        // MUST_OBSERVE: Ogden session stays Ogden
        const ogdenCenter = ogdenResult.workingMemory.center
        expect(ogdenCenter, 'Ogden session must resolve a center').toBeDefined()
        expect(ogdenCenter!.lat).toBeGreaterThanOrEqual(OGDEN_LAT_MIN)
        expect(ogdenCenter!.lat).toBeLessThanOrEqual(OGDEN_LAT_MAX)

        // MUST_OBSERVE: the two centers differ by >2 deg latitude
        expect(Math.abs(ogdenCenter!.lat - sacCenter!.lat)).toBeGreaterThan(2)

        // MUST_NOT_OBSERVE: Sacramento inherited Ogden
        expect(sacCenter!.lat).toBeLessThan(OGDEN_LAT_MIN)

        // MUST_NOT_OBSERVE: Sacramento working-memory center is empty/null
        expect(sacCenter).toBeDefined()

        // No per-request identifier in module scope — verified by static grep
        // in the verification gates. Here we verify dynamically that two
        // concurrent calls through the same singleton produce independent results.

        // EVIDENCE
        // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-3 scenario
        console.log(
          JSON.stringify({
            ac: 'AC-3',
            ogdenCenter,
            sacCenter,
            latDelta: Math.abs(ogdenCenter!.lat - sacCenter!.lat),
            ogdenSearchCenter: extractSearchCenter(ogdenResult.result),
            sacSearchCenter: extractSearchCenter(sacResult.result),
          }),
        )
      },
      REAL_SERVICE_TIMEOUT_MS * 2,
    )
  })

  // -------------------------------------------------------------------------
  // AC-4 — Orchestrator tier resolves one real completion; tripwire handled.
  // -------------------------------------------------------------------------
  describe('AC-4: orchestrator tier resolves a real completion and tripwire is handled', () => {
    it(
      'finishReason in {stop, tool-calls}; call site branches on result.tripwire',
      async () => {
        const { result, tripwireHandled } = await runSpikeTurn({
          sessionId: 'spike-tier-probe',
          userMessage: 'Reply with the single word OK.',
        })

        // MUST_OBSERVE: a real completion resolved (not empty)
        expect(result.text.length >= 1 || result.toolCalls.length >= 1).toBe(true)

        // MUST_OBSERVE: finishReason is a real terminal reason
        expect(['stop', 'tool-calls']).toContain(result.finishReason)

        // MUST_OBSERVE: the call site branched on result.tripwire
        // tripwireHandled is true when result.tripwire is set (or finishReason === 'other'),
        // false when result.tripwire === undefined. Either way, the call site
        // inspected it — never silently dropped.
        expect(typeof tripwireHandled).toBe('boolean')

        // If tripwire is undefined, tripwireHandled must be false (normal path).
        // If tripwire is set, tripwireHandled must be true (blocked path).
        if (result.tripwire === undefined) {
          expect(tripwireHandled).toBe(false)
        } else {
          expect(tripwireHandled).toBe(true)
        }

        // MUST_NOT_OBSERVE: empty completion (tier did not resolve)
        expect(result.text === '' && result.toolCalls.length === 0).toBe(false)

        // MUST_NOT_OBSERVE: finishReason === 'other' with tripwire unread
        if (result.finishReason === 'other') {
          expect(tripwireHandled).toBe(true)
        }

        // EVIDENCE
        // biome-ignore lint/suspicious/noConsole: required stdout evidence artifact for AC-4 scenario
        console.log(
          JSON.stringify({
            ac: 'AC-4',
            finishReason: result.finishReason,
            textLength: result.text.length,
            toolCallCount: result.toolCalls.length,
            tripwire: result.tripwire,
            tripwireHandled,
            modelString: 'anthropic/claude-sonnet-4-6 (orchestrator tier)',
          }),
        )
      },
      REAL_SERVICE_TIMEOUT_MS,
    )
  })
})
