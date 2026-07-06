# DATA-006: getCuratedRouteDetail public query (lean fields + 0–1 scores + routePolyline: string|null + centroid; NO enrichment; Clerk-gated)

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** To Do · **Priority:** P0 · **Effort:** M · **Estimate:** 180 min
**Agent:** convex-implementer
**Proposed By:** convex-planner
**TDD_MODE:** red_first · **RED_GREEN_REQUIRED:** yes
**Agent rationale:** convex-implementer owns public Convex query functions; this task adds a Clerk-gated query in convex/curatedRoutes.ts reusing the existing requireIdentity guard + buildRouteCard lean pattern, verified by integration tests against live dev.

## Outcome

An authenticated client can call `curatedRoutes:getCuratedRouteDetail({ routeId })` and receive a stable lean detail payload. Routes with a routePolyline expose it as a string; routes without expose `routePolyline: null` plus a valid centroid. listCuratedRoutes is unchanged.

## Specification

Add a public Clerk-gated query `getCuratedRouteDetail` in `convex/curatedRoutes.ts` returning a fully-specified lean detail object for a single curated route by routeId: normalized 0–1 scores, optional encoded polyline (`v.union(v.string(), v.null())`), computed bounds, and a centroid for weather lookup. **MUST also return `_id: v.id('curated_routes')`** (the internal document id) alongside `routeId` so the client can pass it to the save mutation's `curatedRouteRef` field (DATA-003/SAVE-001 contract). Reads NO enrichment (curated_route_enrichments is empty). Reuses the archetype UI↔DB map (UC-DATA-02), state-normalize + length-clamp read-path transforms (UC-DATA-04) already present in buildRouteCard. Weather is a SEPARATE client action call (getCurrentWeather on centroid) — this query exposes the centroid, does NOT block on or call weather.

## Critical Constraints

- MUST call `requireIdentity` before any DB read; an unauthenticated call MUST be rejected server-side.
- MUST resolve the route via the `by_routeId` index (`ctx.db.query('curated_routes').withIndex('by_routeId', q => q.eq('routeId', args.routeId)).unique()`).
- `routePolyline` validator MUST be `v.union(v.string(), v.null())`; null for the ~45% lacking geometry.
- MUST return scores on the 0–1 scale (never 0–100); derive the headline from summary or name (oneLiner is 0% populated).
- MUST return `_id: v.id('curated_routes')` in the response — SAVE-001's save mutation requires the internal `_id` (not the public `routeId` string) as `curatedRouteRef`.
- NEVER read `curated_route_enrichments` (table is empty; no photos/history/elevation). NEVER mock `ctx.db` in tests.

## Acceptance Criteria

### AC-1: route WITH routePolyline returns the encoded polyline string
*(PRIMARY)*
- **flow_ref:** `.spec/scenarios/UC-DATA-06/`
- **GIVEN** a seeded curated_routes row (routeId 'curated-001', routePolyline 'encodedPolylineABC123', centroidLat 39.5, centroidLng -105.1, compositeScore 0.85)
- **WHEN** an authenticated client calls `getCuratedRouteDetail({ routeId: 'curated-001' })`
- **THEN** the response returns routePolyline == 'encodedPolylineABC123', compositeScore == 0.85, centroidLat == 39.5, centroidLng == -105.1
- **Test tier:** `integration` · **Service:** live Convex dev (api.curatedRoutes.getCuratedRouteDetail)
- **Verify:** `pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts`
- **Scenario** (start `convex_polyline_route`):
  - must observe: `response.routePolyline == 'encodedPolylineABC123'`; `response.compositeScore == 0.85`; `response.centroidLat == 39.5`
  - must NOT observe: `response.routePolyline == null`; missing routeId; empty/start signature
  - negative control (would fail if): query disconnected returns []; routePolyline validator rejects string; requireIdentity throws unauthenticated

### AC-2: route WITHOUT routePolyline returns null polyline + valid centroid + bounds
- **GIVEN** a seeded row (routeId 'curated-002', routePolyline null, centroidLat 34.1, bounds {north:34.2, south:34.0, east:-118.0, west:-118.4})
- **WHEN** an authenticated client calls `getCuratedRouteDetail({ routeId: 'curated-002' })`
- **THEN** response.routePolyline == null, centroidLat == 34.1, bounds.north == 34.2, bounds.south == 34.0
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts`
- **Scenario** (start `convex_no_polyline_route`): must observe `response.routePolyline == null`, `centroidLat == 34.1`, `bounds.north == 34.2`; must NOT observe undefined polyline / NaN centroid / empty signature; would fail if polyline returned undefined instead of null.

### AC-3: headline derives from summary/name and scores are 0–1
- **GIVEN** a seeded row (oneLiner '', summary 'A scenic mountain loop', curvatureScore 0.92, scenicScore 0.81, compositeScore 0.88)
- **WHEN** queried
- **THEN** response.curvatureScore == 0.92, scenicScore == 0.81, compositeScore == 0.88 (never 92 / 0–100)
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts`
- **Scenario** (start `convex_score_row`): must observe `curvatureScore == 0.92`, `scenicScore == 0.81`, `compositeScore == 0.88`; must NOT observe `curvatureScore == 92` / empty signature; would fail if headline falls back to oneLiner or 0–100 escapes.

### AC-4: detail returns NO enrichment fields
- **GIVEN** an empty curated_route_enrichments table
- **WHEN** queried
- **THEN** response has ≥10 lean keys (routeId, name, state, routePolyline, ...) and 0 enrichment keys (no 'photos', no 'elevationGainM', no 'description')
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts`
- **Scenario** (start `convex_polyline_route`): must observe ≥10 lean keys and 0 enrichment keys; must NOT observe `elevationGainM` / `photos`; would fail if query joins curated_route_enrichments.

### AC-5: unauthenticated request is rejected
- **GIVEN** a live dev deployment and a request with no Clerk identity
- **WHEN** `getCuratedRouteDetail` is called without authentication
- **THEN** error.code == 'UNAUTHENTICATED' (HTTP 401) before any DB read
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts`
- **Scenario** (start `convex_bad_id`): must observe `error.code == 'UNAUTHENTICATED'`, status == 401; must NOT observe a routeId in response; would fail if requireIdentity is skipped.

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | getCuratedRouteDetail returns the encoded routePolyline string when present. | AC-1 | `pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts` |
| TC-2 | getCuratedRouteDetail returns routePolyline:null + valid centroid/bounds when geometry absent. | AC-2 | same |
| TC-3 | Scores are 0–1 and the headline derives from summary/name. | AC-3 | same |
| TC-4 | Response excludes enrichment fields. | AC-4 | same |
| TC-5 | An unauthenticated call is rejected UNAUTHENTICATED. | AC-5 | same |

## Reading List

- `convex/curatedRoutes.ts` (1-60, 293-307) — requireIdentity + buildRouteCard lean pattern + query export shape to mirror
- `convex/schema.ts` (185-198) — curated_routes table + by_routeId index
- `shared/models/curated-routes.ts` (160-250) — curatedRouteValidator lean + optional geometry fields
- `convex/util/archetypeMap.ts` (1-50) — dbArchetypeToUi mapping to reuse
- `convex/util/dataNormalization.ts` (1-50) — normalizeState + clampLength transforms
- `.spec/prds/mvp/04-uc-data.md`#uc-data-06 · `.spec/prds/mvp/09-technical-requirements/04-api-design.md`

## Guardrails

- WRITE-ALLOWED: `convex/curatedRoutes.ts (MODIFY — add getCuratedRouteDetail)` · `convex/__tests__/getCuratedRouteDetail.integration.test.ts (NEW)`
- WRITE-PROHIBITED: `convex/schema.ts` (DATA-003 owns) · `shared/models/curated-routes.ts` · any file not listed above

## Design

- ref: `.spec/prds/mvp/04-uc-data.md`#uc-data-06 · `.spec/scenarios/UC-DATA-06/`
- pattern: export `query({ args:{routeId: v.string()}, returns: detailReturnValidator, handler })` — await requireIdentity, fetch via by_routeId, map through a detail builder based on buildRouteCard adding bounds + routePolyline (`route.routePolyline ?? null`) + sourceLabel/sourceUrl + summary logic + geometrySource.
- pattern_source: `convex/curatedRoutes.ts:buildRouteCard`
- anti_pattern: do NOT use `ctx.db.get(id)` (caller shouldn't need the internal _id); do NOT read curated_route_enrichments/geometry.

## Verification Gates

| Gate | Command |
|------|---------|
| TypeCheck | `pnpm type-check` |
| Integration vs live Convex | `pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts` |
| Biome | `pnpm exec biome check convex/curatedRoutes.ts` |
| Convex build | `pnpm convex:dev --once` |
| Manual live evidence | `npx convex run curatedRoutes:getCuratedRouteDetail '{"routeId":"<real id>"}'` |

## Coding Standards

- Validator-first: returns validator fully specifies every field.
- requireIdentity on every public read.
- Integration tests against live Convex dev — no ctx.db mocks.

## Dependencies

- Depends on: DATA-001, DATA-002, DATA-004, DATA-005
- Blocks: DTL-001

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "DATA-006",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "convex_polyline_route": { "description": "live Convex dev curated_routes row WITH routePolyline + scores + summary", "seed_method": "public_api", "records": ["curated_routes row routePolyline non-null compositeScore 0.85"] },
    "convex_no_polyline_route": { "description": "live Convex dev curated_routes row routePolyline=null centroid present", "seed_method": "public_api", "records": ["routePolyline null centroidLat/Lng set bounds set"] },
    "convex_score_row": { "description": "live Convex dev curated_routes row with real 0-1 scores", "seed_method": "public_api", "records": ["compositeScore 0.88 curvature 0.92 scenic 0.81"] },
    "convex_bad_id": { "description": "a curated-route id absent from live Convex dev", "seed_method": "public_api", "records": ["unknown curated id"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "GIVEN a seeded route WITH routePolyline WHEN an authenticated client calls getCuratedRouteDetail THEN the encoded polyline string is returned unchanged with valid centroid and 0-1 scores.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a seeded route WITHOUT routePolyline WHEN queried THEN routePolyline is null and a valid centroid/bounds are returned.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "primary": false, "description": "GIVEN a seeded route with summary/name + 0-1 scores WHEN queried THEN the headline derives from summary/name and scores stay on the 0-1 scale.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "primary": false, "description": "GIVEN an empty curated_route_enrichments table WHEN queried THEN no enrichment fields appear in the response.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": null },
    { "id": "AC-5", "type": "acceptance_criterion", "primary": false, "description": "GIVEN an unauthenticated client WHEN getCuratedRouteDetail is called THEN requireIdentity rejects with UNAUTHENTICATED.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "routePolyline string returned when present.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "null polyline fallback + centroid/bounds.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "0-1 score normalization + headline derivation.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "enrichment fields absent.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": "AC-4" },
    { "id": "TC-5", "type": "test_criterion", "description": "unauthenticated rejection.", "verify": "pnpm test convex/__tests__/getCuratedRouteDetail.integration.test.ts", "maps_to_ac": "AC-5" }
  ]
}
-->
