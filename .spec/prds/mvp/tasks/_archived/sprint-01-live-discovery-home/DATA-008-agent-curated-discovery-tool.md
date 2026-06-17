# DATA-008: Agent curated-discovery tool — NL request → listCuratedRoutes → existing routing_card contract

| Field | Value |
|---|---|
| Sprint | [sprint-01-live-discovery-home](./SPRINT.md) |
| Type | FEATURE |
| Agent | implementer = `convex-implementer` · reviewer = `convex-reviewer` |
| Estimate | 240 min |
| Priority | P1 |
| Status | Backlog |
| Proposed By | convex-planner |
| Depends on | DATA-005 (listCuratedRoutes — built) |
| Blocks | DISC-012 (render curated routes as cards + card→map loop) |
| PRD refs | DELTA-001 §2/§5(UC-DISC-10)/§6/§7/§8 · ROADMAP Sprint 01 (DATA-008) · 05-uc-disc UC-DISC-10 |

## Background

DELTA-001 folds discovery onto the map+chat home. Verified in code (kb-sprint-plan dispatch + app-dead diagnosis): the chat agent has **no path to the curated catalog** — its orchestrator tools (`routing_agent`/`search_agent`/`enrichment_agent`) only geocode start→end trips into a `PlannedRouteOptionsView`. This is the one genuinely net-new backend task: give the agent a tool to surface **curated** routes through the **existing** `routing_card` machinery so they ride the existing card→map→pin-back loop with no client rewrite.

## Critical constraints

- **MUST** return LIVE curated routes from `listCuratedRoutes` (no stub, canned array, or hardcoded sample).
- **MUST** materialize results into the EXISTING `route_plans → routing_card → route_options` contract and register the tool in `TOOL_TO_CARD_KIND` (no new card kind, no new client query).
- **MUST** carry composite + per-dimension scores on the raw 0–1 scale; Clerk-gate via `requireIdentity` consistent with `listCuratedRoutes`.
- **NEVER** add a new curated query or modify the `listCuratedRoutes`/`getCuratedRouteDetail` contract (args/returns/behavior).
- **NEVER** change `curated_routes` or any table schema — read-only against the catalog, additive only on the agent/tool path.
- **NEVER** stub the curated lookup, fake a `routePlanId`, or report success while the materialized `route_plans.result` is empty/synthetic (cardinal stubbing sin — the AC-1 negative control bites this).
- **STRICTLY** geometry: resolve a polyline via `getCuratedRouteDetail` only if it exists in the deployment; otherwise (live Sprint-01 state — no geometry) emit a centroid-derived single-point `overviewGeometry` fallback. Never synthesize fake legs.
- **STRICTLY** determinism seam (DELTA-001 §8): the NL→params interpretation is the probabilistic boundary; fixture the model/intent signal in tests and assert WHICH curated ids/names are surfaced and plotted (`route_plans.result.options[].label`), never assert on prose.

## Specification

**Objective:** Give the chat agent a card-backed tool (`discoverCuratedRoutes`) that turns an NL discovery request ("twisties near Asheville") into `listCuratedRoutes` params, fetches live curated routes, and materializes them into the existing `route_plans → routing_card → route_options` contract so they render via `RouteAttachmentCard` and ride the existing card→map loop — no schema change, no new curated query.

**Success state:** Sending "twisties near Asheville" through `sendMessage` produces a `routing_card` message whose `route_options` attachment points at a completed `route_plans` row whose `result.options` carry the real curated route names/ids returned by `listCuratedRoutes` (twisties near Asheville), scores on the 0–1 scale, centroid-derived geometry fallback; an empty/disconnected catalog produces NO routing_card.

## Acceptance criteria

- **AC-1** — NL twisties-near-Asheville surfaces the seeded curated route as a routing_card. **GIVEN** a live deployment with the curated catalog seeded with a twisties route near Asheville and a contrasting CA coastal route, an authenticated identity, and the intent fixtured to `{archetypes:['twisties'], center: Asheville, sort:'nearest'}` **WHEN** the tool runs and materializes **THEN** a completed `route_plans` row exists whose `result.options[].label` includes the Asheville twisties route and excludes the CA coastal route; the routing_card attachment points at that `routePlanId`. _test_tier: integration · service: live Convex (convex-test + seeded catalog)._ **Oracle:** observe `status==="completed"`, 1 option, label `"Tail of the Dragon"`, composite `0.91`; must NOT observe 0 options / `"Pacific Coast Hwy"` / `91` / null routePlanId. **Negative control:** empty catalog, disconnected/mocked listCuratedRoutes, stubbed array, no routePlanId.
- **AC-2** — Materializes through the existing routing_card → route_options contract end-to-end via sendMessage. **GIVEN** the seeded catalog + session + tool registered in `TOOL_TO_CARD_KIND` and wired as the discovery_agent meta-tool **WHEN** `sendMessage` runs for "twisties near Asheville" **THEN** a `session_messages` row of kind `routing_card` is created whose `attachments[0]` is `{type:'route_options', routePlanId}` pointing at the completed curated route_plans row. _integration._ **Oracle:** observe a kind `routing_card` row, attachment type `route_options`, routePlanId resolves to the curated plan with label `"Tail of the Dragon"`; must NOT observe 0 routing_card rows / empty attachments / a start→end planned trip.
- **AC-3** — NL intent maps to listCuratedRoutes params via the UI↔DB archetype map + state/center+sort. **GIVEN** a catalog with an OR scenic_byway route and an NC twisties route **WHEN** the tool interprets `{archetypes:['scenic'], state:'Oregon'}` and `{archetypes:['twisties'], center: Asheville, sort:'nearest'}` **THEN** (a) surfaces only McKenzie Pass (UI scenic → DB {scenic_byway,coastal}); (b) surfaces only Tail of the Dragon nearest-first — each via the real listCuratedRoutes. _integration._ **Oracle:** (a) 1 option `"McKenzie Pass"`, not `"Tail of the Dragon"`; (b) 1 option `"Tail of the Dragon"` with numeric distanceMi. **Negative control:** archetype map bypassed (raw UI enum to query), filter ignored (both returned), query mocked, empty catalog.
- **AC-4** — Centroid geometry fallback when no polyline; scores stay 0–1. **GIVEN** the seeded twisties route (centroid+bounds+scores, no polyline) **WHEN** materialized **THEN** the option's `map.overviewGeometry` is a centroid-derived single-point fallback, `map.bounds` matches curated boundsNe/Sw, scores in [0,1]. _integration._ **Oracle:** composite `0.91`, curvature `0.88`, overviewGeometry decodes to centroid (35.49,-83.93), bounds.north === curated boundsNeLat; must NOT observe `91` / fabricated multi-point legs / undefined bounds. **Negative control:** fabricated legs, scores rescaled to 0–100, bounds dropped, empty catalog.
- **AC-5** — Zero-match request returns a conversational chat result and emits no routing_card. **GIVEN** the catalog + an intent with no match (`{archetypes:['adventure'], state:'Rhode Island'}`) **WHEN** the tool runs and listCuratedRoutes returns [] **THEN** the tool returns `{type:'chat', message}` (no routePlanId) and `sendMessage` produces NO routing_card row for that turn. _integration._ **Oracle:** result type `"chat"`, message length>0, 0 routing_card rows this turn; must NOT observe a routing_card / a fabricated completed route_plans. **Negative control:** a card emitted for empty result, a fabricated route, a throw instead of chat result.

## Test criteria

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | discoverCuratedRoutes is registered in TOOL_TO_CARD_KIND → 'routing_card' | AC-2 | `pnpm test -- …discoverCuratedRoutes.integration.test.ts -t 'registered in TOOL_TO_CARD_KIND'` |
| TC-2 | discovery_agent meta-tool results are extracted as a route_options attachment | AC-2 | `pnpm test -- …orchestrator.discovery.test.ts -t 'extracts curated route_options attachment'` |
| TC-3 | UI 'scenic' expands to DB {scenic_byway,coastal} via uiArchetypeToDbSet before listCuratedRoutes | AC-3 | `pnpm test -- …discoverCuratedRoutes.integration.test.ts -t 'maps intent to listCuratedRoutes params'` |
| TC-4 | Materialized result conforms to PlannedRouteOptionsView (planId+options[] w/ map.bounds, overviewGeometry, stats) | AC-4 | `pnpm test -- …discoverCuratedRoutes.integration.test.ts -t 'centroid geometry fallback and 0-1 scores'` |
| TC-5 | Empty catalog produces no routing_card and no completed route_plans (negative control bites) | AC-1 | `pnpm test -- …discoverCuratedRoutes.integration.test.ts -t 'empty catalog surfaces nothing'` |
| TC-6 | requireIdentity gates the tool path (unauthenticated rejected) | AC-1 | `pnpm test -- …discoverCuratedRoutes.integration.test.ts -t 'rejects unauthenticated'` |
| TC-7 | Type-check and lint pass | AC-2 | `pnpm type-check && pnpm lint` |
| TC-8 | Convex build/push succeeds with the new function registered | AC-2 | `pnpm --dir server run convex:dev -- --once` |

## Reading list

- `convex/actions/agent/agents/routingAgent.ts:660-837,866-977,1074-1122` — **PRIMARY PATTERN** runPlanRoute: createForAgentInternal → build PlannedRouteOptionsView → updatePlanStatus(completed,result) → return `{type:'routes',data,routePlanId}`; tool registration + dispatch + result extraction. Mirror for curated.
- `convex/actions/agent/sendMessage.ts:25-29,226-291` — TOOL_TO_CARD_KIND map (register discoverCuratedRoutes) + onToolFinish (routePlanId → kind:'routing_card' session_messages row with route_options attachment).
- `convex/actions/agent/agents/orchestrator.ts:62-107,160-265,300-344` — add discovery_agent meta-tool: determineAvailableTools, the sub-agent Tool, executeOrchestratorTool case, extractOrchestratorAttachments.
- `convex/curatedRoutes.ts:20-54,117-282` — listCuratedRoutes args/returns + buildRouteCard/norm (consumed read-only; reuse the 0–1 norm convention; archetype-set + state-variant filtering already handled).
- `convex/actions/agent/planRide.ts:28-73,104-155` — plannedRouteOptionsViewValidator + buildOptionsFromResults — the exact route_options shape to conform to.

## Guardrails

**Write-allowed:** `convex/actions/agent/tools/discoverCuratedRoutes.ts` (NEW) · `convex/actions/agent/agents/discoveryAgent.ts` (NEW) · `convex/actions/agent/agents/orchestrator.ts` (MODIFY: register meta-tool + attachment extraction only) · `convex/actions/agent/sendMessage.ts` (MODIFY: add to TOOL_TO_CARD_KIND only) · `convex/actions/agent/agents/types.ts` (MODIFY: add result type only) · `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts` (NEW) · `convex/actions/agent/agents/__tests__/orchestrator.discovery.test.ts` (NEW)

**Write-prohibited:** `convex/curatedRoutes.ts` (contract frozen) · `convex/schema.ts` + `server/models/**` (no schema change) · `convex/db/routePlans.ts` (consume as-is) · `convex/util/archetypeMap.ts` (consume as-is) · any `app/**`/`hooks/**`/`components/**` (DISC-012 owns the client render) · any file not listed.

## Verification gates

1. `pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts` — all AC scenarios green; PRIMARY AC-1 watched RED against an empty catalog before GREEN.
2. `pnpm test -- convex/actions/agent/agents/__tests__/orchestrator.discovery.test.ts` — discovery_agent attachment extraction.
3. `pnpm type-check` (exit 0) · `pnpm lint` (exit 0).
4. `pnpm --dir server run convex:dev -- --once` — build/push succeeds; new function path registered.
5. `git diff --name-only` ⊆ write-allowed.
6. **Un-fakeable:** AC-1 evidence (db_query) shows the seeded curated route name/id in `route_plans.result.options` AND the empty-catalog run produced NO routing_card (negative control captured).

## Design / approach

Add `discoverCuratedRoutes` tool that (1) interprets NL → `{archetypes?, state?, center?, sort?, limit?}`, (2) calls `api.curatedRoutes.listCuratedRoutes` via `ctx.runQuery`, (3) materializes into ONE `route_plans` row (createForAgentInternal → updatePlanStatus(completed, PlannedRouteOptionsView)), (4) returns `{type:'routes', routePlanId}`. Expose inside a new `discovery_agent` sub-agent (mirrors routing_agent). Register in `TOOL_TO_CARD_KIND` so `onToolFinish` emits the routing_card → route_options attachment automatically — reusing the entire existing card→map loop. **Intent extraction** is the probabilistic seam: tests fixture the extracted intent and assert engine outcomes (which curated ids/names plot). **Geometry:** centroid-derived encoded polyline (single point) via the already-installed `@mapbox/polyline`; `overlaysPreview` all 'unavailable' (matches planRide). **Failure modes:** zero matches → `{type:'chat', message}` (no card); error → mark route_plans failed + `{type:'error', message, routePlanId}` per routingAgent contract.

## Dependencies

- **Depends on:** DATA-005 (listCuratedRoutes — built).
- **Blocks:** DISC-012 (client render of curated cards + card→map loop).

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "asheville_twisties_catalog": {
      "description": "Curated catalog seeded with one twisties route near Asheville NC and a contrasting coastal route in CA",
      "seed_method": "public_api",
      "records": [
        "curated_routes: 'Tail of the Dragon' (primaryArchetype twisties, centroid 35.49,-83.93, compositeScore 0.91, curvatureScore 0.88, boundsNe/Sw set, no polyline) seeded via the real upsertCuratedRoutes path",
        "curated_routes: 'Pacific Coast Hwy' (primaryArchetype coastal, CA) seeded via upsertCuratedRoutes",
        "a Clerk identity + planning_session created via the real auth/session path"
      ]
    },
    "multi_archetype_catalog": {
      "description": "Curated catalog with a scenic_byway route in OR and a twisties route in NC",
      "seed_method": "public_api",
      "records": [
        "curated_routes: 'McKenzie Pass' (primaryArchetype scenic_byway, Oregon) via upsertCuratedRoutes",
        "curated_routes: 'Tail of the Dragon' (primaryArchetype twisties, NC, centroid 35.49,-83.93) via upsertCuratedRoutes"
      ]
    }
  },
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"NL twisties-near-Asheville request surfaces the seeded curated route as a routing_card (completed route_plans, label includes the Asheville twisties route, excludes CA coastal)","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'surfaces seeded Asheville twisties route'","test_tier":"integration","verification_service":"live Convex (convex-test + seeded curated_routes)","scenario":{"tier":"visible","test_tier":"integration","verification_service":"live Convex","start_ref":"asheville_twisties_catalog","negative_control":{"would_fail_if":["curated catalog empty","listCuratedRoutes disconnected/mocked","discoverCuratedRoutes returns a stubbed/canned array","no routePlanId materialized","route_plans.result.options empty"]},"evidence":{"artifact_type":"db_query","required_capture":true},"cases":[{"start_ref":"asheville_twisties_catalog","action":{"actor":"api_client","steps":["seed catalog per fixture","invoke discoverCuratedRoutes with fixtured intent {archetypes:['twisties'],center:{lat:35.59,lng:-82.55},sort:'nearest',limit:5}","read materialized route_plans by routePlanId"]},"end_state":{"must_observe":["route_plans.status === 'completed'","result.options length 1","option label === 'Tail of the Dragon'","composite score === 0.91"],"must_not_observe":["empty options (0)","label 'Pacific Coast Hwy'","composite score 91","routePlanId null"]}}]}},
    {"id":"AC-2","type":"acceptance_criterion","description":"Result materializes through the existing routing_card → route_options contract end-to-end via sendMessage","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'emits routing_card with route_options attachment'","test_tier":"integration","verification_service":"live Convex (convex-test + sendMessage)","scenario":{"tier":"visible","test_tier":"integration","verification_service":"live Convex","start_ref":"asheville_twisties_catalog","negative_control":{"would_fail_if":["tool omitted from TOOL_TO_CARD_KIND","no routePlanId so no card row","attachment type not 'route_options'","session_messages empty"]},"evidence":{"artifact_type":"db_query","required_capture":true},"cases":[{"start_ref":"asheville_twisties_catalog","action":{"actor":"api_client","steps":["create a planning_session","run sendMessage 'twisties near Asheville' with intent fixtured to twisties/Asheville","query api.db.sessionMessages.list and find newest kind==='routing_card'"]},"end_state":{"must_observe":["a session_messages row kind === 'routing_card'","attachments[0].type === 'route_options'","attachments[0].routePlanId resolves to a route_plans whose result.options[0].label === 'Tail of the Dragon'"],"must_not_observe":["empty (0) routing_card rows","attachments empty","routePlanId pointing at a start→end planned trip"]}}]}},
    {"id":"AC-3","type":"acceptance_criterion","description":"NL intent maps to listCuratedRoutes params via the UI↔DB archetype map and state/center+sort","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'maps intent to listCuratedRoutes params'","test_tier":"integration","verification_service":"live Convex","scenario":{"tier":"visible","test_tier":"integration","verification_service":"live Convex","start_ref":"multi_archetype_catalog","negative_control":{"would_fail_if":["archetype map bypassed (UI enum raw to query)","state/center filter ignored so both returned","listCuratedRoutes mocked","empty catalog"]},"evidence":{"artifact_type":"db_query","required_capture":true},"cases":[{"start_ref":"multi_archetype_catalog","action":{"actor":"api_client","steps":["invoke discoverCuratedRoutes with intent {archetypes:['scenic'],state:'Oregon'}"]},"end_state":{"must_observe":["result.options length 1","option label === 'McKenzie Pass'"],"must_not_observe":["label 'Tail of the Dragon'","empty options (0)","2 options"]}},{"start_ref":"multi_archetype_catalog","action":{"actor":"api_client","steps":["invoke discoverCuratedRoutes with intent {archetypes:['twisties'],center:{lat:35.59,lng:-82.55},sort:'nearest',limit:3}"]},"end_state":{"must_observe":["result.options length 1","option label === 'Tail of the Dragon'","option distanceMi is a positive number under 60"],"must_not_observe":["label 'McKenzie Pass'","0 options"]}}]}},
    {"id":"AC-4","type":"acceptance_criterion","description":"Geometry uses centroid fallback when no curated polyline exists; scores stay 0–1","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'centroid geometry fallback and 0-1 scores'","test_tier":"integration","verification_service":"live Convex","scenario":{"tier":"visible","test_tier":"integration","verification_service":"live Convex","start_ref":"asheville_twisties_catalog","negative_control":{"would_fail_if":["fabricated multi-point legs instead of centroid fallback","scores rescaled to 0–100","bounds dropped","empty catalog"]},"evidence":{"artifact_type":"db_query","required_capture":true},"cases":[{"start_ref":"asheville_twisties_catalog","action":{"actor":"api_client","steps":["invoke discoverCuratedRoutes for the seeded Asheville twisties route","read route_plans.result.options[0].map and overlaysPreview"]},"end_state":{"must_observe":["composite score === 0.91","curvature score === 0.88","map.overviewGeometry decodes to centroid (35.49,-83.93)","map.bounds.north === curated boundsNeLat"],"must_not_observe":["empty options (0)","composite score 91","fabricated legs with >2 coords not derived from centroid","map.bounds undefined"]}}]}},
    {"id":"AC-5","type":"acceptance_criterion","description":"Zero-match request returns a conversational chat result and emits no routing_card","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'zero match yields chat result no card'","test_tier":"integration","verification_service":"live Convex","scenario":{"tier":"visible","test_tier":"integration","verification_service":"live Convex","start_ref":"asheville_twisties_catalog","negative_control":{"would_fail_if":["a routing_card emitted for an empty result","tool fabricates a route to fill the gap","tool throws instead of returning a chat result"]},"evidence":{"artifact_type":"db_query","required_capture":true},"cases":[{"start_ref":"asheville_twisties_catalog","action":{"actor":"api_client","steps":["create a planning_session","run sendMessage 'adventure roads in Rhode Island' with intent fixtured to {archetypes:['adventure'],state:'Rhode Island'} (no match)","query session_messages"]},"end_state":{"must_observe":["tool result type === 'chat'","a conversational message string length > 0","count of kind==='routing_card' rows this turn === 0"],"must_not_observe":["an empty (0) result rendered as a card","a routing_card row this turn","a fabricated completed route_plans this turn"]}}]}},
    {"id":"TC-1","type":"test_criterion","maps_to_ac":"AC-2","description":"discoverCuratedRoutes registered in TOOL_TO_CARD_KIND → 'routing_card'","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'registered in TOOL_TO_CARD_KIND'"},
    {"id":"TC-2","type":"test_criterion","maps_to_ac":"AC-2","description":"discovery_agent meta-tool results extracted as route_options attachment","verify":"pnpm test -- convex/actions/agent/agents/__tests__/orchestrator.discovery.test.ts -t 'extracts curated route_options attachment'"},
    {"id":"TC-3","type":"test_criterion","maps_to_ac":"AC-3","description":"UI 'scenic' expands to DB {scenic_byway,coastal} via uiArchetypeToDbSet before listCuratedRoutes","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'maps intent to listCuratedRoutes params'"},
    {"id":"TC-4","type":"test_criterion","maps_to_ac":"AC-4","description":"Materialized result conforms to PlannedRouteOptionsView","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'centroid geometry fallback and 0-1 scores'"},
    {"id":"TC-5","type":"test_criterion","maps_to_ac":"AC-1","description":"Empty catalog → no routing_card, no completed route_plans (negative control)","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'empty catalog surfaces nothing'"},
    {"id":"TC-6","type":"test_criterion","maps_to_ac":"AC-1","description":"requireIdentity gates the tool path","verify":"pnpm test -- convex/actions/agent/tools/__tests__/discoverCuratedRoutes.integration.test.ts -t 'rejects unauthenticated'"},
    {"id":"TC-7","type":"test_criterion","maps_to_ac":"AC-2","description":"Type-check and lint pass","verify":"pnpm type-check && pnpm lint"},
    {"id":"TC-8","type":"test_criterion","maps_to_ac":"AC-2","description":"Convex build/push succeeds with the new function registered","verify":"pnpm --dir server run convex:dev -- --once"}
  ]
}
-->
