# DATA-001: Seed @convex-dev/geospatial points table from curated_routes centroids (idempotent)

| Field | Value |
|---|---|
| Sprint | sprint-01-live-discovery-home |
| Agent | convex-implementer |
| Estimate | 180 min |
| Type | FEATURE |
| Status | Backlog |
| Proposed By | convex-planner |

## Background
`@convex-dev/geospatial` (v0.2.1) is installed, registered in `server/convex/convex.config.ts` (`app.use(geospatial)`), and wired in `server/convex/geospatialIndex.ts` (key = route doc id, coordinates = centroid, filterKeys = {state, primaryArchetype}, sortKey = compositeScore) — but its component points table is EMPTY (`debugGeospatialData` returns total_in_index=0). Without seeded points, bbox/nearest browse (the hero Discovery screen) returns nothing. This GATE seeds one point per curated_route from its 100%-present centroid, idempotently, so `listCuratedRoutes` (DATA-005) can resolve proximity. Enabling-only: it does NOT alter curated_routes.

## Critical Constraints
- MUST seed one geospatial point per curated_route from centroidLat/centroidLng, carrying filterKeys {state, primaryArchetype} and sortKey compositeScore.
- MUST be idempotent: re-running the seed yields no net new points for already-seeded routes.
- MUST skip + log routes with junk centroids (if any); target ~5,654 points (allowing skips).
- MUST complete `geospatial.nearest` and `geospatial.query({rectangle})` for a founder region under 500ms.
- NEVER mutate `curated_routes` (read-only; seed only the geospatial component).
- NEVER create duplicate points on re-run.

## Specification
**Objective:** Populate the geospatial component points table idempotently from curated_routes centroids so bbox/nearest browse works.
**Success State:** Against live Convex dev, the points table holds ~5,654 points; re-running is a no-op; nearest + rectangle queries return real routes <500ms with correct filterKeys/sortKey.

## Acceptance Criteria
### AC-1: Points table populated to ~catalog size [PRIMARY]
**GIVEN** live Convex dev with the 5,654-row curated_routes catalog and the geospatial component registered with an EMPTY points table **WHEN** the founder runs the seeding function (internal mutation/action) against live Convex dev **THEN** `debugGeospatialData` reports total_in_index approximately equal to the curated_routes count (~5,654, allowing skipped junk centroids).
- test_tier: integration · verification_service: live Convex dev deployment
- verify: run the seed action then a debug query: `cd server && npx convex run --dev <seedAction>` then query `debugGeospatialData` and assert total_in_index >= 5600
- **Scenario:** start_ref→live_catalog; must_observe:[total_in_index >= 5600 (concrete, non-zero)]; must_not_observe:[total_in_index == 0 (empty/start signature)]; negative_control.would_fail_if:[disconnect, stub, empty, mock, static]; case non-degenerate (5,654 rows, not 0).

### AC-2: Idempotent (re-run is a no-op)
**GIVEN** the points table is already seeded **WHEN** the founder runs the seeding function a second time **THEN** the point count does not increase (no net new points).
- test_tier: integration · verify: capture count before second run, re-run, assert count unchanged.
- **Scenario:** must_observe:[count_after == count_before]; must_not_observe:[count_after > count_before]; negative_control.would_fail_if:[stub, duplicate-on-rerun].

### AC-3: nearest + rectangle return real routes <500ms with correct keys
**GIVEN** the seeded points table **WHEN** the founder issues `geospatial.nearest` at a founder-region point (Nashville 36.17,-86.78) and `geospatial.query({rectangle})` over a Southeast bbox **THEN** both return >=1 real route within 500ms, each point carrying filterKeys {state, primaryArchetype} and sortKey compositeScore.
- test_tier: integration · verify: time both calls via the validation harness; assert >=1 result and latency <500ms.
- **Scenario:** start_ref→founder_region_bbox/nashville_center; must_observe:[>=1 real routeId, latency_ms < 500, filterKeys present]; must_not_observe:[empty result, missing keys, latency >= 500]; negative_control.would_fail_if:[index not seeded, wrong keys].

### AC-4: Junk-centroid routes skipped + logged (error path)
**GIVEN** a curated_route with an invalid centroid (NaN/out-of-range lat/lng, if any exist) **WHEN** the seed runs **THEN** that route is skipped (not crashing the seed) and logged, and valid routes still seed.
- test_tier: integration · verify: seed completes without throwing; logs reference skipped keys.
- **Scenario:** must_observe:[seed action exits success, log mentions skipped]; must_not_observe:[seed throws/aborts]; negative_control.would_fail_if:[uncaught throw, partial abort].

## Test Criteria
- **TC-1** (maps_to_ac AC-1): Seeded point count is within tolerance of the 5,654-row catalog — verify: `cd server && npx convex run --dev <debugQuery>` returns total_in_index >= 5600
- **TC-2** (maps_to_ac AC-2): A second seed run produces zero net-new points — verify: diff count before/after re-run == 0
- **TC-3** (maps_to_ac AC-3): nearest + rectangle return >=1 real route under 500ms with filterKeys + sortKey — verify: timed validation harness
- **TC-4** (maps_to_ac AC-4): Invalid-centroid routes are skipped without aborting the seed — verify: seed action returns success with skip log

## Reading List
- `server/convex/geospatialIndex.ts` — declared index shape (key, filterKeys, sortKey)
- `server/convex/convex.config.ts` — `app.use(geospatial)` registration
- `server/convex/geospatialValidation.ts` — existing nearest/rectangle + <500ms latency assertion pattern (validation-only; quarantine before prod)
- `server/models/curated-routes.ts` — centroid fields (centroidLat/centroidLng, 100% present)
- PRD `.spec/prds/mvp/04-uc-data.md` UC-DATA-01; `09-technical-requirements/06-external-dependencies.md`

## Guardrails
**Write Allowed:** `server/convex/geospatialSeed.ts (NEW)` internal mutation/action; register/extend in `server/convex/convex.config.ts` if required.
**Write Prohibited:** `server/models/curated-routes.ts` (read-only model), `server/convex/schema.ts`, `server/convex/geospatialIndex.ts` (already correctly declared).

## Code Pattern / Design
- Pattern: idempotent seed via geospatial `insert`/`add` keyed by curated_routes doc id; upsert semantics so re-run is a no-op. Iterate curated_routes in a paginated internal action (avoid loading all 5,654 in one transaction).
- Anti-pattern: re-seeding duplicates; loading the whole catalog in one `.collect()`; mutating curated_routes; using `.filter()` for geography downstream.

## Agent Instructions (TDD)
RED: write an integration test that runs the seed against live Convex dev and asserts total_in_index >= 5600 (fails while index empty). GREEN: implement `geospatialSeed` so the test passes + idempotency holds. REFACTOR: paginate the seed; add skip-logging for junk centroids. Verify AC-3 latency + AC-4 skip before done.

## Dependencies
- depends_on: none
- blocks: DATA-005 (listCuratedRoutes bbox/nearest depends on seeded points)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{ "requirements": [ {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN live Convex dev with 5,654 curated_routes and empty geospatial points WHEN the seed runs THEN total_in_index ~= 5,654","verify":"cd server && npx convex run --dev <seedAction> then debugGeospatialData count >= 5600"}, {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN seeded points WHEN seed runs again THEN no net new points","verify":"count diff before/after re-run == 0"}, {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN seeded points WHEN nearest(Nashville) + rectangle(Southeast) THEN >=1 real route <500ms with filterKeys+sortKey","verify":"timed validation harness, latency_ms < 500"}, {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN an invalid-centroid route WHEN seed runs THEN route skipped+logged, valid routes still seed","verify":"seed returns success with skip log"}, {"id":"TC-1","type":"test_criterion","description":"Seeded point count within tolerance of 5,654-row catalog","maps_to_ac":"AC-1","verify":"debugGeospatialData total_in_index >= 5600"}, {"id":"TC-2","type":"test_criterion","description":"Second seed run produces zero net-new points","maps_to_ac":"AC-2","verify":"count diff == 0"}, {"id":"TC-3","type":"test_criterion","description":"nearest+rectangle return >=1 real route <500ms with keys","maps_to_ac":"AC-3","verify":"timed harness"}, {"id":"TC-4","type":"test_criterion","description":"Invalid-centroid routes skipped without abort","maps_to_ac":"AC-4","verify":"seed success + skip log"} ] }
-->
