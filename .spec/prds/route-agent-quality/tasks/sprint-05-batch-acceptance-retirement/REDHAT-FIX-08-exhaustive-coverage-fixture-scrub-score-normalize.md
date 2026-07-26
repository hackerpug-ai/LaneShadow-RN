# REDHAT-FIX-08 — Fix founder live coverageReport truncation + scrub fixture routes + add missing REDHATFIX07 integration suite + normalize top-50 compositeScore sorting

> Status: ✅ Completed
> Completed: 2026-07-26T21:22:11Z
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | REDHAT-FIX-08 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 150 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-04 |
| DEPENDS_ON | REDHAT-FIX-01, REDHAT-FIX-03, REDHAT-FIX-06 |
| BLOCKS | REDHAT-FIX-09 (real founder acceptance packet cannot be trusted until coverageReport + top-50 are hygiene-correct) |

RUNTIME_COMMANDS:
- REDHATFIX07 integration suite: `npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts`
- REDHATFIX08 compositeScore normalization test: `npx vitest run convex/__tests__/REDHATFIX08-*.integration.test.ts`
- Static regression guard: no take(500) in curatedGeometry.ts: `rg -n "\.take\(500\)" convex/curatedGeometry.ts`
- Typecheck: `pnpm type-check`
- Lint: `pnpm exec biome check convex scripts`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

No `.take(500)` remains in convex/curatedGeometry.ts; live coverageReport counts are exhaustive for N>500 buckets (minority provenances not false-zeroed); unscoped counts exclude test:/seed: and known fixture routeIds; the 5 REDHATFIX07 integration tests exist and pass; top-50 manifest sorting is scale-normalized and no longer biased toward integer-scored rows.

## BACKGROUND

Red-hat review (2026-07-25): `.take(500)` still exists in curatedGeometry.coverageReport live path (F1), the 5 REDHATFIX07 test files do not exist (F2), top-50 evidence is contaminated by fixture motorcycleroads:twist-of-tepusquet-loop (F7/F12), and sortManifestRows compares mixed compositeScore scales (F14).

**Objective:** Make the founder's unscoped live coverageReport exhaustive and contamination-free, restore the missing REDHATFIX07 integration oracle suite, and fix top-50 ranking integrity by normalizing mixed compositeScore scales.

**Agent rationale:** All defects are backend-only: curatedGeometry.coverageReport live path truncation, shared isTestSeedRoute fixture detection, top50Review sort normalization, and missing Convex integration tests. Primary proof must be integration (real Convex dev deployment) with N>500 seeded rows to make a .take(500) regression unavoidably RED.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** remove the `.take(500)` truncation from the unscoped live coverageReport counting path in convex/curatedGeometry.ts (the founder's real query path). Acceptable implementations: (A) paginate-to-completion scan with cursor-based accumulation and no fixed cap, or (B) indexed aggregate/counter read keyed by geometryProvenance (and status) so coverageReport never scans large docs in one execution.
- **MUST** ensure the unscoped scan excludes contamination: routeIds matching test:/seed: AND known non-prefixed fixture routeIds by extending `isTestSeedRoute` beyond prefix/name checks to include explicit fixture routeIds (at minimum motorcycleroads:twist-of-tepusquet-loop).
- **MUST** implement the five missing integration tests referenced by the prior plan (REDHATFIX07-*.integration.test.ts). They must be oracle-strong and include negative_control.would_fail_if items that explicitly bite a `.take(500)` regression.
- **MUST** add/extend integration coverage to prove fixture route exclusion on founder unscoped surfaces (coverageReport and top-50 export), while preserving intentional prefix-scoped harness behavior.
- **MUST** fix `sortManifestRows` (convex/top50Review.ts:124) by normalizing compositeScore onto a single comparable scale before sorting, so an integer 85 and decimal 0.85 are treated as equivalent quality (0.85), and higher true quality rows outrank lower ones regardless of representation.
- **MUST** keep behavior non-fakeable: seeded N>500 datasets must be used, and at least one case must assert non-degenerate counts (not 0/[]).
- **MUST** keep authorization rules intact (requireOperator/requireIdentity) and avoid introducing new public APIs that bypass existing guards.
- **NEVER** NEVER add a new fictional public function (e.g. coverageReportLivePublic) to sidestep fixing the real curatedGeometry:coverageReport path.
- **NEVER** NEVER reintroduce any silent fixed cap (take(N)) as the final source of unscoped live coverage counts.
- **NEVER** NEVER allow fixture routes with production-like prefixes (motorcycleroads:...) to appear in unscoped founder top-50 exports or to pollute unscoped coverage counting.
- **NEVER** NEVER rely on unit-only mocks as primary proof for the truncation or hygiene fixes; the ACs are integration-first on real Convex dev deployment.
- **NEVER** NEVER sort mixed compositeScore scales without normalization; a raw numeric compare that lets 85 outrank 0.9 is a hard fail.
- **STRICTLY** STRICTLY `rg -n "\.take\(500\)" convex/curatedGeometry.ts` MUST return zero matches after the fix (this file had exactly one take(500) in the live coverageReport path at line ~1336).
- **STRICTLY** STRICTLY the five REDHATFIX07 integration tests must exist at the specified paths and must fail if `.take(500)` is reintroduced or if fixture/test/seed scrubbing is removed.
- **STRICTLY** STRICTLY compositeScore normalization must be applied before sorting in sortManifestRows (not after truncation), and the ranking must reflect normalized scores.

## SPECIFICATION

**Objective:** Make the founder's unscoped live coverageReport exhaustive and contamination-free, restore the missing REDHATFIX07 integration oracle suite, and fix top-50 ranking integrity by normalizing mixed compositeScore scales.

**Success state:** No `.take(500)` remains in convex/curatedGeometry.ts; live coverageReport counts are exhaustive for N>500 buckets (minority provenances not false-zeroed); unscoped counts exclude test:/seed: and known fixture routeIds; the 5 REDHATFIX07 integration tests exist and pass; top-50 manifest sorting is scale-normalized and no longer biased toward integer-scored rows.

## CAPABILITY CHAIN

- **touches_capabilities:** CAP-GEO-04
- **provides:** founder_live_coverageReport_exhaustive_counts_no_take500, coverageReport_unscoped_excludes_test_seed_and_known_fixture_routeIds, REDHATFIX07_integration_suite_present_and_regression_biting, top50_manifest_sort_is_scale_normalized, top50_and_coverage_hygiene_blocks_fixture_contamination_in_gate_packets
- **consumes:** Existing coverageReport persisted branch semantics (runId-based), isTestSeedRoute shared predicate (convex/lib/top50Eligibility.ts) used by top50Review and listRetirementCandidates, Existing Convex integration test harness patterns (runConvexFn / identity scaffolding), S5-T3 top50Review export pipeline, S5-T1/S5-T4 founder gate surfaces relying on coverageReport truthfulness
- **boundary_contracts:**
  - The unscoped founder live coverageReport path MUST return exhaustive lever candidateCount/passCount, terminalStates, provenanceCounts, and riderReadyCount for the eligible catalog — never a silently truncated sample.
  - A geometryStatus bucket with >500 rows MUST still produce correct counts for minority geometryProvenance values that would otherwise fall after the first 500 rows.
  - Unscoped founder surfaces MUST exclude test:/seed: routes AND known non-prefixed fixture routes (e.g. motorcycleroads:twist-of-tepusquet-loop) from both coverageReport counting and top-50 export eligibility; scoped harnesses may still count them when explicitly scoped.
  - Top-50 review ordering MUST be based on a single normalized compositeScore scale so mixed 0–1 and 0–100 values do not bias ranking.
  - The REDHATFIX07 integration suite MUST fail if a .take(500) regression returns, or if fixture/test/seed hygiene is removed.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `redhatfix08-oversized-generated-bucket` (seed_method: `public_api`): Seed a single geometryStatus bucket with N>500 rows so any `.take(500)` regression undercounts.
  - Create 520 curated_routes with geometryStatus='generated', geometryProvenance='scraped_promoted', riderReady=false, routeIds under a dedicated non-test prefix (e.g. motorcycleroads:redhatfix08-gen-scraped-001..520).
  - Optionally seed curated_route_geometry for a subset with verification.verdict='pass' to assert passCount correctness.
  - Teardown: delete seeded routes + geometry rows by routeId prefix using test-support public mutations.
- `redhatfix08-minority-buried-after-500` (seed_method: `public_api`): Reproduce the false-zero bug: minority provenances appear only after the first 500 rows of a status bucket.
  - Seed 500 rows geometryStatus='generated', geometryProvenance='scraped_promoted' (majority).
  - Seed 15 rows geometryStatus='generated', geometryProvenance='ai_reconstructed' with routeIds motorcycleroads:redhatfix08-ai-001..015.
  - Seed 12 rows geometryStatus='generated', geometryProvenance='name_routed' with routeIds motorcycleroads:redhatfix08-nr-001..012.
  - Truth assertions: ai_reconstructed.candidateCount==15; name_routed.candidateCount==12.
- `redhatfix08-test-seed-and-fixture-exclusion` (seed_method: `public_api`): Seed test:/seed: contamination plus a known production-prefixed fixture routeId that must be excluded from unscoped founder surfaces.
  - Seed 40 rows routeId test:redhatfix08-cont-001..040 geometryStatus='generated' geometryProvenance='ai_reconstructed'.
  - Seed 10 rows routeId seed:redhatfix08-cont-001..010 geometryStatus='unresolved'.
  - Seed 1 row routeId motorcycleroads:twist-of-tepusquet-loop with geometryStatus='generated', geometryProvenance='ai_reconstructed', compositeScore high enough to be top-50 eligible, and gate-passing geometry so it would appear unless excluded.
  - Seed 5 real production-like rows motorcycleroads:redhatfix08-real-001..005 geometryStatus='generated' geometryProvenance='ai_reconstructed'.
  - Unscoped coverageReport + unscoped top50 export must exclude test:/seed: and the explicit fixture routeId; real rows still count.
- `redhatfix08-mixed-composite-score-scale` (seed_method: `public_api`): Seed top-50 eligible rows with mixed compositeScore representation (0–1 decimals and 0–100 integers) to validate normalized sorting.
  - Seed riderReady=true route A with compositeScore=85 (integer scale) and routeId test:redhatfix08-score-int-85.
  - Seed riderReady=true route B with compositeScore=0.9 (decimal scale) and routeId test:redhatfix08-score-dec-0.9.
  - Both must be eligible (not retired, not duplicate, not quarantined) and have geometry present so exportTop50Manifest can include them.
  - Expected: normalized(85)==0.85, so route B (0.9) must outrank route A.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Exhaustive lever candidateCount when a status bucket has N>500 (no take(500) truncation)

**Requirement:** GIVEN a seeded catalog where geometryStatus='generated' contains 520 scraped_promoted rows (redhatfix08-oversized-generated-bucket) WHEN the founder's unscoped live curatedGeometry:coverageReport path computes lever counts THEN levers[scraped_promoted].candidateCount equals 520 (exhaustive), not 500 and not an undercount

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-exhaustive-over-500.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: coverageReport live path still uses take(500) as final count source; counts come from a fixed-cap sample rather than exhaustive scan/aggregate; lever candidateCount is hardcoded or stubbed; minority rows beyond first 500 are dropped silently; take(500) still present; fixed-cap counting; hardcoded leverCounts; stubbed/static report that ignores rows after 500
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix08-oversized-generated-bucket`
  - ACTION (api_client): Seed 520 generated scraped_promoted rows via public_api test support; Call curatedGeometry:coverageReport (unscoped; no routeIdPrefix, no routeIds); Assert levers scraped_promoted candidateCount == 520
  - MUST_OBSERVE: `levers[scraped_promoted].candidateCount == 520`
  - MUST_NOT_OBSERVE: `levers[scraped_promoted].candidateCount == 500`
  - MUST_NOT_OBSERVE: `levers[scraped_promoted].candidateCount == 0`
  - MUST_NOT_OBSERVE: `empty levers`
  - MUST_NOT_OBSERVE: `levers == {} (empty)`

### AC-2 — Minority provenances buried after 500 majority rows are not false-zeroed

**Requirement:** GIVEN a seeded bucket with 500 scraped_promoted rows plus minority ai_reconstructed/name_routed rows beyond 500 (redhatfix08-minority-buried-after-500) WHEN unscoped live coverageReport is queried THEN ai_reconstructed.candidateCount==15 and name_routed.candidateCount==12 (never 0)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-minority-provenance-not-zero.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: take(500) regression reappears; minority provenances are only counted if they appear in the first 500 rows; leverCounts treat missing-in-sample as true zero; minority candidateCounts are hardcoded or stubbed to 0 (static shell response); take(500) regression; counting only first page; minority lever counts hardcoded/stubbed to 0 (static shell)
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix08-minority-buried-after-500`
  - ACTION (operator): Seed majority+minority dataset via public_api; Call curatedGeometry:coverageReport (unscoped); Assert levers ai_reconstructed candidateCount == 15; Assert levers name_routed candidateCount == 12
  - MUST_OBSERVE: `levers[ai_reconstructed].candidateCount == 15`
  - MUST_OBSERVE: `levers[name_routed].candidateCount == 12`
  - MUST_NOT_OBSERVE: `levers[ai_reconstructed].candidateCount == 0`
  - MUST_NOT_OBSERVE: `levers[name_routed].candidateCount == 0`
  - MUST_NOT_OBSERVE: `empty levers`
  - MUST_NOT_OBSERVE: `levers == {} (empty)`

### AC-3 — Unscoped founder surfaces exclude test:/seed: AND explicit fixture routeIds

**Requirement:** GIVEN a mix of test:/seed: rows, real rows, and a known fixture routeId with production prefix (redhatfix08-test-seed-and-fixture-exclusion) WHEN unscoped curatedGeometry:coverageReport and unscoped top50Review:exportTop50Manifest are executed THEN test:/seed: and fixture routeId motorcycleroads:twist-of-tepusquet-loop do not contribute to counts or appear in top-50; real rows still do

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04/UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-test-seed-hygiene.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: isTestSeedRoute only checks test:/seed: prefixes and misses known fixture routeIds; coverageReport unscoped does not consult isTestSeedRoute (or equivalent scrub); top-50 export eligibility does not consult isTestSeedRoute; fixture scrub is mocked/stubbed out (static allowlist empty), letting fixture routeId through; fixture route appears as row #1 in the top-50 manifest; fixture routeId not detected by isTestSeedRoute; coverageReport does not scrub fixture/test/seed; top-50 export includes tepusquet fixture; fixture scrub logic is mocked/stubbed (static) so fixture route is treated as eligible
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix08-test-seed-and-fixture-exclusion`
  - ACTION (api_client): Seed contamination + fixture + real pool via public_api; Call curatedGeometry:coverageReport (unscoped) and confirm counts exclude test/seed and fixture routeId; Call top50Review:exportTop50Manifest (unscoped) and assert it does not include motorcycleroads:twist-of-tepusquet-loop
  - MUST_OBSERVE: `manifest.rows.some(routeId == 'motorcycleroads:twist-of-tepusquet-loop') == false`
  - MUST_OBSERVE: `manifest.rows.filter(routeId startsWith 'test:').length == 0`
  - MUST_OBSERVE: `manifest.rows.filter(routeId startsWith 'seed:').length == 0`
  - MUST_OBSERVE: `coverageReport.levers[ai_reconstructed].candidateCount >= 5`
  - MUST_NOT_OBSERVE: `manifest.rows.some(routeId == 'motorcycleroads:twist-of-tepusquet-loop') == true`
  - MUST_NOT_OBSERVE: `manifest.rows.length == 0 (empty)`
  - MUST_NOT_OBSERVE: `manifest contains routeId starting with 'test:'`
  - MUST_NOT_OBSERVE: `coverageReport.levers[ai_reconstructed].candidateCount == 45`
  - MUST_NOT_OBSERVE: `empty levers`

### AC-4 — Missing REDHATFIX07 test files exist and `.take(500)` is absent from curatedGeometry.ts

**Requirement:** GIVEN a branch that previously had zero REDHATFIX07 tests and a `.take(500)` in curatedGeometry.ts WHEN the REDHATFIX07 integration suite and the static grep guard are run THEN the 5 REDHATFIX07 integration tests exist and pass, and ripgrep finds no `.take(500)` in curatedGeometry.ts

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts && rg -n "\.take\(500\)" convex/curatedGeometry.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: any REDHATFIX07-*.integration.test.ts file is missing; tests are fakeable by stubs (no N>500 assertions); take(500) reintroduced in curatedGeometry.ts; test files missing (empty suite); take(500) present; vitest output is mocked/stubbed (fabricated pass) rather than real integration
- EVIDENCE: `stdout` (required_capture: True)
- CASE 1 — start_ref `redhatfix08-oversized-generated-bucket`
  - ACTION (cli_user): Run: npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts; Run: rg -n "\.take\(500\)" convex/curatedGeometry.ts
  - MUST_OBSERVE: `vitest exit code 0 for REDHATFIX07 suite`
  - MUST_OBSERVE: `rg output has 0 matches`
  - MUST_OBSERVE: `vitest_exit_code == 0`
  - MUST_OBSERVE: `rg_match_count == 0`
  - MUST_NOT_OBSERVE: `No test files found (empty suite)`
  - MUST_NOT_OBSERVE: `rg match at curatedGeometry.ts:1336 (or any match)`
  - MUST_NOT_OBSERVE: `rg output contains '.take(500)'`
  - MUST_NOT_OBSERVE: `vitest output == '' (empty)`
  - MUST_NOT_OBSERVE: `rg_match_count > 0`

### AC-5 — Top-50 sorting normalizes compositeScore so mixed 0–1 and 0–100 values compare correctly

**Requirement:** GIVEN two eligible riderReady routes with compositeScore 85 (int) and 0.9 (decimal) (redhatfix08-mixed-composite-score-scale) WHEN top50Review:exportTop50Manifest sorts rows THEN the 0.9 row outranks the 85 row (because 0.9 > normalized(85)=0.85)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX08-compositeScore-normalization.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: sortManifestRows compares raw compositeScore without normalization; integer compositeScore values always outrank decimals regardless of true quality; manifest ordering is hardcoded/static (stubbed sort) instead of derived from normalized scores; mock normalization returns a constant (fabricated) scale for all rows; raw numeric sort remains; normalization not applied before sort; manifest ordering is hardcoded/static (stubbed) instead of derived from normalized scores
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix08-mixed-composite-score-scale`
  - ACTION (api_client): Seed two riderReady routes with compositeScore=85 and compositeScore=0.9 via public_api; Call top50Review:exportTop50Manifest with a limit>=2; Assert returned rows[0].routeId == test:redhatfix08-score-dec-0.9 and rows[1].routeId == test:redhatfix08-score-int-85
  - MUST_OBSERVE: `manifest.rows[0].routeId == 'test:redhatfix08-score-dec-0.9'`
  - MUST_OBSERVE: `manifest.rows[1].routeId == 'test:redhatfix08-score-int-85'`
  - MUST_OBSERVE: `manifest.rows.length >= 2`
  - MUST_NOT_OBSERVE: `manifest rows sorted with 85 above 0.9 due to raw numeric compare`
  - MUST_NOT_OBSERVE: `manifest.rows.length == 0 (empty)`
  - MUST_NOT_OBSERVE: `manifest rows sorted with 85 above 0.9 due to scale mix`

## TEST CRITERIA (boolean — map 1:1+ to ACs)

- **TC-1** → AC-1: Unscoped live coverageReport returns scraped_promoted candidateCount == 520 when 520 generated scraped_promoted rows are seeded
  - VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-exhaustive-over-500.integration.test.ts -t "TC-1"`
- **TC-2** → AC-2: Minority ai_reconstructed/name_routed rows beyond the first 500 are still counted (15 and 12 respectively)
  - VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-minority-provenance-not-zero.integration.test.ts -t "TC-2"`
- **TC-3** → AC-3: Unscoped coverageReport and top-50 export exclude test:/seed: and explicit fixture routeIds; real rows remain countable
  - VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-test-seed-hygiene.integration.test.ts -t "TC-3"`
- **TC-4** → AC-4: REDHATFIX07 suite exists and passes; curatedGeometry.ts contains zero `.take(500)` matches
  - VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts && rg -n "\.take\(500\)" convex/curatedGeometry.ts`
- **TC-5** → AC-5: Top-50 manifest sorting uses normalized compositeScore; 0.9 outranks 85 (normalized to 0.85)
  - VERIFY: `npx vitest run convex/__tests__/REDHATFIX08-compositeScore-normalization.integration.test.ts -t "TC-5"`

## READING LIST

- `.spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T164517Z.md` (1-220): Findings F1/F2/F7/F12/F14 driving this task
- `convex/curatedGeometry.ts` (1235-1385): coverageReport live path: `.take(500)` at ~1336; replace with exhaustive strategy
- `convex/lib/top50Eligibility.ts` (1-80): isTestSeedRoute must be extended to catch explicit fixture routeIds beyond prefixes
- `convex/curatedGeometryTestSupport.ts` (200-250): seedPoCRoute defines motorcycleroads:twist-of-tepusquet-loop fixture routeId
- `convex/top50Review.ts` (121-210): sortManifestRows and exportTop50Manifest ordering + eligibility scrubs
- `.spec/prds/route-agent-quality/05-uc-rec.md` (1-140): UC-REC-04/05 realized-yield honesty and founder gate dependence on truthful counts

## GUARDRAILS

### WRITE-ALLOWED

- convex/curatedGeometry.ts (MODIFY — remove take(500) and implement exhaustive live counting strategy)
- convex/lib/top50Eligibility.ts (MODIFY — extend isTestSeedRoute to explicit fixture routeIds)
- convex/top50Review.ts (MODIFY — normalize compositeScore in sortManifestRows)
- convex/curatedGeometryTestSupport.ts (MODIFY/ADD seed helpers to make fixture routeId riderReady/eligible when needed)
- convex/__tests__/REDHATFIX07-*.integration.test.ts (NEW — five missing files)
- convex/__tests__/REDHATFIX08-*.integration.test.ts (NEW — compositeScore normalization test)

### WRITE-PROHIBITED

- react-native/**
- adding fictional public functions to avoid fixing curatedGeometry:coverageReport
- weakening scenario negative_control or replacing integration with unit-only mocks
- changing Sprint 05 gate evidence files (that belongs to REDHAT-FIX-09)

## CODE PATTERN

**Pattern:** Replace unscoped `.take(500)` scan with an exhaustive strategy (cursor-based pagination accumulation or precomputed aggregates), add explicit fixture routeId detection in isTestSeedRoute, and normalize compositeScore to one comparable scale before sorting.

**Pattern source:** convex/curatedRouteStateCounts.ts backfill pattern; convex/top50Review.ts eligibility scrub; curatedGeometry.ts coverageReport live branch

**Anti-pattern:** Silent truncation via take(N); prefix-only scrub that misses known fixture routeIds; raw numeric compare of mixed-scale compositeScore

### Interaction notes

- The founder path is curatedGeometry:coverageReport (unscoped, live scan). Fix must land there; do not introduce substitute API names.
- If exhaustive live counting cannot safely read the full curated_routes table in one execution (16MB risk), prefer an aggregate/counter table or a cursor-based multi-call accumulation — but the founder-facing path must still be able to obtain an exhaustive result without a fixed cap.
- Fixture contamination must be excluded only for unscoped founder surfaces; scoped harnesses must remain usable for integration isolation.

## DESIGN REFERENCES

- Red-hat review findings F1/F2/F7/F12/F14
- UC-REC-04 AC-7 (founder acceptance depends on truthful realized-yield counts)
- UC-VER-05 AC-6 (top-50 independent review must be uncontaminated)
- Convex 16MB read limit rationale (curated_route_state_counts precedent)

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| REDHATFIX07 integration suite | `npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts` | Exit 0 |
| REDHATFIX08 compositeScore normalization test | `npx vitest run convex/__tests__/REDHATFIX08-*.integration.test.ts` | Exit 0 |
| Static regression guard: no take(500) in curatedGeometry.ts | `rg -n "\.take\(500\)" convex/curatedGeometry.ts` | 0 matches |
| Typecheck | `pnpm type-check` | Exit 0 |
| Lint | `pnpm exec biome check convex scripts` | Exit 0 |

## AGENT ASSIGNMENT

- Implementer: `convex-implementer`
- Reviewer: `convex-reviewer`
- Rationale: All defects are backend-only: curatedGeometry.coverageReport live path truncation, shared isTestSeedRoute fixture detection, top50Review sort normalization, and missing Convex integration tests. Primary proof must be integration (real Convex dev deployment) with N>500 seeded rows to make a .take(500) regression unavoidably RED.
- Proposed by: `convex-planner` (RULES.md#Agent Dispatch (prior REDHAT-FIX expansions proposed_by: convex-planner))

## AGENT INSTRUCTIONS (TDD flow)

1. Read READING LIST and CRITICAL CONSTRAINTS.
2. RED: write failing integration tests per AC scenarios (public_api seeds). Capture RED evidence.
3. GREEN: implement minimal code to pass ACs.
4. REFACTOR: clean up without weakening oracles.
5. Run all VERIFICATION GATES; paste evidence into the task PR/notes.

## ORCHESTRATOR VERIFICATION PROTOCOL

- Confirm `proposed_by` is a specialist (not orchestrator).
- Confirm every AC scenario passes `validate_scenario` (zero CRITICAL).
- Confirm PRIMARY AC is integration/e2e with real Convex deployment.
- Confirm REQUIREMENT-CONTRACT block present and parseable.

## EVIDENCE GATES

- RED evidence: failing test output before implementation for each behavioral AC.
- GREEN evidence: passing `npx vitest run` for cited integration files.
- Static guards: any `rg` gates in VERIFICATION GATES must match expected.

## REVIEW CRITERIA

- No stubs/mocks as primary proof.
- Negative controls would fail on truncation/fabrication/seed identity.
- WRITE-ALLOWED respected; no RN UI scope creep.

## DEPENDENCIES

- depends_on: REDHAT-FIX-01, REDHAT-FIX-03, REDHAT-FIX-06
- blocks: REDHAT-FIX-09 (real founder acceptance packet cannot be trusted until coverageReport + top-50 are hygiene-correct)

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/CONVEX-RULES.md (present in /Users/inference1/Projects/brain/docs/CONVEX-RULES.md)
- Validators-first; returns validators on public functions; avoid fixed-cap sampling for founder-facing truth
- Scenario-contract: seeded start state via public_api; negative_control must fail on stubs/regressions

## NOTES

Implements red-hat remediation scope for findings F1 (take500 still present), F2 (missing tests), F7/F12 (fixture contamination via tepusquet routeId), and F14 (compositeScore scale mix). This task must produce integration oracles that bite a `.take(500)` regression by seeding N>500 rows and asserting exhaustive counts.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-08",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "redhatfix08-oversized-generated-bucket": {
      "description": "Seed a single geometryStatus bucket with N>500 rows so any `.take(500)` regression undercounts.",
      "seed_method": "public_api",
      "records": [
        "Create 520 curated_routes with geometryStatus='generated', geometryProvenance='scraped_promoted', riderReady=false, routeIds under a dedicated non-test prefix (e.g. motorcycleroads:redhatfix08-gen-scraped-001..520).",
        "Optionally seed curated_route_geometry for a subset with verification.verdict='pass' to assert passCount correctness.",
        "Teardown: delete seeded routes + geometry rows by routeId prefix using test-support public mutations."
      ]
    },
    "redhatfix08-minority-buried-after-500": {
      "description": "Reproduce the false-zero bug: minority provenances appear only after the first 500 rows of a status bucket.",
      "seed_method": "public_api",
      "records": [
        "Seed 500 rows geometryStatus='generated', geometryProvenance='scraped_promoted' (majority).",
        "Seed 15 rows geometryStatus='generated', geometryProvenance='ai_reconstructed' with routeIds motorcycleroads:redhatfix08-ai-001..015.",
        "Seed 12 rows geometryStatus='generated', geometryProvenance='name_routed' with routeIds motorcycleroads:redhatfix08-nr-001..012.",
        "Truth assertions: ai_reconstructed.candidateCount==15; name_routed.candidateCount==12."
      ]
    },
    "redhatfix08-test-seed-and-fixture-exclusion": {
      "description": "Seed test:/seed: contamination plus a known production-prefixed fixture routeId that must be excluded from unscoped founder surfaces.",
      "seed_method": "public_api",
      "records": [
        "Seed 40 rows routeId test:redhatfix08-cont-001..040 geometryStatus='generated' geometryProvenance='ai_reconstructed'.",
        "Seed 10 rows routeId seed:redhatfix08-cont-001..010 geometryStatus='unresolved'.",
        "Seed 1 row routeId motorcycleroads:twist-of-tepusquet-loop with geometryStatus='generated', geometryProvenance='ai_reconstructed', compositeScore high enough to be top-50 eligible, and gate-passing geometry so it would appear unless excluded.",
        "Seed 5 real production-like rows motorcycleroads:redhatfix08-real-001..005 geometryStatus='generated' geometryProvenance='ai_reconstructed'.",
        "Unscoped coverageReport + unscoped top50 export must exclude test:/seed: and the explicit fixture routeId; real rows still count."
      ]
    },
    "redhatfix08-mixed-composite-score-scale": {
      "description": "Seed top-50 eligible rows with mixed compositeScore representation (0\u20131 decimals and 0\u2013100 integers) to validate normalized sorting.",
      "seed_method": "public_api",
      "records": [
        "Seed riderReady=true route A with compositeScore=85 (integer scale) and routeId test:redhatfix08-score-int-85.",
        "Seed riderReady=true route B with compositeScore=0.9 (decimal scale) and routeId test:redhatfix08-score-dec-0.9.",
        "Both must be eligible (not retired, not duplicate, not quarantined) and have geometry present so exportTop50Manifest can include them.",
        "Expected: normalized(85)==0.85, so route B (0.9) must outrank route A."
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN N>500 seeded rows in one status bucket WHEN founder unscoped live coverageReport runs THEN lever candidateCount is exhaustive (not capped, not undercounted)",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-exhaustive-over-500.integration.test.ts",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "coverageReport live path still uses take(500) as final count source",
            "counts come from a fixed-cap sample rather than exhaustive scan/aggregate",
            "lever candidateCount is hardcoded or stubbed",
            "minority rows beyond first 500 are dropped silently",
            "take(500) still present",
            "fixed-cap counting",
            "hardcoded leverCounts",
            "stubbed/static report that ignores rows after 500"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix08-oversized-generated-bucket",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed 520 generated scraped_promoted rows via public_api test support",
                "Call curatedGeometry:coverageReport (unscoped; no routeIdPrefix, no routeIds)",
                "Assert levers scraped_promoted candidateCount == 520"
              ]
            },
            "end_state": {
              "must_observe": [
                "levers[scraped_promoted].candidateCount == 520"
              ],
              "must_not_observe": [
                "levers[scraped_promoted].candidateCount == 500",
                "levers[scraped_promoted].candidateCount == 0",
                "empty levers",
                "levers == {} (empty)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Unscoped live coverageReport returns scraped_promoted candidateCount == 520 when 520 generated scraped_promoted rows are seeded",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-exhaustive-over-500.integration.test.ts -t \"TC-1\""
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN minority provenances beyond first 500 WHEN unscoped live coverageReport runs THEN minority candidateCounts are correct (not false-zeroed)",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-minority-provenance-not-zero.integration.test.ts",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "take(500) regression reappears",
            "minority provenances are only counted if they appear in the first 500 rows",
            "leverCounts treat missing-in-sample as true zero",
            "minority candidateCounts are hardcoded or stubbed to 0 (static shell response)",
            "take(500) regression",
            "counting only first page",
            "minority lever counts hardcoded/stubbed to 0 (static shell)"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix08-minority-buried-after-500",
            "action": {
              "actor": "operator",
              "steps": [
                "Seed majority+minority dataset via public_api",
                "Call curatedGeometry:coverageReport (unscoped)",
                "Assert levers ai_reconstructed candidateCount == 15",
                "Assert levers name_routed candidateCount == 12"
              ]
            },
            "end_state": {
              "must_observe": [
                "levers[ai_reconstructed].candidateCount == 15",
                "levers[name_routed].candidateCount == 12"
              ],
              "must_not_observe": [
                "levers[ai_reconstructed].candidateCount == 0",
                "levers[name_routed].candidateCount == 0",
                "empty levers",
                "levers == {} (empty)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Minority ai_reconstructed/name_routed rows beyond the first 500 are still counted (15 and 12 respectively)",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-minority-provenance-not-zero.integration.test.ts -t \"TC-2\""
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN test:/seed: + explicit fixture routeIds WHEN unscoped founder surfaces run THEN contamination is excluded (coverage + top-50) and real rows remain",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-test-seed-hygiene.integration.test.ts",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04/UC-VER-05",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "isTestSeedRoute only checks test:/seed: prefixes and misses known fixture routeIds",
            "coverageReport unscoped does not consult isTestSeedRoute (or equivalent scrub)",
            "top-50 export eligibility does not consult isTestSeedRoute",
            "fixture scrub is mocked/stubbed out (static allowlist empty), letting fixture routeId through",
            "fixture route appears as row #1 in the top-50 manifest",
            "fixture routeId not detected by isTestSeedRoute",
            "coverageReport does not scrub fixture/test/seed",
            "top-50 export includes tepusquet fixture",
            "fixture scrub logic is mocked/stubbed (static) so fixture route is treated as eligible"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix08-test-seed-and-fixture-exclusion",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed contamination + fixture + real pool via public_api",
                "Call curatedGeometry:coverageReport (unscoped) and confirm counts exclude test/seed and fixture routeId",
                "Call top50Review:exportTop50Manifest (unscoped) and assert it does not include motorcycleroads:twist-of-tepusquet-loop"
              ]
            },
            "end_state": {
              "must_observe": [
                "manifest.rows.some(routeId == 'motorcycleroads:twist-of-tepusquet-loop') == false",
                "manifest.rows.filter(routeId startsWith 'test:').length == 0",
                "manifest.rows.filter(routeId startsWith 'seed:').length == 0",
                "coverageReport.levers[ai_reconstructed].candidateCount >= 5"
              ],
              "must_not_observe": [
                "manifest.rows.some(routeId == 'motorcycleroads:twist-of-tepusquet-loop') == true",
                "manifest.rows.length == 0 (empty)",
                "manifest contains routeId starting with 'test:'",
                "coverageReport.levers[ai_reconstructed].candidateCount == 45",
                "empty levers"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Unscoped coverageReport and top-50 export exclude test:/seed: and explicit fixture routeIds; real rows remain countable",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-test-seed-hygiene.integration.test.ts -t \"TC-3\""
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN prior missing tests and take(500) WHEN suite+rg checks run THEN tests exist+pass and take(500) is absent from curatedGeometry.ts",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts && rg -n \"\\.take\\(500\\)\" convex/curatedGeometry.ts",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "any REDHATFIX07-*.integration.test.ts file is missing",
            "tests are fakeable by stubs (no N>500 assertions)",
            "take(500) reintroduced in curatedGeometry.ts",
            "test files missing (empty suite)",
            "take(500) present",
            "vitest output is mocked/stubbed (fabricated pass) rather than real integration"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix08-oversized-generated-bucket",
            "action": {
              "actor": "cli_user",
              "steps": [
                "Run: npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts",
                "Run: rg -n \"\\.take\\(500\\)\" convex/curatedGeometry.ts"
              ]
            },
            "end_state": {
              "must_observe": [
                "vitest exit code 0 for REDHATFIX07 suite",
                "rg output has 0 matches",
                "vitest_exit_code == 0",
                "rg_match_count == 0"
              ],
              "must_not_observe": [
                "No test files found (empty suite)",
                "rg match at curatedGeometry.ts:1336 (or any match)",
                "rg output contains '.take(500)'",
                "vitest output == '' (empty)",
                "rg_match_count > 0"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "REDHATFIX07 suite exists and passes; curatedGeometry.ts contains zero `.take(500)` matches",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts && rg -n \"\\.take\\(500\\)\" convex/curatedGeometry.ts"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN mixed compositeScore scales WHEN manifest is sorted THEN ordering reflects normalized scale not raw numeric",
      "verify": "npx vitest run convex/__tests__/REDHATFIX08-compositeScore-normalization.integration.test.ts",
      "test_tier": "integration",
      "flow_ref": "UC-VER-05",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "sortManifestRows compares raw compositeScore without normalization",
            "integer compositeScore values always outrank decimals regardless of true quality",
            "manifest ordering is hardcoded/static (stubbed sort) instead of derived from normalized scores",
            "mock normalization returns a constant (fabricated) scale for all rows",
            "raw numeric sort remains",
            "normalization not applied before sort",
            "manifest ordering is hardcoded/static (stubbed) instead of derived from normalized scores"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix08-mixed-composite-score-scale",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed two riderReady routes with compositeScore=85 and compositeScore=0.9 via public_api",
                "Call top50Review:exportTop50Manifest with a limit>=2",
                "Assert returned rows[0].routeId == test:redhatfix08-score-dec-0.9 and rows[1].routeId == test:redhatfix08-score-int-85"
              ]
            },
            "end_state": {
              "must_observe": [
                "manifest.rows[0].routeId == 'test:redhatfix08-score-dec-0.9'",
                "manifest.rows[1].routeId == 'test:redhatfix08-score-int-85'",
                "manifest.rows.length >= 2"
              ],
              "must_not_observe": [
                "manifest rows sorted with 85 above 0.9 due to raw numeric compare",
                "manifest.rows.length == 0 (empty)",
                "manifest rows sorted with 85 above 0.9 due to scale mix"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Top-50 manifest sorting uses normalized compositeScore; 0.9 outranks 85 (normalized to 0.85)",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHATFIX08-compositeScore-normalization.integration.test.ts -t \"TC-5\""
    }
  ],
  "proposed_by": "convex-planner",
  "touches_capabilities": [
    "CAP-GEO-04"
  ],
  "provides": [
    "founder_live_coverageReport_exhaustive_counts_no_take500",
    "coverageReport_unscoped_excludes_test_seed_and_known_fixture_routeIds",
    "REDHATFIX07_integration_suite_present_and_regression_biting",
    "top50_manifest_sort_is_scale_normalized",
    "top50_and_coverage_hygiene_blocks_fixture_contamination_in_gate_packets"
  ],
  "consumes": [
    "Existing coverageReport persisted branch semantics (runId-based)",
    "isTestSeedRoute shared predicate (convex/lib/top50Eligibility.ts) used by top50Review and listRetirementCandidates",
    "Existing Convex integration test harness patterns (runConvexFn / identity scaffolding)",
    "S5-T3 top50Review export pipeline",
    "S5-T1/S5-T4 founder gate surfaces relying on coverageReport truthfulness"
  ],
  "boundary_contracts": [
    "The unscoped founder live coverageReport path MUST return exhaustive lever candidateCount/passCount, terminalStates, provenanceCounts, and riderReadyCount for the eligible catalog \u2014 never a silently truncated sample.",
    "A geometryStatus bucket with >500 rows MUST still produce correct counts for minority geometryProvenance values that would otherwise fall after the first 500 rows.",
    "Unscoped founder surfaces MUST exclude test:/seed: routes AND known non-prefixed fixture routes (e.g. motorcycleroads:twist-of-tepusquet-loop) from both coverageReport counting and top-50 export eligibility; scoped harnesses may still count them when explicitly scoped.",
    "Top-50 review ordering MUST be based on a single normalized compositeScore scale so mixed 0\u20131 and 0\u2013100 values do not bias ranking.",
    "The REDHATFIX07 integration suite MUST fail if a .take(500) regression returns, or if fixture/test/seed hygiene is removed."
  ]
}
-->
<!-- /REQUIREMENT-CONTRACT -->
