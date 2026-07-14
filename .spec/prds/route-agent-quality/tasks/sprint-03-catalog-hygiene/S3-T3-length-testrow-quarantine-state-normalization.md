# S3-T3 — Length + test/seed-row quarantine + idempotent state-string normalization (UC-HYG-03, UC-HYG-04)

| Field | Value |
|-------|-------|
| TASK_ID | S3-T3 |
| SPRINT | [Sprint 03 — Catalog hygiene](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | — (N/A: deterministic at-rest cleanup) |
| DEPENDS_ON | S3-T1 |
| BLOCKS | sprint-04 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

fixLengthOutliers quarantines ≤0 (zero_length, length nulled) and >1000mi (length_outlier) rows; quarantineTestRows flags name-pattern test rows (test_row); quarantined rows recompute riderReady=false; a recovered sane routed length clears the length quarantine; normalizeStates canonicalizes dirty strings into statesAll (ordered, stateRaw preserved) and is a no-op on a second pass; every pass has a {dryRun?} preview that writes nothing.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Read convex/_generated/ai/guidelines.md first.
- fixLengthOutliers: lengthMiles ≤0 → null the claimed length + quarantine.reason='zero_length'; lengthMiles >1000mi → quarantine.reason='length_outlier'. Each mutation is {dryRun?}-previewable.
- quarantineTestRows: name-pattern test/seed rows (e.g. 'Test Route CO-04') → quarantine.reason='test_row'. {dryRun?}-previewable.
- normalizeStates: canonicalize state strings (reuse convex/util/dataNormalization.ts normalizeState); represent a multi-state route as an ORDERED set in the EXISTING statesAll field, preserve the original in stateRaw, set state=primary canonical. Idempotent + {dryRun?}-previewable.
- Hook the EXISTING recomputeRiderReadyForRoute so quarantined rows recompute riderReady=false (quarantine is already a predicate input in computeRiderReadyFromDoc).
- Auto-clear a zero_length quarantine when a sane routed length is written through the existing persistGeometryVerified/recompute path (real mutation), storing the routed length as truth.
- Seed length/test-row/dirty-state rows via curatedGeometryTestSupport (extend it); assert PERSISTED values from a direct table query.

**NEVER**
- Never collapse a multi-state route to a single state — statesAll keeps the ordered set.
- Never store a quarantine.reason outside the schema union ('zero_length'|'length_outlier'|'test_row').
- Never let a quarantined row recompute riderReady=true; never let a rider-ready row report length ≤0 or >1000mi.
- Never edit convex/schema.ts (statesAll/stateRaw/quarantine already present — NO new field needed), convex/actions/agent/**, or the RN app; never rebuild the recompute predicate.
- Never divide-normalize a state string that is already canonical (idempotent); never report complete while any hygiene mutation lacks {dryRun?}.

**STRICTLY**
- Length quarantine bands: ≤0 (zero_length, claimed length nulled) and >1000mi (length_outlier); in-range lengths untouched.
- State canonicalization: hyphen/underscore/whitespace → single-spaced title case (normalizeState); 'North-Carolina' and 'North Carolina' unify.
- normalizeStates idempotent: a second pass over canonical strings reports changed == 0.

## DONE WHEN

- AC-1 [PRIMARY]: the ≤0 row is flagged quarantine.reason='zero_length' with its claimed length nulled, the >1000mi row is flagged quarantine.reason='length_outlier', the dry-run writes nothing, and a second committed run flags 0 new rows
- AC-2: it is flagged quarantine.reason='test_row' and the dry-run writes nothing
- AC-3: no quarantined row has riderReady=true and no rider-ready row reports length ≤0 or >1000mi
- AC-4: the length quarantine clears and the stored length equals the routed length within the sane range
- AC-5: each is canonicalized (state='New York'/'North Carolina'), the tri-state row keeps an ordered statesAll=['Alabama','Mississippi','Tennessee'] with stateRaw preserved, variant pairs unify, and the dry-run writes nothing
- AC-6: the first run reports changed>0 and the second reports changed==0, and the already-canonical 'North Carolina' control is never modified
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `pnpm type-check` clean + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Add fixLengthOutliers, quarantineTestRows, and normalizeStates to curatedGeometryHygiene.ts: quarantine length outliers/zero-length/test rows with recorded reasons (excluded from rider-ready, auto-cleared on recovery) and canonicalize dirty state strings into the existing statesAll ordered set — each dry-run-previewable and idempotent.

**Success state:** fixLengthOutliers quarantines ≤0 (zero_length, length nulled) and >1000mi (length_outlier) rows; quarantineTestRows flags name-pattern test rows (test_row); quarantined rows recompute riderReady=false; a recovered sane routed length clears the length quarantine; normalizeStates canonicalizes dirty strings into statesAll (ordered, stateRaw preserved) and is a no-op on a second pass; every pass has a {dryRun?} preview that writes nothing.

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `length_outlier_rows` (seed_method: `public_api`): One row lengthMiles=0 (→ zero_length, claimed length nulled) and one row lengthMiles=5000 (→ length_outlier); both otherwise rider-ready-eligible to prove exclusion.
    - curated_routes routeId=test:hyg-len-zero lengthMiles=0 seeded via curatedGeometryTestSupport
    - curated_routes routeId=test:hyg-len-5000 lengthMiles=5000 seeded via curatedGeometryTestSupport
- `test_seed_rows` (seed_method: `public_api`): One row named 'Test Route CO-04' matching the test/seed name pattern (→ test_row).
    - curated_routes routeId=test:hyg-testrow name='Test Route CO-04' seeded via curatedGeometryTestSupport
- `length_recovery_row` (seed_method: `public_api`): A zero_length-quarantined row with null claimed length that will receive a sane 22.0-mi routed length via the real persistGeometryVerified path to prove auto-clear.
    - curated_routes routeId=test:hyg-len-recover lengthMiles=0 quarantine reason='zero_length' seeded via curatedGeometryTestSupport
- `dirty_state_rows` (seed_method: `public_api`): Rows with dirty state strings: 'New-York', 'North-Carolina', 'Alabama / Mississippi / Tennessee' (tri-state), plus a control already-canonical 'North Carolina'.
    - curated_routes routeId=test:hyg-state-ny state='New-York'
    - curated_routes routeId=test:hyg-state-nc state='North-Carolina'
    - curated_routes routeId=test:hyg-state-tri state='Alabama / Mississippi / Tennessee'
    - curated_routes routeId=test:hyg-state-canon state='North Carolina' (control, already canonical)

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Length quarantine with reasons; zero-length nulled; dry-run + idempotent

**Requirement:** GIVEN rows with lengthMiles ≤0 and >1000mi WHEN fixLengthOutliers runs THEN the ≤0 row is flagged quarantine.reason='zero_length' with its claimed length nulled, the >1000mi row is flagged quarantine.reason='length_outlier', the dry-run writes nothing, and a second committed run flags 0 new rows

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-03
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t length-quarantine`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the quarantine object is never stored so a zero-length row is a static pass (mutation stub/no-op); the zero-length row's claimed length is left statically at 0 instead of nulled; the >1000mi row is not flagged because the outlier branch is a no-op; the dry-run branch writes the quarantine anyway (no-op guard); flagged/zeroed counts are hardcoded constants (stub) rather than counted; re-running flags already-quarantined rows because the idempotency guard is a no-op
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `length_outlier_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:fixLengthOutliers '{"dryRun":true}'; query both rows to confirm no quarantine was written; npx convex run curatedGeometryHygiene:fixLengthOutliers '{}' (committed); query both rows and read {zeroed,flagged}
    - MUST_OBSERVE: after the dry-run both rows have quarantine == null (unwritten); committed zeroed == 1 (the ≤0 row); committed flagged == 2 (zero_length + length_outlier); test:hyg-len-zero quarantine.reason == 'zero_length' and its claimed lengthMiles is nulled; test:hyg-len-5000 quarantine.reason == 'length_outlier'
    - MUST_NOT_OBSERVE: quarantine set after the dry-run; test:hyg-len-zero still lengthMiles == 0 with no quarantine; test:hyg-len-5000 quarantine == null
- CASE 2 — start_ref `length_outlier_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:fixLengthOutliers '{}' (second committed run); read {flagged} and re-query both rows
    - MUST_OBSERVE: second-run flagged == 0 (no-op / nothing new to quarantine)
    - MUST_NOT_OBSERVE: second-run flagged == 2 (the first-run count repeated — start value re-applied); quarantine.flaggedAt overwritten on an already-quarantined row (mutated from the committed start state); second-run flagged is a non-zero count instead of 0 (the no-op re-run must report 0 newly-quarantined rows, nothing re-flagged)

### AC-2 — Test/seed-row quarantine (test_row); dry-run writes nothing

**Requirement:** GIVEN a row named 'Test Route CO-04' WHEN quarantineTestRows runs THEN it is flagged quarantine.reason='test_row' and the dry-run writes nothing

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-03
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t test-row-quarantine`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the test-row name pattern is never matched so the row is a static pass (the matcher is a no-op stub); quarantine.reason is stored as a constant other than 'test_row' (static); the dry-run branch writes the quarantine anyway (no-op guard); flagged is a hardcoded constant (stub) rather than counted
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `test_seed_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:quarantineTestRows '{"dryRun":true}'; query the row to confirm no write; npx convex run curatedGeometryHygiene:quarantineTestRows '{}' (committed); query the row and read {flagged}
    - MUST_OBSERVE: after the dry-run quarantine == null; committed flagged == 1; test:hyg-testrow quarantine.reason == 'test_row'
    - MUST_NOT_OBSERVE: quarantine set after the dry-run; quarantine.reason != 'test_row'; quarantine still absent/null after the committed run (flagged == 0 — nothing matched, unchanged start state)

### AC-3 — Quarantined rows excluded from rider-ready invariant

**Requirement:** GIVEN quarantined rows WHEN recomputeRiderReady runs over them THEN no quarantined row has riderReady=true and no rider-ready row reports length ≤0 or >1000mi

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (fixLengthOutliers + quarantineTestRows + recomputeRiderReadyForRoute over real seeded rows)
- FLOW_REF: UC-HYG-03
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t rider-ready-exclusion`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: recomputeRiderReady is a no-op so a quarantined row stays riderReady=true (mock/stub predicate); quarantine is not read by the predicate (disconnect) so a flagged row is still rider-ready; the rider-ready invariant reads a hardcoded/empty result set (static) instead of the real seeded rows
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `length_outlier_rows`
    - ACTION (cli_user): run fixLengthOutliers '{}' and quarantineTestRows '{}' (committed); run recomputeRiderReadyForRoute on each seeded row; query riderReady + lengthMiles + quarantine for each
    - MUST_OBSERVE: every quarantined seeded row riderReady == false; 0 rider-ready seeded rows with lengthMiles ≤ 0 or > 1000
    - MUST_NOT_OBSERVE: a quarantined row riderReady == true (unchanged pre-recompute value); a rider-ready row lengthMiles == 0 or > 1000

### AC-4 — Length quarantine auto-clears on recovered geometry

**Requirement:** GIVEN a zero_length-quarantined null-length row WHEN a sane measured routed length is written through persistGeometryVerified/recompute THEN the length quarantine clears and the stored length equals the routed length within the sane range

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real persistGeometryVerified + recomputeRiderReadyForRoute over a seeded quarantined row)
- FLOW_REF: UC-HYG-03
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t length-recovery`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the quarantine never clears after a sane length is measured (the auto-clear branch is a no-op stub); the recovered length is not stored (still null/0) so there is no measured truth (the write is a no-op); the quarantine clears but lengthMiles stays statically at 0 (partial stub); recomputeRiderReady is disconnected from the cleared quarantine so the row is left in its start state
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `length_recovery_row`
    - ACTION (cli_user): run fixLengthOutliers '{}' to quarantine the null-length row; write a sane 22.0-mi routed length through persistGeometryVerified (real mutation) then recomputeRiderReadyForRoute; query the row
    - MUST_OBSERVE: test:hyg-len-recover quarantine == null after recovery (cleared); stored lengthMiles == 22.0 (routed truth) within [0,1000]
    - MUST_NOT_OBSERVE: quarantine.reason == 'zero_length' still set after a sane length is measured (unchanged start state); lengthMiles == 0 or null after recovery (nothing written)

### AC-5 — State canonicalization + multi-state ordered set in statesAll

**Requirement:** GIVEN dirty state strings ('New-York', 'North-Carolina', 'Alabama / Mississippi / Tennessee') WHEN normalizeStates runs THEN each is canonicalized (state='New York'/'North Carolina'), the tri-state row keeps an ordered statesAll=['Alabama','Mississippi','Tennessee'] with stateRaw preserved, variant pairs unify, and the dry-run writes nothing

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-04
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t state-normalize`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the hyphenated 'North-Carolina' is left statically dirty (the canonicalizer is a no-op stub); the tri-state string is collapsed to a single state because the split is a no-op; statesAll is written as an empty/static array or drops a state; the dry-run branch writes the canonical strings anyway (no-op guard); changed-count is a hardcoded constant (stub) rather than counted
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `dirty_state_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:normalizeStates '{"dryRun":true}'; query the rows to confirm no write; npx convex run curatedGeometryHygiene:normalizeStates '{}' (committed); query the rows
    - MUST_OBSERVE: after the dry-run test:hyg-state-nc state still == 'North-Carolina' (unwritten); committed: test:hyg-state-ny state == 'New York'; committed: test:hyg-state-nc state == 'North Carolina'; test:hyg-state-tri statesAll == ['Alabama','Mississippi','Tennessee'] (ordered, length 3); test:hyg-state-tri stateRaw == 'Alabama / Mississippi / Tennessee' (original preserved)
    - MUST_NOT_OBSERVE: state written during the dry-run; test:hyg-state-nc state == 'North-Carolina' (unchanged start value) after the committed run; test:hyg-state-tri collapsed to a single state (statesAll length 1); statesAll absent/empty on the tri-state row (nothing written)

### AC-6 — State normalization idempotent; canonical control untouched

**Requirement:** GIVEN a catalog whose dirty state strings were normalized by a first pass, plus an already-canonical control WHEN normalizeStates runs twice THEN the first run reports changed>0 and the second reports changed==0, and the already-canonical 'North Carolina' control is never modified

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)
- FLOW_REF: UC-HYG-04
- VERIFY: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t state-idempotent`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the second run reports changed>0 because the idempotency guard is a no-op (re-normalizes canonical strings); the already-canonical 'North Carolina' control row is modified by a stub that rewrites every row; changed-count is a hardcoded constant (stub) so the no-op second run still reports >0
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `dirty_state_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:normalizeStates '{}' (first committed pass); read {changed}
    - MUST_OBSERVE: first-run changed >= 3 (the three dirty rows) — non-degenerate
    - MUST_NOT_OBSERVE: first-run changed == 0 (no-op / nothing detected)
- CASE 2 — start_ref `dirty_state_rows`
    - ACTION (cli_user): npx convex run curatedGeometryHygiene:normalizeStates '{}' (second committed pass); read {changed}; query the control row test:hyg-state-canon
    - MUST_OBSERVE: second-run changed == 0 (no-op / nothing left to normalize); test:hyg-state-canon state == 'North Carolina' (unmodified)
    - MUST_NOT_OBSERVE: second-run changed > 0 (canonical strings re-normalized — first-run count repeated); test:hyg-state-canon state changed from its 'North Carolina' start value

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | fixLengthOutliers flags ≤0 rows zero_length with claimed length nulled and >1000mi rows length_outlier; the dry-run writes nothing and a second run flags 0 | AC-1 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t length-quarantine` |
| TC-2 | quarantineTestRows flags a 'Test Route CO-04' row with reason test_row and the dry-run writes nothing | AC-2 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t test-row-quarantine` |
| TC-3 | No quarantined row recomputes riderReady true and no rider-ready row reports length ≤0 or >1000mi | AC-3 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t rider-ready-exclusion` |
| TC-4 | A zero_length-quarantined null-length row clears its quarantine when a sane routed length is written and stores the routed length | AC-4 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t length-recovery` |
| TC-5 | normalizeStates canonicalizes hyphenated state strings and preserves a tri-state ordered set in statesAll with stateRaw; the dry-run writes nothing | AC-5 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t state-normalize` |
| TC-6 | A second normalizeStates pass reports changed 0 and the already-canonical control row is unmodified | AC-6 | `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t state-idempotent` |
| TC-7 | SUPPLEMENTARY pure-unit (UNIT_TEST_JUSTIFIED: pure string logic, zero I/O): the state canonicalizer splits a delimiter-joined string into an ordered canonical set and unifies hyphen/space variants | AC-5 | `pnpm test convex/__tests__/curatedGeometryHygiene.unit.test.ts -t canonicalize` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryHygiene.ts (MODIFY — add fixLengthOutliers, quarantineTestRows, normalizeStates; reuse the S3-T1 {dryRun?} helper)
- scripts/hygiene-curated-routes.ts (MODIFY — add --length, --test-rows, --states subcommands)
- convex/__tests__/curatedGeometryHygiene.integration.test.ts (MODIFY — add quarantine + state cases)
- convex/__tests__/curatedGeometryHygiene.unit.test.ts (MODIFY — pure state canonicalizer/ordered-set unit)
- convex/curatedGeometryTestSupport.ts (MODIFY — length/test-row/dirty-state seed shapes)

**writeProhibited:**
- convex/schema.ts - statesAll/stateRaw/quarantine already present; NO new field/index (multi-state uses existing statesAll)
- convex/curatedGeometry.ts computeRiderReadyFromDoc/persistGeometryVerified internals - HOOK only, do not rebuild the predicate or persist seam
- convex/actions/agent/** - out of scope
- app/**, components/** - no UI in this sprint
- .spec/** - planning docs are read-only
- unrelated Convex modules

## READING LIST

- `convex/util/dataNormalization.ts` (1-42) — normalizeState + stateVariants to REUSE for canonicalization + region-check equivalence
- `shared/models/curated-routes.ts` (208-213,255-256) — quarantine union already present; statesAll (ordered array) + stateRaw already present — the multi-state representation, NO new schema field
- `convex/curatedGeometry.ts` (406-508) — computeRiderReadyFromDoc (quarantine already an input) + recomputeRiderReadyForRoute + persistGeometryVerified seam to hook for exclusion + auto-clear
- `convex/curatedGeometryTestSupport.ts` (11-107,159-170) — insertTestRoute + seedQuarantinedLengthRow to extend for length/test-row/dirty-state shapes
- `.spec/prds/route-agent-quality/10-technical-requirements/04-api-design.md` (20-22,84-92) — fixLengthOutliers/quarantineTestRows/normalizeStates contracts + the {dryRun?} governance rule

## CODE PATTERN

- Pattern: // multi-state ordered set uses the EXISTING statesAll/stateRaw fields (no schema change)
const parts = raw.split('/').map((s) => normalizeState(s.trim())).filter(Boolean)
const canonical = parts.length > 1
  ? { state: parts[0], statesAll: parts, stateRaw: raw }
  : { state: parts[0], stateRaw: raw }
const changed = canonical.state !== row.state // idempotency guard
if (!dryRun && changed) await ctx.db.patch(row._id, canonical)
- Pattern source: `convex/util/dataNormalization.ts:6-14 (normalizeState) + shared/models/curated-routes.ts:255-256 (statesAll/stateRaw) + convex/curatedGeometry.ts:441-455 (recompute hook)`
- Anti-pattern: Adding a new schema field for multi-state (statesAll exists); collapsing a tri-state to one; a quarantine.reason outside the union; rebuilding computeRiderReadyFromDoc instead of hooking recomputeRiderReadyForRoute; a dry-run that writes.

## VERIFICATION GATES

- Integration tests pass: `pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts` → Exit 0
- Supplementary unit: `pnpm test convex/__tests__/curatedGeometryHygiene.unit.test.ts` → Exit 0
- Typecheck: `pnpm type-check` → Exit 0
- Lint: `pnpm exec biome check` → Exit 0
- Convex build: `pnpm convex:dev --once` → Exit 0

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Pure-Convex backend: extend curatedGeometryHygiene.ts with fixLengthOutliers, quarantineTestRows, and normalizeStates (using the existing statesAll/stateRaw fields for the multi-state ordered set), each {dryRun?}-previewable and idempotent, hooking the existing recomputeRiderReady seam for rider-ready exclusion and length-quarantine auto-clear — verified against the real dev deployment.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: S3-T1
- Blocks: sprint-04

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
  "task_id": "S3-T3",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "length_outlier_rows": {
      "description": "One row lengthMiles=0 (\u2192 zero_length, claimed length nulled) and one row lengthMiles=5000 (\u2192 length_outlier); both otherwise rider-ready-eligible to prove exclusion.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-len-zero lengthMiles=0 seeded via curatedGeometryTestSupport",
        "curated_routes routeId=test:hyg-len-5000 lengthMiles=5000 seeded via curatedGeometryTestSupport"
      ]
    },
    "test_seed_rows": {
      "description": "One row named 'Test Route CO-04' matching the test/seed name pattern (\u2192 test_row).",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-testrow name='Test Route CO-04' seeded via curatedGeometryTestSupport"
      ]
    },
    "length_recovery_row": {
      "description": "A zero_length-quarantined row with null claimed length that will receive a sane 22.0-mi routed length via the real persistGeometryVerified path to prove auto-clear.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-len-recover lengthMiles=0 quarantine reason='zero_length' seeded via curatedGeometryTestSupport"
      ]
    },
    "dirty_state_rows": {
      "description": "Rows with dirty state strings: 'New-York', 'North-Carolina', 'Alabama / Mississippi / Tennessee' (tri-state), plus a control already-canonical 'North Carolina'.",
      "seed_method": "public_api",
      "records": [
        "curated_routes routeId=test:hyg-state-ny state='New-York'",
        "curated_routes routeId=test:hyg-state-nc state='North-Carolina'",
        "curated_routes routeId=test:hyg-state-tri state='Alabama / Mississippi / Tennessee'",
        "curated_routes routeId=test:hyg-state-canon state='North Carolina' (control, already canonical)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "maps_to_ac": null,
      "description": "GIVEN rows with lengthMiles \u22640 and >1000mi WHEN fixLengthOutliers runs THEN the \u22640 row is flagged quarantine.reason='zero_length' with its claimed length nulled, the >1000mi row is flagged quarantine.reason='length_outlier', the dry-run writes nothing, and a second committed run flags 0 new rows",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t length-quarantine",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the quarantine object is never stored so a zero-length row is a static pass (mutation stub/no-op)",
            "the zero-length row's claimed length is left statically at 0 instead of nulled",
            "the >1000mi row is not flagged because the outlier branch is a no-op",
            "the dry-run branch writes the quarantine anyway (no-op guard)",
            "flagged/zeroed counts are hardcoded constants (stub) rather than counted",
            "re-running flags already-quarantined rows because the idempotency guard is a no-op"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "length_outlier_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:fixLengthOutliers '{\"dryRun\":true}'",
                "query both rows to confirm no quarantine was written",
                "npx convex run curatedGeometryHygiene:fixLengthOutliers '{}' (committed)",
                "query both rows and read {zeroed,flagged}"
              ]
            },
            "end_state": {
              "must_observe": [
                "after the dry-run both rows have quarantine == null (unwritten)",
                "committed zeroed == 1 (the \u22640 row)",
                "committed flagged == 2 (zero_length + length_outlier)",
                "test:hyg-len-zero quarantine.reason == 'zero_length' and its claimed lengthMiles is nulled",
                "test:hyg-len-5000 quarantine.reason == 'length_outlier'"
              ],
              "must_not_observe": [
                "quarantine set after the dry-run",
                "test:hyg-len-zero still lengthMiles == 0 with no quarantine",
                "test:hyg-len-5000 quarantine == null"
              ]
            }
          },
          {
            "start_ref": "length_outlier_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:fixLengthOutliers '{}' (second committed run)",
                "read {flagged} and re-query both rows"
              ]
            },
            "end_state": {
              "must_observe": [
                "second-run flagged == 0 (no-op / nothing new to quarantine)"
              ],
              "must_not_observe": [
                "second-run flagged == 2 (the first-run count repeated \u2014 start value re-applied)",
                "quarantine.flaggedAt overwritten on an already-quarantined row (mutated from the committed start state)",
                "second-run flagged is a non-zero count instead of 0 (the no-op re-run must report 0 newly-quarantined rows, nothing re-flagged)"
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
      "description": "GIVEN a row named 'Test Route CO-04' WHEN quarantineTestRows runs THEN it is flagged quarantine.reason='test_row' and the dry-run writes nothing",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t test-row-quarantine",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the test-row name pattern is never matched so the row is a static pass (the matcher is a no-op stub)",
            "quarantine.reason is stored as a constant other than 'test_row' (static)",
            "the dry-run branch writes the quarantine anyway (no-op guard)",
            "flagged is a hardcoded constant (stub) rather than counted"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "test_seed_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:quarantineTestRows '{\"dryRun\":true}'",
                "query the row to confirm no write",
                "npx convex run curatedGeometryHygiene:quarantineTestRows '{}' (committed)",
                "query the row and read {flagged}"
              ]
            },
            "end_state": {
              "must_observe": [
                "after the dry-run quarantine == null",
                "committed flagged == 1",
                "test:hyg-testrow quarantine.reason == 'test_row'"
              ],
              "must_not_observe": [
                "quarantine set after the dry-run",
                "quarantine.reason != 'test_row'",
                "quarantine still absent/null after the committed run (flagged == 0 \u2014 nothing matched, unchanged start state)"
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
      "description": "GIVEN quarantined rows WHEN recomputeRiderReady runs over them THEN no quarantined row has riderReady=true and no rider-ready row reports length \u22640 or >1000mi",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t rider-ready-exclusion",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (fixLengthOutliers + quarantineTestRows + recomputeRiderReadyForRoute over real seeded rows)",
        "negative_control": {
          "would_fail_if": [
            "recomputeRiderReady is a no-op so a quarantined row stays riderReady=true (mock/stub predicate)",
            "quarantine is not read by the predicate (disconnect) so a flagged row is still rider-ready",
            "the rider-ready invariant reads a hardcoded/empty result set (static) instead of the real seeded rows"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "length_outlier_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "run fixLengthOutliers '{}' and quarantineTestRows '{}' (committed)",
                "run recomputeRiderReadyForRoute on each seeded row",
                "query riderReady + lengthMiles + quarantine for each"
              ]
            },
            "end_state": {
              "must_observe": [
                "every quarantined seeded row riderReady == false",
                "0 rider-ready seeded rows with lengthMiles \u2264 0 or > 1000"
              ],
              "must_not_observe": [
                "a quarantined row riderReady == true (unchanged pre-recompute value)",
                "a rider-ready row lengthMiles == 0 or > 1000"
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
      "description": "GIVEN a zero_length-quarantined null-length row WHEN a sane measured routed length is written through persistGeometryVerified/recompute THEN the length quarantine clears and the stored length equals the routed length within the sane range",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t length-recovery",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real persistGeometryVerified + recomputeRiderReadyForRoute over a seeded quarantined row)",
        "negative_control": {
          "would_fail_if": [
            "the quarantine never clears after a sane length is measured (the auto-clear branch is a no-op stub)",
            "the recovered length is not stored (still null/0) so there is no measured truth (the write is a no-op)",
            "the quarantine clears but lengthMiles stays statically at 0 (partial stub)",
            "recomputeRiderReady is disconnected from the cleared quarantine so the row is left in its start state"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "length_recovery_row",
            "action": {
              "actor": "cli_user",
              "steps": [
                "run fixLengthOutliers '{}' to quarantine the null-length row",
                "write a sane 22.0-mi routed length through persistGeometryVerified (real mutation) then recomputeRiderReadyForRoute",
                "query the row"
              ]
            },
            "end_state": {
              "must_observe": [
                "test:hyg-len-recover quarantine == null after recovery (cleared)",
                "stored lengthMiles == 22.0 (routed truth) within [0,1000]"
              ],
              "must_not_observe": [
                "quarantine.reason == 'zero_length' still set after a sane length is measured (unchanged start state)",
                "lengthMiles == 0 or null after recovery (nothing written)"
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
      "description": "GIVEN dirty state strings ('New-York', 'North-Carolina', 'Alabama / Mississippi / Tennessee') WHEN normalizeStates runs THEN each is canonicalized (state='New York'/'North Carolina'), the tri-state row keeps an ordered statesAll=['Alabama','Mississippi','Tennessee'] with stateRaw preserved, variant pairs unify, and the dry-run writes nothing",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t state-normalize",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the hyphenated 'North-Carolina' is left statically dirty (the canonicalizer is a no-op stub)",
            "the tri-state string is collapsed to a single state because the split is a no-op",
            "statesAll is written as an empty/static array or drops a state",
            "the dry-run branch writes the canonical strings anyway (no-op guard)",
            "changed-count is a hardcoded constant (stub) rather than counted"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "dirty_state_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:normalizeStates '{\"dryRun\":true}'",
                "query the rows to confirm no write",
                "npx convex run curatedGeometryHygiene:normalizeStates '{}' (committed)",
                "query the rows"
              ]
            },
            "end_state": {
              "must_observe": [
                "after the dry-run test:hyg-state-nc state still == 'North-Carolina' (unwritten)",
                "committed: test:hyg-state-ny state == 'New York'",
                "committed: test:hyg-state-nc state == 'North Carolina'",
                "test:hyg-state-tri statesAll == ['Alabama','Mississippi','Tennessee'] (ordered, length 3)",
                "test:hyg-state-tri stateRaw == 'Alabama / Mississippi / Tennessee' (original preserved)"
              ],
              "must_not_observe": [
                "state written during the dry-run",
                "test:hyg-state-nc state == 'North-Carolina' (unchanged start value) after the committed run",
                "test:hyg-state-tri collapsed to a single state (statesAll length 1)",
                "statesAll absent/empty on the tri-state row (nothing written)"
              ]
            }
          }
        ],
        "id": "AC-5",
        "primary": false
      }
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN a catalog whose dirty state strings were normalized by a first pass plus an already-canonical control WHEN normalizeStates runs twice THEN the first run reports changed>0 and the second reports changed==0 and the already-canonical 'North Carolina' control is never modified",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t state-idempotent",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curated_routes rows seeded via curatedGeometryTestSupport)",
        "negative_control": {
          "would_fail_if": [
            "the second run reports changed>0 because the idempotency guard is a no-op (re-normalizes canonical strings)",
            "the already-canonical 'North Carolina' control row is modified by a stub that rewrites every row",
            "changed-count is a hardcoded constant (stub) so the no-op second run still reports >0"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "dirty_state_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:normalizeStates '{}' (first committed pass)",
                "read {changed}"
              ]
            },
            "end_state": {
              "must_observe": [
                "first-run changed >= 3 (the three dirty rows) \u2014 non-degenerate"
              ],
              "must_not_observe": [
                "first-run changed == 0 (no-op / nothing detected)"
              ]
            }
          },
          {
            "start_ref": "dirty_state_rows",
            "action": {
              "actor": "cli_user",
              "steps": [
                "npx convex run curatedGeometryHygiene:normalizeStates '{}' (second committed pass)",
                "read {changed}",
                "query the control row test:hyg-state-canon"
              ]
            },
            "end_state": {
              "must_observe": [
                "second-run changed == 0 (no-op / nothing left to normalize)",
                "test:hyg-state-canon state == 'North Carolina' (unmodified)"
              ],
              "must_not_observe": [
                "second-run changed > 0 (canonical strings re-normalized \u2014 first-run count repeated)",
                "test:hyg-state-canon state changed from its 'North Carolina' start value"
              ]
            }
          }
        ],
        "id": "AC-6",
        "primary": false
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "fixLengthOutliers flags \u22640 rows zero_length with claimed length nulled and >1000mi rows length_outlier; the dry-run writes nothing and a second run flags 0",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t length-quarantine"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "quarantineTestRows flags a 'Test Route CO-04' row with reason test_row and the dry-run writes nothing",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t test-row-quarantine"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "No quarantined row recomputes riderReady true and no rider-ready row reports length \u22640 or >1000mi",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t rider-ready-exclusion"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "A zero_length-quarantined null-length row clears its quarantine when a sane routed length is written and stores the routed length",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t length-recovery"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-5",
      "description": "normalizeStates canonicalizes hyphenated state strings and preserves a tri-state ordered set in statesAll with stateRaw; the dry-run writes nothing",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t state-normalize"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-6",
      "description": "A second normalizeStates pass reports changed 0 and the already-canonical control row is unmodified",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.integration.test.ts -t state-idempotent"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-5",
      "description": "SUPPLEMENTARY pure-unit (UNIT_TEST_JUSTIFIED: pure string logic, zero I/O): the state canonicalizer splits a delimiter-joined string into an ordered canonical set and unifies hyphen/space variants",
      "verify": "pnpm test convex/__tests__/curatedGeometryHygiene.unit.test.ts -t canonicalize"
    }
  ]
}
-->
</details>
