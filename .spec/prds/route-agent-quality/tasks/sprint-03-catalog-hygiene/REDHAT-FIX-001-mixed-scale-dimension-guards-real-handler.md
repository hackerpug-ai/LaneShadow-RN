# REDHAT-FIX-001 — Exercise the in-scale and mixed-scale dimension guards through the real normalization handler (F-1)

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-001 |
| SPRINT | [Sprint 03 — Catalog hygiene](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 30 min |
| EFFORT | S |
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

The normalizeEditorialScores handler correctly normalizes individual out-of-scale dimension scores even when compositeScore is already in-scale (≤1), and a mixed-scale integration test proves through the REAL Convex handler that a row with compositeScore=0.85 and curvatureScore=88 gets ONLY curvatureScore divided — the composite stays byte-for-byte unchanged.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Read convex/_generated/ai/guidelines.md first.
- The mixed-scale row MUST be exercised through the REAL normalizeEditorialScores handler (internalAction → Convex dev deployment), not just the pure normalizeScore predicate.
- The computeNormalizedScores gate MUST change from 'compositeScore > 1' to 'ANY score field > 1' so mixed-scale rows are not skipped.
- fetchOutOfScaleRows MUST catch mixed-scale rows when routeIdPrefix is provided — the current by_composite_score index query (compositeScore > 1) misses rows where compositeScore ≤ 1 but some dimension is > 1.
- An in-scale dimension (value ≤ 1) within a mixed-scale row MUST be left byte-for-byte unchanged — only values > 1 are divided.
- The all-in-scale control row (all dimensions ≤ 1) MUST be completely untouched through the real handler.
- The all-out-of-scale row (all dimensions > 1) MUST still have ALL dimensions divided — regression guard.
- Seed rows through curatedGeometryTestSupport (extend it for mixed-scale shapes); assert PERSISTED values from a direct table query.

**NEVER**
- Never edit convex/schema.ts — scoreScaleNormalizedAt already exists.
- Never test only the pure normalizeScore predicate — the integration test MUST go through the real internalAction handler.
- Never gate row processing purely on compositeScore > 1 for test-prefix runs — this is the exact bug being fixed.
- Never use a unit test as the sole verification for the mixed-scale case — it MUST be integration-tier against the real Convex dev deployment.
- Never edit convex/actions/agent/**, app/**, or .spec/**.

**STRICTLY**
- Fetch logic: when routeIdPrefix is provided, scan broadly (prefix-scoped) to catch ALL test rows regardless of compositeScore value; when no prefix (production), keep the by_composite_score index scan for read efficiency on the 5,757-row catalog.
- computeNormalizedScores returns null ONLY when ALL score fields are ≤ 1 AND scoreScaleNormalizedAt is absent.
- Out-of-scale iff value > 1 (0–100 stored scale). In-scale (≤1) dimensions are left byte-for-byte unchanged.

## DONE WHEN

- AC-1 [PRIMARY]: a mixed-scale row (compositeScore=0.85 in-scale, curvatureScore=88 out-of-scale, scenicScore=0.84 in-scale, technicalScore=75 out-of-scale, trafficScore=0.76 in-scale, remotenessScore=70 out-of-scale) is exercised through the real handler — ONLY out-of-scale dimensions are ÷100 while in-scale dimensions stay byte-for-byte unchanged
- AC-2: an all-in-scale control row is scanned but NOT normalized — every score field unchanged and scoreScaleNormalizedAt NOT stamped
- AC-3: an all-out-of-scale row still has ALL dimensions divided — regression guard
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Fix the F-1 finding: the normalizeEditorialScores handler skips rows where compositeScore ≤ 1, even if individual dimension scores (curvatureScore, technicalScore, etc.) are on the 0–100 scale. Add a mixed-scale integration test fixture and verify through the REAL handler that selective per-dimension normalization works — in-scale dimensions are untouched, out-of-scale dimensions are divided.

**Success state:** `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` passes with new mixed-scale test cases. A row seeded with compositeScore=0.85, curvatureScore=88 (mixed-scale) is fetched by the handler, curvatureScore is divided to 0.88, and compositeScore remains exactly 0.85. An all-in-scale row is completely unchanged. An all-out-of-scale row still has all dimensions divided.

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `mixedScaleRow` (seed_method: `public_api`): 1 row with mixed-scale scores — compositeScore=0.85 (in-scale), curvatureScore=88 (out-of-scale), scenicScore=0.84 (in-scale), technicalScore=75 (out-of-scale), trafficScore=0.76 (in-scale), remotenessScore=70 (out-of-scale); scoreScaleNormalizedAt ABSENT.
    - curated_routes routeId=test:hyg-mixed-001 compositeScore=0.85 curvatureScore=88 scenicScore=0.84 technicalScore=75 trafficScore=0.76 remotenessScore=70 seeded via curatedGeometryTestSupport (extended seedMixedScaleRows)
- `allInScaleRow` (seed_method: `public_api`): 1 row where ALL score fields are already in-scale (≤1); scoreScaleNormalizedAt ABSENT — must be completely untouched.
    - curated_routes routeId=test:hyg-mixed-all-inscale compositeScore=0.9 all dimensions ≤1 seeded via curatedGeometryTestSupport
- `allOutOfScaleRow` (seed_method: `public_api`): 1 row where ALL score fields are out-of-scale (>1); scoreScaleNormalizedAt ABSENT — regression guard.
    - curated_routes routeId=test:hyg-mixed-all-out compositeScore=90 all dimensions >1 seeded via curatedGeometryTestSupport

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Mixed-scale row: only out-of-scale dimensions divided through real handler

**Requirement:** GIVEN a curated_routes row seeded with mixed-scale scores (compositeScore=0.85 in-scale, curvatureScore=88 out-of-scale, scenicScore=0.84 in-scale, technicalScore=75 out-of-scale, trafficScore=0.76 in-scale, remotenessScore=70 out-of-scale) and no scoreScaleNormalizedAt WHEN normalizeEditorialScores runs with routeIdPrefix:'test:hyg-mixed-' (committed) against the real Convex dev deployment THEN ONLY the out-of-scale dimensions are ÷100 — curvatureScore becomes 0.88, technicalScore becomes 0.75, remotenessScore becomes 0.7 — while compositeScore stays exactly 0.85, scenicScore stays exactly 0.84, and trafficScore stays exactly 0.76, byte-for-byte unchanged.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport, real normalizeEditorialScores internalAction)
- FLOW_REF: F-1
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t mixed-scale`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: computeNormalizedScores gates on compositeScore > 1 only — the mixed-scale row (compositeScore=0.85) is never fetched or processed; fetchOutOfScaleRows uses only the by_composite_score index (compositeScore > 1) — mixed-scale rows with compositeScore ≤ 1 are never fetched; computeNormalizedScores divides ALL dimensions indiscriminately (would change compositeScore from 0.85 to 0.0085); a stub handler returns {scanned:0, normalized:0} for all rows (no normalization occurs, curvatureScore stays 88); a stub handler normalizes only compositeScore and ignores dimension fields (curvatureScore stays 88)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `mixedScaleRow`
    - ACTION (cli_user): seed test:hyg-mixed-001 with mixed-scale scores via seedMixedScaleRows; run normalizeEditorialScores {routeIdPrefix:'test:hyg-mixed-'} (committed); query test:hyg-mixed-001 via getTestRoute
    - MUST_OBSERVE: compositeScore == 0.85 (strict toBe — not divided); curvatureScore ≈ 0.88 (toBeCloseTo precision 5); scenicScore == 0.84 (strict toBe); technicalScore ≈ 0.75 (toBeCloseTo precision 5); trafficScore == 0.76 (strict toBe); remotenessScore ≈ 0.70 (toBeCloseTo precision 5); scoreScaleNormalizedAt is defined and > 0; response.normalized >= 1
    - MUST_NOT_OBSERVE: compositeScore ≈ 0.0085 (would indicate compositeScore was divided — the bug); scenicScore ≈ 0.0084 (would indicate in-scale scenicScore was divided); trafficScore ≈ 0.0076 (would indicate in-scale trafficScore was divided); curvatureScore == 88 (would indicate no normalization occurred); scoreScaleNormalizedAt is undefined or null

### AC-2 — All-in-scale control row: completely untouched

**Requirement:** GIVEN a curated_routes row where ALL score fields are already in-scale (compositeScore=0.9, all dimensions ≤ 1) and no scoreScaleNormalizedAt WHEN normalizeEditorialScores runs with routeIdPrefix:'test:hyg-mixed-' through the real handler THEN the row is scanned but NOT normalized — every score field is byte-for-byte unchanged and scoreScaleNormalizedAt is NOT stamped.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes row, real normalizeEditorialScores internalAction)
- FLOW_REF: F-1
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t all-in-scale`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: computeNormalizedScores stamps scoreScaleNormalizedAt on rows where no dimension needed normalization (a stub that always returns a result object); fetchOutOfScaleRows does not scan rows with compositeScore ≤ 1 in prefix mode — the row is never checked; the handler divides in-scale values (e.g., 0.9 → 0.009)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `allInScaleRow`
    - ACTION (cli_user): seed test:hyg-mixed-all-inscale via seedMixedScaleRows; run normalizeEditorialScores {routeIdPrefix:'test:hyg-mixed-'} (committed); query test:hyg-mixed-all-inscale via getTestRoute
    - MUST_OBSERVE: compositeScore == 0.9 (strict toBe); curvatureScore == 0.88 (strict toBe); scenicScore == 0.84 (strict toBe); technicalScore == 0.8 (strict toBe); trafficScore == 0.76 (strict toBe); remotenessScore == 0.7 (strict toBe); scoreScaleNormalizedAt is undefined (row was not normalized)
    - MUST_NOT_OBSERVE: scoreScaleNormalizedAt is defined and > 0 (would indicate the row was incorrectly marked as processed); any score field changed from its seeded value

### AC-3 — All-out-of-scale regression guard: all dimensions still divided

**Requirement:** GIVEN a curated_routes row where ALL score fields are out-of-scale (compositeScore=90, all dimensions > 1) WHEN normalizeEditorialScores runs with routeIdPrefix:'test:hyg-mixed-' through the real handler THEN ALL score fields are ÷100 — regression guard proving the mixed-scale fix did not break the original all-out-of-scale path.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: F-1
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t all-out-regression`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: computeNormalizedScores returns null for all rows (a stub that broke the original path while fixing mixed-scale); the per-dimension gate change accidentally excludes rows where compositeScore > 1 (overcorrection)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `allOutOfScaleRow`
    - ACTION (cli_user): seed test:hyg-mixed-all-out via seedMixedScaleRows; run normalizeEditorialScores {routeIdPrefix:'test:hyg-mixed-'} (committed); query test:hyg-mixed-all-out via getTestRoute
    - MUST_OBSERVE: compositeScore ≈ 0.9 (toBeCloseTo precision 5); curvatureScore ≈ 0.88; scenicScore ≈ 0.84; technicalScore ≈ 0.8; trafficScore ≈ 0.76; remotenessScore ≈ 0.7; scoreScaleNormalizedAt is defined and > 0
    - MUST_NOT_OBSERVE: any score field still > 1.0 after normalization; compositeScore == 90 (unchanged start value)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Mixed-scale row through real handler: in-scale dimensions strict equality, out-of-scale dimensions ÷100 | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t mixed-scale` |
| TC-2 | All-in-scale control row completely untouched through real handler | AC-2 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t all-in-scale` |
| TC-3 | All-out-of-scale regression guard: all dimensions still ÷100 | AC-3 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t all-out-regression` |
| TC-4 | SUPPLEMENTARY pure-unit (UNIT_TEST_JUSTIFIED: pure number logic): computeNormalizedScores with mixed-scale input returns object with in-scale values unchanged and out-of-scale ÷100; all-in-scale returns null | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.unit.test.ts -t mixed-scale` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryHygiene.ts (MODIFY — widen computeNormalizedScores gate to ANY score > 1; widen fetchOutOfScaleRows for prefix-mode broad scan)
- convex/curatedGeometryTestSupport.ts (MODIFY — add seedMixedScaleRows: mixed-scale, all-in-scale, all-out-of-scale seed shapes)
- convex/__tests__/curatedGeometryHygiene.integration.test.ts (MODIFY — add mixed-scale integration cases)
- convex/__tests__/curatedGeometryHygiene.unit.test.ts (MODIFY — add mixed-scale computeNormalizedScores unit)

**writeProhibited:**
- convex/schema.ts - scoreScaleNormalizedAt already present; no index/field change
- convex/actions/agent/** - out of scope
- app/**, components/** - no UI in this sprint
- .spec/** - planning docs are read-only
- unrelated Convex modules

## READING LIST

- `convex/curatedGeometryHygiene.ts` — normalizeEditorialScores handler, computeNormalizedScores gate, fetchOutOfScaleRows query
- `convex/curatedGeometryTestSupport.ts` — insertTestRoute, seedEditorialScoreRows, teardownHygieneScoreRows to extend for mixed-scale shapes
- `convex/__tests__/curatedGeometryHygiene.integration.test.ts` — existing AC-1 through AC-4 test suite (the mixed-scale cases extend this)
- `convex/schema.ts` — curated_routes indexes: by_composite_score, by_routeId
- `shared/models/curated-routes.ts` (line 290: scoreScaleNormalizedAt field)

## CODE PATTERN

- Pattern: // per-dimension gate — ANY score field > 1 triggers normalization, not just compositeScore
const SCORE_FIELDS = ['compositeScore','curvatureScore','scenicScore','technicalScore','trafficScore','remotenessScore']
const hasAnyOutOfScale = SCORE_FIELDS.some((k) => typeof row[k] === 'number' && row[k] > 1)
const needsNormalize = row.scoreScaleNormalizedAt == null && hasAnyOutOfScale
- Pattern source: `convex/curatedGeometryHygiene.ts (computeNormalizedScores) + convex/curatedRoutes.ts:129 (the read-path norm being superseded)`
- Anti-pattern: Gating purely on compositeScore > 1 — this skips mixed-scale rows where compositeScore is already normalized but individual dimensions are not.

## VERIFICATION GATES

- Integration tests pass: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` → Exit 0
- Supplementary unit: `pnpm test convex/__tests__/curatedGeometryHygiene.unit.test.ts` → Exit 0
- Typecheck: `pnpm type-check` → Exit 0
- Lint: `pnpm exec biome check` → Exit 0
- Convex build: `pnpm convex:dev --once` → Exit 0

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Requires modifying Convex internalMutation handler logic (widening the normalization gate to per-dimension), test support seeders (mixed-scale shapes), and integration tests. Pure backend Convex work.
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
  "task_id": "REDHAT-FIX-001",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "mixedScaleRow": {
      "description": "1 row with mixed-scale scores: compositeScore=0.85 (in-scale), curvatureScore=88 (out-of-scale), scenicScore=0.84 (in-scale), technicalScore=75 (out-of-scale), trafficScore=0.76 (in-scale), remotenessScore=70 (out-of-scale); scoreScaleNormalizedAt ABSENT.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-mixed-001 compositeScore=0.85 curvatureScore=88 scenicScore=0.84 technicalScore=75 trafficScore=0.76 remotenessScore=70 seeded via curatedGeometryTestSupport"
      ]
    },
    "allInScaleRow": {
      "description": "1 row where ALL score fields are already in-scale (\u22641); scoreScaleNormalizedAt ABSENT \u2014 must be completely untouched.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-mixed-all-inscale compositeScore=0.9 all dimensions \u22641 seeded via curatedGeometryTestSupport"
      ]
    },
    "allOutOfScaleRow": {
      "description": "1 row where ALL score fields are out-of-scale (>1); scoreScaleNormalizedAt ABSENT \u2014 regression guard.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-mixed-all-out compositeScore=90 all dimensions >1 seeded via curatedGeometryTestSupport"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN a curated_routes row seeded with mixed-scale scores (compositeScore=0.85 in-scale, curvatureScore=88 out-of-scale, scenicScore=0.84 in-scale, technicalScore=75 out-of-scale, trafficScore=0.76 in-scale, remotenessScore=70 out-of-scale) and no scoreScaleNormalizedAt WHEN normalizeEditorialScores runs with routeIdPrefix:'test:hyg-mixed-' (committed) THEN ONLY the out-of-scale dimensions are \u00f7100 while in-scale dimensions stay byte-for-byte unchanged",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t mixed-scale",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport, real normalizeEditorialScores internalAction)",
        "negative_control": {
          "would_fail_if": [
            "computeNormalizedScores gates on compositeScore > 1 only \u2014 the mixed-scale row (compositeScore=0.85) is never fetched or processed",
            "fetchOutOfScaleRows uses only the by_composite_score index (compositeScore > 1) \u2014 mixed-scale rows with compositeScore \u22641 are never fetched",
            "computeNormalizedScores divides ALL dimensions indiscriminately (would change compositeScore from 0.85 to 0.0085)",
            "a stub handler returns {scanned:0, normalized:0} for all rows (no normalization occurs, curvatureScore stays 88)",
            "a stub handler normalizes only compositeScore and ignores dimension fields (curvatureScore stays 88)"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "mixedScaleRow",
            "action": {
              "actor": "cli_user",
              "steps": [
                "seed test:hyg-mixed-001 with mixed-scale scores via seedMixedScaleRows",
                "run normalizeEditorialScores {routeIdPrefix:'test:hyg-mixed-'} (committed)",
                "query test:hyg-mixed-001 via getTestRoute"
              ]
            },
            "end_state": {
              "must_observe": [
                "compositeScore == 0.85 (strict toBe \u2014 not divided)",
                "curvatureScore \u2248 0.88 (toBeCloseTo precision 5)",
                "scenicScore == 0.84 (strict toBe)",
                "technicalScore \u2248 0.75 (toBeCloseTo precision 5)",
                "trafficScore == 0.76 (strict toBe)",
                "remotenessScore \u2248 0.70 (toBeCloseTo precision 5)",
                "scoreScaleNormalizedAt is defined and > 0",
                "response.normalized >= 1"
              ],
              "must_not_observe": [
                "compositeScore \u2248 0.0085 (would indicate compositeScore was divided \u2014 the bug)",
                "scenicScore \u2248 0.0084 (would indicate in-scale scenicScore was divided)",
                "trafficScore \u2248 0.0076 (would indicate in-scale trafficScore was divided)",
                "curvatureScore == 88 (would indicate no normalization occurred)",
                "scoreScaleNormalizedAt is undefined or null"
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
      "description": "GIVEN a curated_routes row where ALL score fields are already in-scale (compositeScore=0.9, all dimensions \u22641) and no scoreScaleNormalizedAt WHEN normalizeEditorialScores runs with routeIdPrefix:'test:hyg-mixed-' through the real handler THEN the row is scanned but NOT normalized \u2014 every score field is byte-for-byte unchanged and scoreScaleNormalizedAt is NOT stamped",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t all-in-scale",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes row, real normalizeEditorialScores internalAction)",
        "negative_control": {
          "would_fail_if": [
            "computeNormalizedScores stamps scoreScaleNormalizedAt on rows where no dimension needed normalization (a stub that always returns a result object)",
            "fetchOutOfScaleRows does not scan rows with compositeScore \u22641 in prefix mode \u2014 the row is never checked",
            "the handler divides in-scale values (e.g., 0.9 \u2192 0.009)"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "allInScaleRow",
            "action": {
              "actor": "cli_user",
              "steps": [
                "seed test:hyg-mixed-all-inscale via seedMixedScaleRows",
                "run normalizeEditorialScores {routeIdPrefix:'test:hyg-mixed-'} (committed)",
                "query test:hyg-mixed-all-inscale via getTestRoute"
              ]
            },
            "end_state": {
              "must_observe": [
                "compositeScore == 0.9 (strict toBe)",
                "curvatureScore == 0.88 (strict toBe)",
                "scenicScore == 0.84 (strict toBe)",
                "technicalScore == 0.8 (strict toBe)",
                "trafficScore == 0.76 (strict toBe)",
                "remotenessScore == 0.7 (strict toBe)",
                "scoreScaleNormalizedAt is undefined (row was not normalized)"
              ],
              "must_not_observe": [
                "scoreScaleNormalizedAt is defined and > 0 (would indicate the row was incorrectly marked as processed)",
                "any score field changed from its seeded value"
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
      "description": "GIVEN a curated_routes row where ALL score fields are out-of-scale (compositeScore=90, all dimensions >1) WHEN normalizeEditorialScores runs with routeIdPrefix:'test:hyg-mixed-' through the real handler THEN ALL score fields are \u00f7100 \u2014 regression guard proving the mixed-scale fix did not break the original all-out-of-scale path",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t all-out-regression",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "computeNormalizedScores returns null for all rows (a stub that broke the original path while fixing mixed-scale)",
            "the per-dimension gate change accidentally excludes rows where compositeScore > 1 (overcorrection)"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "allOutOfScaleRow",
            "action": {
              "actor": "cli_user",
              "steps": [
                "seed test:hyg-mixed-all-out via seedMixedScaleRows",
                "run normalizeEditorialScores {routeIdPrefix:'test:hyg-mixed-'} (committed)",
                "query test:hyg-mixed-all-out via getTestRoute"
              ]
            },
            "end_state": {
              "must_observe": [
                "compositeScore \u2248 0.9 (toBeCloseTo precision 5)",
                "curvatureScore \u2248 0.88",
                "scenicScore \u2248 0.84",
                "technicalScore \u2248 0.8",
                "trafficScore \u2248 0.76",
                "remotenessScore \u2248 0.7",
                "scoreScaleNormalizedAt is defined and > 0"
              ],
              "must_not_observe": [
                "any score field still > 1.0 after normalization",
                "compositeScore == 90 (unchanged start value)"
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
      "description": "Mixed-scale row through real handler: in-scale dimensions strict equality, out-of-scale dimensions \u00f7100",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t mixed-scale"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "All-in-scale control row completely untouched through real handler",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t all-in-scale"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "All-out-of-scale regression guard: all dimensions still \u00f7100",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t all-out-regression"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "SUPPLEMENTARY pure-unit (UNIT_TEST_JUSTIFIED: pure number logic): computeNormalizedScores with mixed-scale input returns object with in-scale values unchanged and out-of-scale \u00f7100; all-in-scale returns null",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.unit.test.ts -t mixed-scale"
    }
  ]
}
-->
</details>
