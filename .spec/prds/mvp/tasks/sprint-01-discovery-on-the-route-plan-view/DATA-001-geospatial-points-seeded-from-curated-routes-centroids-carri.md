# DATA-001: Geospatial points seeded from curated_routes centroids (carried — verify idempotent + non-empty)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** INFRA · **Status:** ✅ Completed · **Priority:** P0 · **Effort:** S · **Estimate:** 30 min  
**Agent:** convex-implementer  
**Proposed By:** convex-planner  
**Agent rationale:** Verification of a seeded @convex-dev/geospatial component against the live Convex dev deployment — Convex backend domain, integration-tier evidence, no UI. The convex-implementer owns the seed action (geospatialSeed.ts) and the validation query (geospatialValidation.ts) and can drive npx convex run against live dev.  

## Outcome

Running seedGeospatialAll against live Convex populates ~5,654 geospatial points (one per curated_route), a re-run adds zero, and nearest/bbox return real routes.

## Specification

geospatialSeed.ts already defines seedGeospatialBatchInternal (paginated internalMutation over curated_routes, skipping junk centroids) and seedGeospatialAll (action that loops batches). geospatialIndex.ts wires the GeospatialIndex (key=route doc _id, filterKeys={state, primaryArchetype}, sortKey=compositeScore). geospatialValidation.ts exposes debugGeospatialData (total_in_index via a full-world rectangle), validateNearestNeighbor (Nashville), and validateRectangularRange (Southeast box). This task re-verifies the SPATIAL-RESOLVE gate against live Convex dev per T-DATA-001 and T-DATA-002: (1) run seedGeospatialAll once, capture debugGeospatialData total_in_index ≈ curated_routes count (~5,654, tolerant of skipped junk centroids); (2) run it a second time and confirm no net-new points (idempotent — geospatial.insert keyed on route _id does not duplicate); (3) confirm validateNearestNeighbor + validateRectangularRange each return ≥1 real route under the 500ms budget with filterKeys/sortKey present. Note debugGeospatialData currently caps the rectangle at limit:1000 — if total_in_index reads ~1000 due to that cap rather than the true count, harden the count probe (paginate via nextCursor) so the AC asserts the true ~5,654, not a truncated 1000. Use npx convex run against live dev for the seed action and the debug/validation queries.

## Critical Constraints

- VERIFY ONLY — this is a carried/built task. Do NOT re-implement seedGeospatialAll or geospatialIndex.ts; if a defect is found, the fix is a minimal correction bonded to the failing AC, not a rewrite.
- NEVER seed against prod or any deployment other than the live Convex DEV deployment that holds the 5,654-row curated_routes catalog.
- NEVER mutate curated_routes — seeding writes only to the geospatial component points table (enabling-only).
- The idempotence AC MUST observe a real second-run delta of 0 against the live index — a unit/mock that asserts 0 is a fakeable pass and is rejected.

## Acceptance Criteria

### AC-1: Seeding populates ~5,654 idempotent geospatial points
*(PRIMARY)*
- **flow_ref:** `HF-DATA-01-CORE` · `.spec/scenarios/UC-DATA-01/core-seed-geospatial-from-centroids.scenario.md` *(bound 2026-06-23 by /kb-e2e-retrofit --apply)*
- **GIVEN** the live Convex dev deployment holding the 5,654-row curated_routes catalog with the geospatial index empty or partially seeded
- **WHEN** the founder runs seedGeospatialAll then runs it a second time, reading debugGeospatialData before/after each run
- **THEN** post-first-run total_in_index is within tolerance of the curated_routes count and the second run yields zero net-new points
- **Test tier:** `integration` · **Service:** live Convex dev deployment (geospatialSeed.seedGeospatialAll + geospatialValidation.debugGeospatialData)
- **Verify:** `pnpm test convex/__tests__/geospatialSeed.integration.test.ts` → `seedsApproxRouteCountAndReRunIsIdempotent`
- **Scenario** (start `live_curated_catalog`):
  - must observe: total_in_index ≈ 5654 (within skipped-junk tolerance, > 5000); second-run net-new points = 0
  - must NOT observe: total_in_index = 0; total_in_index = 1000 (truncated cap); second-run net-new > 0 (duplication)
  - negative control (would fail if): seed action is a no-op (empty index); insert is not keyed on route _id so re-run duplicates points; debugGeospatialData is mocked/static; count probe truncates at the limit:1000 cap and reports 1000 not ~5,654

### AC-2: nearest + rectangle return real routes with filterKeys/sortKey under 500ms
- **GIVEN** the seeded geospatial index on live Convex dev
- **WHEN** validateNearestNeighbor (Nashville point) and validateRectangularRange (Southeast bbox) run
- **THEN** each returns ≥1 real route within 500ms with state+primaryArchetype filterKeys and compositeScore sortKey available
- **Test tier:** `integration` · **Service:** live Convex dev deployment (geospatialValidation.validateNearestNeighbor + validateRectangularRange)
- **Verify:** `pnpm test convex/__tests__/geospatialSeed.integration.test.ts` → `nearestAndRectangleReturnRealRoutesUnderBudget`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: status = 'PASS'; count ≥ 1 for both queries; latency_ms < 500
  - negative control (would fail if): index empty so queries return []; filterKeys/sortKey not stored on points; latency over 500ms budget

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration test asserts post-seed total_in_index > 5000 and a second seedGeospatialAll run produces 0 net-new points (T-DATA-001). | AC-1 | `pnpm test convex/__tests__/geospatialSeed.integration.test.ts` |
| TC-2 | Integration test asserts nearest + rectangle each return ≥1 real route under 500ms with filterKeys/sortKey (T-DATA-002). | AC-2 | `pnpm test convex/__tests__/geospatialSeed.integration.test.ts` |

## Reading List

- `convex/geospatialSeed.ts` (24-131) — PRIMARY PATTERN — paginated batch insert + seedGeospatialAll loop; the function under verification
- `convex/geospatialValidation.ts` (12-90) — debugGeospatialData count probe (note the limit:1000 cap to harden) + nearest/rectangle validators
- `convex/geospatialIndex.ts` (21-27) — GeospatialIndex wiring: key/filterKeys/sortKey contract
- `convex/__tests__/seedGeospatialTest.test.ts` (1-86) — existing seed test shape and conventions
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (29-30) — T-DATA-001 / T-DATA-002 pass/fail criteria

## Guardrails

- WRITE-ALLOWED: `convex/__tests__/geospatialSeed.integration.test.ts (NEW)`
- WRITE-ALLOWED: `convex/geospatialValidation.ts (MODIFY — only if the count probe needs the cap-truncation fix)`
- WRITE-ALLOWED: `convex/geospatialSeed.ts (MODIFY — only a minimal correction if idempotence/skip logic is found broken)`
- WRITE-PROHIBITED: convex/schema.ts — no schema change in this gate
- WRITE-PROHIBITED: convex/curated*.ts — curated_routes is read-only here
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: .spec/prds/mvp/04-uc-data.md#uc-data-01
- ref: .spec/prds/mvp/09-technical-requirements/04-api-design.md
- pattern: Idempotent component-index seed verified against live Convex dev via npx convex run; debugGeospatialData as the count oracle (paginated to defeat the rectangle cap).

## Verification Gates

| Gate | Command |
|------|---------|
| gate | `pnpm type-check` |
| gate | `pnpm test convex/__tests__/geospatialSeed.integration.test.ts` |
| gate | `pnpm exec biome check convex/geospatialSeed.ts convex/geospatialValidation.ts` |
| gate | `pnpm convex:dev -- --once` |
| gate | `npx convex run geospatialValidation:debugGeospatialData '{}' (manual evidence capture against live dev — total_in_index > 5000)` |

## Coding Standards

- Validator-first: no schema/validator change in this gate (enabling-only).
- No .filter() for geography — geospatial component handles spatial resolution.
- Integration evidence over unit assertions: the idempotence/non-empty claims must be observed against live Convex, never mocked.

## Dependencies

- Depends on: None
- Blocks: DATA-005 (listCuratedRoutes bbox/nearest modes rely on seeded points)
- Parallel: DATA-002, DATA-004

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "live_curated_catalog": {
      "description": "the live Convex dev deployment's 5,654-row curated_routes table (centroid 100% present)",
      "seed_method": "migration_fixture",
      "records": [
        "~5,654 curated_routes rows each with centroidLat/centroidLng, state, primaryArchetype, compositeScore"
      ]
    },
    "seeded_geospatial_index": {
      "description": "geospatial component points table after a successful seedGeospatialAll run",
      "seed_method": "public_api",
      "records": [
        "~5,654 points keyed by curated_route _id with {state, primaryArchetype} filterKeys and compositeScore sortKey"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN live Convex dev with the 5,654-row catalog WHEN seedGeospatialAll runs twice with debugGeospatialData read between THEN post-first-run total_in_index \u2248 route count and second run yields 0 net-new points",
      "verify": "pnpm test convex/__tests__/geospatialSeed.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the seeded index WHEN nearest + rectangle validation queries run THEN each returns \u22651 real route under 500ms with filterKeys/sortKey",
      "verify": "pnpm test convex/__tests__/geospatialSeed.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Idempotent non-empty seed verified against live dev (T-DATA-001)",
      "verify": "pnpm test convex/__tests__/geospatialSeed.integration.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "nearest+rectangle real-route latency budget verified (T-DATA-002)",
      "verify": "pnpm test convex/__tests__/geospatialSeed.integration.test.ts",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
