/**
 * DATA-008 — Integration tests for discoverCuratedRoutes determinism seam.
 *
 * Verifies the ENGINE OUTCOME of the discovery pipeline at the determinism seam
 * (T-DISC-010): a fixtured intent yields a real route_plans row whose options
 * correspond to the listCuratedRoutes result, the orchestrator dispatch path
 * reaches executeDiscoverCuratedRoutes, and the tool is mapped to routing_card.
 *
 * Determinism seam: the intent object is injected directly into
 * executeDiscoverCuratedRoutes (the exported entry that wraps the unexported
 * runDiscoverCuratedRoutes and forwards `{intent}` with NO NL parsing). We
 * never assert agent prose and never exercise the orchestrator's brittle regex
 * intent parser (orchestrator.ts 309-324).
 *
 * Mocked Convex: vitest aliases `convex/_generated/api` to a deep proxy
 * (vitest.config.ts), so we cannot reach live dev from this harness. Instead we
 * inject a fake `AgentContext` whose `runQuery`/`runMutation` capture every
 * call and return fixtured rows — letting us assert the engine outcome
 * (route_plans row created + options built from the queried routes + correct
 * queryArgs). This is the same pattern as the existing
 * discoverCuratedRoutes-card-mapping.test.ts and other tool tests in this dir
 * (see compileSketch.test.ts).
 *
 * Score CORRECTNESS (composite>0, real dimensions) is owned by DATA-008b —
 * we deliberately do NOT assert non-zero scores here.
 *
 * Reference: .spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/DATA-008-verify-discovercuratedroutes-maps-nl-intent-listcuratedroute.md
 */

import { type ToolCall, validateToolCall } from '@mariozechner/pi-ai'
import { describe, expect, it, vi } from 'vitest'
import { determineAvailableTools } from '../../agents/orchestrator'
import type { AgentContext } from '../../ridePlanningAgent'
import { TOOL_TO_CARD_KIND } from '../../sendMessage'
import { discoverCuratedRoutesSchema, executeDiscoverCuratedRoutes } from '../discoverCuratedRoutes'

// ---------------------------------------------------------------------------
// Fixtures: a listCuratedRoutes result for {archetypes:['scenic'], state:'North Carolina'}
// ---------------------------------------------------------------------------

/**
 * Three curated routes that listCuratedRoutes would return for a scenic NC query.
 * Shape mirrors convex/curatedRoutes.ts buildRouteCard() output (post-norm scores).
 * Scores are intentionally small/zero here — correctness is DATA-008b's scope.
 */
const FIXTURE_NC_SCENIC_ROUTES = [
  {
    routeId: 'nc-blue-ridge-001',
    name: 'Blue Ridge Parkway — Asheville to Mount Mitchell',
    state: 'North Carolina',
    primaryArchetype: 'scenic',
    centroidLat: 35.77,
    centroidLng: -82.24,
    compositeScore: 0.92,
    curvatureScore: 0.85,
    scenicScore: 0.95,
    technicalScore: 0.7,
    trafficScore: 0.3,
    remotenessScore: 0.6,
    lengthMiles: 72,
    distanceMi: 72,
    summary: 'Classic ridge run along the Blue Ridge.',
    geometryStatus: 'generated',
  },
  {
    routeId: 'nc-cherohala-002',
    name: 'Cherohala Skyway',
    state: 'North Carolina',
    primaryArchetype: 'scenic',
    centroidLat: 35.34,
    centroidLng: -84.11,
    compositeScore: 0.88,
    curvatureScore: 0.9,
    scenicScore: 0.92,
    technicalScore: 0.65,
    trafficScore: 0.25,
    remotenessScore: 0.75,
    lengthMiles: 41,
    distanceMi: 41,
    summary: 'Remote skyway with tight switchbacks.',
    geometryStatus: 'generated',
  },
  {
    routeId: 'nc-dragon-003',
    name: 'Tail of the Dragon — US 129',
    state: 'North Carolina',
    primaryArchetype: 'scenic',
    centroidLat: 35.48,
    centroidLng: -84.04,
    compositeScore: 0.9,
    curvatureScore: 0.99,
    scenicScore: 0.8,
    technicalScore: 0.85,
    trafficScore: 0.5,
    remotenessScore: 0.4,
    lengthMiles: 11,
    distanceMi: 11,
    summary: '318 curves in 11 miles.',
    geometryStatus: 'pending',
  },
]

const FIXTURE_ROUTE_PLAN_ID = 'route_plans:k7m2g3v4q8s5j6t1n9w2e3r4' as any
const MOCK_PLANNING_SESSION_ID = 'planning_sessions:abc123' as any

// ---------------------------------------------------------------------------
// Fake AgentContext — records every runQuery / runMutation call
// ---------------------------------------------------------------------------

type CapturedMutation = { name: string; args: any }
type CapturedQuery = { name: string; args: any }

function buildMockCtx(opts: { curatedRoutes?: any[]; allowed?: boolean }): {
  ctx: AgentContext
  queries: CapturedQuery[]
  mutations: CapturedMutation[]
} {
  const queries: CapturedQuery[] = []
  const mutations: CapturedMutation[] = []
  const curatedRoutes = opts.curatedRoutes ?? FIXTURE_NC_SCENIC_ROUTES
  const allowed = opts.allowed ?? true

  /**
   * Discriminate the mocked Convex ref by the SHAPE of the args the engine
   * passes — vitest's `convex/_generated/api` mock is a deep Proxy whose
   * references cannot be stringified, so we identify calls by what the engine
   * actually sends (the engine outcome), not by an opaque ref path.
   *
   *   planUsage.checkUsageInternal       → { clerkUserId }
   *   curatedRoutes.listCuratedRoutes    → { limit, sort, state?, archetypes? }
   *   curatedGeometry.getGeometryForRoutes → { routeIds }
   *   routePlans.createForAgentInternal  → { clerkUserId, planningSessionId, planInput, ... }
   *   routePlans.updatePlanStatus        → { routePlanId, status, result }
   */
  const identify = (args: any): string => {
    if (!args || typeof args !== 'object') return 'unknown'
    if ('routeIds' in args) return 'curatedGeometry.getGeometryForRoutes'
    if ('planInput' in args) return 'routePlans.createForAgentInternal'
    if ('status' in args && 'result' in args) return 'routePlans.updatePlanStatus'
    if ('sort' in args && 'limit' in args) return 'curatedRoutes.listCuratedRoutes'
    if ('clerkUserId' in args && !('planningSessionId' in args)) {
      return 'planUsage.checkUsageInternal'
    }
    return 'unknown'
  }

  const ctx: AgentContext = {
    planningSessionId: MOCK_PLANNING_SESSION_ID,
    clerkUserId: 'user_test_001',
    piMessages: [],
    runQuery: vi.fn(async (_ref: any, args: any) => {
      const name = identify(args)
      queries.push({ name, args })

      // plan usage gate
      if (name === 'planUsage.checkUsageInternal') {
        return { allowed, limit: 100 }
      }
      // listCuratedRoutes — return the fixture
      if (name === 'curatedRoutes.listCuratedRoutes') {
        return curatedRoutes
      }
      // geometry side-table lookup — return empty (fallback path)
      if (name === 'curatedGeometry.getGeometryForRoutes') {
        return []
      }
      return undefined
    }) as any,
    runMutation: vi.fn(async (_ref: any, args: any) => {
      const name = identify(args)
      mutations.push({ name, args })

      if (name === 'routePlans.createForAgentInternal') {
        return { routePlanId: FIXTURE_ROUTE_PLAN_ID }
      }
      // updatePlanStatus — returns the row id
      if (name === 'routePlans.updatePlanStatus') {
        return { routePlanId: args?.routePlanId ?? FIXTURE_ROUTE_PLAN_ID }
      }
      return undefined
    }) as any,
    runAction: vi.fn(async () => undefined) as any,
  }

  return { ctx, queries, mutations }
}

/**
 * Build the exact toolCall shape the orchestrator's `discovery_agent` case
 * constructs (orchestrator.ts:326-331) — proves the dispatch site's toolCall
 * is valid against the schema and reaches executeDiscoverCuratedRoutes.
 */
function buildDiscoveryToolCall(intent: Record<string, unknown>): ToolCall {
  return {
    type: 'toolCall',
    id: `discovery-test-${Date.now()}`,
    name: 'discoverCuratedRoutes',
    arguments: { intent },
  } as unknown as ToolCall
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DATA-008 AC-1: fixtured intent drives a route_plans row whose options match the queried routes', () => {
  it('fixturedIntentPlotsQueriedRoutes: returns routes + creates route_plans row + options match listCuratedRoutes result', async () => {
    // GIVEN: a fixtured intent (NL parsing bypassed) + the seeded catalog fixture
    const intent = {
      archetypes: ['scenic'],
      state: 'North Carolina',
      sort: 'best' as const,
      limit: 5,
    }
    const { ctx, queries, mutations } = buildMockCtx({})

    // WHEN: executeDiscoverCuratedRoutes runs (the exported wrapper around the
    // unexported runDiscoverCuratedRoutes — forwards {intent} with NO NL parsing)
    const result = await executeDiscoverCuratedRoutes(ctx, buildDiscoveryToolCall(intent))

    // THEN: result is a routes result with a real route_plans id
    expect(result.type).toBe('routes')
    expect(result.routePlanId).toBe(FIXTURE_ROUTE_PLAN_ID)
    expect(typeof result.routePlanId).toBe('string')
    expect(result.routePlanId.length).toBeGreaterThan(0)

    // THEN: listCuratedRoutes was actually called (engine drove the query, not a stub)
    const listCall = queries.find((q) => q.name === 'curatedRoutes.listCuratedRoutes')
    expect(listCall, 'listCuratedRoutes must be invoked by the tool').toBeDefined()
    // queryArgs built from intent: limit, sort, state, archetypes
    expect(listCall!.args).toMatchObject({
      limit: 5,
      sort: 'best',
      state: 'North Carolina',
    })
    // intent.archetypes passed through (DB set mapping happens inside the tool)
    expect(listCall!.args.archetypes).toEqual(['scenic'])

    // THEN: a route_plans row was created (createForAgentInternal mutation)
    const createCall = mutations.find((m) => m.name === 'routePlans.createForAgentInternal')
    expect(createCall, 'route_plans createForAgentInternal mutation must fire').toBeDefined()
    expect(createCall!.args).toMatchObject({
      clerkUserId: 'user_test_001',
      planningSessionId: MOCK_PLANNING_SESSION_ID,
    })

    // THEN: the row was updated to completed with options matching the query result
    const updateCall = mutations.find((m) => m.name === 'routePlans.updatePlanStatus')
    expect(updateCall, 'route_plans updatePlanStatus mutation must fire').toBeDefined()
    expect(updateCall!.args.status).toBe('completed')
    expect(updateCall!.args.routePlanId).toBe(FIXTURE_ROUTE_PLAN_ID)

    const options = updateCall!.args.result?.options
    expect(Array.isArray(options), 'options must be an array').toBe(true)

    // THEN: option count matches the listCuratedRoutes result count (1..5)
    expect(options.length).toBe(FIXTURE_NC_SCENIC_ROUTES.length)
    expect(options.length).toBeLessThanOrEqual(5)

    // THEN: option routeOptionId set === 'curated-' + queried route ids (same set)
    const expectedIds = FIXTURE_NC_SCENIC_ROUTES.map((r) => `curated-${r.routeId}`).sort()
    const actualIds = options.map((o: any) => o.routeOptionId).sort()
    expect(actualIds).toEqual(expectedIds)

    // THEN: option labels match the queried route names (label set corresponds)
    const expectedLabels = FIXTURE_NC_SCENIC_ROUTES.map((r) => r.name).sort()
    const actualLabels = options.map((o: any) => o.label).sort()
    expect(actualLabels).toEqual(expectedLabels)

    // Negative controls (would fail if the tool degraded to a chat no-op)
    expect(result.type).not.toBe('chat')
    expect(options.length).toBeGreaterThan(0)
  })

  it('emptyCatalogReturnsChat: when listCuratedRoutes returns [], the tool returns chat and creates no route_plans row', async () => {
    // GIVEN: an intent whose query yields no routes
    const intent = {
      archetypes: ['scenic'],
      state: 'North Carolina',
      sort: 'best' as const,
      limit: 5,
    }
    const { ctx, mutations } = buildMockCtx({ curatedRoutes: [] })

    // WHEN: the tool runs
    const result = await executeDiscoverCuratedRoutes(ctx, buildDiscoveryToolCall(intent))

    // THEN: it short-circuits to a chat result (no fake route_plans row)
    expect(result.type).toBe('chat')
    const createCall = mutations.find((m) => m.name === 'routePlans.createForAgentInternal')
    expect(createCall, 'no route_plans row should be created on empty results').toBeUndefined()
  })
})

describe('DATA-008 AC-2: the tool is dispatched by the orchestrator ReAct loop and mapped to a routing_card', () => {
  it('toolIsInvokedByReactLoopAndMappedToCard: dispatch toolCall returns routes + card mapping present + discovery_agent tool registered', async () => {
    // GIVEN: the exact toolCall shape the orchestrator's discovery_agent case builds
    //        (orchestrator.ts:326-331 — {type:'toolCall', name:'discoverCuratedRoutes',
    //        arguments:{intent}}). This is the ReAct dispatch target.
    const intent = {
      archetypes: ['scenic'],
      state: 'North Carolina',
      sort: 'best' as const,
      limit: 5,
    }
    const discoveryAgentToolCall = buildDiscoveryToolCall(intent)

    // Sanity: the dispatch toolCall must validate against the tool schema — if it
    // doesn't, validateToolCall inside executeDiscoverCuratedRoutes would throw
    // and the dispatch path would never reach the engine.
    const validated = validateToolCall([discoverCuratedRoutesSchema], discoveryAgentToolCall) as any
    expect(validated.intent).toMatchObject({ archetypes: ['scenic'], state: 'North Carolina' })

    // WHEN: executeDiscoverCuratedRoutes (the function the dispatch case invokes) runs
    const { ctx } = buildMockCtx({})
    const result = await executeDiscoverCuratedRoutes(ctx, discoveryAgentToolCall)

    // THEN: dispatch target returns routes with a real route_plans id
    //       (matches AC-2 "must observe: executeDiscoverCuratedRoutes return.type === 'routes';
    //        typeof routePlanId === 'string' && length > 0")
    expect(result.type).toBe('routes')
    expect(typeof result.routePlanId).toBe('string')
    expect(result.routePlanId.length).toBeGreaterThan(0)

    // THEN: TOOL_TO_CARD_KIND maps the tool to routing_card so a routing_card
    //       session_message is emitted on toolFinish (sendMessage.ts:25-29).
    expect(TOOL_TO_CARD_KIND.discoverCuratedRoutes).toBe('routing_card')

    // THEN: the discovery_agent tool is registered in the orchestrator's
    //       available-tools list (the registry the LLM picks from). If this
    //       tool were absent the orchestrator could never dispatch a discovery
    //       request and would return 'Unknown orchestrator tool'.
    const tools = determineAvailableTools(/* hasRoutes */ false, /* hasPendingSketch */ false)
    const toolNames = tools.map((t) => t.name)
    expect(toolNames).toContain('discovery_agent')

    // Also verify discovery_agent is available when routes exist (enrichment path)
    const toolsWithRoutes = determineAvailableTools(true, false)
    expect(toolsWithRoutes.map((t) => t.name)).toContain('discovery_agent')

    // Negative controls (would fail if the wiring degraded)
    expect(result.type).not.toBe('chat')
    expect(TOOL_TO_CARD_KIND.discoverCuratedRoutes).not.toBeUndefined()
  })

  it('cardKindMappingIsRoutingCard: discoverCuratedRoutes → routing_card (negative control for undefined mapping)', () => {
    // GIVEN/WHEN: the TOOL_TO_CARD_KIND mapping exported from sendMessage.ts
    // THEN: the entry is present and exactly 'routing_card' — not undefined,
    //       not a different kind. This is the negative control called out in
    //       the spec: "TOOL_TO_CARD_KIND lacks discoverCuratedRoutes (undefined)
    //       so no routing_card row is emitted" must NOT happen.
    expect(TOOL_TO_CARD_KIND).toHaveProperty('discoverCuratedRoutes')
    expect(TOOL_TO_CARD_KIND.discoverCuratedRoutes).toBe('routing_card')
  })

  it('discoveryToolSchemaMatchesDispatchContract: the schema name is discoverCuratedRoutes and accepts an intent', () => {
    // GIVEN: the exported discoverCuratedRoutesSchema
    // THEN: its name matches the toolCall.name the dispatch case uses
    //       (orchestrator.ts:329 — name: 'discoverCuratedRoutes'). If these
    //       drift, the dispatch case would build a toolCall that the schema
    //       rejects and the engine would never run.
    expect(discoverCuratedRoutesSchema.name).toBe('discoverCuratedRoutes')
    expect(discoverCuratedRoutesSchema.parameters).toBeDefined()
  })
})
