# DATA-008b: FIX: discoverCuratedRoutes reads nested route.scores/route.score but listCuratedRoutes returns flat *Score fields → chat cards show composite 0 / zero bars

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** ✅ Completed · **Priority:** P0 · **Effort:** M · **Estimate:** 90 min  
**Agent:** convex-implementer  
**Proposed By:** convex-planner  
**Agent rationale:** Confirmed backend bug in the Convex discovery action's option builder: it reads fields that listCuratedRoutes does not return. convex-implementer owns both contracts (the query's flat returnValidator and the tool's option mapping) and can prove the fix against live dev.  

## Outcome

A fixtured discovery intent yields a route_plans option whose scores.composite > 0 and whose dimension scores equal the route's real listCuratedRoutes values, and distanceMi=0 is guarded to the nearest-sort case.

## Specification

In tools/discoverCuratedRoutes.ts the options.map (lines 133-172) builds each option.scores as {composite: route.score||0, dimensions:{scenery: route.scores?.scenery||0, curvature: route.scores?.curvature||0, elevation: route.scores?.elevation||0, traffic: route.scores?.traffic||0, pavement: route.scores?.pavement||0}}. None of route.score or route.scores.* exist on the listCuratedRoutes return (returnValidator: compositeScore, curvatureScore, scenicScore, technicalScore, trafficScore, remotenessScore — all flat 0–1, optional dimensions). So every chat-discovered option surfaces composite:0 and all-zero dimension bars. FIX: map composite ← route.compositeScore, and the dimension set ← the flat fields, choosing a stable dimension naming that the routing_card / RouteAttachmentCard consumes (align to the card's expected dimension keys; map scenery←scenicScore, curvature←curvatureScore, traffic←trafficScore, and carry technicalScore/remotenessScore per the card contract — confirm the consumer's expected keys before finalizing). ALSO at line 139 the stats.distanceMeters = (route.distanceMi||0)*1609.344 fabricates 0 meters when distanceMi is undefined (best sort) — guard so distance is only set when distanceMi is present (sort='nearest'). Do NOT touch listCuratedRoutes or its norm helper; the query already returns correct 0–1 flat scores.

## Critical Constraints

- THE BUG (confirmed, discoverCuratedRoutes.ts lines 144-153): the option builder reads route.score and route.scores?.scenery|curvature|elevation|traffic|pavement, but listCuratedRoutes returns FLAT fields — compositeScore, curvatureScore, scenicScore, technicalScore, trafficScore, remotenessScore. Map the flat fields so the option carries the route's REAL 0–1 scores.
- PRIMARY AC MUST observe scores.composite > 0 (a non-degenerate value) for a route whose real compositeScore > 0 — a fixed value of 0 is the start signature and a fakeable pass; the test must exclude it.
- Verify against REAL listCuratedRoutes on live Convex dev — no mocked query. The bug only manifests against the real flat-field contract.
- Guard the distanceMi=0 fallback: distanceMi is populated only on sort='nearest'; do not coerce an undefined distance into a real 0 (use undefined/null, not a misleading 0 distance).

## Acceptance Criteria

### AC-1: discovery option carries the route's real non-zero composite + dimension scores
*(PRIMARY)*
- **flow_ref:** `HF-DISC-10-EDGE` · `.spec/scenarios/UC-DISC-10/edge-zero-score-and-no-result.scenario.md` *(bound 2026-06-23 by /kb-e2e-retrofit --apply)*
- **GIVEN** the seeded live Convex dev catalog and a fixtured intent that returns a route whose real compositeScore > 0
- **WHEN** runDiscoverCuratedRoutes executes and the created route_plans option is loaded
- **THEN** option.scores.composite equals the route's real compositeScore (> 0) and each dimension score equals the route's real corresponding flat *Score value (not 0)
- **Test tier:** `integration` · **Service:** live Convex dev (discoverCuratedRoutes → listCuratedRoutes → route_plans options)
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` → `optionCarriesRealNonZeroScores`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: option.scores.composite > 0; option.scores.composite === the queried route's real compositeScore; ≥1 dimension score > 0 matching the queried route's real *Score
  - must NOT observe: option.scores.composite === 0; all dimension scores === 0 (the start/zero signature)
  - negative control (would fail if): option reads route.score (undefined→0) so composite is 0; dimensions read route.scores.* (undefined→0) so all bars are 0; listCuratedRoutes mocked

### AC-2: distanceMi=0 fallback is guarded to the nearest-sort case
- **GIVEN** a fixtured intent with sort='best' (distanceMi unpopulated)
- **WHEN** runDiscoverCuratedRoutes builds the option stats
- **THEN** the option does not present a misleading real 0-distance — distance is undefined/null when distanceMi is absent, and populated only when sort='nearest' returned a distanceMi
- **Test tier:** `integration` · **Service:** live Convex dev (discoverCuratedRoutes options for best vs nearest)
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` → `distanceGuardedToNearestSort`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: best-sort option distance === undefined (no fabricated 0); nearest-sort option distance derived from a real distanceMi > 0
  - must NOT observe: best-sort option distanceMeters === 0 (fabricated real 0); nearest-sort option distance === 0; nearest-sort option distance === undefined; 0 options returned (empty result)
  - negative control (would fail if): the option builder is hardcoded to coerce an absent distanceMi into a real 0 (stats.distanceMeters = (route.distanceMi||0)*1609.344) so best-sort fabricates a 0 distance; the nearest-sort branch is a no-op/stubbed so the real distanceMi is dropped to undefined; listCuratedRoutes is mocked so neither the best-absent nor the nearest-present distance reflects the real query

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: a fixtured intent's route_plans option has scores.composite > 0 equal to the route's real compositeScore and ≥1 real non-zero dimension score (the DATA-008b PRIMARY fix). | AC-1 | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` |
| TC-2 | Integration: best-sort options do not fabricate a real 0 distance; nearest-sort options carry the real distance. | AC-2 | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` |

## Reading List

- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (133-172) — PRIMARY PATTERN (the bug) — options.map reading route.score/route.scores.* + distanceMi fallback to fix
- `convex/curatedRoutes.ts` (36-54) — the authoritative FLAT returnValidator: compositeScore + 5 flat *Score fields (the contract the tool must read)
- `convex/curatedRoutes.ts` (119-137) — buildRouteCard — confirms which flat fields the card actually carries
- `convex/actions/agent/sendMessage.ts` (247-276) — how the routing_card consumes the route_plans option (attachment) — confirm expected dimension keys
- `.spec/prds/mvp/05-uc-disc.md` (91-96) — UC-DISC-10 AC5: composite carries through 0–1 as bars/percent, never 0-100, never 0

## Guardrails

- WRITE-ALLOWED: `convex/actions/agent/tools/discoverCuratedRoutes.ts (MODIFY — fix the option score mapping + distance guard)`
- WRITE-ALLOWED: `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts (NEW)`
- WRITE-PROHIBITED: convex/curatedRoutes.ts — the query already returns correct flat 0–1 scores; do not change it
- WRITE-PROHIBITED: convex/util/archetypeMap.ts
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: .spec/prds/mvp/09-technical-requirements/04-api-design.md
- ref: .spec/prds/mvp/05-uc-disc.md#uc-disc-10
- pattern: Align the consumer (option builder) to the producer's flat returnValidator: composite ← compositeScore, dimensions ← the flat *Score fields; guard derived-distance to the sort='nearest' branch.

## Verification Gates

| Gate | Command |
|------|---------|
| gate | `pnpm type-check` |
| gate | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` |
| gate | `pnpm exec biome check convex/actions/agent/tools/discoverCuratedRoutes.ts` |
| gate | `pnpm --dir server run convex:dev -- --once` |

## Coding Standards

- Read the producer's actual returnValidator field names — never guess nested shapes.
- Non-degenerate assertion: the fix is proven only by observing a real >0 score, never a passing 0.
- Do not fabricate 0 as a real value (distance) — use undefined/null for absent data.

## Dependencies

- Depends on: DATA-005, DATA-008
- Blocks: DISC-020 (renders chat cards with score %/bars)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "seeded_geospatial_index": {
      "description": "live Convex dev with the 5,654-row catalog where the top scenic North Carolina route has compositeScore > 0 and non-zero dimension scores",
      "seed_method": "migration_fixture",
      "records": [
        "curated_routes with real 0\u20131 compositeScore/curvatureScore/scenicScore/technicalScore/trafficScore/remotenessScore"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a fixtured intent returning a route with real compositeScore>0 WHEN runDiscoverCuratedRoutes runs THEN the route_plans option's scores.composite equals that real value (>0) and dimensions equal the real flat *Score values",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN best vs nearest sort WHEN options are built THEN distance is undefined for best and a real value for nearest (no fabricated 0)",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "real non-zero composite + dimension scores on the option (PRIMARY fix)",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "distanceMi=0 fallback guarded to nearest sort",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
