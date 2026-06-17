# DATA-005: listCuratedRoutes public query — all 4 browse modes, Clerk-gated, 0–1 scores, limit cap (carried — verify)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** INFRA · **Status:** To Do · **Priority:** P0 · **Effort:** S · **Estimate:** 45 min  
**Agent:** convex-implementer  
**Proposed By:** convex-planner  
**Agent rationale:** Verification of the central net-new public query across all four arg modes, the Clerk gate, score scale, and limit cap against live Convex. convex-implementer owns curatedRoutes.ts and the requireIdentity guard and can exercise all modes via the Convex client / npx convex run.  

## Outcome

listCuratedRoutes returns correct ranked results for bbox, center+nearest (distanceMi populated), state (both variants), and archetype modes, Clerk-gated, with 0–1 scores and a server-capped limit.

## Specification

curatedRoutes.ts.listCuratedRoutes is the Clerk-gated public query powering discovery. Args: bbox | center | state | archetypes[] (UI enums) | sort('best'|'nearest') | limit (Math.min(limit??50,200)). It has four modes: Mode 1 bbox via geospatial.query(rectangle) ranked by compositeScore; Mode 2 sort='nearest' via geospatial.nearest with distanceMi = geo.distance*0.000621371 ascending; Mode 3 state-only via by_state probing both stateVariants; Mode 4 best via by_composite_score index. buildRouteCard returns the locked lean shape (returnValidator: routeId,name,state(canonical),primaryArchetype(UI),centroidLat/Lng,compositeScore,5 optional dimension scores,lengthMiles?,distanceMi?,summary?). This task re-verifies the FEATURE(D2) query per T-DATA-008 (all AC1–6) against live dev: each mode returns correct ranked/capped results; Clerk gate enforced; scores 0–1; lengthMiles clamped; distanceMi present only on nearest; limit honored within interactive latency. NOTE: a known divide-by-100 `norm` helper (line 117) exists for defensive 0–100→0–1 coercion; D0 says scores are already 0–1 — confirm it does not corrupt genuine 0–1 scores (it only divides when v>1, which never fires for 0–1 data); flag if it does, but do not expand its scope here.

## Critical Constraints

- VERIFY ONLY — listCuratedRoutes is built (curatedRoutes.ts). Correct only a proven mode/gate defect bonded to a failing AC.
- NEVER weaken the Clerk gate — listCuratedRoutes MUST call requireIdentity; an unauthenticated call MUST be rejected server-side.
- A 0–100 score escaping (raw 0–100 number), a 710,430mi length, or a dropped state variant is a hard failure.
- NEVER use .filter() for geography or state — bbox/nearest go through the geospatial index, state through by_state; the query must not full-table scan the 5,654 rows.

## Acceptance Criteria

### AC-1: all four browse modes return correct ranked/capped results with 0–1 scores
*(PRIMARY)*
- **GIVEN** the seeded live Convex dev catalog (geospatial + by_state + by_composite_score)
- **WHEN** listCuratedRoutes is called with (a) a bbox, (b) sort='nearest'+center, (c) archetypes=['scenic','twisties'], (d) state='North Carolina'
- **THEN** bbox returns only in-box centroids ranked by compositeScore; nearest returns ascending-distance rows with distanceMi populated; archetypes return only mapped UI-enum routes; state returns both dirty variants; every card has compositeScore in [0,1] and clamped lengthMiles, capped to the limit
- **Test tier:** `integration` · **Service:** live Convex dev (api.curatedRoutes.listCuratedRoutes)
- **Verify:** `pnpm test convex/__tests__/listCuratedRoutes.integration.test.ts` → `allFourModesReturnCorrectRankedCappedResults`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: ≥1 route; results sorted by compositeScore desc; every compositeScore ≤ 1 (0–1 scale); result length ≤ 25
  - must NOT observe: 0 routes; any compositeScore > 1; result length > 25
  - negative control (would fail if): query disconnected/empty returns []; nearest omits distanceMi; a 0–100 score escapes; a state variant is dropped; limit not capped (full-table scan)

### AC-2: query is Clerk-gated (unauthenticated call rejected)
- **GIVEN** an unauthenticated Convex client
- **WHEN** listCuratedRoutes is called with no identity
- **THEN** the call is rejected server-side by requireIdentity (does not return data)
- **Test tier:** `integration` · **Service:** live Convex dev (requireIdentity guard)
- **Verify:** `pnpm test convex/__tests__/listCuratedRoutes.integration.test.ts` → `unauthenticatedCallIsRejected`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: an identity/auth error is thrown
  - must NOT observe: a populated route array; ≥1 route returned to an unauthenticated caller
  - negative control (would fail if): requireIdentity is bypassed so unauthenticated calls return data; auth check is mocked

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: all four modes correct, ranked, capped; 0–1 scores; distanceMi on nearest; both NC variants; within interactive latency (T-DATA-008 AC1–6). | AC-1 | `pnpm test convex/__tests__/listCuratedRoutes.integration.test.ts` |
| TC-2 | Integration: an unauthenticated listCuratedRoutes call is rejected by requireIdentity. | AC-2 | `pnpm test convex/__tests__/listCuratedRoutes.integration.test.ts` |

## Reading List

- `convex/curatedRoutes.ts` (20-283) — PRIMARY PATTERN — argsValidator/returnValidator + the four resolution modes + requireIdentity + buildRouteCard
- `.spec/prds/mvp/09-technical-requirements/04-api-design.md` (19-58) — locked args/returns contract + resolution rules + auth-gate precondition
- `convex/geospatialIndex.ts` (1-27) — the geospatial index used by Modes 1 and 2
- `convex/__tests__/dataNormalization.test.ts` (1-40) — test conventions for the transforms this query composes
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (56) — T-DATA-008 pass/fail

## Guardrails

- WRITE-ALLOWED: `convex/__tests__/listCuratedRoutes.integration.test.ts (NEW)`
- WRITE-ALLOWED: `convex/curatedRoutes.ts (MODIFY — only a proven mode/gate/score correction)`
- WRITE-PROHIBITED: convex/schema.ts
- WRITE-PROHIBITED: convex/guards.ts — do not weaken requireIdentity
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: .spec/prds/mvp/09-technical-requirements/04-api-design.md
- ref: .spec/prds/mvp/04-uc-data.md#uc-data-05
- pattern: Single Clerk-gated public browse query with index-backed resolution per mode (geospatial for bbox/nearest, by_state for state, by_composite_score for best), fully-specified returns validator, server-capped limit.

## Verification Gates

| Gate | Command |
|------|---------|
| gate | `pnpm type-check` |
| gate | `pnpm test convex/__tests__/listCuratedRoutes.integration.test.ts` |
| gate | `pnpm exec biome check convex/curatedRoutes.ts` |
| gate | `pnpm --dir server run convex:dev -- --once` |
| gate | `npx convex run curatedRoutes:listCuratedRoutes '{"state":"North Carolina","limit":200}' (manual evidence against live dev — count > 43, all canonical)` |

## Coding Standards

- Validator-first: returns validator fully specifies every card field (already present) — keep it exhaustive.
- No .filter() for geography/state — index-backed resolution only.
- Server-cap the limit to protect the 5,654-row scale.
- requireIdentity on every public read.

## Dependencies

- Depends on: DATA-001, DATA-002, DATA-004
- Blocks: DATA-008, DATA-008b, DISC-002 (useCuratedDiscovery wraps this query), OPS-001 (canary)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "seeded_geospatial_index": {
      "description": "live Convex dev with the 5,654-row catalog, seeded geospatial points, by_state + by_composite_score indexes",
      "seed_method": "migration_fixture",
      "records": [
        "curated_routes spanning founder regions, the NC spelling split, mixed archetypes, 0\u20131 scores, junk + valid lengths"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN seeded live dev WHEN listCuratedRoutes called in bbox/nearest/archetype/state modes THEN each returns correct ranked, capped, 0\u20131-scored, length-clamped results (distanceMi on nearest, both NC variants)",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN no identity WHEN listCuratedRoutes called THEN requireIdentity rejects the call",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.integration.test.ts",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "four-mode correctness + score scale + cap (T-DATA-008)",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.integration.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Clerk gate enforced",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.integration.test.ts",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
