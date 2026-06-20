# DATA-009: plan a SINGLE route per origin→destination — stop emitting metric-based (balanced/efficient) multi-route variants

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P1 · **Effort:** S · **Estimate:** 90 min
**Agent:** convex-implementer · **Reviewer:** convex-reviewer
**Proposed By:** convex-planner
**Agent rationale:** The duplicate-card bug is caused at the SOURCE, not downstream. `findScenicWaypointsImpl` (`findScenicWaypoints.ts:60-88`) returns a hardcoded array of 3 fixed preference variants (`scenic-coastal`/`balanced`/`efficient`), all with EMPTY waypoints, so the Google Routes API frequently returns near-identical geometry for the same OD; `buildOptionsFromResults` then emits one card per surviving variant. convex-implementer reduces the variant generator to a single scenic variant so the orchestrator compiles exactly one route — the N-element orchestrator plumbing degrades to N=1 with zero edits and the `PlannedRouteOptionsView` shape is preserved.

> **Remedial — Sprint 1 testing feedback (2026-06-20, item #5, supersedes the 2026-06-18 dedup scope):** "in the chat the system is returning the same route multiple times but under the differing 'modes' … I don't really care about 'balanced' or 'efficient'. Let's REMOVE routing based on these metrics for now; in the future we may return to different metrics that matter more to the user." (Image #2)
>
> **Scope change vs prior DATA-009:** the original task chose contract "(b) dedupe near-identical geometry" and explicitly preserved the 3 variants. The founder's stronger feedback supersedes that: dedup treated a symptom. This task removes the metric-based variant generation at the source. The prior dedup artifacts (`dedupVariantResults.ts` + its tests) were never built — Glob confirms they do not exist — so there is nothing to delete; this task replaces the unbuilt approach.

## Outcome

For one origin→destination, planRide returns exactly ONE route option — never a second card that differs only by an efficiency preference (`balanced`/`efficient`). The `PlannedRouteOptionsView` shape that DATA-008b and DISC-020 consume is unchanged; `options[]` may now legitimately be length 1 (downstream already handles this).

## Specification

`findScenicWaypointsImpl` (`findScenicWaypoints.ts:60-88`) returns a hardcoded 3-element `RouteVariant[]` — `scenic-coastal` (avoidHighways), `balanced` (default), `efficient` (avoidTolls), all with `waypoints: []`. `planRideOrchestrator` (`planRideOrchestrator.ts:71-77`) stores them, `Promise.allSettled(variants.map(...))` (`82-98`) compiles one provider route per variant, `withConditions.map(...)` (`183-190`) returns one `OrchestratorResult` per variant (1:1), and `buildOptionsFromResults` (`planRide.ts:126-153`) maps one option per result → N cards for the SAME road. Because the variant id becomes the visible label (`buildSketchFromVariant`, `planRideOrchestrator.ts:202-203`: `variant.id.replace(/-/g, ' ')`), the rider sees `balanced` / `efficient` clones — the exact surface objected to.

**Fix seam (smallest diff):** reduce the array returned by `findScenicWaypointsImpl` (`findScenicWaypoints.ts:60-88`) from 3 variants to **1** scenic variant. Optionally extract a pure `buildRouteVariants()` helper so the single-variant set lives in one named, unit-testable function. No orchestrator edit is required: its failure-handling / weather-probe / `NO_ROUTES_GENERATED` invariants (`planRideOrchestrator.ts:100-129`) already operate over an N-element array and degrade to N=1 unchanged. `findScenicWaypoints` stays a pure deterministic generator (no I/O — `findScenicWaypoints.ts:40-44`), preserving the "deterministic logic wraps the probabilistic core" discipline. No dedup helper is needed under a single-variant contract.

## Critical Constraints

- **MUST** reduce `findScenicWaypointsImpl` to return a single scenic variant (`scenicBias: 'high'`, `avoidHighways: true`) so `planRide` emits exactly one option per OD; `options.length === 1` for a successful single-route compile.
- **MUST** keep the `PlannedRouteOptionsView` / `plannedRouteOptionsViewValidator` shape (`planRide.ts:28-73`) byte-identical — only the cardinality of `options[]` changes.
- **NEVER** emit an option whose label/variant-id is `balanced` or `efficient` (the duplicate-metric bug). **NEVER** change `buildOptionsFromResults`' option SHAPE, `normalizeRoute`, `compileSketch`, or the routing provider. **NEVER** mock the routing provider in the PRIMARY integration assertion's pipeline wiring — fixture the provider RESPONSE and assert the orchestrator OUTPUT.
- **STRICTLY** scope writes to the variant generator + its unit test + one new integration test. The prior WRITE-PROHIBITED on `findScenicWaypoints` is explicitly LIFTED by this re-scope.

## Acceptance Criteria

### AC-1: planRide returns exactly one route option per origin→destination
*(PRIMARY)*
- **GIVEN** a fixtured routing-provider response (injected at the `routeFromSketch`/`compileSketch` determinism boundary, `routingProvider.ts:52-56`) returning a single valid `ProviderRouteResponse` with a non-empty `overviewGeometry.value` for one SF→Santa Cruz OD
- **WHEN** `planRideOrchestrator` runs and `buildOptionsFromResults` builds the view
- **THEN** `options.length === 1` and the single option carries the full `PlannedRouteOptionView` shape (`routeOptionId`, `label`, `rationale`, `stats`, `map.overviewGeometry`, `overlaysPreview`)
- **Test tier:** `integration` · **Service:** live Convex dev ride-planning pipeline (fixtured provider response → real `planRideOrchestrator` → real `buildOptionsFromResults`)
- **Verify:** `pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t returnsExactlyOneOption`

### AC-2: no `balanced` / `efficient` labeled option is ever emitted
- **GIVEN** the same fixtured single-route provider response for one OD
- **WHEN** the options are built
- **THEN** no surviving option has a label/variant-id of `balanced` or `efficient`; the variant set is the single scenic variant only
- **Test tier:** `integration` · **Service:** live Convex dev pipeline
- **Verify:** `pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t neverEmitsBalancedOrEfficient`

### AC-3: single-variant path preserves the orchestrator success/failure invariants
- **GIVEN** (success) a fixtured provider that compiles the single variant, and (failure) a fixtured provider that rejects the single variant
- **WHEN** `planRideOrchestrator` runs
- **THEN** success → `results.length === 1`, no throw; failure → throws `NO_ROUTES_GENERATED` (`planRideOrchestrator.ts:127-129`) — never a silent `[]`
- **Test tier:** `integration` · **Service:** live Convex dev pipeline
- **Verify:** `pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t preservesSuccessAndFailureInvariants`

### AC-4: the variant generator returns exactly one scenic variant
*(SUPPLEMENTARY, unit)*
- **GIVEN** the deterministic `findScenicWaypoints` (or extracted `buildRouteVariants`) generator
- **WHEN** called with any start/end
- **THEN** it returns an array of length 1 whose entry matches the scenic variant (`preferences.scenicBias === 'high'`); no `balanced`/`efficient` entry
- **Test tier:** `unit` · **Service:** pure function (no I/O)
- **UNIT_TEST_JUSTIFIED:** `findScenicWaypoints` is a pure deterministic array generator with zero I/O (`findScenicWaypoints.ts:40-44`); end-to-end single-route behavior is covered by AC-1..AC-3 integration tests.
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/findScenicWaypoints.test.ts -t returnsSingleScenicVariant`

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | A single-route provider fixture yields exactly one option with the full view shape. | AC-1 | `pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t returnsExactlyOneOption` |
| TC-2 | No emitted option is labeled `balanced` or `efficient`. | AC-2 | `pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t neverEmitsBalancedOrEfficient` |
| TC-3 | Success→1 result no-throw; all-fail→`NO_ROUTES_GENERATED` (never silent `[]`). | AC-3 | `pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t preservesSuccessAndFailureInvariants` |
| TC-4 | Generator returns length-1 scenic variant; no balanced/efficient. | AC-4 | `pnpm test convex/actions/agent/tools/__tests__/findScenicWaypoints.test.ts -t returnsSingleScenicVariant` |

## Reading List

- `convex/actions/agent/tools/findScenicWaypoints.ts` (40-88) — the 3-variant generator; PRIMARY edit seam (reduce to 1)
- `convex/actions/agent/lib/planRideOrchestrator.ts` (71-77, 82-98, 127-129, 183-190, 202-203) — N-element plumbing (no edit; degrades to N=1); label derivation from variant id
- `convex/actions/agent/planRide.ts` (28-73, 126-153) — `plannedRouteOptionsViewValidator` + `buildOptionsFromResults` (out of scope; already handles length 1/0)
- `convex/actions/agent/__tests__/planRide.integration.test.ts` (54-122) — harness pattern for the new integration test (fixtured provider response + real pipeline)
- `convex/actions/agent/tools/__tests__/findScenicWaypoints.test.ts` (13, 29-47, 62-63, 71) — RECONCILE: currently hardcodes the 3-variant contract; flip to single-variant (this IS the AC-4 RED→GREEN surface)

## Guardrails

**WRITE-ALLOWED:** `convex/actions/agent/tools/findScenicWaypoints.ts`, `convex/actions/agent/tools/__tests__/findScenicWaypoints.test.ts`, `convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts` (NEW)
**WRITE-PROHIBITED:** `convex/actions/agent/planRide.ts` (option SHAPE), `convex/actions/agent/lib/planRideOrchestrator.ts` (unless relocating the variant set — but the smaller diff is in `findScenicWaypoints`), `normalizeRoute.ts`, `compileSketch.ts`, `providers/routingProvider.ts`, any DISC-* / DATA-008b / DISC-020 consumer

## Test-Reconciliation Note (REQUIRED — Boy Scout, same commit)

1. `convex/actions/agent/tools/__tests__/findScenicWaypoints.test.ts` hardcodes the 3-variant contract (line 13 `toHaveLength(3)`; lines 29-47 assert all 3 ids+prefs; lines 62-63, 71) and WILL go RED. Rewrite to the single-variant contract: assert `=== 1` and assert ABSENCE of `balanced`/`efficient`. Do NOT delete the file or weaken to `>=1`.
2. `convex/actions/agent/__tests__/ridePlanningAgent.test.ts` mocks the orchestrator/buildOptions (lines 45-55) — won't go red, but is a Tier-3 mocked unit test and may NOT be claimed as the single-route AC proof. The PRIMARY proof is the new `planRideSingleRoute.integration.test.ts`. (See [#831 BOY-SCOUT migration] — do not conflate.)
3. `convex/actions/agent/lib/__tests__/planRideOrchestrator.test.ts` mocks `findScenicWaypoints` (lines 23-27) only to test failure-logging; unaffected — flag "verified unaffected" so a reviewer doesn't re-open it.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts convex/actions/agent/tools/__tests__/findScenicWaypoints.test.ts` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'convex/actions/agent/tools/findScenicWaypoints.ts'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: with the 3-variant generator, the AC-1 fixture yields options.length === 3 — the test must FAIL before the single-variant change makes it pass` |
| human_gate | `On-device (live Convex): plan a ride → chat returns ONE route card for the OD (no 'balanced'/'efficient' duplicate of the same road)` |

## Coding Standards

- Keep `findScenicWaypoints` pure (no I/O); orchestrator wraps the probabilistic provider call deterministically.
- Fixture the provider RESPONSE at the routing boundary; never mock the orchestrator/buildOptions wiring in the PRIMARY assertion.
- No `any` on the returned `RouteVariant[]`.

## Dependencies

- Depends on: (none — independent backend change)
- Blocks: RUX-001/RUX-002 carousel render with `options.length === 1` (verify the pager renders cleanly with a single card; flagged to RUX-001)
- Coordinates with: #831 (BOY-SCOUT `ridePlanningAgent.test.ts` migration) — land the location/variant assertions consistent with the single-variant contract

## Notes

The single scenic variant uses `scenicBias: 'high', avoidHighways: true` — preserves the scenic intent the product implies. Loss of route diversity is explicitly accepted for now ("in the future we may return to different metrics"). Label note: with id `scenic`, `buildSketchFromVariant` derives label "scenic" — confirm it reads acceptably or set a friendlier label.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "provider_single_valid_route": {
      "description": "routing-provider response (fixtured at the routeFromSketch/compileSketch boundary) returning ONE valid ProviderRouteResponse with non-empty overviewGeometry.value for an SF->Santa Cruz OD",
      "seed_method": "recorded_external",
      "records": [ "one recorded ProviderRouteResponse with multi-point overviewGeometry, distanceMeters, durationSeconds" ]
    },
    "provider_single_route_rejects": {
      "description": "recorded routing-provider response that REJECTS/fails to compile the single variant for one OD",
      "seed_method": "recorded_external",
      "records": [ "a recorded rejected/failed provider compile (throw / non-2xx) for the single variant" ]
    },
    "generator_input_any_od": {
      "description": "a static start/end input pair for the pure findScenicWaypoints generator (no I/O; the input IS the fixture)",
      "seed_method": "migration_fixture",
      "records": [ "{ start: {lat,lng}, end: {lat,lng} } for any origin->destination" ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a single-route provider fixture for one OD WHEN planRideOrchestrator + buildOptionsFromResults run THEN options.length === 1 with the full PlannedRouteOptionView shape",
      "verify": "pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t returnsExactlyOneOption",
      "scenario": {
        "start_ref": "provider_single_valid_route", "tier": "visible", "test_tier": "integration",
        "verification_service": "live Convex dev ride-planning pipeline (fixtured provider response -> real orchestrator -> real buildOptionsFromResults)",
        "negative_control": { "would_fail_if": [
          "findScenicWaypoints still returns 3 variants -> options.length === 3",
          "the provider is mocked away inside the pipeline wiring so the real variant-count path is never exercised",
          "the orchestrator is short-circuited but the generator left at 3 (the array still drives 3 compiles)"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "provider_single_valid_route",
          "action": { "actor": "system", "steps": [
            "run planRideOrchestrator with the single-route provider fixture",
            "build the PlannedRouteOptionsView and read options"
          ] },
          "end_state": {
            "must_observe": [
              "options.length === 1",
              "options[0].routeOptionId is a non-empty string",
              "options[0].map.overviewGeometry.value is a non-empty string and format === 'polyline'"
            ],
            "must_not_observe": [ "options.length >= 2 (multi-variant cards survive)", "options.length === 0 (empty options array)" ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN the single-route fixture WHEN options are built THEN no option is labeled/identified balanced or efficient",
      "verify": "pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t neverEmitsBalancedOrEfficient",
      "scenario": {
        "start_ref": "provider_single_valid_route", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "live Convex dev pipeline",
        "negative_control": { "would_fail_if": [
          "the 3-variant generator is retained -> balanced/efficient labels reappear (buildSketchFromVariant derives label from variant.id)",
          "the label is hardcoded/stubbed to a static string masking the real variant id",
          "options is an empty array (0 options) — over-pruned to nothing"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "provider_single_valid_route",
          "action": { "actor": "system", "steps": [ "build options from the single-route fixture", "inspect every option label/variant id" ] },
          "end_state": {
            "must_observe": [ "options.length === 1", "the count of options whose label matches /^(balanced|efficient)$/i === 0" ],
            "must_not_observe": [ "any option whose label or variant id is 'balanced' or 'efficient'", "options is empty (0 options)" ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN success and failure provider fixtures WHEN the orchestrator runs THEN success->1 result no-throw; all-fail->NO_ROUTES_GENERATED (never silent [])",
      "verify": "pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t preservesSuccessAndFailureInvariants",
      "scenario": {
        "start_ref": "provider_single_route_rejects", "tier": "visible", "test_tier": "integration", "primary": false,
        "verification_service": "live Convex dev pipeline",
        "negative_control": { "would_fail_if": [
          "the successful.length === 0 guard (planRideOrchestrator.ts:127) is stubbed/bypassed to return a static empty [] on all-failure (empty options reach the render)",
          "the orchestrator is disconnected so the rejecting fixture never reaches the NO_ROUTES_GENERATED throw"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "provider_single_route_rejects",
          "action": { "actor": "system", "steps": [ "run with a rejecting provider fixture", "assert it throws an Error whose message contains 'NO_ROUTES_GENERATED'", "run with a success fixture", "assert results.length === 1" ] },
          "end_state": {
            "must_observe": [ "the rejecting fixture causes a thrown Error whose message contains the literal 'NO_ROUTES_GENERATED'", "the success fixture yields results.length === 1 with no throw" ],
            "must_not_observe": [ "the rejecting fixture returns a silent empty array (0 results) instead of throwing", "the success fixture yields results.length === 0 (empty) or throws" ]
          }
        } ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "UNIT (justified, pure no-I/O): findScenicWaypoints returns exactly one scenic variant; no balanced/efficient",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/findScenicWaypoints.test.ts -t returnsSingleScenicVariant",
      "scenario": {
        "start_ref": "generator_input_any_od", "tier": "visible", "test_tier": "unit", "primary": false,
        "verification_service": "pure function (no I/O) — UNIT_TEST_JUSTIFIED: deterministic array generator, end-to-end covered by AC-1..AC-3",
        "negative_control": { "would_fail_if": [
          "the generator still returns the static 3-element array -> result.length === 3 (current assertions at findScenicWaypoints.test.ts:13,62,63,71)",
          "the generator is stubbed to return an empty [] (0 variants)"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "generator_input_any_od",
          "action": { "actor": "system", "steps": [ "call findScenicWaypoints({start,end})", "inspect the returned RouteVariant[]" ] },
          "end_state": {
            "must_observe": [ "result.length === 1", "result[0].preferences.scenicBias === 'high'" ],
            "must_not_observe": [ "result.length === 3 (the old 3-variant array)", "result is empty (0 variants)", "any entry with id === 'balanced' or id === 'efficient'" ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "Single-route fixture yields exactly one full-shape option.", "maps_to_ac": "AC-1", "verify": "pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t returnsExactlyOneOption" },
    { "id": "TC-2", "type": "test_criterion", "description": "No balanced/efficient option emitted.", "maps_to_ac": "AC-2", "verify": "pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t neverEmitsBalancedOrEfficient" },
    { "id": "TC-3", "type": "test_criterion", "description": "Success/failure invariants preserved at N=1.", "maps_to_ac": "AC-3", "verify": "pnpm test convex/actions/agent/__tests__/planRideSingleRoute.integration.test.ts -t preservesSuccessAndFailureInvariants" },
    { "id": "TC-4", "type": "test_criterion", "description": "Generator returns one scenic variant.", "maps_to_ac": "AC-4", "verify": "pnpm test convex/actions/agent/tools/__tests__/findScenicWaypoints.test.ts -t returnsSingleScenicVariant" }
  ]
}
-->
