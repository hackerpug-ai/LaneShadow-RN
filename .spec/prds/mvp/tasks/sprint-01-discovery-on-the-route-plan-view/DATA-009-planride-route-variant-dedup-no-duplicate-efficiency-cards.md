# DATA-009: planRide route-variant dedup — stop emitting duplicate efficiency-variant cards for the same origin→destination

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P1 · **Effort:** M · **Estimate:** 120 min
**Agent:** convex-implementer · **Reviewer:** convex-reviewer
**Proposed By:** convex-planner
**Agent rationale:** The fix is a backend transform in the Convex deterministic ride-planning pipeline: `planRideOrchestrator` generates 3 fixed preference variants (`findScenicWaypoints.ts`) that the Google Routes API frequently collapses to near-identical geometry, then `buildOptionsFromResults` emits one card per surviving variant. convex-implementer owns the orchestrator → buildOptionsFromResults → `plannedRouteOptionsViewValidator` contract and can prove the deduped output against a fixtured multi-variant provider response on live Convex dev without breaking DATA-008/008b/DISC-020's options/routing_card shape.

> **Remedial — Sprint 1 testing feedback (item 4):** "the results return multiple cards with the same route … the only difference is 'efficient' or 'balanced' … we shouldn't have duplicate suggested route cards." (Images #4, #5)

## Outcome

For one origin→destination, planRide returns the genuinely-distinct routes only — never two cards that differ solely by an efficiency preference (scenic-coastal / balanced / efficient) over identical geometry. The `PlannedRouteOptionsView` shape that DATA-008b and DISC-020 consume is unchanged; only the cardinality/content of `options[]` changes (clones dropped), always leaving ≥1 option.

## Specification

`planRideOrchestrator` currently compiles 3 fixed preference variants (`findScenicWaypoints.ts:53-89`: scenic-coastal, balanced, efficient) all with EMPTY waypoints, so the Google Routes API frequently returns identical or near-identical geometry for the same origin→destination; `buildOptionsFromResults` (`planRide.ts:104-155`) then maps one option per surviving variant, producing 2–3 cards for the SAME road. Insert a deterministic dedup step over the orchestrator's `successful` results (`planRideOrchestrator.ts:100-191`), keyed on `overviewGeometry.value` (the encoded polyline) plus rounded `distanceMeters`/`durationSeconds`, that collapses geometry-identical/overlapping variants to the genuinely-distinct set (clones dropped) while always keeping ≥1 result. The downstream `buildOptionsFromResults` mapping and `PlannedRouteOptionsView` shape are untouched; only the input array it receives is deduped. The pure `dedupVariantResults` helper is extracted for unit coverage; the orchestrator wraps it deterministically (CLAUDE.md: "Deterministic logic wraps the probabilistic core"). Chosen contract = **(b) dedupe near-identical** (same OD + overlapping geometry), preserving genuinely-distinct scenic alternatives — not (a) single-primary, which would risk dropping legitimately distinct routes and more aggressively change cardinality.

## Critical Constraints

- **MUST** dedup the orchestrator's compiled variant results by geometry identity (`overviewGeometry.value`) before `buildOptionsFromResults` maps them to options, so identical-geometry efficiency variants collapse to a single option.
- **MUST** preserve the exact `PlannedRouteOptionsView` / `plannedRouteOptionsViewValidator` shape (`planId` + `options[]` with routeOptionId/label/rationale/stats/map/overlaysPreview) — DATA-008b, DISC-020, and the card→map loop consume it unchanged.
- **MUST** always return at least one option when at least one variant compiled successfully (dedup never empties `options[]`).
- **NEVER** emit two options for the same origin→destination that differ only by efficiency preference (scenic-coastal vs balanced vs efficient) when their geometry is identical/overlapping — that is the exact duplicate-card bug being fixed.
- **NEVER** mock the routing provider in the PRIMARY integration assertion's pipeline wiring — fixture the provider RESPONSE (a known multi-variant payload) and assert the deduped orchestrator OUTPUT (which options survive), never prose.
- **STRICTLY** scope writes to the orchestrator dedup seam + a pure dedup helper + tests — do NOT change findScenicWaypoints' variant-generation contract, normalizeRoute, the provider, buildOptionsFromResults' option SHAPE, or any DISC-* / DATA-008b consumer.

## Acceptance Criteria

### AC-1: identical-geometry efficiency variants collapse to a single option
*(PRIMARY)*
- **GIVEN** a fixtured routing-provider response where all 3 findScenicWaypoints preference variants (scenic-coastal, balanced, efficient) return the SAME `overviewGeometry.value` and the same distance/duration for one origin→destination
- **WHEN** planRideOrchestrator runs and planRide/buildOptionsFromResults builds the PlannedRouteOptionsView
- **THEN** `options.length === 1` (the duplicate efficiency-variant clones are dropped), and the single surviving option carries the full PlannedRouteOptionView shape (routeOptionId, label, rationale, stats, map, overlaysPreview)
- **Test tier:** `integration` · **Service:** live Convex dev ride-planning pipeline (planRideOrchestrator → buildOptionsFromResults) with a fixtured multi-variant provider response
- **Verify:** `pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts`
- **Scenario** (start `provider_three_identical_variants`):
  - must observe: `options.length === 1`; `options[0]` has a non-empty routeOptionId and a populated `map.overviewGeometry`
  - must NOT observe: `options.length === 3` (one card per variant — the bug); `options.length === 2`; `options.length === 0` (empty — dedup over-pruned)
  - negative control (would fail if): the orchestrator maps one option per compiled variant with no dedup → `options.length === 3`; the dedup helper is a passthrough/no-op → `options.length === 3`; the provider response is mocked away so all variants trivially differ and the identical-geometry case is never exercised

### AC-2: genuinely distinct routes are preserved
- **GIVEN** a fixtured response where 2 of the 3 variants share geometry and the 3rd returns a genuinely different `overviewGeometry.value` (distinct polyline + materially different distance/duration) for the same origin→destination
- **WHEN** planRideOrchestrator runs and the options are built
- **THEN** `options.length === 2` — the two clones collapse to one, the genuinely-distinct route survives as a second option, and neither survivor is dropped
- **Test tier:** `integration` · **Service:** live Convex dev with a fixtured 2-clone + 1-distinct provider response
- **Verify:** `pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts`
- **Scenario** (start `provider_two_clones_one_distinct`):
  - must observe: `options.length === 2`; the two survivors' `overviewGeometry.value` values are distinct (one === P-A, one === P-B)
  - must NOT observe: `options.length === 1` (distinct route lost); `options.length === 3` (clones not collapsed); two survivors sharing the same `overviewGeometry.value`
  - negative control (would fail if): dedup over-prunes and collapses the distinct route too → `options.length === 1`; no dedup → `options.length === 3`; the dedup key is the variant id (always unique) instead of geometry → `options.length === 3`

### AC-3: dedup never empties options (≥1 survivor invariant)
- **GIVEN** any fixtured provider response where at least one variant compiled successfully
- **WHEN** the dedup step runs over the orchestrator's successful results
- **THEN** `options.length >= 1` always — even when every variant is an identical clone, exactly one survivor remains and the map can render
- **Test tier:** `integration` · **Service:** live Convex dev ride-planning pipeline
- **Verify:** `pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts`
- **Scenario** (start `provider_three_identical_variants`):
  - must observe: `options.length >= 1` for every fixture; `options[]` is a non-empty array
  - must NOT observe: `options.length === 0`; `options === undefined or null`
  - negative control (would fail if): dedup returns an empty array when all variants are identical (would break the card→map render) → `options.length === 0`; dedup throws on an all-clones input instead of keeping one survivor

### AC-4: pure dedup helper collapses clones and preserves distinct entries (unit)
- **GIVEN** the extracted pure `dedupVariantResults` helper and an array of OrchestratorResult-shaped inputs
- **WHEN** called with `[A, A-clone, B]` (A and A-clone share `overviewGeometry.value`, B distinct)
- **THEN** it returns `[A, B]` (2 entries, clone removed, distinct preserved, first occurrence kept) — and returns `[A]` for `[A, A, A]` and `[]` only for `[]`
- **Test tier:** `unit` · **Service:** pure transform (no I/O)
- **UNIT_TEST_JUSTIFIED:** dedupVariantResults is a pure array transform over already-compiled results (no network, DB, or provider I/O) — the geometry-key dedup logic is pure and unit-tested in isolation, while the end-to-end pipeline behavior is covered by AC-1..AC-3 integration tests against live Convex dev.
- **Verify:** `pnpm test convex/actions/agent/lib/__tests__/dedupVariantResults.test.ts`
- **Scenario** (start `helper_clone_array`):
  - must observe: `dedupVariantResults([A,A-clone,B]).length === 2`; `dedupVariantResults([A,A,A]).length === 1`
  - must NOT observe: `dedupVariantResults([A,A-clone,B]).length === 3`; a thrown error on undefined geometry; `dedupVariantResults([A,A,A]).length === 0` (over-pruned)
  - negative control (would fail if): the helper returns its input unchanged (passthrough) → 3 entries survive; keys on variant id/index (always unique) → clones never collapse; drops ALL entries that have a duplicate (removing both A and A-clone) → `[B]` only, losing the route

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: a fixtured all-identical-geometry provider response yields `options.length === 1` with the full PlannedRouteOptionView shape (no duplicate efficiency cards). | AC-1 | `pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts` |
| TC-2 | Integration: a 2-clone + 1-distinct fixtured response yields `options.length === 2` with two distinct `overviewGeometry.value` survivors. | AC-2 | `pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts` |
| TC-3 | Integration: dedup never returns `options.length === 0` when ≥1 variant compiled (the ≥1-survivor invariant holds across fixtures). | AC-3 | `pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts` |
| TC-4 | Unit: `dedupVariantResults` collapses geometry-identical clones to the first occurrence and preserves distinct entries (`[A,A-clone,B] → [A,B]`; `[A,A,A] → [A]`; `[] → []`). | AC-4 | `pnpm test convex/actions/agent/lib/__tests__/dedupVariantResults.test.ts` |

## Reading List

- `convex/actions/agent/tools/findScenicWaypoints.ts` (53-89) — ROOT CAUSE — the 3 hardcoded preference variants (scenic-coastal/balanced/efficient) all use EMPTY waypoints, so Google Routes API frequently returns identical geometry → duplicate cards
- `convex/actions/agent/lib/planRideOrchestrator.ts` (100-191) — PRIMARY EDIT SEAM — `successful` results are mapped 1:1 to OrchestratorResult; insert dedup here (over successful[] keyed on `routeSnapshot.overviewGeometry.value` + rounded distance/duration) before the final `.map`
- `convex/actions/agent/planRide.ts` (104-155) — buildOptionsFromResults — maps results→options 1:1; its option SHAPE (plannedRouteOptionValidator, 28-73) must NOT change; only its input array is deduped
- `convex/actions/agent/providers/routingProvider.ts` (40-48) — `ProviderRouteResponse.overviewGeometry` — the encoded-polyline value used as the dedup geometry-identity key (the determinism seam to fixture)
- `convex/actions/agent/__tests__/planRide.integration.test.ts` (1-70) — existing integration-test harness pattern (fake ctx + real orchestrator) to mirror for the dedup integration test
- `convex/actions/agent/__tests__/planRide.test.ts` (17-46) — `makeSnapshot()` helper showing `overviewGeometry.value` shape — basis for the dedup fixtures and the pure-helper unit test

## Guardrails

**WRITE-ALLOWED:**
- `convex/actions/agent/lib/planRideOrchestrator.ts` (MODIFY — call dedup over successful[] before building OrchestratorResult[])
- `convex/actions/agent/lib/dedupVariantResults.ts` (NEW — pure geometry-key dedup helper exported for testing)
- `convex/actions/agent/lib/__tests__/dedupVariantResults.test.ts` (NEW — unit test for the pure helper)
- `convex/actions/agent/__tests__/planRideDedup.integration.test.ts` (NEW — integration test against the fixtured provider + real orchestrator)

**WRITE-PROHIBITED:**
- `convex/actions/agent/tools/findScenicWaypoints.ts` — do NOT change the variant-generation contract (3 preference variants stay; dedup happens downstream)
- `convex/actions/agent/planRide.ts` — do NOT change buildOptionsFromResults' option SHAPE or plannedRouteOptionsViewValidator
- `convex/actions/agent/tools/normalizeRoute.ts`
- `convex/actions/agent/providers/routingProvider.ts` — the provider is the fixtured seam, not modified
- Any DISC-* component, RouteAttachmentCard, sendMessage.ts, or any file not listed in WRITE-ALLOWED

## Design

- **Pattern:** Deterministic dedup wrapping the probabilistic/external provider output: extract a pure `dedupVariantResults(results)` helper keyed on `overviewGeometry.value` (with a rounded distance/duration tie-break), apply it to planRideOrchestrator's `successful` array before constructing `OrchestratorResult[]`, keeping the first occurrence per geometry key and guaranteeing ≥1 survivor.
- **Pattern source:** `convex/actions/agent/lib/planRideOrchestrator.ts` (the existing deterministic-wraps-probabilistic orchestrator), per `convex/actions/agent/CLAUDE.md` "Deterministic logic wraps the probabilistic core"
- **Anti-pattern:** Keying dedup on variant id/index (always unique → clones never collapse), or removing ALL entries that have a duplicate (loses the route entirely instead of keeping one), or returning an empty `options[]` when every variant is identical (breaks the map render)
- ref: DATA-008b (the routing_card score-field mapping consumer that must not break)
- ref: client consumer RUX-001 (the carousel pages whatever distinct set this returns, one route at a time)

## Verification Gates

| Gate | Command |
|------|---------|
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'convex/actions/agent/lib/planRideOrchestrator.ts' 'convex/actions/agent/lib/dedupVariantResults.ts'` |
| unit-helper | `pnpm test convex/actions/agent/lib/__tests__/dedupVariantResults.test.ts` |
| integration-dedup | `pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts` |
| convex-build | `pnpm convex:dev -- --once` |
| scenario | `RED-against-bug: the AC-1 test must FAIL on the current no-dedup orchestrator (options.length === 3 for identical geometry) before the dedup makes it pass (options.length === 1)` |
| human_gate | `On a real device, plan SF→Santa Cruz and observe ONE route card (or only genuinely-distinct routes), with NO duplicate efficiency-variant cards for the same road` |

## Coding Standards

- Read the producer's actual field names (`overviewGeometry.value`) — never guess geometry shape; the value is an encoded polyline string.
- Non-degenerate assertion: prove dedup by observing `options.length === 1` for all-identical AND `options.length === 2` for 2-clone+1-distinct — a fix that always returns 1 (over-pruning) must FAIL AC-2; a fix that always returns 3 (no dedup) must FAIL AC-1.
- Keep the dedup helper pure (no I/O) and exported for testing; the orchestrator wraps it deterministically.
- Never break the `PlannedRouteOptionsView` shape — only the cardinality/content of `options[]` changes.
- Implementer judgment (flagged, not load-bearing): pick a sensible distance/duration tolerance for "overlapping" near-identical geometry (e.g. within ~1% or ~200m), documented in the helper.

## Dependencies

- Depends on: DATA-008, DATA-008b (the routing_card options/score path this dedups without breaking)
- Blocks: DISC-020 (chat-driven curated cards ride the same options shape); informs RUX-001 (client carousel pages the deduped distinct set)

## Notes

Verified by Read (not assumed): findScenicWaypoints.ts hardcodes exactly 3 preference variants all with EMPTY waypoints, which is why Google Routes collapses them to identical geometry for the same OD; the dedup seam belongs in planRideOrchestrator (over `successful`), NOT in findScenicWaypoints (whose variant contract several call sites depend on). Chose contract (b) dedupe-near-identical over (a) single-primary because UC-DISC-10 + the RUX one-at-a-time pager benefit from keeping genuinely-distinct scenic alternatives while only dropping pure efficiency-clones; the options[] shape stays intact for DISC-020 / DATA-008b. The PRIMARY integration test fixtures the PROVIDER RESPONSE (the determinism seam) and exercises the REAL orchestrator + REAL buildOptionsFromResults — no mocking of the dedup logic itself, per the project iron rule.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "provider_three_identical_variants": {
      "description": "A fixtured routing-provider response (injected at the compileSketch/routingProvider seam — the determinism boundary) where all 3 findScenicWaypoints preference variants return the SAME overviewGeometry.value (encoded polyline) and the same total distanceMeters/durationSeconds for a single SF→Santa Cruz origin→destination. Reproduces the duplicate-efficiency-card scenario.",
      "seed_method": "recorded_external",
      "records": [
        "ProviderRouteResponse with overviewGeometry.value = 'polyline-P-A' returned for scenic-coastal, balanced, and efficient variants (identical geometry + distance + duration)"
      ]
    },
    "provider_two_clones_one_distinct": {
      "description": "A fixtured provider response where variants 1+2 share polyline P-A (identical distance/duration) and variant 3 returns a distinct polyline P-B with a materially different distance/duration, for the same origin→destination.",
      "seed_method": "recorded_external",
      "records": [
        "ProviderRouteResponse overviewGeometry.value = 'polyline-P-A' for scenic-coastal + balanced",
        "ProviderRouteResponse overviewGeometry.value = 'polyline-P-B' (distinct distance/duration) for efficient"
      ]
    },
    "helper_clone_array": {
      "description": "In-memory array of OrchestratorResult-shaped objects for the pure-helper unit test: [A, A-clone (same overviewGeometry.value as A), B (distinct)].",
      "seed_method": "recorded_external",
      "records": [
        "A: routeSnapshot.overviewGeometry.value = 'pA'",
        "A-clone: routeSnapshot.overviewGeometry.value = 'pA'",
        "B: routeSnapshot.overviewGeometry.value = 'pB'"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a fixtured provider response where all 3 preference variants return the same overviewGeometry.value WHEN planRideOrchestrator runs and options are built THEN options.length === 1 with the full PlannedRouteOptionView shape (duplicate efficiency cards eliminated)",
      "verify": "pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts",
      "scenario": {
        "start_ref": "provider_three_identical_variants",
        "tier": "integration",
        "test_tier": "integration",
        "verification_service": "live Convex dev ride-planning pipeline (fixtured provider response -> real orchestrator dedup -> real buildOptionsFromResults)",
        "negative_control": { "would_fail_if": [
          "the orchestrator maps one option per compiled variant with no dedup -> options.length === 3 (the current duplicate-card bug)",
          "the dedup helper is a passthrough/no-op (returns its input unchanged) -> options.length === 3",
          "the provider response is mocked away so all variants trivially differ and the identical-geometry case is never exercised"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "provider_three_identical_variants",
          "action": { "actor": "convex ride-planning pipeline", "steps": [
            "seed the routing provider to return one identical encoded polyline + identical distance/duration for all 3 preference variants of a single SF->Santa Cruz origin->destination",
            "invoke planRideOrchestrator with that origin->destination",
            "pass the orchestrator results to buildOptionsFromResults and read the resulting options[]"
          ] },
          "end_state": {
            "must_observe": [ "options.length === 1", "options[0] has a non-empty routeOptionId and a populated map.overviewGeometry" ],
            "must_not_observe": [ "options.length === 3 (one card per variant — the bug)", "options.length === 2", "options.length === 0 (empty result — dedup over-pruned)" ]
          }
        } ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN 2 clones + 1 genuinely-distinct variant WHEN options are built THEN options.length === 2 with two distinct geometries preserved",
      "verify": "pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts",
      "scenario": {
        "start_ref": "provider_two_clones_one_distinct",
        "tier": "integration",
        "test_tier": "integration",
        "verification_service": "live Convex dev ride-planning pipeline (fixtured provider response -> real orchestrator dedup)",
        "primary": false,
        "negative_control": { "would_fail_if": [
          "dedup is a no-op / passthrough (options unchanged) -> options.length === 3",
          "dedup over-prunes and collapses the distinct route too -> options.length === 1 (a real distinct route was lost)",
          "the dedup key is the variant id (always unique) instead of geometry, so clones never collapse -> options.length === 3"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "provider_two_clones_one_distinct",
          "action": { "actor": "convex ride-planning pipeline", "steps": [
            "seed the provider so variants 1+2 share polyline P-A and variant 3 returns a distinct polyline P-B with a materially different distance/duration",
            "invoke planRideOrchestrator and build options"
          ] },
          "end_state": {
            "must_observe": [ "options.length === 2", "the two survivors' overviewGeometry.value values are distinct (one === P-A, one === P-B)" ],
            "must_not_observe": [ "options.length === 1 (distinct route lost)", "options.length === 3 (clones not collapsed)", "options.length === 0 (empty result)" ]
          }
        } ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN >=1 compiled variant WHEN dedup runs THEN options.length >= 1 always (never empties)",
      "verify": "pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts",
      "scenario": {
        "start_ref": "provider_three_identical_variants",
        "tier": "integration",
        "test_tier": "integration",
        "verification_service": "live Convex dev ride-planning pipeline",
        "primary": false,
        "negative_control": { "would_fail_if": [
          "dedup returns an empty array when all variants are identical (would break the card->map render) -> options.length === 0",
          "dedup is a no-op that leaves the input unchanged",
          "dedup throws on an all-clones input instead of keeping one survivor"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "provider_three_identical_variants",
          "action": { "actor": "convex ride-planning pipeline", "steps": [
            "run the all-identical fixture and the 2-clone+1-distinct fixture through the pipeline",
            "assert options.length >= 1 for both"
          ] },
          "end_state": {
            "must_observe": [ "options.length === 1 for the all-identical fixture", "options.length >= 1 for every fixture" ],
            "must_not_observe": [ "options.length === 0 (empty)", "options === undefined or null" ]
          }
        } ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN the pure dedupVariantResults helper WHEN called with clone arrays THEN it collapses geometry-identical entries to the first occurrence and preserves distinct entries",
      "verify": "pnpm test convex/actions/agent/lib/__tests__/dedupVariantResults.test.ts",
      "unit_test_justified": "dedupVariantResults is a pure array transform over already-compiled results (no network, DB, or provider I/O); end-to-end pipeline behavior is covered by AC-1..AC-3 integration tests.",
      "scenario": {
        "start_ref": "helper_clone_array",
        "tier": "logic",
        "test_tier": "unit",
        "primary": false,
        "unit_test_justified": "pure array->array reducer with zero I/O; end-to-end pipeline behavior covered by AC-1..AC-3 integration tests",
        "verification_service": "pure function (no I/O)",
        "negative_control": { "would_fail_if": [
          "the helper returns its input unchanged (passthrough) -> [A, A-clone, B] survives with 3 entries",
          "the helper keys on variant id/index (always unique) -> clones never collapse",
          "the helper drops ALL entries that have a duplicate (removing both A and A-clone) -> [B] only, losing the route entirely instead of keeping one A"
        ] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [ {
          "start_ref": "helper_clone_array",
          "action": { "actor": "unit test", "steps": [
            "call dedupVariantResults([A, A-clone, B]) and assert result === [A, B]",
            "call dedupVariantResults([A, A, A]) and assert result.length === 1",
            "call dedupVariantResults([]) and assert result.length === 0"
          ] },
          "end_state": {
            "must_observe": [ "dedupVariantResults([A,A-clone,B]).length === 2", "dedupVariantResults([A,A,A]).length === 1" ],
            "must_not_observe": [ "dedupVariantResults([A,A-clone,B]).length === 3", "dedupVariantResults([A,A,A]).length === 0 (over-pruned)" ]
          }
        } ]
      }
    },
    { "id": "TC-1", "type": "test_criterion", "description": "all-identical fixture -> options.length === 1 (PRIMARY: no duplicate efficiency cards)", "verify": "pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "2-clone+1-distinct fixture -> options.length === 2 with distinct geometries", "verify": "pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "dedup >=1-survivor invariant (never options.length === 0)", "verify": "pnpm test convex/actions/agent/__tests__/planRideDedup.integration.test.ts", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "pure helper collapses clones to first occurrence, preserves distinct entries", "verify": "pnpm test convex/actions/agent/lib/__tests__/dedupVariantResults.test.ts", "maps_to_ac": "AC-4" }
  ]
}
-->
