# DATA-008: Verify discoverCuratedRoutes maps NL intent → listCuratedRoutes → routing_card and is invoked by the ReAct loop

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** M · **Estimate:** 90 min  
**Agent:** convex-implementer  
**Proposed By:** convex-planner  
**Agent rationale:** The discovery tool is a Convex action (tools/discoverCuratedRoutes.ts) wired into the orchestrator ReAct dispatch (orchestrator.ts) and surfaced via TOOL_TO_CARD_KIND in sendMessage.ts — all backend. convex-implementer owns the action, the orchestrator wiring, and the route_plans/session_messages mutations and can drive the determinism seam against live dev.  

## Outcome

A fixtured discovery intent drives discoverCuratedRoutes → listCuratedRoutes → a created route_plans row whose options reflect the queried routes, the tool is dispatched by the orchestrator ReAct loop, and TOOL_TO_CARD_KIND surfaces it as a routing_card.

## Specification

tools/discoverCuratedRoutes.ts.runDiscoverCuratedRoutes(ctx,{intent}) maps intent.archetypes (UI) → DB set, builds queryArgs {limit,sort,state?,center?,archetypes?}, calls api.curatedRoutes.listCuratedRoutes, and on non-empty results persists a route_plans row (createForAgentInternal) then updates it (updatePlanStatus) with options[] built from the routes, returning {type:'routes', routePlanId}. The orchestrator (orchestrator.ts, discovery_agent case ~line 276) parses NL into an intent and calls executeDiscoverCuratedRoutes(ctx, toolCall) — this is the ReAct dispatch site that proves the tool is invoked. sendMessage.ts.TOOL_TO_CARD_KIND maps discoverCuratedRoutes→'routing_card', and onToolFinish creates a routing_card session_message with the route_plans attachment. This task verifies the engine outcome of UC-DISC-10 / DATA-008 at the determinism seam: a fixtured intent yields a real route_plans row whose options correspond to the listCuratedRoutes result (assert routeOptionId set / count / label set against the query result), the orchestrator dispatch path reaches executeDiscoverCuratedRoutes, and the card-kind mapping is present. Score CORRECTNESS (composite>0, real dimensions) is explicitly deferred to DATA-008b.

## Critical Constraints

- Assert WHICH routes are plotted (route_plans row created + options for the queried routes + routing_card surfaced) — NEVER assert the agent's prose. Fixture the intent at the determinism seam (runDiscoverCuratedRoutes(ctx,{intent})), bypassing NL parsing.
- Use the REAL listCuratedRoutes against live Convex dev — no mocked ctx.runQuery. A test that stubs the query is a fakeable pass and is rejected.
- This task verifies INVOCATION + WIRING + CARD-EMISSION; the zero-score field-mapping bug is owned by DATA-008b — do NOT fix scores here (and do NOT assert non-zero scores here; that is DATA-008b's PRIMARY).
- Do NOT couple the determinism-seam test to the orchestrator's brittle regex intent parser (orchestrator.ts lines 283-296) — inject the intent object directly.

## Acceptance Criteria

### AC-1: fixtured intent drives a route_plans row whose options match the queried routes
*(PRIMARY)*
- **GIVEN** the seeded live Convex dev catalog and a fixtured intent {archetypes:['scenic'], state:'North Carolina', sort:'best', limit:5}
- **WHEN** runDiscoverCuratedRoutes(ctx,{intent}) executes against live dev (NL parsing bypassed)
- **THEN** it returns {type:'routes', routePlanId}, a route_plans row is created, and its options[] routeOptionId/label set corresponds to the listCuratedRoutes result for that intent (same route ids, same count ≤5)
- **Test tier:** `integration` · **Service:** live Convex dev (discoverCuratedRoutes → api.curatedRoutes.listCuratedRoutes → route_plans)
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts` → `fixturedIntentPlotsQueriedRoutes`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: result.type === 'routes'; a route_plans row exists with status 'completed'; options.length === the listCuratedRoutes result length (1..5); options[].routeOptionId set === 'curated-'+queried route ids
  - must NOT observe: result.type === 'chat'; 0 options; no route_plans row created
  - negative control (would fail if): listCuratedRoutes is mocked; tool is a no-op returning type:'chat'; no route_plans row created; options[] empty or unrelated to the query result

### AC-2: the tool is dispatched by the orchestrator ReAct loop and mapped to a routing_card
- **GIVEN** the orchestrator discovery_agent dispatch case and the sendMessage card-kind map
- **WHEN** the orchestrator routes a discovery request
- **THEN** executeDiscoverCuratedRoutes is reached via the discovery_agent case and TOOL_TO_CARD_KIND['discoverCuratedRoutes'] === 'routing_card'
- **Test tier:** `integration` · **Service:** live Convex dev (orchestrator dispatch + sendMessage mapping)
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts` → `toolIsInvokedByReactLoopAndMappedToCard`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: executeDiscoverCuratedRoutes return.type === 'routes'; typeof executeDiscoverCuratedRoutes return.routePlanId === 'string' && return.routePlanId.length > 0 (a real route_plans id); TOOL_TO_CARD_KIND['discoverCuratedRoutes'] === 'routing_card'
  - must NOT observe: 'Unknown orchestrator tool'; return.type === 'chat'; TOOL_TO_CARD_KIND['discoverCuratedRoutes'] === undefined; 0 route_plans rows created (no dispatch)
  - negative control (would fail if): the discovery_agent dispatch case is absent so the tool is never invoked and the orchestrator returns 'Unknown orchestrator tool'; TOOL_TO_CARD_KIND lacks discoverCuratedRoutes (undefined) so no routing_card row is emitted; executeDiscoverCuratedRoutes is stubbed to a no-op returning type:'chat' so no route_plans row is created

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: a fixtured intent creates a route_plans row whose options match the real listCuratedRoutes result (engine outcome, not prose) — T-DISC-010 determinism seam. | AC-1 | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts` |
| TC-2 | Integration: orchestrator discovery_agent case invokes executeDiscoverCuratedRoutes and the tool is mapped to routing_card. | AC-2 | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts` |

## Reading List

- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (44-200) — PRIMARY PATTERN — runDiscoverCuratedRoutes intent→listCuratedRoutes→route_plans→options; the determinism seam
- `convex/actions/agent/agents/orchestrator.ts` (276-311) — the discovery_agent dispatch case that invokes executeDiscoverCuratedRoutes (proves ReAct invocation)
- `convex/actions/agent/sendMessage.ts` (25-29) — TOOL_TO_CARD_KIND['discoverCuratedRoutes']==='routing_card' + onToolFinish card emission (227-276)
- `convex/actions/agent/agents/orchestrator.test.ts` (1-80) — orchestrator test conventions for asserting dispatch outcomes
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (89) — T-DISC-010 determinism-seam contract (assert routes/plot, not prose)

## Guardrails

- WRITE-ALLOWED: `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts (NEW)`
- WRITE-ALLOWED: `convex/actions/agent/agents/orchestrator.ts (MODIFY — only if the dispatch case is found broken/unreachable)`
- WRITE-ALLOWED: `convex/actions/agent/sendMessage.ts (MODIFY — only if TOOL_TO_CARD_KIND is found missing the entry)`
- WRITE-PROHIBITED: convex/actions/agent/tools/discoverCuratedRoutes.ts — the score-field fix is DATA-008b's scope, not this task
- WRITE-PROHIBITED: convex/curatedRoutes.ts
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: .spec/prds/mvp/05-uc-disc.md#uc-disc-10
- ref: .spec/prds/mvp/10-e2e-testing-criteria.md
- pattern: Determinism seam: inject the intent object directly into the tool, assert the engine outcome (route_plans row + options matching the real query result + routing_card kind), never the LLM prose.

## Verification Gates

| Gate | Command |
|------|---------|
| gate | `pnpm type-check` |
| gate | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts` |
| gate | `pnpm exec biome check convex/actions/agent/tools/discoverCuratedRoutes.ts convex/actions/agent/agents/orchestrator.ts convex/actions/agent/sendMessage.ts` |
| gate | `pnpm --dir server run convex:dev -- --once` |

## Coding Standards

- Deterministic vs probabilistic: route_plans persistence + card emission are deterministic; only NL→intent is probabilistic — fixture the seam.
- Assert engine outcomes (rows/ids/counts), never agent prose.
- Use real ctx.runQuery against live dev — no mocked Convex.

## Dependencies

- Depends on: DATA-005
- Blocks: DATA-008b, DISC-020 (renders the routing_card transcript cards)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "seeded_geospatial_index": {
      "description": "live Convex dev with the 5,654-row catalog, seeded geospatial points, NC spelling split",
      "seed_method": "migration_fixture",
      "records": [
        "curated_routes returnable by listCuratedRoutes for {archetypes:['scenic'], state:'North Carolina'}"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a fixtured intent WHEN runDiscoverCuratedRoutes runs against live dev THEN a route_plans row is created whose options match the real listCuratedRoutes result (same ids, count)",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the orchestrator dispatch WHEN a discovery request routes THEN executeDiscoverCuratedRoutes is invoked and the tool maps to routing_card",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "determinism-seam engine outcome (route_plans + options) verified vs the real query (T-DISC-010)",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "ReAct invocation + routing_card mapping",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
