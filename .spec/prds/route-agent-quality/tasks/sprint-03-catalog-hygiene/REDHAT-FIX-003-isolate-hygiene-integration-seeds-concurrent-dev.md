# REDHAT-FIX-003 — Isolate hygiene integration seeds from concurrent shared-dev deployments (F-4)

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-003 |
| SPRINT | [Sprint 03 — Catalog hygiene](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 45 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | — (N/A: deterministic at-rest cleanup) |
| DEPENDS_ON | S3-T1 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

Hygiene integration test seeds use unique namespace prefixes (test:hyg:{runId}:*) so that two concurrent test runs on the same shared Convex dev deployment do not collide. Teardown is namespace-aware — deleting only rows matching the caller's runId prefix. An integration test proves that seeding and teardown under runId 'alpha' does not affect seeds created under runId 'beta'.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Read convex/_generated/ai/guidelines.md first.
- Seed mutations MUST accept a runId parameter (v.string()) and embed it in every routeId: `test:hyg:{runId}:score-90`, `test:hyg:{runId}:score-72`, etc.
- Teardown mutations MUST accept a runId parameter and delete ONLY rows whose routeId starts with `test:hyg:{runId}:`.
- The normalizeEditorialScores handler's routeIdPrefix MUST be parameterized to `test:hyg:{runId}:` so the handler only processes the caller's rows.
- An integration test MUST prove isolation: seed under runId 'alpha', seed under runId 'beta', teardown 'alpha', then verify 'beta' rows still exist unchanged.
- Existing fixed-ID seeders (seedEditorialScoreRows without runId) MUST remain backward-compatible OR the integration test MUST be updated to use the namespaced variants.

**NEVER**
- Never use fixed routeId prefixes (test:hyg-score-90) for new test cases — concurrent runs will collide.
- Never teardown ALL test:hyg-* rows regardless of runId — this nukes other concurrent runs' seeds.
- Never use Date.now() or Math.random() for runId without making it deterministic within a single test run — the test must be reproducible.
- Never edit convex/schema.ts, convex/actions/agent/**, app/**, or .spec/**.

**STRICTLY**
- runId format: a short deterministic string unique per test session (e.g., 'alpha', 'beta' for test reproducibility, or process.pid + timestamp for real concurrent runs).
- Teardown implementation: query curated_routes filtered by routeId.startsWith(`test:hyg:${runId}:`), delete only matching rows.

## DONE WHEN

- AC-1 [PRIMARY]: two test sessions seed rows under different runIds ('alpha' and 'beta') on the same shared dev deployment — all rows coexist without collision
- AC-2: teardown under runId 'alpha' deletes ONLY alpha rows — all 'beta' rows remain present with their original values completely unchanged
- AC-3: normalizeEditorialScores with routeIdPrefix:'test:hyg:alpha:' processes only alpha rows — beta rows are untouched
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Fix the F-4 finding: hygiene integration tests seed rows into the shared Convex dev deployment with fixed routeId prefixes (test:hyg-score-90). When two agents or developers run tests concurrently, one test's teardown nukes the other's setup. Add runId-based namespace isolation to all hygiene seed/teardown mutations and update the integration test to use namespaced seeds. Add a concurrency-isolation integration test proving two namespaces don't interfere.

**Success state:** `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` passes with namespaced seed/teardown. A new integration test case proves that seeding runId 'alpha' rows, seeding runId 'beta' rows, then tearing down 'alpha' leaves all 'beta' rows intact and unchanged.

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `runAlphaSeeds` (seed_method: `public_api`): 2 rows under runId 'alpha' with routeId prefix 'test:hyg:alpha:'.
    - curated_routes routeId=test:hyg:alpha:score-90 compositeScore=90 all dimensions on 0–100 scale
    - curated_routes routeId=test:hyg:alpha:score-72 compositeScore=72 all dimensions on 0–100 scale
- `runBetaSeeds` (seed_method: `public_api`): 2 rows under runId 'beta' with routeId prefix 'test:hyg:beta:'.
    - curated_routes routeId=test:hyg:beta:score-85 compositeScore=85 all dimensions on 0–100 scale
    - curated_routes routeId=test:hyg:beta:score-70 compositeScore=70 all dimensions on 0–100 scale

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Concurrent namespaces coexist without collision

**Requirement:** GIVEN seed mutations accept a runId parameter and generate namespaced routeIds (test:hyg:{runId}:*) WHEN two test sessions seed rows under different runIds ('alpha' and 'beta') on the same shared Convex dev deployment THEN both sets of rows coexist without collision — all 4 rows exist with their correct seeded values, and neither seed operation overwrote or interfered with the other.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows, real mutations)
- FLOW_REF: F-4
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t concurrent-namespaces`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: seeds use fixed routeId prefixes (test:hyg-score-90) — the second seed overwrites the first's rows; a stub mutation ignores runId and always seeds the same fixed routeIds — concurrent runs collide; insertTestRoute's existing-doc path patches over a row created by a different runId — data corruption
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `runAlphaSeeds+runBetaSeeds`
    - ACTION (cli_user): teardown any existing test:hyg:* rows (cleanup); run seedEditorialScoreRowsNamespaced {runId:'alpha'}; run seedEditorialScoreRowsNamespaced {runId:'beta'}; query all 4 routeIds via getTestRoute
    - MUST_OBSERVE: test:hyg:alpha:score-90 exists with compositeScore == 90; test:hyg:alpha:score-72 exists with compositeScore == 72; test:hyg:beta:score-85 exists with compositeScore == 85; test:hyg:beta:score-70 exists with compositeScore == 70
    - MUST_NOT_OBSERVE: test:hyg:alpha:score-90 is missing or has compositeScore != 90 (would indicate beta seed overwrote it); test:hyg:beta:score-85 is missing or has compositeScore != 85 (would indicate alpha seed overwrote it); any of the 4 routeIds return null (would indicate collision)

### AC-2 — Alpha teardown does not affect beta rows

**Requirement:** GIVEN rows seeded under runId 'alpha' and runId 'beta' coexist on the shared dev deployment WHEN teardownHygieneScoreRowsByRunId runs with {runId:'alpha'} THEN only 'alpha' rows are deleted — all 'beta' rows remain present with their original values completely unchanged.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows, real teardown mutation)
- FLOW_REF: F-4
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t alpha-teardown-beta-safe`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: teardown deletes ALL test:hyg-* rows regardless of runId prefix (the current bug — nukes concurrent runs); teardown uses a fixed routeId list that doesn't account for runId namespacing; a stub teardown that deletes nothing (alpha rows would still exist); teardown uses routeId prefix test:hyg- (without runId) which matches both alpha and beta rows
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `runAlphaSeeds+runBetaSeeds`
    - ACTION (cli_user): seed alpha rows; seed beta rows; run teardownHygieneScoreRowsByRunId {runId:'alpha'}; query test:hyg:alpha:score-90 (expect null); query test:hyg:alpha:score-72 (expect null); query test:hyg:beta:score-85 (expect row with compositeScore==85); query test:hyg:beta:score-70 (expect row with compositeScore==70); run teardownHygieneScoreRowsByRunId {runId:'beta'} (cleanup)
    - MUST_OBSERVE: test:hyg:alpha:score-90 is null (deleted by alpha teardown); test:hyg:alpha:score-72 is null (deleted by alpha teardown); test:hyg:beta:score-85 exists with compositeScore == 85 (unaffected); test:hyg:beta:score-70 exists with compositeScore == 70 (unaffected); teardownHygieneScoreRowsByRunId {runId:'alpha'} returned {status:'deleted', count:2}
    - MUST_NOT_OBSERVE: test:hyg:beta:score-85 is null (would indicate alpha teardown incorrectly deleted beta rows); test:hyg:beta:score-70 is null; test:hyg:beta:score-85 has compositeScore != 85 (data corruption); alpha teardown returned count > 2 (would indicate it deleted beta rows too)

### AC-3 — Normalize scoped to namespace prefix; beta rows untouched

**Requirement:** GIVEN namespaced seeds exist under runId 'alpha' WHEN normalizeEditorialScores runs with routeIdPrefix:'test:hyg:alpha:' (committed) THEN only alpha rows are processed — beta rows on the same deployment are untouched.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: F-4
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t normalize-scoped-namespace`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: normalizeEditorialScores uses prefix 'test:hyg-score-' (old fixed prefix) — it would miss alpha rows; fetchOutOfScaleRows ignores routeIdPrefix and processes all rows — beta rows would be normalized; a stub handler processes no rows — alpha assertion fails
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `runAlphaSeeds+runBetaSeeds`
    - ACTION (cli_user): seed alpha rows; seed beta rows; run normalizeEditorialScores {routeIdPrefix:'test:hyg:alpha:'} (committed); query test:hyg:alpha:score-90; query test:hyg:beta:score-85; run teardown for both namespaces (cleanup)
    - MUST_OBSERVE: test:hyg:alpha:score-90 compositeScore ≈ 0.9 (toBeCloseTo precision 5); test:hyg:alpha:score-90 scoreScaleNormalizedAt is defined and > 0; test:hyg:beta:score-85 compositeScore == 85 (unchanged); test:hyg:beta:score-85 scoreScaleNormalizedAt is undefined (not processed)
    - MUST_NOT_OBSERVE: test:hyg:beta:score-85 compositeScore ≈ 0.85 (would indicate the handler processed beta rows outside the alpha prefix); test:hyg:beta:score-85 scoreScaleNormalizedAt is defined (cross-namespace processing)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Concurrent namespaces coexist: seed alpha, seed beta, all 4 rows exist with correct values | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t concurrent-namespaces` |
| TC-2 | Alpha teardown does not affect beta: seed both, teardown alpha, beta rows intact with unchanged values | AC-2 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t alpha-teardown-beta-safe` |
| TC-3 | Normalize scoped to namespace: seed both, normalize alpha prefix, alpha normalized + beta untouched | AC-3 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t normalize-scoped-namespace` |
| TC-4 | Type safety: seedEditorialScoreRowsNamespaced accepts {runId: v.string()}, teardownHygieneScoreRowsByRunId accepts {runId: v.string()} | AC-1 | `pnpm type-check` |
| TC-5 | Existing S3-T1 test cases (AC-1 through AC-4) still pass after migrating to namespaced seed/teardown | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryTestSupport.ts (MODIFY — add seedEditorialScoreRowsNamespaced + teardownHygieneScoreRowsByRunId mutations)
- convex/__tests__/curatedGeometryHygiene.integration.test.ts (MODIFY — add F-4 isolation cases; migrate existing tests to namespaced seeds)
- convex/curatedGeometryHygiene.ts (MODIFY — if routeIdPrefix needs adjustment for namespaced patterns)

**writeProhibited:**
- convex/schema.ts - no schema change
- convex/actions/agent/** - out of scope
- app/**, components/** - no UI
- .spec/** - planning docs are read-only
- unrelated Convex modules

## READING LIST

- `convex/curatedGeometryTestSupport.ts` — seedEditorialScoreRows, seedInScaleControlRow, teardownHygieneScoreRows (the mutations to parameterize with runId)
- `convex/__tests__/curatedGeometryHygiene.integration.test.ts` — the test suite that must switch to namespaced seed/teardown
- `convex/curatedGeometryHygiene.ts` — normalizeEditorialScores routeIdPrefix (must accept test:hyg:{runId}: prefix)

## CODE PATTERN

- Pattern: // namespaced seed mutation
export const seedEditorialScoreRowsNamespaced = mutation({
  args: { runId: v.string() },
  handler: async (ctx, { runId }) => {
    // routeId: `test:hyg:${runId}:score-90` etc.
  }
})
// namespaced teardown
export const teardownHygieneScoreRowsByRunId = mutation({
  args: { runId: v.string() },
  handler: async (ctx, { runId }) => {
    const prefix = `test:hyg:${runId}:`
    const rows = await ctx.db.query('curated_routes').collect()
    for (const row of rows.filter(r => r.routeId.startsWith(prefix))) {
      await ctx.db.delete(row._id)
    }
    return { status: 'deleted', count: ... }
  }
})
- Pattern source: `convex/curatedGeometryTestSupport.ts (existing seedEditorialScoreRows + teardownHygieneScoreRows — parameterize with runId)`
- Anti-pattern: Fixed routeId prefixes in seed mutations with no runId parameter — two concurrent runs insert the same routeId, and one run's teardown deletes the other's rows.

## VERIFICATION GATES

- Integration tests pass: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` → Exit 0
- Typecheck: `pnpm type-check` → Exit 0
- Lint: `pnpm exec biome check` → Exit 0
- Convex build: `pnpm convex:dev --once` → Exit 0

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Requires modifying Convex mutations (seed/teardown with runId parameterization), updating integration test infrastructure, and adding concurrency-isolation test cases. Pure backend Convex work.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S3-T1
- Blocks: —

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-003",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "runAlphaSeeds": {
      "description": "2 rows under runId 'alpha' with routeId prefix 'test:hyg:alpha:'.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg:alpha:score-90 compositeScore=90 all dimensions on 0\u2013100 scale",
        "curated_routes routeId=test:hyg:alpha:score-72 compositeScore=72 all dimensions on 0\u2013100 scale"
      ]
    },
    "runBetaSeeds": {
      "description": "2 rows under runId 'beta' with routeId prefix 'test:hyg:beta:'.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg:beta:score-85 compositeScore=85 all dimensions on 0\u2013100 scale",
        "curated_routes routeId=test:hyg:beta:score-70 compositeScore=70 all dimensions on 0\u2013100 scale"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN seed mutations accept a runId parameter and generate namespaced routeIds WHEN two test sessions seed rows under different runIds ('alpha' and 'beta') THEN both sets of rows coexist without collision \u2014 all 4 rows exist with their correct seeded values",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t concurrent-namespaces",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows, real mutations)",
        "negative_control": {
          "would_fail_if": [
            "seeds use fixed routeId prefixes (test:hyg-score-90) \u2014 the second seed overwrites the first's rows",
            "a stub mutation ignores runId and always seeds the same fixed routeIds \u2014 concurrent runs collide",
            "insertTestRoute's existing-doc path patches over a row created by a different runId \u2014 data corruption"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "runAlphaSeeds+runBetaSeeds",
            "action": {
              "actor": "cli_user",
              "steps": [
                "teardown any existing test:hyg:* rows (cleanup)",
                "run seedEditorialScoreRowsNamespaced {runId:'alpha'}",
                "run seedEditorialScoreRowsNamespaced {runId:'beta'}",
                "query all 4 routeIds via getTestRoute"
              ]
            },
            "end_state": {
              "must_observe": [
                "test:hyg:alpha:score-90 exists with compositeScore == 90",
                "test:hyg:alpha:score-72 exists with compositeScore == 72",
                "test:hyg:beta:score-85 exists with compositeScore == 85",
                "test:hyg:beta:score-70 exists with compositeScore == 70"
              ],
              "must_not_observe": [
                "test:hyg:alpha:score-90 is missing or has compositeScore != 90 (would indicate beta seed overwrote it)",
                "test:hyg:beta:score-85 is missing or has compositeScore != 85 (would indicate alpha seed overwrote it)",
                "any of the 4 routeIds return null (would indicate collision)"
              ]
            }
          }
        ],
        "id": "AC-1",
        "primary": true
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN rows seeded under runId 'alpha' and runId 'beta' coexist WHEN teardownHygieneScoreRowsByRunId runs with {runId:'alpha'} THEN only 'alpha' rows are deleted \u2014 all 'beta' rows remain present with their original values completely unchanged",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t alpha-teardown-beta-safe",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows, real teardown mutation)",
        "negative_control": {
          "would_fail_if": [
            "teardown deletes ALL test:hyg-* rows regardless of runId prefix (the current bug \u2014 nukes concurrent runs)",
            "teardown uses a fixed routeId list that doesn't account for runId namespacing",
            "a stub teardown that deletes nothing (alpha rows would still exist)",
            "teardown uses routeId prefix test:hyg- (without runId) which matches both alpha and beta rows"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "runAlphaSeeds+runBetaSeeds",
            "action": {
              "actor": "cli_user",
              "steps": [
                "seed alpha rows via seedEditorialScoreRowsNamespaced {runId:'alpha'}",
                "seed beta rows via seedEditorialScoreRowsNamespaced {runId:'beta'}",
                "run teardownHygieneScoreRowsByRunId {runId:'alpha'}",
                "query test:hyg:alpha:score-90 via getTestRoute (expect null)",
                "query test:hyg:alpha:score-72 via getTestRoute (expect null)",
                "query test:hyg:beta:score-85 via getTestRoute (expect row with compositeScore==85)",
                "query test:hyg:beta:score-70 via getTestRoute (expect row with compositeScore==70)",
                "run teardownHygieneScoreRowsByRunId {runId:'beta'} (cleanup)"
              ]
            },
            "end_state": {
              "must_observe": [
                "test:hyg:alpha:score-90 is null (deleted by alpha teardown)",
                "test:hyg:alpha:score-72 is null (deleted by alpha teardown)",
                "test:hyg:beta:score-85 exists with compositeScore == 85 (unaffected)",
                "test:hyg:beta:score-70 exists with compositeScore == 70 (unaffected)",
                "teardownHygieneScoreRowsByRunId {runId:'alpha'} returned {status:'deleted', count:2}"
              ],
              "must_not_observe": [
                "test:hyg:beta:score-85 is null (would indicate alpha teardown incorrectly deleted beta rows)",
                "test:hyg:beta:score-70 is null",
                "test:hyg:beta:score-85 has compositeScore != 85 (data corruption)",
                "alpha teardown returned count > 2 (would indicate it deleted beta rows too)"
              ]
            }
          }
        ],
        "id": "AC-2",
        "primary": false
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN namespaced seeds exist under runId 'alpha' WHEN normalizeEditorialScores runs with routeIdPrefix:'test:hyg:alpha:' (committed) THEN only alpha rows are processed \u2014 beta rows on the same deployment are untouched",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t normalize-scoped-namespace",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "normalizeEditorialScores uses prefix 'test:hyg-score-' (old fixed prefix) \u2014 it would miss alpha rows",
            "fetchOutOfScaleRows ignores routeIdPrefix and processes all rows \u2014 beta rows would be normalized",
            "a stub handler processes no rows \u2014 alpha assertion fails"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "runAlphaSeeds+runBetaSeeds",
            "action": {
              "actor": "cli_user",
              "steps": [
                "seed alpha rows via seedEditorialScoreRowsNamespaced {runId:'alpha'}",
                "seed beta rows via seedEditorialScoreRowsNamespaced {runId:'beta'}",
                "run normalizeEditorialScores {routeIdPrefix:'test:hyg:alpha:'} (committed)",
                "query test:hyg:alpha:score-90 via getTestRoute",
                "query test:hyg:beta:score-85 via getTestRoute",
                "run teardown for both namespaces (cleanup)"
              ]
            },
            "end_state": {
              "must_observe": [
                "test:hyg:alpha:score-90 compositeScore \u2248 0.9 (toBeCloseTo precision 5)",
                "test:hyg:alpha:score-90 scoreScaleNormalizedAt is defined and > 0",
                "test:hyg:beta:score-85 compositeScore == 85 (unchanged \u2014 beta not processed)",
                "test:hyg:beta:score-85 scoreScaleNormalizedAt is undefined (not processed)"
              ],
              "must_not_observe": [
                "test:hyg:beta:score-85 compositeScore \u2248 0.85 (would indicate the handler processed beta rows outside the alpha prefix)",
                "test:hyg:beta:score-85 scoreScaleNormalizedAt is defined (cross-namespace processing)"
              ]
            }
          }
        ],
        "id": "AC-3",
        "primary": false
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "Concurrent namespaces coexist: seed alpha, seed beta, all 4 rows exist with correct values",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t concurrent-namespaces"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "Alpha teardown does not affect beta: seed both, teardown alpha, beta rows intact with unchanged values",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t alpha-teardown-beta-safe"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "Normalize scoped to namespace: seed both, normalize alpha prefix, alpha normalized + beta untouched",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t normalize-scoped-namespace"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "Type safety: seedEditorialScoreRowsNamespaced accepts {runId: v.string()} and teardownHygieneScoreRowsByRunId accepts {runId: v.string()}",
      "verify": "pnpm type-check"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "Existing S3-T1 test cases still pass after migrating to namespaced seed/teardown",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts"
    }
  ]
}
-->
</details>
