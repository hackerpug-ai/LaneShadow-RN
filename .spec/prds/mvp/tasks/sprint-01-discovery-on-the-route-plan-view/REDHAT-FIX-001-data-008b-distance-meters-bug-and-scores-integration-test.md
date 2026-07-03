# REDHAT-FIX-001: DATA-008b: fix distanceMeters:0 fabrication at discoverCuratedRoutes.ts:151 AND create discoverCuratedRoutes.scores.integration.test.ts

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** M · **Estimate:** 90 min
**Agent:** convex-implementer
**Proposed By:** convex-planner
**TDD Mode:** red_first · **RED/GREEN Required:** yes
**Agent rationale:** Confirmed CRITICAL backend bug — the distance guard from DATA-008b was never applied (line 151 still fabricates `distanceMeters: 0`), and the primary integration test file `discoverCuratedRoutes.scores.integration.test.ts` was never created. convex-implementer owns the tool's option builder and can prove both the fix and the test against live Convex dev.

> **Source:** [red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md](../../../reviews/red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md) — CRITICAL findings #1 + #2.

## Outcome

Best-sort curated options omit `distanceMeters` (carry `undefined`, not a fabricated `0`) and live integration tests prove real non-zero composite + dimension scores map correctly from the flat `listCuratedRoutes` fields.

## Specification

**Part A — Bug fix:** At `convex/actions/agent/tools/discoverCuratedRoutes.ts:151`, the line reads `(route.distanceMi || 0) * 1609.344`. When `route.distanceMi` is `undefined` (sort='best'), the `|| 0` fallback fabricates a real `0` meter value. FIX: replace with `route.distanceMi != null ? route.distanceMi * 1609.344 : undefined` so `distanceMeters` is `undefined` when `distanceMi` is absent and only set to a real value when present. The scores mapping at lines 155-170 is ALREADY correct (reads flat `compositeScore`/`*Score` fields) — do NOT touch it.

**Part B — Missing test file:** Create `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` with two live-Convex integration tests:
1. `optionCarriesRealNonZeroScores` — drives `runDiscoverCuratedRoutes`, loads the created `route_plans` row, asserts `option.scores.composite > 0` AND equals the route's real `compositeScore`, AND ≥1 dimension score `> 0` matching the route's real flat `*Score` value.
2. `distanceGuardedToNearestSort` — asserts `best`-sort options carry `distanceMeters === undefined` (no fabricated 0), and `nearest`-sort options carry `distanceMeters > 0` derived from `distanceMi`.

## Critical Constraints

- **MUST** change only line 151's `distanceMeters` expression in `discoverCuratedRoutes.ts`; the scores block at lines 155-170 is strictly read-only.
- **NEVER** modify `convex/curatedRoutes.ts`, `convex/util/archetypeMap.ts`, `convex/schema.ts`, or any existing test file.
- **STRICTLY** create only the one new test file named exactly `discoverCuratedRoutes.scores.integration.test.ts`.
- **MUST** run tests against live Convex dev data, not mocked `listCuratedRoutes` results. The bug only manifests against the real flat-field contract.
- **PRIMARY AC MUST** observe `scores.composite > 0` (a non-degenerate value) for a route whose real `compositeScore > 0` — a fixed value of 0 is the start signature and a fakeable pass; the test must exclude it.

## Acceptance Criteria

### AC-1: discovery option carries the route's real non-zero composite + dimension scores
*(PRIMARY)*
- **GIVEN** the seeded live Convex dev catalog and a fixtured intent that returns a route whose real `compositeScore > 0`
- **WHEN** `runDiscoverCuratedRoutes` executes and the created `route_plans` option is loaded
- **THEN** `option.scores.composite` equals the route's real `compositeScore` (`> 0`) and each dimension score equals the route's real corresponding flat `*Score` value (not 0)
- **Test tier:** `integration` · **Service:** live Convex dev (discoverCuratedRoutes → listCuratedRoutes → route_plans options)
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t optionCarriesRealNonZeroScores`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: `option.scores.composite > 0`; `option.scores.composite` === the queried route's real `compositeScore` (e.g. 0.82); ≥1 dimension score `> 0` matching the queried route's real `*Score`
  - must NOT observe: `option.scores.composite === 0`; all dimension scores `=== 0` (the start/zero signature)
  - negative control (would fail if): option reads `route.score` (undefined→0) so composite is 0; dimensions read `route.scores.*` (undefined→0) so all bars are 0; `listCuratedRoutes` mocked

### AC-2: distanceMi=0 fallback is guarded to the nearest-sort case
- **GIVEN** a fixtured intent with `sort='best'` (`distanceMi` unpopulated)
- **WHEN** `runDiscoverCuratedRoutes` builds the option stats
- **THEN** the option does not present a misleading real 0-distance — `distanceMeters` is `undefined` when `distanceMi` is absent, and populated only when `sort='nearest'` returned a `distanceMi`
- **Test tier:** `integration` · **Service:** live Convex dev (discoverCuratedRoutes options for best vs nearest)
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t distanceGuardedToNearestSort`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: best-sort option `distanceMeters === undefined` (no fabricated 0); nearest-sort option `distanceMeters > 0` (a positive real number)
  - must NOT observe: best-sort option `distanceMeters === 0` (fabricated real 0); nearest-sort option `distanceMeters === 0`; nearest-sort option `distanceMeters === undefined`; 0 options returned
  - negative control (would fail if): the builder coerces absent `distanceMi` into 0 (the current bug at line 151); nearest-sort branch is a no-op/stubbed so real `distanceMi` is dropped; `listCuratedRoutes` is mocked

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: a fixtured intent's route_plans option has `scores.composite > 0` equal to the route's real `compositeScore` and ≥1 real non-zero dimension score (the DATA-008b PRIMARY fix). | AC-1 | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` |
| TC-2 | Integration: best-sort options do not fabricate a real 0 distance; nearest-sort options carry the real distance. | AC-2 | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` |
| TC-3 | `discoverCuratedRoutes.ts:151` sets `distanceMeters` to `undefined` when `route.distanceMi` is absent; the scores block at 155-170 is untouched; no write-prohibited files modified. | AC-2 | `git diff --name-only && git diff -- convex/actions/agent/tools/discoverCuratedRoutes.ts` |

## Reading List

- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (144-170) — PRIMARY PATTERN — the `options.map` builder: line 151 distance bug + the already-fixed flat score mapping at 155-170
- `convex/curatedRoutes.ts` (36-54) — the authoritative FLAT `returnValidator`: `compositeScore` + 5 flat `*Score` fields (the contract the tool must read)
- `convex/actions/agent/tools/discoverCuratedRoutesLiveTest.ts` (20-95) — existing live-Convex seam used to invoke `executeDiscoverCuratedRoutes` and read back `route_plans`
- `.spec/reviews/red-hat-sprint-01-discovery-2026-07-03T00-00-00Z.md` (29-35) — the CRITICAL finding this task closes

## Guardrails

- WRITE-ALLOWED: `convex/actions/agent/tools/discoverCuratedRoutes.ts (MODIFY — fix line 151 distance guard only)`
- WRITE-ALLOWED: `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts (NEW)`
- WRITE-PROHIBITED: `convex/curatedRoutes.ts` — the query already returns correct flat 0–1 scores
- WRITE-PROHIBITED: `convex/util/archetypeMap.ts`, `convex/schema.ts`
- WRITE-PROHIBITED: Any existing test file
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: `convex/actions/agent/tools/discoverCuratedRoutes.ts:155-170` (the already-fixed score mapping)
- ref: `.spec/prds/mvp/05-uc-disc.md` (91-96) — UC-DISC-10 AC5: composite carries through 0–1 as bars/percent, never 0-100, never 0
- pattern: Guard absent optional values with explicit `undefined` rather than falsy coercion (`|| 0`); validate score correctness by reading the persisted plan via the real internal action seam.
- anti-pattern: Using `|| 0` to coerce `undefined` into a numeric 0, which fabricates a misleading real value.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check convex/actions/agent/tools/discoverCuratedRoutes.ts convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` |
| convex dev | `pnpm --dir server run convex:dev -- --once` |
| scope | `git diff --name-only ⊆ write_allowed` |

## Coding Standards

- Use `route.distanceMi != null ? route.distanceMi * 1609.344 : undefined` so `distanceMeters` is only defined when a real distance exists.
- Preserve the existing flat score mapping unchanged.
- Assert concrete seeded values (real `compositeScore`, real dimension scores) rather than only `> 0`.
- Do not fabricate 0 as a real value (distance) — use `undefined` for absent data.

## Dependencies

- Depends on: DATA-008, DATA-008b (the score mapping fix already landed)
- Blocks: (none)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-001",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "seeded_geospatial_index": {
      "description": "live Convex dev with the 5,654-row catalog where the top scenic North Carolina route has compositeScore > 0 and non-zero dimension scores",
      "seed_method": "migration_fixture",
      "records": [
        "curated_routes with real 0–1 compositeScore/curvatureScore/scenicScore/technicalScore/trafficScore/remotenessScore",
        "curated_routes rows with and without distanceMi populated so both best and nearest sorts can be exercised"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the seeded live Convex dev catalog and a fixtured intent that returns a route whose real compositeScore > 0 WHEN runDiscoverCuratedRoutes executes and the created route_plans option is loaded THEN option.scores.composite equals the route's real compositeScore (> 0) and each dimension score equals the route's real corresponding flat *Score value (not 0)",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t optionCarriesRealNonZeroScores",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "seeded_geospatial_index",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev",
        "must_observe": ["option.scores.composite > 0", "option.scores.composite === the queried route's real compositeScore (e.g. 0.82)", "at least 1 dimension score > 0 matching the real *Score"],
        "must_not_observe": ["option.scores.composite === 0", "all dimension scores === 0"],
        "negative_control": { "would_fail_if": ["option reads route.score (undefined to 0) so composite === 0", "dimensions read route.scores.* (undefined to 0) so all bars === 0", "listCuratedRoutes is mocked"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "seeded_geospatial_index", "action": { "actor": "api_client", "steps": ["run live discovery with sort=best", "load route_plans option[0]", "read scores.composite and dimensions"] }, "end_state": { "must_observe": ["option[0].scores.composite === 0.82 (the real compositeScore, > 0)", "option[0].scores.dimensions.scenery === the real scenicScore (> 0)"], "must_not_observe": ["option[0].scores.composite === 0", "every dimension === 0 (the zero signature)"] } }]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a fixtured intent with sort='best' (distanceMi unpopulated) WHEN runDiscoverCuratedRoutes builds the option stats THEN the option does not present a misleading real 0-distance — distanceMeters is undefined when distanceMi is absent, and populated only when sort='nearest' returned a distanceMi",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t distanceGuardedToNearestSort",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "seeded_geospatial_index",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev",
        "must_observe": ["best-sort option distanceMeters === undefined", "nearest-sort option distanceMeters > 0 (a positive real number)"],
        "must_not_observe": ["best-sort option distanceMeters === 0", "nearest-sort option distanceMeters === 0", "nearest-sort option distanceMeters === undefined"],
        "negative_control": { "would_fail_if": ["the builder coerces absent distanceMi into 0 (the current bug at line 151)", "nearest-sort branch is a no-op so distanceMi is dropped", "listCuratedRoutes is mocked"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "seeded_geospatial_index", "action": { "actor": "api_client", "steps": ["run best-sort discovery", "run nearest-sort discovery with a center point", "compare option[0].stats.distanceMeters"] }, "end_state": { "must_observe": ["best-sort: option[0].stats.distanceMeters === undefined", "nearest-sort: option[0].stats.distanceMeters === 123456.7 (> 0, a real distance)"], "must_not_observe": ["best-sort: distanceMeters === 0 (fabricated)", "nearest-sort: distanceMeters === undefined or === 0", "0 options returned (empty result)"] } }]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Integration: a fixtured intent's route_plans option has scores.composite > 0 equal to the route's real compositeScore and >=1 real non-zero dimension score (the DATA-008b PRIMARY fix).",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Integration: best-sort options do not fabricate a real 0 distance; nearest-sort options carry the real distance.",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "discoverCuratedRoutes.ts:151 sets distanceMeters to undefined when route.distanceMi is absent; scores block 155-170 untouched; no write-prohibited files modified.",
      "verify": "git diff --name-only && git diff -- convex/actions/agent/tools/discoverCuratedRoutes.ts",
      "maps_to_ac": "AC-2"
    }
  ]
}
-->
