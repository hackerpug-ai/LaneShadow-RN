# REDHAT-FIX-004 — Generalize catalog scan/change-set boundaries for paginated T2/T3 hygiene passes (F-3)

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-004 |
| SPRINT | [Sprint 03 — Catalog hygiene](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 60 min |
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

All hygiene handlers in curatedGeometryHygiene.ts accept {cursor?, batchSize?, dryRun?} and return {continueCursor, isDone} alongside their domain-specific fields. The operator driver script loops until isDone. A multi-batch run processes every row in the catalog, bounded by Convex per-transaction read limits, and the dryRun preview is byte-identical to a committed multi-batch run regardless of batchSize.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Read convex/_generated/ai/guidelines.md first.
- Use Convex `.paginate({cursor, numItems})` on the query builder — the same pattern already proven in `convex/curatedGeometry.ts:214` and `convex/curatedGeometryQa.ts:63`.
- Accept cursor as `v.union(v.string(), v.null())` — matching the established pattern in listForGeometryBackfill args.
- Default batchSize to 100 — stays well under Convex's per-transaction documents-read limit while minimizing round trips.
- Return `continueCursor` as a non-null string on every response (empty string '' when isDone:true is acceptable).
- Return `isDone:boolean` on every response.
- The multi-batch driver loop must accumulate per-batch counts into totals (same pattern as `scripts/backfill-curated-geometry.ts:226-256`).
- Add new seed helpers for ≥10 paginated test rows to curatedGeometryTestSupport.ts.
- All existing S3-T1 integration test assertions must still pass unchanged.
- normalizeEditorialScores must use the by_composite_score index with `.paginate()` — NOT a full-table scan with in-memory filter.

**NEVER**
- Never edit convex/schema.ts — indexes are already sufficient (by_composite_score exists).
- Never edit convex/_generated/** — auto-generated.
- Never edit convex/actions/agent/** — unrelated agent code.
- Never edit react-native/** or app/** — this is backend-only.
- Never edit .spec/** — task definitions are immutable during implementation.
- Never use `.filter()` as the primary scan strategy — use `.withIndex()` then `.paginate()`.
- Never remove the routeIdPrefix arg from normalizeEditorialScores — the S3-T1 integration test depends on it.
- Never break the existing response shape — extend it, do not narrow it.

**STRICTLY**
- The cursor passed to `.paginate()` is opaque — callers must not parse or construct it; only pass it through from a prior response.continueCursor.
- The response shape change is additive: `{scanned, normalized}` → `{scanned, normalized, continueCursor, isDone}` — callers destructuring `{scanned, normalized}` must still work.
- The dryRun flag must be respected per-batch — a multi-batch dryRun run writes nothing across ALL batches.
- Idempotency must hold across batches — re-running a multi-batch pass on already-normalized rows returns normalized:0 on every batch.

## DONE WHEN

- AC-1 [PRIMARY]: 10 out-of-scale test rows are processed in a multi-batch cursor loop (batchSize:3) — all 10 rows normalized, total normalized === 10, batchCount >= 2
- AC-2: first batch returns isDone:false + non-empty continueCursor; second batch processes different rows (cursor advanced)
- AC-3: driver script (scripts/hygiene-curated-routes.ts) loops until isDone, accumulates totals, accepts --cursor=X and --batchSize=N
- AC-4: dryRun multi-batch total === committed multi-batch total === committed single-batch (batchSize:100) total; dryRun writes nothing
- AC-5: backward compatibility — bare {} call works, returns {scanned, normalized, continueCursor, isDone}, existing S3-T1 tests pass unmodified
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Generalize the pagination pattern from Convex's native `.paginate()` API into the shared helper used by all curated_routes hygiene handlers. Currently the handlers use unbounded scans that risk hitting Convex's per-transaction documents-read limit on the real 5,757-row catalog. The fix replaces unbounded scans with `.paginate({cursor, numItems})`, adds `{cursor?, batchSize?}` to handler args, adds `{continueCursor, isDone}` to handler returns, and updates the operator driver script to loop until isDone.

**Success state:** A developer runs `pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores` against the real Convex dev deployment. The driver loops in batches of 100, accumulating normalized counts, until isDone. Every out-of-scale row is normalized. Running with --dryRun produces the same total counts without writing. The S3-T1 integration tests pass unchanged. batchSize=2 produces the same final result as batchSize=100, just in more batches.

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `paginated_score_seed` (seed_method: `public_api`): 10 curated_routes rows with out-of-scale (0-100) composite + dimension scores, routeId prefix 'test:hyg-pag-'. Used to verify multi-batch pagination — with batchSize=3, ceil(10/3)=4 batches are needed.
    - curated_routes routeId=test:hyg-pag-01..10 compositeScore=95/88/92/76/84/98/70/82/94/86 all dimensions on 0-100 scale
- `inscale_control_row` (seed_method: `public_api`): 1 curated_routes row with in-scale (0-1) composite score, routeId 'test:hyg-pag-inscale'. Seeded alongside paginated_score_seed to verify that in-scale rows are scanned but NOT normalized across batches.
    - curated_routes routeId=test:hyg-pag-inscale compositeScore=0.85 all dimensions ≤1
- `existing_s3t1_seed` (seed_method: `public_api`): The existing 3-row seedEditorialScoreRows fixture — reused to verify backward compatibility.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Multi-batch full-catalog processing via cursor loop

**Requirement:** GIVEN 10 curated_routes rows with out-of-scale composite scores (test:hyg-pag-01 through test:hyg-pag-10) seeded in the real Convex dev deployment WHEN normalizeEditorialScores is called with {cursor: null, batchSize: 3, routeIdPrefix: 'test:hyg-pag-'} in a loop until isDone THEN all 10 rows have compositeScore ≤ 1.0 and scoreScaleNormalizedAt stamped, and the sum of per-batch normalized counts equals 10.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment — real curated_routes rows seeded via curatedGeometryTestSupport, invoked via npx convex run
- FLOW_REF: F-3
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t multi-batch-pagination`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a stub that returns {scanned:0, normalized:0, continueCursor:'', isDone:true} without reading the table — all 10 rows would remain at compositeScore > 1.0; a no-pagination implementation that still uses .collect() — would process all 10 in one batch (isDone:true immediately); a handler that ignores the cursor and always scans from the start — would normalize the same first 3 rows on every batch, leaving rows 4-10 un-normalized; a handler that advances the cursor but skips the routeIdPrefix filter — would count non-test rows in normalized
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `paginated_score_seed`
    - ACTION (cli_user): teardown + seed 10 paginated test rows; call normalizeEditorialScores {cursor: null, batchSize: 3, routeIdPrefix: 'test:hyg-pag-'}; loop calling with response.continueCursor until isDone === true; accumulate totalNormalized; query all 10 rows via getTestRoute
    - MUST_OBSERVE: all 10 rows have compositeScore ≤ 1.0; all 10 rows have scoreScaleNormalizedAt defined; totalNormalized === 10; batchCount >= 2; every response includes continueCursor and isDone; final batch has isDone === true
    - MUST_NOT_OBSERVE: any test row with compositeScore > 1.0 after the full multi-batch run; totalNormalized < 10 (rows skipped); totalNormalized > 10 (rows double-counted); a batch with isDone === true while rows remain un-normalized

### AC-2 — Cursor continuation: second batch processes different rows

**Requirement:** GIVEN 10 out-of-scale test rows seeded WHEN normalizeEditorialScores is called with {cursor: null, batchSize: 3} THEN the response has isDone:false and a non-empty continueCursor. A second call with {cursor: continueCursor, batchSize: 3} processes a DIFFERENT subset of rows (cursor advanced, batch2.continueCursor !== batch1.continueCursor).

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: F-3
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t cursor-continuation`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a handler that always returns isDone:true regardless of remaining rows; a handler that returns a null/empty continueCursor when more rows exist; a handler that ignores the cursor and always processes the same first page
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `paginated_score_seed`
    - ACTION (cli_user): seed 10 rows; call batch1 {cursor: null, batchSize: 3}; assert isDone === false and continueCursor is non-empty; call batch2 {cursor: batch1.continueCursor, batchSize: 3}; assert batch2.continueCursor !== batch1.continueCursor
    - MUST_OBSERVE: batch1.isDone === false (10 rows, batchSize 3 → more remain); batch1.continueCursor is a non-empty opaque string; batch2.continueCursor !== batch1.continueCursor (cursor advanced); batch1.normalized + batch2.normalized < 10 OR a third batch is needed
    - MUST_NOT_OBSERVE: batch1.isDone === true when 10 rows exist and batchSize is 3; batch1.continueCursor is null/empty/'null'; batch2.continueCursor === batch1.continueCursor (cursor did not advance); batch2.normalized === 0 when rows remain un-normalized

### AC-3 — Driver script loops until isDone with cursor continuation

**Requirement:** GIVEN the operator driver script scripts/hygiene-curated-routes.ts WHEN invoked as `pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores` THEN the script loops calling normalizeEditorialScores with a continuation cursor until isDone, accumulates scanned/normalized totals across batches, and prints a final summary. The script accepts --cursor=X for resuming and --batchSize=N for controlling batch size.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment + driver script execution via pnpm tsx
- FLOW_REF: F-3
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t driver-loop`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a driver that calls the handler once and exits — would only process the first batch; a driver that does not pass the continuation cursor between batches; a driver that has no loop at all
- EVIDENCE: `cli_output` (required_capture: true)
- CASE 1 — start_ref `paginated_score_seed`
    - ACTION (cli_user): seed 10 rows; run `pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --batchSize=2`; capture stdout; query all 10 test rows
    - MUST_OBSERVE: driver stdout contains evidence of a cursor loop (multiple batch lines or while-loop indicator); driver stdout contains a final totals summary; all 10 test rows have compositeScore ≤ 1.0; driver accepts --batchSize=N and --cursor=X flags
    - MUST_NOT_OBSERVE: driver processes only a single batch and exits when isDone === false; driver crashes on the {continueCursor, isDone} response shape; driver loses the cursor between iterations

### AC-4 — DryRun/committed consistency across batch sizes

**Requirement:** GIVEN 10 out-of-scale test rows seeded fresh WHEN normalizeEditorialScores is run with {dryRun: true} in a cursor loop with batchSize:3 THEN the total normalized count across all dryRun batches equals the total from a subsequent committed multi-batch run with the same batchSize. No row is modified by the dryRun. The total is identical when batchSize is changed to 100 (single batch).

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: F-3
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dryrun-committed-consistency`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a handler that writes during dryRun; a handler that skips rows when batchSize is small; a handler that double-counts rows across batches in dryRun
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `paginated_score_seed`
    - ACTION (cli_user): seed 10 rows; run dryRun multi-batch (batchSize:3) → capture totalDryRunNormalized; verify no rows changed; run committed multi-batch (batchSize:3) → capture totalCommittedNormalized; teardown + reseed; run committed single-batch (batchSize:100)
    - MUST_OBSERVE: totalDryRunNormalized === 10; all 10 rows unchanged after dryRun (compositeScore still > 1.0); totalCommittedNormalized === totalDryRunNormalized; single-batch (batchSize:100) normalized === 10 === multi-batch (batchSize:3) total; final committed: all 10 rows compositeScore ≤ 1.0
    - MUST_NOT_OBSERVE: any row modified by the dryRun pass; totalDryRunNormalized !== totalCommittedNormalized; batchSize:3 total !== batchSize:100 total; totalDryRunNormalized > 10 (double-counting)

### AC-5 — Backward compatibility: bare args and existing S3-T1 tests

**Requirement:** GIVEN the existing S3-T1 integration test suite and the existing 3-row seedEditorialScoreRows fixture WHEN normalizeEditorialScores is called with {} (no cursor, no batchSize — bare args) THEN the handler still processes all out-of-scale test rows, returns {scanned, normalized, continueCursor, isDone}, and all existing S3-T1 integration test assertions pass without modification.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: F-3
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a handler that throws when cursor or batchSize is absent; a handler that changes the return type to exclude scanned or normalized; a handler that requires cursor as non-optional; a handler whose default batchSize is 0 or negative
- EVIDENCE: `test_result` (required_capture: true)
- CASE 1 — start_ref `existing_s3t1_seed`
    - ACTION (cli_user): run existing S3-T1 suite; teardown + seed 3 editorial score rows; call normalizeEditorialScores with bare {}; call with {routeIdPrefix: 'test:hyg-score-'} (existing pattern)
    - MUST_OBSERVE: all 4 existing S3-T1 describe blocks pass without modification; bare {} call returns {scanned, normalized, continueCursor, isDone} — no error; response.normalized === 3 on first bare call; response.continueCursor is a string; response.isDone === true (3 rows < default batchSize of 100); second call returns normalized === 0 (idempotency)
    - MUST_NOT_OBSERVE: any existing S3-T1 test failure; TypeError or Convex validation error when calling with bare {}; missing scanned or normalized fields; normalized count differs from pre-change S3-T1 behavior

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Multi-batch full-catalog: 10 rows, batchSize:3, cursor loop → all 10 normalized across >= 2 batches | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t multi-batch-pagination` |
| TC-2 | Cursor continuation: batch1 isDone:false + non-empty continueCursor, batch2 cursor advanced, cumulative increases | AC-2 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t cursor-continuation` |
| TC-3 | Driver loop: script loops until isDone, accumulates totals, accepts --cursor and --batchSize | AC-3 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t driver-loop` |
| TC-4 | DryRun/committed consistency: dryRun multi-batch === committed multi-batch === committed single-batch; dryRun writes nothing | AC-4 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dryrun-committed-consistency` |
| TC-5 | Backward compatibility: existing S3-T1 suite passes unmodified; bare {} returns {scanned, normalized, continueCursor, isDone} | AC-5 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` |
| TC-6 | In-scale control row: across all batches, compositeScore remains 0.85 (not divided to 0.0085) | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t multi-batch-pagination` |
| TC-7 | Type safety: pnpm type-check passes with new cursor/batchSize args and continueCursor/isDone return fields | AC-1 | `pnpm type-check` |
| TC-8 | Convex build: pnpm convex:dev --once succeeds — validators for cursor and batchSize accepted | AC-5 | `pnpm convex:dev --once` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryHygiene.ts (MODIFY — replace unbounded .collect() scans with .paginate({cursor, numItems}); add continueCursor/isDone to response; add cursor/batchSize to args)
- scripts/hygiene-curated-routes.ts (MODIFY — add while(!isDone) cursor loop with accumulated totals; accept --cursor and --batchSize flags)
- convex/__tests__/curatedGeometryHygiene.integration.test.ts (MODIFY — add multi-batch pagination, cursor continuation, driver loop, dryRun/committed consistency, backward-compat cases)
- convex/curatedGeometryTestSupport.ts (MODIFY — add seedPaginatedScoreRows for ≥10 paginated test rows + inscale control)

**writeProhibited:**
- convex/schema.ts - indexes already sufficient (by_composite_score exists)
- convex/_generated/** - auto-generated
- convex/actions/agent/** - unrelated agent code
- react-native/**, app/** - backend-only
- .spec/** - task definitions are read-only
- shared/**, tokens/** - unrelated

## READING LIST

- `convex/curatedGeometry.ts:176-234` — listForGeometryBackfill: the canonical .paginate({cursor, numItems}) pattern with by_composite_score index
- `convex/curatedGeometryQa.ts:57-89` — listGeneratedForQa: .paginate() with filter
- `scripts/backfill-curated-geometry.ts:218-268` — runFullBackfill: the while(!isDone) cursor-loop with accumulated totals
- `convex/db/curation.ts:72-101` — v.string()/v.boolean() validators for continueCursor/isDone
- `convex/curatedGeometryHygiene.ts` — the current unpaginated normalizeEditorialScores handler
- `convex/curatedGeometryTestSupport.ts:427-527` — existing seed/teardown helpers to extend
- `convex/__tests__/curatedGeometryHygiene.integration.test.ts` — existing S3-T1 test harness

## CODE PATTERN

- Pattern: // Convex .paginate() cursor loop
const page = await ctx.db
  .query('curated_routes')
  .withIndex('by_composite_score', (q) => q.gt('compositeScore', 1))
  .paginate({ cursor: args.cursor ?? null, numItems: args.batchSize ?? 100 })
// process page.page rows...
return {
  scanned, normalized,
  continueCursor: page.continueCursor,
  isDone: page.isDone,
}
// driver: while (!isDone) { res = run(fn, {cursor, batchSize}); total += res.normalized; cursor = res.continueCursor; if(res.isDone) break; }
- Pattern source: `convex/curatedGeometry.ts:181-233 (listForGeometryBackfill) + scripts/backfill-curated-geometry.ts:218-256 (runFullBackfill loop)`
- Anti-pattern: Using .collect() to read the entire matching result set into memory in one transaction — hits Convex's per-transaction documents-read limit on the 5,757-row production catalog. Also: constructing a cursor manually from _creationTime/_id — Convex .paginate() cursors are opaque strings.

## VERIFICATION GATES

- Integration tests pass: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` → Exit 0
- Typecheck: `pnpm type-check` → Exit 0
- Lint: `pnpm exec biome check` → Exit 0
- Convex build: `pnpm convex:dev --once` → Exit 0

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — This task modifies Convex internal mutations, test support seeders, and an operator driver script — all TypeScript backend code within convex/ and scripts/. The change touches validators, query pagination, and CLI driver logic, requiring Convex-specific knowledge of the .paginate() API and per-transaction read limits.
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
  "task_id": "REDHAT-FIX-004",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "paginated_score_seed": {
      "description": "10 curated_routes rows with out-of-scale (0-100) composite + dimension scores, routeId prefix 'test:hyg-pag-'. With batchSize=3, ceil(10/3)=4 batches are needed.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-pag-01 compositeScore=95 dimensions on 0-100 scale",
        "curated_routes routeId=test:hyg-pag-02 compositeScore=88 dimensions on 0-100 scale",
        "curated_routes routeId=test:hyg-pag-03 compositeScore=92 dimensions on 0-100 scale",
        "curated_routes routeId=test:hyg-pag-04 compositeScore=76 dimensions on 0-100 scale",
        "curated_routes routeId=test:hyg-pag-05 compositeScore=84 dimensions on 0-100 scale",
        "curated_routes routeId=test:hyg-pag-06 compositeScore=98 dimensions on 0-100 scale",
        "curated_routes routeId=test:hyg-pag-07 compositeScore=70 dimensions on 0-100 scale",
        "curated_routes routeId=test:hyg-pag-08 compositeScore=82 dimensions on 0-100 scale",
        "curated_routes routeId=test:hyg-pag-09 compositeScore=94 dimensions on 0-100 scale",
        "curated_routes routeId=test:hyg-pag-10 compositeScore=86 dimensions on 0-100 scale"
      ]
    },
    "inscale_control_row": {
      "description": "1 curated_routes row with in-scale (0-1) composite score, routeId 'test:hyg-pag-inscale'. Seeded alongside paginated_score_seed to verify in-scale rows are scanned but NOT normalized across batches.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-pag-inscale compositeScore=0.85 all dimensions \u22641"
      ]
    },
    "existing_s3t1_seed": {
      "description": "The existing 3-row seedEditorialScoreRows fixture \u2014 reused to verify backward compatibility of S3-T1 ACs after the pagination change.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-score-90 compositeScore=90",
        "curated_routes routeId=test:hyg-score-72 compositeScore=72",
        "curated_routes routeId=test:hyg-score-85 compositeScore=85"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN 10 curated_routes rows with out-of-scale composite scores (test:hyg-pag-01 through test:hyg-pag-10) seeded WHEN normalizeEditorialScores is called with {cursor: null, batchSize: 3, routeIdPrefix: 'test:hyg-pag-'} in a loop until isDone THEN all 10 rows have compositeScore \u22641.0 and scoreScaleNormalizedAt stamped, and the sum of per-batch normalized counts equals 10",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t multi-batch-pagination",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment \u2014 real curated_routes rows seeded via curatedGeometryTestSupport",
        "negative_control": {
          "would_fail_if": [
            "a stub that returns {scanned:0, normalized:0, continueCursor:'', isDone:true} without reading the table \u2014 all 10 rows would remain at compositeScore > 1.0",
            "a no-pagination implementation that still uses .collect() \u2014 would process all 10 in one batch (isDone:true immediately)",
            "a handler that ignores the cursor and always scans from the start \u2014 would normalize the same first 3 rows on every batch, leaving rows 4-10 un-normalized",
            "a handler that advances the cursor but skips the routeIdPrefix filter \u2014 would count non-test rows in normalized"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "paginated_score_seed",
            "action": {
              "actor": "cli_user",
              "steps": [
                "teardown + seed 10 paginated test rows",
                "call normalizeEditorialScores {cursor: null, batchSize: 3, routeIdPrefix: 'test:hyg-pag-'}",
                "loop calling with response.continueCursor until isDone === true, accumulating totalNormalized",
                "query all 10 rows via getTestRoute"
              ]
            },
            "end_state": {
              "must_observe": [
                "all 10 rows have compositeScore \u2264 1.0",
                "all 10 rows have scoreScaleNormalizedAt defined",
                "totalNormalized === 10",
                "batchCount >= 2",
                "every response includes continueCursor and isDone",
                "final batch has isDone === true"
              ],
              "must_not_observe": [
                "any test row with compositeScore > 1.0 after the full multi-batch run",
                "totalNormalized < 10 (rows skipped)",
                "totalNormalized > 10 (rows double-counted)",
                "a batch with isDone === true while rows remain un-normalized"
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
      "description": "GIVEN 10 out-of-scale test rows seeded WHEN normalizeEditorialScores is called with {cursor: null, batchSize: 3} THEN the response has isDone:false and a non-empty continueCursor. A second call with the continuation cursor processes a different subset of rows",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t cursor-continuation",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "a handler that always returns isDone:true regardless of remaining rows",
            "a handler that returns a null/empty continueCursor when more rows exist",
            "a handler that ignores the cursor and always processes the same first page"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "paginated_score_seed",
            "action": {
              "actor": "cli_user",
              "steps": [
                "seed 10 rows",
                "call batch1 {cursor: null, batchSize: 3}",
                "assert isDone === false and continueCursor is non-empty",
                "call batch2 {cursor: batch1.continueCursor, batchSize: 3}",
                "assert batch2.continueCursor !== batch1.continueCursor"
              ]
            },
            "end_state": {
              "must_observe": [
                "batch1.isDone === false (10 rows, batchSize 3 \u2192 more remain)",
                "batch1.continueCursor is a non-empty opaque string",
                "batch2.continueCursor !== batch1.continueCursor (cursor advanced)",
                "batch1.normalized + batch2.normalized < 10 OR a third batch is needed"
              ],
              "must_not_observe": [
                "batch1.isDone === true when 10 rows exist and batchSize is 3",
                "batch1.continueCursor is null/empty/'null'",
                "batch2.continueCursor === batch1.continueCursor (cursor did not advance)",
                "batch2.normalized === 0 when rows remain un-normalized"
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
      "description": "GIVEN the operator driver script WHEN invoked as pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores THEN the script loops calling normalizeEditorialScores with a continuation cursor until isDone, accumulates totals, and accepts --cursor=X and --batchSize=N",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t driver-loop",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment + driver script execution via pnpm tsx",
        "negative_control": {
          "would_fail_if": [
            "a driver that calls the handler once and exits \u2014 would only process the first batch",
            "a driver that does not pass the continuation cursor between batches",
            "a driver that has no loop at all"
          ]
        },
        "evidence": {
          "artifact_type": "cli_output",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "paginated_score_seed",
            "action": {
              "actor": "cli_user",
              "steps": [
                "seed 10 rows",
                "run pnpm tsx scripts/hygiene-curated-routes.ts normalize-scores --batchSize=2",
                "capture stdout",
                "query all 10 test rows"
              ]
            },
            "end_state": {
              "must_observe": [
                "driver stdout contains evidence of a cursor loop (multiple batch lines or while-loop indicator)",
                "driver stdout contains a final totals summary",
                "all 10 test rows have compositeScore \u2264 1.0",
                "driver accepts --batchSize=N and --cursor=X flags"
              ],
              "must_not_observe": [
                "driver processes only a single batch and exits when isDone === false",
                "driver crashes on the {continueCursor, isDone} response shape",
                "driver loses the cursor between iterations"
              ]
            }
          }
        ],
        "id": "AC-3",
        "primary": false
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN 10 out-of-scale test rows seeded fresh WHEN normalizeEditorialScores is run with {dryRun: true} in a cursor loop with batchSize:3 THEN the total normalized count across all dryRun batches equals the committed multi-batch total, which equals the committed single-batch (batchSize:100) total. No row is modified by the dryRun.",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dryrun-committed-consistency",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "a handler that writes during dryRun",
            "a handler that skips rows when batchSize is small",
            "a handler that double-counts rows across batches in dryRun"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "paginated_score_seed",
            "action": {
              "actor": "cli_user",
              "steps": [
                "seed 10 rows",
                "run dryRun multi-batch (batchSize:3) \u2192 capture totalDryRunNormalized",
                "verify no rows changed (compositeScore still > 1.0)",
                "run committed multi-batch (batchSize:3) \u2192 capture totalCommittedNormalized",
                "teardown + reseed 10 rows",
                "run committed single-batch (batchSize:100)"
              ]
            },
            "end_state": {
              "must_observe": [
                "totalDryRunNormalized === 10",
                "all 10 rows unchanged after dryRun (compositeScore still > 1.0)",
                "totalCommittedNormalized === totalDryRunNormalized",
                "single-batch (batchSize:100) normalized === 10 === multi-batch (batchSize:3) total",
                "final committed: all 10 rows compositeScore \u2264 1.0"
              ],
              "must_not_observe": [
                "any row modified by the dryRun pass",
                "totalDryRunNormalized !== totalCommittedNormalized",
                "batchSize:3 total !== batchSize:100 total",
                "totalDryRunNormalized > 10 (double-counting)"
              ]
            }
          }
        ],
        "id": "AC-4",
        "primary": false
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the existing S3-T1 integration test suite WHEN normalizeEditorialScores is called with {} (bare args) THEN the handler still processes all out-of-scale test rows, returns {scanned, normalized, continueCursor, isDone}, and all existing S3-T1 assertions pass without modification",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment \u2014 existing S3-T1 integration test suite + bare-args invocation",
        "negative_control": {
          "would_fail_if": [
            "a handler that throws when cursor or batchSize is absent (missing v.optional)",
            "a handler that changes the return type to exclude scanned or normalized",
            "a handler that requires cursor as non-optional",
            "a handler whose default batchSize is 0 or negative"
          ]
        },
        "evidence": {
          "artifact_type": "test_result",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "existing_s3t1_seed",
            "action": {
              "actor": "cli_user",
              "steps": [
                "run existing S3-T1 suite",
                "teardown + seed 3 editorial score rows",
                "call normalizeEditorialScores with bare {}",
                "call with {routeIdPrefix: 'test:hyg-score-'} (existing pattern)"
              ]
            },
            "end_state": {
              "must_observe": [
                "all 4 existing S3-T1 describe blocks pass without modification",
                "bare {} call returns {scanned, normalized, continueCursor, isDone} \u2014 no error",
                "response.normalized === 3 on first bare call",
                "response.continueCursor is a string",
                "response.isDone === true (3 rows < default batchSize of 100)",
                "second call returns normalized === 0 (idempotency)"
              ],
              "must_not_observe": [
                "any existing S3-T1 test failure",
                "TypeError or Convex validation error when calling with bare {}",
                "missing scanned or normalized fields",
                "normalized count differs from pre-change S3-T1 behavior"
              ]
            }
          }
        ],
        "id": "AC-5",
        "primary": false
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "Multi-batch full-catalog: 10 rows, batchSize:3, cursor loop \u2192 all 10 normalized across >= 2 batches",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t multi-batch-pagination"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "Cursor continuation: batch1 isDone:false + non-empty continueCursor, batch2 cursor advanced",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t cursor-continuation"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "Driver loop: script loops until isDone, accumulates totals, accepts --cursor and --batchSize",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t driver-loop"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "DryRun/committed consistency across batch sizes; dryRun writes nothing",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t dryrun-committed-consistency"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-5",
      "description": "Backward compatibility: existing S3-T1 suite passes; bare {} returns continueCursor and isDone",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "In-scale control row: across all batches, compositeScore remains 0.85 (not divided)",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t multi-batch-pagination"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "Type safety: pnpm type-check passes with new cursor/batchSize args and continueCursor/isDone return fields",
      "verify": "pnpm type-check"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-5",
      "description": "Convex build: pnpm convex:dev --once succeeds \u2014 validators accepted",
      "verify": "pnpm convex:dev --once"
    }
  ]
}
-->
</details>
