# S3-T1 — Score-scale ÷100 normalization at rest with dry-run preview (UC-HYG-01)

| Field | Value |
|-------|-------|
| TASK_ID | S3-T1 |
| SPRINT | [Sprint 03 — Catalog hygiene](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | — (N/A: deterministic at-rest cleanup) |
| DEPENDS_ON | None |
| BLOCKS | S3-T2, S3-T3, sprint-04 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

normalizeEditorialScores {dryRun:true} previews the exact change-set without writing; the committed run divides every out-of-scale composite+dimension score by 100 at rest, stamps scoreScaleNormalizedAt, returns changed-count == out-of-scale count; a second run is a no-op; no curated_routes row carries compositeScore > 1.0; already-in-scale rows are untouched.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Read convex/_generated/ai/guidelines.md first (run `npx convex ai-files install`, fall back to brain/docs/CONVEX-RULES.md).
- Divide the composite AND all dimension scores (curvatureScore, scenicScore, technicalScore, trafficScore, remotenessScore) of each out-of-scale row by 100 AT REST — the stored row must satisfy a direct table query returning 0–1, not a read-path patch.
- Establish convex/curatedGeometryHygiene.ts as the shared module and a first-class {dryRun?} preview/change-set helper that returns the exact same change-set a committed run applies (writes NOTHING in dry-run) — S3-T2/S3-T3 reuse this helper.
- Stamp scoreScaleNormalizedAt on every row a commit run normalizes; use it plus a value>1 guard as the double idempotency gate so no score is ever divided twice.
- Establish scripts/hygiene-curated-routes.ts with --dryRun and subcommand routing following the sibling scripts/backfill-curated-geometry.ts flag conventions (`--flag=value`, invoke internalActions via `npx convex run module:fn '<argsJson>'`).
- Seed real curated_routes rows through curatedGeometryTestSupport (extend it for custom composite+dimension scores and an already-in-scale control row); assert PERSISTED values from a direct table query.

**NEVER**
- Never leave the ÷100 as only the read-path `norm` helper (curatedRoutes.ts:129) — a direct curated_routes query must return 0–1.
- Never divide an already-in-scale (value ≤1) score, and never divide a row that already carries scoreScaleNormalizedAt.
- Never hardcode the changed-count — it must be counted from rows actually normalized.
- Never edit convex/schema.ts (scoreScaleNormalizedAt is already present), convex/actions/agent/**, the RN app, or convex/curatedGeometry.ts predicate internals.
- Never report complete while any hygiene mutation lacks {dryRun?}, or while a mocked table stands in for the real dev deployment.

**STRICTLY**
- Out-of-scale iff value > 1 (0–100 stored scale). In-scale (≤1) rows are left byte-for-byte unchanged.
- dryRun response and the committed response must report identical {scanned,normalized} for the same catalog state.
- Catalog-wide post-condition: zero curated_routes rows with compositeScore > 1.0.

## DONE WHEN

- AC-1 [PRIMARY]: each out-of-scale composite and dimension score is ÷100 at rest, a direct curated_routes query returns 0–1, normalized == the out-of-scale row count, and scoreScaleNormalizedAt is stamped on every normalized row
- AC-2: it returns the preview change-set and writes NOTHING, and a subsequent committed run's change-set matches the preview
- AC-3: normalized == 0 and no stored score differs (the marker + value>1 guard prevent a second division)
- AC-4: no seeded curated_routes row carries compositeScore > 1.0 and the already-in-scale control row is byte-for-byte unmodified
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Build convex/curatedGeometryHygiene.ts and its normalizeEditorialScores internalAction: an idempotent, dry-run-previewable at-rest ÷100 of the ~103 out-of-scale editorial rows' composite and dimension scores, plus the shared {dryRun?} change-set helper and the operator driver skeleton that S3-T2/S3-T3 extend.

**Success state:** normalizeEditorialScores {dryRun:true} previews the exact change-set without writing; the committed run divides every out-of-scale composite+dimension score by 100 at rest, stamps scoreScaleNormalizedAt, returns changed-count == out-of-scale count; a second run is a no-op; no curated_routes row carries compositeScore > 1.0; already-in-scale rows are untouched.

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `out_of_scale_editorial_rows` (seed_method: `public_api`): 3 editorial-source rows (source='editorial') with compositeScore + all five dimension scores stored on the 0–100 scale (e.g. composite 90/72/85) and scoreScaleNormalizedAt ABSENT.
    - curated_routes routeId=test:hyg-score-90 compositeScore=90 dimensions~[88,84,80,76,70] source=editorial seeded via curatedGeometryTestSupport (extended seedEditorialScoreRows)
    - curated_routes routeId=test:hyg-score-72 compositeScore=72 dimensions on 0–100 scale
    - curated_routes routeId=test:hyg-score-85 compositeScore=85 dimensions on 0–100 scale
- `in_scale_control_row` (seed_method: `public_api`): 1 row already on the 0–1 scale (compositeScore 0.85, all dimensions ≤1) with scoreScaleNormalizedAt ABSENT — must be left unmodified by the pass.
    - curated_routes routeId=test:hyg-score-inscale compositeScore=0.85 dimensions all ≤1 seeded via curatedGeometryTestSupport

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — ÷100 editorial scores at rest with counted changed-set

**Requirement:** GIVEN out-of-scale editorial rows (composite + dimension scores on the 0–100 scale, no scoreScaleNormalizedAt) WHEN normalizeEditorialScores runs committed (no dryRun) THEN each out-of-scale composite and dimension score is ÷100 at rest, a direct curated_routes query returns 0–1, normalized == the out-of-scale row count, and scoreScaleNormalizedAt is stamped on every normalized row

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-01
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t normalize-at-rest`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the ÷100 remains only the read-path `norm` helper (curatedRoutes.ts:129) so a direct curated_routes table query still returns the static 90 (nothing written at rest); only compositeScore is divided while the dimension scores (curvatureScore/scenicScore/technicalScore/trafficScore/remotenessScore) stay statically at 0–100; normalized is a hardcoded constant (stub) rather than counted from rows actually changed; scoreScaleNormalizedAt is never stamped (no-op) so a later run divides again
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `out_of_scale_editorial_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}'; query curated_routes by_routeId for each seeded editorial row; read the returned {scanned,normalized}
    - MUST_OBSERVE: compositeScore == 0.90 (was 90) on row test:hyg-score-90; curvatureScore == 0.88 on test:hyg-score-90 and every dimension score on all 3 rows in [0,1]; normalized == 3 (all three out-of-scale rows changed); scoreScaleNormalizedAt == a stored epoch-ms timestamp > 0 on all 3 normalized rows (was absent before the pass)
    - MUST_NOT_OBSERVE: compositeScore == 90 (unchanged start value) on any seeded row; any dimension score > 1.0 on a normalized row; scoreScaleNormalizedAt absent/undefined on a normalized row (nothing stamped)

### AC-2 — dryRun previews the change-set and writes nothing

**Requirement:** GIVEN out-of-scale editorial rows WHEN normalizeEditorialScores runs with {dryRun:true} THEN it returns the preview change-set and writes NOTHING, and a subsequent committed run's change-set matches the preview

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-01
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dry-run`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the dry-run writes the ÷100 to the table anyway (compositeScore already 0.90 before commit); the dry-run returns an empty/zero preview instead of the real per-row change-set; the committed run's normalized count differs from the dry-run preview
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `out_of_scale_editorial_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:normalizeEditorialScores '{"dryRun":true}'; query curated_routes for the seeded rows to confirm no write occurred; npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}' (committed); compare the committed {scanned,normalized} to the dry-run preview
    - MUST_OBSERVE: dry-run response normalized == 3 (preview counts the 3 out-of-scale rows); after the dry-run test:hyg-score-90 compositeScore == 90 (still unwritten); committed run normalized == 3, matching the dry-run preview
    - MUST_NOT_OBSERVE: compositeScore == 0.90 after the dry-run (table mutated by a preview); dry-run normalized == 0 (empty preview)

### AC-3 — Second run is a no-op (idempotent)

**Requirement:** GIVEN a catalog already normalized by a prior committed pass WHEN normalizeEditorialScores runs a second time THEN normalized == 0 and no stored score differs (the marker + value>1 guard prevent a second division)

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-01
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t idempotent`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the pass divides an already-normalized row a second time (0.90 → 0.009); the value>1 guard is missing so an already-in-scale 0.85 row is divided; normalized is non-zero on a no-op second run
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `out_of_scale_editorial_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}' (first committed pass); record the returned normalized count
    - MUST_OBSERVE: first-pass normalized == 3 (non-degenerate)
    - MUST_NOT_OBSERVE: first-pass normalized == 0
- CASE 2 — start_ref `out_of_scale_editorial_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}' (second committed pass); query the previously-normalized rows
    - MUST_OBSERVE: second-run normalized == 0 (no-op); compositeScore == 0.90 unchanged on test:hyg-score-90 (not 0.009)
    - MUST_NOT_OBSERVE: compositeScore == 0.009 (divided twice); second-run normalized > 0

### AC-4 — No composite > 1.0 invariant; in-scale rows untouched

**Requirement:** GIVEN a catalog including an already-in-scale (0–1) editorial control row WHEN the pass completes THEN no seeded curated_routes row carries compositeScore > 1.0 and the already-in-scale control row is byte-for-byte unmodified

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-01
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t invariant`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the value>1 guard is missing (stub) so the already-in-scale 0.85 control row is statically divided to 0.0085; the pass is a no-op that leaves an out-of-scale 90 in the table so a full scan still finds compositeScore > 1.0; the invariant check reads a hardcoded/empty result set (static) instead of scanning the real seeded rows
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `in_scale_control_row`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}' (committed); query the in-scale control row test:hyg-score-inscale; scan the seeded rows for compositeScore > 1.0
    - MUST_OBSERVE: in-scale control compositeScore == 0.85 (unchanged); 0 seeded rows with compositeScore > 1.0 after the pass
    - MUST_NOT_OBSERVE: compositeScore == 0.0085 (in-scale row wrongly divided from its 0.85 start value); any seeded row with compositeScore > 1.0 (e.g. a static 90 left unwritten)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | normalizeEditorialScores committed divides composite and every dimension score of the out-of-scale editorial rows by 100 at rest; a direct curated_routes query returns 0–1 and scoreScaleNormalizedAt is stamped | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t normalize-at-rest` |
| TC-2 | normalizeEditorialScores {dryRun:true} returns the preview change-set and writes nothing; the committed run matches the preview | AC-2 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dry-run` |
| TC-3 | A second committed normalizeEditorialScores run reports normalized 0 and no stored score changes | AC-3 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t idempotent` |
| TC-4 | After the pass no seeded curated_routes row has compositeScore greater than 1.0 and the already-in-scale control row is unchanged | AC-4 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t invariant` |
| TC-5 | SUPPLEMENTARY pure-unit (UNIT_TEST_JUSTIFIED: pure number logic, zero I/O): the scale predicate divides a value greater than 1 by 100 and leaves a 0–1 value untouched | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.unit.test.ts -t scale` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryHygiene.ts (NEW — module + normalizeEditorialScores + shared {dryRun?} preview/change-set helper reused by S3-T2/S3-T3)
- scripts/hygiene-curated-routes.ts (NEW — driver skeleton: --dryRun + subcommand routing, sibling flag conventions)
- convex/__tests__/curatedGeometryHygiene.integration.test.ts (NEW — PRIMARY integration)
- convex/__tests__/curatedGeometryHygiene.unit.test.ts (NEW — supplementary pure scale predicate)
- convex/curatedGeometryTestSupport.ts (MODIFY — add editorial score seed shapes: custom composite+dimension scores, in-scale control, optional scoreScaleNormalizedAt)

**writeProhibited:**
- convex/schema.ts - scoreScaleNormalizedAt already present; no index/field change
- convex/actions/agent/** - out of scope (agent rebuild is Sprint AGT)
- app/**, components/** - no UI in this sprint
- convex/curatedGeometry.ts predicate/persist internals - hook only, do not modify computeRiderReadyFromDoc
- .spec/** - planning docs are read-only
- unrelated Convex modules

## READING LIST

- `convex/curatedRoutes.ts` (129,257-260,304) — the read-path `norm` ÷100 patch that AC-1 must supersede at rest; the reused shadow/quarantine exclusion filter
- `shared/models/curated-routes.ts` (85-92,208-213) — compositeScore + five dimension score fields; scoreScaleNormalizedAt already present (no schema edit)
- `convex/curatedGeometryTestSupport.ts` (11-107,121-138) — insertTestRoute real-mutation seed to extend for custom composite+dimension scores and an in-scale control row
- `scripts/backfill-curated-geometry.ts` (39-90,140-175) — sibling driver flag conventions (--flag=value, npx convex run module:fn '<argsJson>') to mirror in scripts/hygiene-curated-routes.ts
- `.spec/prds/route-agent-quality/10-technical-requirements/04-api-design.md` (14-22,84-92) — normalizeEditorialScores contract + the {dryRun?} batch-governance contract for all five functions

## CODE PATTERN

- Pattern: // idempotency + value guard mirrors computeRiderReadyFromDoc's absent-optional discipline
const needsNormalize = row.scoreScaleNormalizedAt == null && row.compositeScore > 1
if (!dryRun && needsNormalize) {
  await ctx.db.patch(row._id, {
    compositeScore: row.compositeScore / 100,
    curvatureScore: row.curvatureScore > 1 ? row.curvatureScore / 100 : row.curvatureScore,
    /* ...remaining dimensions... */
    scoreScaleNormalizedAt: Date.now(),
  })
}
- Pattern source: `convex/curatedGeometry.ts:406-438 (absent-optional predicate) + convex/curatedRoutes.ts:129 (the read-path norm being superseded)`
- Anti-pattern: Leaving the ÷100 as the read-path norm helper; dividing already-in-scale scores; hardcoding the changed-count; a dry-run that writes; editing convex/schema.ts.

## VERIFICATION GATES

- Integration tests pass: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` → Exit 0
- Supplementary unit: `pnpm test convex/__tests__/curatedGeometryHygiene.unit.test.ts` → Exit 0
- Typecheck: `pnpm type-check` → Exit 0
- Lint: `pnpm exec biome check` → Exit 0
- Convex build: `pnpm convex:dev --once` → Exit 0

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Pure-Convex backend: a new default-runtime internalAction that scans curated_routes, divides out-of-scale editorial scores by 100 at rest with an idempotency marker, exposes the shared {dryRun?} preview/change-set helper the sibling passes reuse, plus a real Convex dev-deployment integration test seeded through curatedGeometryTestSupport. Establishes the module every S3 pass extends.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: None
- Blocks: S3-T2, S3-T3, sprint-04

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
  "task_id": "S3-T1",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "out_of_scale_editorial_rows": {
      "description": "3 editorial-source rows (source='editorial') with compositeScore + all five dimension scores stored on the 0\u2013100 scale (e.g. composite 90/72/85) and scoreScaleNormalizedAt ABSENT.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-score-90 compositeScore=90 dimensions~[88,84,80,76,70] source=editorial seeded via curatedGeometryTestSupport (extended seedEditorialScoreRows)",
        "curated_routes routeId=test:hyg-score-72 compositeScore=72 dimensions on 0\u2013100 scale",
        "curated_routes routeId=test:hyg-score-85 compositeScore=85 dimensions on 0\u2013100 scale"
      ]
    },
    "in_scale_control_row": {
      "description": "1 row already on the 0\u20131 scale (compositeScore 0.85, all dimensions \u22641) with scoreScaleNormalizedAt ABSENT \u2014 must be left unmodified by the pass.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-score-inscale compositeScore=0.85 dimensions all \u22641 seeded via curatedGeometryTestSupport"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN out-of-scale editorial rows (composite + dimension scores on the 0\u2013100 scale, no scoreScaleNormalizedAt) WHEN normalizeEditorialScores runs committed THEN each out-of-scale composite and dimension score is \u00f7100 at rest, a direct curated_routes query returns 0\u20131, normalized == the out-of-scale row count, and scoreScaleNormalizedAt is stamped",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t normalize-at-rest",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the \u00f7100 remains only the read-path `norm` helper (curatedRoutes.ts:129) so a direct curated_routes table query still returns the static 90 (nothing written at rest)",
            "only compositeScore is divided while the dimension scores (curvatureScore/scenicScore/technicalScore/trafficScore/remotenessScore) stay statically at 0\u2013100",
            "normalized is a hardcoded constant (stub) rather than counted from rows actually changed",
            "scoreScaleNormalizedAt is never stamped (no-op) so a later run divides again"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "out_of_scale_editorial_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}'",
                "query curated_routes by_routeId for each seeded editorial row",
                "read the returned {scanned,normalized}"
              ]
            },
            "end_state": {
              "must_observe": [
                "compositeScore == 0.90 (was 90) on row test:hyg-score-90",
                "curvatureScore == 0.88 on test:hyg-score-90 and every dimension score on all 3 rows in [0,1]",
                "normalized == 3 (all three out-of-scale rows changed)",
                "scoreScaleNormalizedAt == a stored epoch-ms timestamp > 0 on all 3 normalized rows (was absent before the pass)"
              ],
              "must_not_observe": [
                "compositeScore == 90 (unchanged start value) on any seeded row",
                "any dimension score > 1.0 on a normalized row",
                "scoreScaleNormalizedAt absent/undefined on a normalized row (nothing stamped)"
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
      "description": "GIVEN out-of-scale editorial rows WHEN normalizeEditorialScores runs with {dryRun:true} THEN it returns the preview change-set and writes NOTHING and a subsequent committed run's change-set matches the preview",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dry-run",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the dry-run writes the \u00f7100 to the table anyway (compositeScore already 0.90 before commit)",
            "the dry-run returns an empty/zero preview instead of the real per-row change-set",
            "the committed run's normalized count differs from the dry-run preview"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "out_of_scale_editorial_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:normalizeEditorialScores '{\"dryRun\":true}'",
                "query curated_routes for the seeded rows to confirm no write occurred",
                "npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}' (committed)",
                "compare the committed {scanned,normalized} to the dry-run preview"
              ]
            },
            "end_state": {
              "must_observe": [
                "dry-run response normalized == 3 (preview counts the 3 out-of-scale rows)",
                "after the dry-run test:hyg-score-90 compositeScore == 90 (still unwritten)",
                "committed run normalized == 3, matching the dry-run preview"
              ],
              "must_not_observe": [
                "compositeScore == 0.90 after the dry-run (table mutated by a preview)",
                "dry-run normalized == 0 (empty preview)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN a catalog already normalized by a prior committed pass WHEN normalizeEditorialScores runs a second time THEN normalized == 0 and no stored score differs (marker + value>1 guard prevent a second division)",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t idempotent",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the pass divides an already-normalized row a second time (0.90 \u2192 0.009)",
            "the value>1 guard is missing so an already-in-scale 0.85 row is divided",
            "normalized is non-zero on a no-op second run"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "out_of_scale_editorial_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}' (first committed pass)",
                "record the returned normalized count"
              ]
            },
            "end_state": {
              "must_observe": [
                "first-pass normalized == 3 (non-degenerate)"
              ],
              "must_not_observe": [
                "first-pass normalized == 0"
              ]
            }
          },
          {
            "start_ref": "out_of_scale_editorial_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}' (second committed pass)",
                "query the previously-normalized rows"
              ]
            },
            "end_state": {
              "must_observe": [
                "second-run normalized == 0 (no-op)",
                "compositeScore == 0.90 unchanged on test:hyg-score-90 (not 0.009)"
              ],
              "must_not_observe": [
                "compositeScore == 0.009 (divided twice)",
                "second-run normalized > 0"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN a catalog including an already-in-scale (0\u20131) editorial control row WHEN the pass completes THEN no seeded curated_routes row carries compositeScore > 1.0 and the already-in-scale control row is byte-for-byte unmodified",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t invariant",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the value>1 guard is missing (stub) so the already-in-scale 0.85 control row is statically divided to 0.0085",
            "the pass is a no-op that leaves an out-of-scale 90 in the table so a full scan still finds compositeScore > 1.0",
            "the invariant check reads a hardcoded/empty result set (static) instead of scanning the real seeded rows"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "in_scale_control_row",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}' (committed)",
                "query the in-scale control row test:hyg-score-inscale",
                "scan the seeded rows for compositeScore > 1.0"
              ]
            },
            "end_state": {
              "must_observe": [
                "in-scale control compositeScore == 0.85 (unchanged)",
                "0 seeded rows with compositeScore > 1.0 after the pass"
              ],
              "must_not_observe": [
                "compositeScore == 0.0085 (in-scale row wrongly divided from its 0.85 start value)",
                "any seeded row with compositeScore > 1.0 (e.g. a static 90 left unwritten)"
              ]
            }
          }
        ],
        "id": "AC-4",
        "primary": false
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "normalizeEditorialScores committed divides composite and every dimension score of the out-of-scale editorial rows by 100 at rest; a direct curated_routes query returns 0\u20131 and scoreScaleNormalizedAt is stamped",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t normalize-at-rest"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "normalizeEditorialScores {dryRun:true} returns the preview change-set and writes nothing; the committed run matches the preview",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dry-run"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "A second committed normalizeEditorialScores run reports normalized 0 and no stored score changes",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t idempotent"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "After the pass no seeded curated_routes row has compositeScore greater than 1.0 and the already-in-scale control row is unchanged",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t invariant"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "SUPPLEMENTARY pure-unit (UNIT_TEST_JUSTIFIED: pure number logic, zero I/O): the scale predicate divides a value greater than 1 by 100 and leaves a 0\u20131 value untouched",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.unit.test.ts -t scale"
    }
  ]
}
-->
</details>
