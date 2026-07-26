# REDHAT-FIX-07 — Exhaustive coverageReport lever counts without take(500) truncation

> Status: ✅ Completed
> Commit: 880ffc24b90abd2cbc2026a73f280d44cf33e9c8
> Reviewer: product-manager+convex-reviewer
> Completed: 2026-07-26T20:51:26Z
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | REDHAT-FIX-07 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-04 |
| DEPENDS_ON | REDHAT-FIX-01, REDHAT-FIX-03, REDHAT-FIX-04, REDHAT-FIX-06 |
| BLOCKS | S5-T4 founder accept/reject on live realized yield (honest packet), Sprint 05 gate: Founder-Operator acceptance of full-batch rider-ready vs expected-yield table, Sprint 10 honesty if still relying on truncated coverageReport lever zeros |

RUNTIME_COMMANDS:
- integration: `npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex scripts`
- build: `pnpm convex:dev --once`
- operator (post-fix full catalog): `pnpm tsx scripts/backfill-curated-geometry.ts --all`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Unscoped live coverageReport returns lever candidateCounts equal to full catalog membership for each geometryProvenance (minus excluded test:/seed:); a status bucket with N>500 no longer undercounts minority levers to 0; take(500) is gone from the live counting path; integration RED→GREEN proves N>500 and contamination hygiene; operator may re-run --all and obtain a fresh non-truncated report before accept/reject.

## BACKGROUND

Post-remediation orchestrator finding 2026-07-25T03:35Z: live coverageReport (no runId / non-persisted path) at convex/curatedGeometry.ts:1330-1360 loops geometryStatus in [generated, review, unresolved, failed] with .withIndex('by_geometry_status').take(500). Live catalog had ~5959 total rows (~2930 generated, ~2893 unresolved, both >>500). Minority provenances ai_reconstructed (71 real) and name_routed (11 real) fell outside the first 500 rows of their status bucket → candidateCount: 0 false zeros → rejected batch-acceptance decision on a possibly-valid catalog. REDHAT-FIX-03 only scrubbed listRetirementCandidates export, not the table and not coverageReport scans; ~202 test:/seed: rows still resident in curated_routes can crowd real rows out of any bounded scan.

**Objective:** Fix coverageReport live-branch per-status scans so lever candidate/pass counts and terminal/provenance tallies are exhaustive (no silent take(500) truncation), and purge or exclude residual test:/seed: contamination from unscoped production counts so Founder batch acceptance uses a trustworthy realized-yield packet.

**Agent rationale:** coverageReport live-branch lever counting, curated_routes hygiene (test:/seed: purge or exclusion), and any aggregate/pagination helpers are Convex-backend only. No RN UI. Primary proof is integration against real Convex with N>500 status buckets so a remaining take(500) cannot green.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** make lever-candidate counting exhaustive for the live coverageReport path: either (A) paginate each geometryStatus (and provenance membership) to completion with real Convex .paginate() multi-call orchestration (no fixed row cap on the final count), or (B) maintain an indexed aggregate/counter table keyed by geometryProvenance (and optionally geometryStatus) updated on write so coverageReport never depends on a truncated row scan
- **MUST** prove exhaustiveness with integration seeds where a single geometryStatus bucket has N>500 rows and minority provenances (ai_reconstructed, name_routed) appear only after the first 500 majority rows — candidateCount for those provenances must equal the seeded truth, not 0 and not a take(500) partial
- **MUST** purge OR exclude routeIds matching isTestSeedRoute (test:/seed: and shared markers) from unscoped live coverageReport lever/terminal/provenance counts so the ~202 contamination rows cannot crowd real rows or pollute candidateCount / riderReadyCount
- **MUST** preserve prefix-scoped / routeIds-scoped harness isolation: when routeIdPrefix starts with test: (or explicit idSet of test routes), test rows remain countable for integration harnesses
- **MUST** re-run or prove via real-Convex integration that a fresh post-fix coverageReport is trustworthy before any Founder accept/reject; document operator step for live pnpm tsx scripts/backfill-curated-geometry.ts --all when full catalog rebatch is required outside CI
- **MUST** respect Convex hard rules: exactly one .paginate() per function; stay under 16MB read budget — if full exhaustive per-row geometry joins exceed limits, prefer aggregate counters or multi-invocation accumulation without silent truncation
- **MUST** define returns validators on any new public/internal functions and use v.id / schema-aligned validators
- **NEVER** leave .take(500) (or any silent fixed take(N) cap) as the final source of lever candidateCount / terminalStates / provenanceCounts on the unscoped live coverageReport path at convex/curatedGeometry.ts ~1330-1360
- **NEVER** claim candidateCount from a truncated scan; a false zero (candidateCount: 0) for real ai_reconstructed / name_routed rows is a hard fail
- **NEVER** leave test:/seed: rows counting as production levers on the unscoped path without exclusion or table purge
- **NEVER** use the pre-fix truncated coverageReport for Founder-Operator accept/reject or expected-yield comparison
- **NEVER** mock ctx.db / query results as primary proof; unit-only stubs of lever counts are invalid for behavioral ACs
- **NEVER** weaken validate_scenario (must_observe must stay concrete; negative_control must fail take(500)/hardcoded zeros/static reports)
- **STRICTLY** a stub that returns hardcoded lever counts, a still-present take(500) on the live path, or counts that only work for ≤500-row buckets MUST fail the REDHATFIX07 integration suite
- **STRICTLY** primary ACs are integration against Convex dev deployment with seed_method public_api (real seed mutations / test support) — never view injection
- **STRICTLY** if strategy B (aggregates) is chosen, counters must stay consistent under write (insert/patch geometryStatus/geometryProvenance/riderReady) and coverageReport must read aggregates, not a truncated scan fallback that can diverge
- **STRICTLY** CAP-GEO-04 boundary: all-levers-failed / low-yield founder decisions depend on honest lever candidateCounts — truncated zeros falsify escalation and rejection

## SPECIFICATION

**Objective:** Fix coverageReport live-branch per-status scans so lever candidate/pass counts and terminal/provenance tallies are exhaustive (no silent take(500) truncation), and purge or exclude residual test:/seed: contamination from unscoped production counts so Founder batch acceptance uses a trustworthy realized-yield packet.

**Success state:** Unscoped live coverageReport returns lever candidateCounts equal to full catalog membership for each geometryProvenance (minus excluded test:/seed:); a status bucket with N>500 no longer undercounts minority levers to 0; take(500) is gone from the live counting path; integration RED→GREEN proves N>500 and contamination hygiene; operator may re-run --all and obtain a fresh non-truncated report before accept/reject.

## CAPABILITY CHAIN

- **touches_capabilities:** CAP-GEO-04
- **provides:** exhaustive_coverageReport_lever_candidate_counts, non_truncated_terminalStates_and_provenanceCounts, production_catalog_hygiene_test_seed_exclusion_or_purge, trustworthy_live_coverage_input_for_founder_accept_reject
- **consumes:** CAP-GEO-05 couch-sample PASS unlock for --all (already consumed by Sprint 04/05), isTestSeedRoute shared predicate (REDHAT-FIX-03 / top50Eligibility), existing .paginate() multi-call patterns (listForGeometryBackfill, listAllRoutesForReset, listRetirementCandidates cursor encoding), buildLeverRows / PRD_YIELD_ASSUMPTIONS lever model
- **boundary_contracts:**
  - coverageReport lever candidateCount/passCount and terminalStates/provenanceCounts for the unscoped live path must equal exhaustive catalog membership for counted rows (minus excluded test:/seed: contamination), never a silently truncated .take(N) sample
  - A status bucket with >500 rows must still yield candidateCount == full seeded provenance membership for that provenance; minority provenances buried after 500 majority rows must not report candidateCount: 0
  - test:/seed: contamination must not inflate or deflate production lever/terminal counts on the unscoped founder path; prefix-scoped harness isolation remains intact
  - Founder-Operator accept/reject (UC-REC-04 AC-7) must not use a pre-fix truncated coverageReport; post-fix report is the only valid live input for realized-yield comparison

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `redhatfix07-oversized-generated-bucket` (seed_method: `public_api`): Seed N>500 generated rows under a unique production-like prefix so unscoped (or prefix-scoped production) live coverageReport must count beyond any take(500). Exact N is fixed and asserted.
  - 520 rows geometryStatus=generated geometryProvenance=scraped_promoted routeId motorcycleroads:redhatfix07-gen-scraped-001..520 (or equivalent non-test production-like ids under a dedicated purgeable prefix)
  - Optionally 30 generated with verificationVerdict=pass and curated_route_geometry for passCount proof
  - Cleanup: delete/purge fixture prefix after test via public_api test support
- `redhatfix07-minority-buried-after-500` (seed_method: `public_api`): Reproduces the false-zero bug: majority provenance fills the first 500 of a status bucket; minority ai_reconstructed and name_routed appear only after position 500.
  - 500 rows geometryStatus=generated geometryProvenance=scraped_promoted (fill the would-be take(500) window first by insertion/order that matches by_geometry_status scan order)
  - 15 rows geometryStatus=generated geometryProvenance=ai_reconstructed routeId motorcycleroads:redhatfix07-ai-001..015
  - 12 rows geometryStatus=generated geometryProvenance=name_routed routeId motorcycleroads:redhatfix07-nr-001..012
  - Truth: levers.ai_reconstructed.candidateCount == 15; name_routed.candidateCount == 12; scraped_promoted.candidateCount >= 500
- `redhatfix07-contamination-pool` (seed_method: `public_api`): Mix of production-like routes and test:/seed: contamination that must not pollute unscoped lever/terminal counts (extends FIX-03 hygiene from export-only to coverage counts / optional table purge).
  - 40 rows routeId test:redhatfix07-cont-001..040 geometryStatus=generated geometryProvenance=ai_reconstructed
  - 10 rows routeId seed:redhatfix07-cont-001..010 geometryStatus=unresolved
  - 5 rows routeId motorcycleroads:redhatfix07-real-001..005 geometryStatus=generated geometryProvenance=ai_reconstructed
  - Unscoped coverageReport must not count the 40+10 test/seed into production levers; real ai_reconstructed candidates >= 5 (or exact after isolation)
- `redhatfix07-prefix-harness` (seed_method: `public_api`): Prefix-scoped isolation for integration harnesses: routeIdPrefix=test:redhatfix07- must still see test rows when intentionally scoped.
  - routeId test:redhatfix07-harness-ai geometryStatus=generated geometryProvenance=ai_reconstructed
  - routeId test:redhatfix07-harness-nr geometryStatus=generated geometryProvenance=name_routed
  - coverageReport({ routeIdPrefix: 'test:redhatfix07-' }) counts harness rows

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Exhaustive lever candidateCount when a geometryStatus bucket has N>500

**Requirement:** GIVEN a real Convex catalog seed with 520+ generated rows of known provenance (redhatfix07-oversized-generated-bucket) and no take-friendly truncation of truth WHEN an operator queries the live coverageReport path (no persisted runId short-circuit, or the same counting path used for live scans) THEN levers[].candidateCount for that provenance equals the seeded exhaustive count (e.g. scraped_promoted candidates == 520), not min(seeded, 500) and not a false undercount

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-exhaustive-over-500.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: take(500) still present on live coverage path; hardcoded lever candidateCount; stub empty zero candidates; static report ignoring catalog size; counts that only work for <=500-row buckets (candidates == 500 when seeded == 520)
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix07-oversized-generated-bucket`
  - ACTION (operator): Seed 520 generated scraped_promoted rows via public_api test support mutation; Call curatedGeometry.coverageReport on the live path scoped to the fixture set if needed for isolation (or unscoped after purge of other fixtures); Read levers where provenance == scraped_promoted (or lever promote); Assert candidateCount == 520
  - MUST_OBSERVE: `levers[scraped_promoted].candidateCount == 520`
  - MUST_OBSERVE: `source == 'live' || completeness == 'scan_not_batch' || source indicates non-persisted live scan`
  - MUST_OBSERVE: `terminalStates.generated >= 520 || scoped generated count == 520`
  - MUST_NOT_OBSERVE: `levers[scraped_promoted].candidateCount == 500`
  - MUST_NOT_OBSERVE: `levers[scraped_promoted].candidateCount == 0`
  - MUST_NOT_OBSERVE: `candidates == 0 when seeded >500`
  - MUST_NOT_OBSERVE: `take(500) path used for final count`
  - MUST_NOT_OBSERVE: `empty levers`

### AC-2 — Minority provenances buried after 500 majority rows are not false-zeroed

**Requirement:** GIVEN 500 generated scraped_promoted rows that would saturate a take(500) window plus 15 ai_reconstructed and 12 name_routed generated rows only present beyond that window (redhatfix07-minority-buried-after-500) WHEN live coverageReport computes leverCounts THEN ai_reconstructed.candidateCount == 15 and name_routed.candidateCount == 12 (never 0); scraped_promoted.candidateCount >= 500

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-minority-provenance-not-zero.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: take(500) still present on live coverage path; ai_reconstructed candidateCount hardcoded 0; name_routed candidateCount hardcoded 0; stub empty zero candidates for minority levers; static report ignoring buried rows past first 500 of status bucket
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix07-minority-buried-after-500`
  - ACTION (operator): Seed 500 scraped_promoted generated + 15 ai_reconstructed generated + 12 name_routed generated via public_api; Query live coverageReport; Capture levers for ai_reconstructed and name_routed candidateCount
  - MUST_OBSERVE: `levers[ai_reconstructed].candidateCount == 15`
  - MUST_OBSERVE: `levers[name_routed].candidateCount == 12`
  - MUST_OBSERVE: `levers[scraped_promoted].candidateCount >= 500`
  - MUST_OBSERVE: `provenanceCounts.ai_reconstructed == 15 || provenanceCounts includes ai_reconstructed 15`
  - MUST_NOT_OBSERVE: `levers[ai_reconstructed].candidateCount == 0`
  - MUST_NOT_OBSERVE: `levers[name_routed].candidateCount == 0`
  - MUST_NOT_OBSERVE: `candidates == 0 when seeded >0 for minority`
  - MUST_NOT_OBSERVE: `take(500) path used for final count`
  - MUST_NOT_OBSERVE: `empty levers`

### AC-3 — test:/seed: contamination purged or excluded from unscoped production lever counts

**Requirement:** GIVEN curated_routes contains both production-like routes and test:/seed: contamination (redhatfix07-contamination-pool), and REDHAT-FIX-03 only scrubbed listRetirementCandidates export not coverageReport WHEN unscoped live coverageReport is queried (no routeIdPrefix / no test-only idSet) THEN test: and seed: rows do not contribute to lever candidateCount, terminalStates, provenanceCounts, or riderReadyCount; production-like rows still count; optionally a purge mutation removes residual contamination from the table so it cannot crowd bounded scans

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-test-seed-hygiene.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: test: rows still counted in unscoped lever candidates; seed: rows still counted in unscoped terminalStates; stub empty report that zeros all levers including production rows; mock scrub that only drops one prefix and leaves test: in counts; take(500) still used so contamination crowds real rows out of the sample
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix07-contamination-pool`
  - ACTION (operator): Seed 40 test: ai_reconstructed + 10 seed: unresolved + 5 motorcycleroads real ai_reconstructed; Optionally invoke purgeTestSeedContamination public_api if implementer chooses table purge; Query unscoped live coverageReport; Assert production ai_reconstructed candidates reflect real rows only (not +40 test)
  - MUST_OBSERVE: `unscoped_test_prefix_contribution_to_lever_counts == 0`
  - MUST_OBSERVE: `unscoped_seed_prefix_contribution_to_lever_counts == 0`
  - MUST_OBSERVE: `levers[ai_reconstructed].candidateCount == 5 || levers[ai_reconstructed].candidateCount excludes test/seed and equals real seeded count`
  - MUST_OBSERVE: `isTestSeedRoute used or table purged of test:/seed:`
  - MUST_NOT_OBSERVE: `levers[ai_reconstructed].candidateCount == 45`
  - MUST_NOT_OBSERVE: `levers[ai_reconstructed].candidateCount includes 40 test: rows`
  - MUST_NOT_OBSERVE: `terminalStates inflated by seed: unresolved alone without production rows`
  - MUST_NOT_OBSERVE: `empty scrub that zeros production levers`
  - MUST_NOT_OBSERVE: `candidates == 0 when 5 real rows exist`

### AC-4 — Prefix-scoped harness still counts test: rows; live path has no silent take(N) final cap

**Requirement:** GIVEN prefix harness fixtures under test:redhatfix07- and a codebase where the pre-fix live path used .take(500) per status WHEN coverageReport is called with routeIdPrefix='test:redhatfix07-' and source of live counting path is re-queried after fix THEN harness test rows are counted under the prefix; the live unscoped counting implementation no longer uses silent take(500) as the final count source; re-running coverageReport on the oversized fixture remains exhaustive (not flaky partial)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-prefix-and-no-take-cap.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: prefix path also scrubs empty removing harness rows; hardcoded lever candidateCount on prefix path; take(500) still present on live coverage path; static report ignoring catalog size; stub empty zero candidates
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix07-prefix-harness`
  - ACTION (api_client): Seed test:redhatfix07-harness-ai and test:redhatfix07-harness-nr; Call coverageReport({ routeIdPrefix: 'test:redhatfix07-' }); Assert ai_reconstructed and name_routed candidates include harness rows; Static-source or behavioral proof: live unscoped path final counts do not depend on .take(500)
  - MUST_OBSERVE: `prefix_levers[ai_reconstructed].candidateCount >= 1`
  - MUST_OBSERVE: `prefix_levers[name_routed].candidateCount >= 1`
  - MUST_OBSERVE: `live_path_silent_take_500_final_count == false`
  - MUST_OBSERVE: `second_coverageReport_on_oversized_fixture candidates stable == seeded truth`
  - MUST_NOT_OBSERVE: `prefix candidates.length == 0`
  - MUST_NOT_OBSERVE: `routeId test:redhatfix07-harness-ai missing from prefix-scoped counts`
  - MUST_NOT_OBSERVE: `take(500) path used for final unscoped count`
  - MUST_NOT_OBSERVE: `empty levers`
  - MUST_NOT_OBSERVE: `candidates == 0 when seeded >0 under prefix`

### AC-5 — Post-fix report is the only valid founder input; operator rebatch verification documented

**Requirement:** GIVEN the pre-fix truncated report produced false ai_reconstructed/name_routed zeros and must not drive accept/reject WHEN after the counting fix lands, operator either re-runs live coverageReport on real Convex with N>500 seeds (CI primary) and/or documents re-run of pnpm tsx scripts/backfill-curated-geometry.ts --all for the full catalog THEN integration proves trustworthy counts on real Convex; operator notes require a fresh post-fix coverageReport before Founder accept/reject; pre-fix truncated packet is rejected as evidence

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX07-post-fix-trustworthy-report.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: founder accept allowed to cite pre-fix truncated report as sole evidence; hardcoded lever candidateCount; take(500) still present on live coverage path; static report ignoring catalog size; stub empty zero candidates
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix07-minority-buried-after-500`
  - ACTION (operator): After fix, re-query live coverageReport against oversized+minority fixture on real Convex; Capture levers and assert no false zeros; Record operator verification note: full-catalog rebatch command pnpm tsx scripts/backfill-curated-geometry.ts --all required before production Founder decision if live catalog still has residual unprocessed work
  - MUST_OBSERVE: `levers[ai_reconstructed].candidateCount == 15`
  - MUST_OBSERVE: `levers[name_routed].candidateCount == 12`
  - MUST_OBSERVE: `post_fix_report_trustworthy == true`
  - MUST_OBSERVE: `operator_note_includes == 'pnpm tsx scripts/backfill-curated-geometry.ts --all' || docs mention full-batch re-run before founder accept`
  - MUST_NOT_OBSERVE: `levers[ai_reconstructed].candidateCount == 0`
  - MUST_NOT_OBSERVE: `levers[name_routed].candidateCount == 0`
  - MUST_NOT_OBSERVE: `pre_fix_truncated_report_used_for_accept == true`
  - MUST_NOT_OBSERVE: `empty levers`
  - MUST_NOT_OBSERVE: `take(500) path used for final count`

## TEST CRITERIA (boolean — map 1:1+ to ACs)

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | Live coverageReport returns scraped_promoted candidateCount == 520 when 520 generated scraped_promoted rows are seeded (N>500 exhaustive) | AC-1 | `npx vitest run convex/__tests__/REDHATFIX07-exhaustive-over-500.integration.test.ts -t 'TC-1'` |
| TC-2 | With 500 scraped_promoted + 15 ai_reconstructed + 12 name_routed generated, levers report candidateCount 15 and 12 respectively (not 0) | AC-2 | `npx vitest run convex/__tests__/REDHATFIX07-minority-provenance-not-zero.integration.test.ts -t 'TC-2'` |
| TC-3 | Unscoped live coverageReport does not count test: or seed: routeIds toward lever candidateCount or terminalStates; production-like rows still count | AC-3 | `npx vitest run convex/__tests__/REDHATFIX07-test-seed-hygiene.integration.test.ts -t 'TC-3'` |
| TC-4 | coverageReport({routeIdPrefix:'test:redhatfix07-'}) still counts harness test rows; live final counting path does not use silent take(500) | AC-4 | `npx vitest run convex/__tests__/REDHATFIX07-prefix-and-no-take-cap.integration.test.ts -t 'TC-4'` |
| TC-5 | Post-fix re-query of coverageReport on the minority-buried fixture remains exhaustive; pre-fix truncated zeros are not acceptable founder evidence | AC-5 | `npx vitest run convex/__tests__/REDHATFIX07-post-fix-trustworthy-report.integration.test.ts -t 'TC-5'` |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `convex/curatedGeometry.ts` | 1235-1388 | coverageReport query: persisted runId branch vs live scan; leverCounts; take(500) bug at 1330-1360 |
| `convex/curatedGeometry.ts` | 1330-1360 | BUG SITE: for each geometryStatus .withIndex('by_geometry_status').take(500) silent cap driving false zero candidateCounts |
| `convex/curatedGeometry.ts` | 1102-1121 | buildLeverRows maps leverCounts → candidateCount/passCount/realizedRate for PRD yield assumptions |
| `convex/curatedGeometry.ts` | 194-278 | listForGeometryBackfill + listAllRoutesForReset real .paginate() continueCursor/isDone multi-call patterns |
| `convex/curatedGeometry.ts` | 3086-3190 | listRetirementCandidates: one .paginate() per function; cursor-encoded multi-status walk; isTestSeedRoute scrub (FIX-03/06) — pattern reference, not copy take caps |
| `convex/curatedGeometry.ts` | 1905-2000 | seedS5T1* public_api fixtures — extend or add bulk seed for N>500 REDHATFIX07 pools |
| `convex/lib/top50Eligibility.ts` | 1-40 | isTestSeedRoute / TEST_SEED_ROUTE_MARKERS — reuse for coverage hygiene (FIX-03 extended) |
| `convex/schema.ts` | 180-210 | curated_routes indexes including by_geometry_status; add aggregate table only if strategy B |
| `convex/_generated/ai/guidelines.md` | 1-120 | Convex API rules: one paginate per function, validators, no unbounded collect on large tables |
| `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/REDHAT-FIX-03-scrub-test-seed-retirement-candidates.md` | 1-120 | FIX-03 scrubbed export only — this task extends hygiene to coverageReport / optional table purge |
| `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/REDHAT-FIX-01-remove-live-coverage-stubs-real-all-batch.md` | 1-80 | Live vs persisted report semantics; do not reintroduce isDone/totalCostUSD stubs while fixing counts |
| `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/REDHAT-FIX-04-zero-candidate-low-yield-escalation.md` | 1-60 | Zero-candidate escalation depends on honest candidateCount — truncated zeros falsify CAP-GEO-04 decisions |
| `scripts/backfill-curated-geometry.ts` | 1-80 | Operator --all entrypoint for post-fix full-batch re-run |
| `convex/__tests__/REDHATFIX03-retirement-seed-scrub.integration.test.ts` | 1-80 | Integration pattern for test:/seed: scrub proof against real Convex |
| `convex/__tests__/REDHATFIX01-live-coverage-no-stubs.integration.test.ts` | 1-80 | Live coverageReport integration harness style |

## GUARDRAILS

### WRITE-ALLOWED
- convex/curatedGeometry.ts (MODIFY — live coverageReport counting path; optional purge mutation; optional multi-page count helpers)
- convex/schema.ts (MODIFY only if strategy B adds aggregate/counter table or additive index e.g. by_geometry_status_and_provenance)
- convex/lib/top50Eligibility.ts (MODIFY only if shared predicate needs export/extension already used by FIX-03)
- convex/curatedGeometryTestSupport.ts (MODIFY/NEW bulk seed + cleanup for N>500 fixtures if not in curatedGeometry.ts)
- convex/__tests__/REDHATFIX07-*.integration.test.ts (NEW)
- scripts/backfill-curated-geometry.ts (MODIFY minimal if operator rebatch wiring needed)
- scripts/geometry-coverage-report.ts (MODIFY minimal if report reader must surface exhaustive/scan metadata)
- scripts/*purge* or scripts/*coverage* (NEW/MODIFY small operator purge helper if table purge chosen)

### WRITE-PROHIBITED
- react-native/** (no UI for this task)
- unrelated sprint task bodies and S4/S3 REDHAT fixes outside hygiene shared helpers
- weakening tools/validate-scenario contracts or fakeable must_observe
- reintroducing live isDone:true + totalCostUSD:0 stubs (REDHAT-FIX-01)
- mocking ctx.db as primary proof
- deleting production motorcycleroads:* rows that are not test:/seed: contamination
- accepting Founder decision on pre-fix truncated coverageReport

## CODE PATTERN

**Pattern:** Primary recommended: replace live-path .take(500) with exhaustive counting. Strategy A — multi-call .paginate() orchestration to completion (existing listForGeometryBackfill / listAllRoutesForReset continueCursor/isDone loops; optional cursor-encoded multi-status walk like listRetirementCandidates but without a fixed final cap that drops unread pages). Strategy B — indexed aggregate/counter table updated on geometryStatus/geometryProvenance/riderReady writes; coverageReport reads aggregates. Either way ACs prove N>500 and minority-buried correctness. Reuse isTestSeedRoute for unscoped exclusion or add purge mutation for residual test:/seed: rows.

**Pattern source:** `convex/curatedGeometry.ts:194-278 (.paginate helpers); convex/curatedGeometry.ts:3086-3190 (cursor-encoded status walk + isTestSeedRoute); convex/lib/top50Eligibility.ts:isTestSeedRoute`

**Anti-pattern:** .take(500) per geometryStatus as a complete catalog scan for lever candidateCount; treating candidateCount:0 as real when minority provenances exist past the first 500 rows; counting test:/seed: as production levers on the unscoped founder path; Founder accept/reject on a pre-fix truncated coverageReport

### Interaction notes
- No RN UI. Operator + founder consume coverageReport / acceptance packet only.
- Convex allows exactly ONE .paginate() per function — exhaustive multi-status counts cannot loop paginate inside a single query. Prefer either: (A) multi-invocation accumulate (internalQuery page + action/mutation loop, or cursor-encoded resume until isDone with no silent drop of unread pages), or (B) write-time aggregate counters keyed by geometryProvenance (+ optional geometryStatus).
- Per-row curated_route_geometry joins for passCount on ~6k rows risk 16MB read limits — if strategy A retains per-row joins, accumulate across pages; if limits bind, store pass/verdict fields used for counting on route or aggregates.
- Unscoped path: exclude isTestSeedRoute OR purge contamination from table. Prefix/idSet path: keep test rows for harness isolation (parity with FIX-03 AC-2).
- Do not break REDHAT-FIX-01: live path still must not claim completed full-batch isDone/totalCostUSD stubs.

## DESIGN REFERENCES

- SPRINT.md (Sprint 05 batch acceptance gate)
- UC-REC-04 AC-7 realized-yield acceptance
- CAP-GEO-04 all-levers-failed / founder decision honesty
- REDHAT-FIX-03 export scrub (extend to coverage counts)
- REDHAT-FIX-01 live vs persisted coverage semantics
- REDHAT-FIX-06 / listRetirementCandidates one-paginate cursor encoding

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| All Tests Pass | `npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts` | Exit 0 |
| Typecheck | `pnpm type-check` | Exit 0 |
| Lint | `pnpm exec biome check convex scripts` | Exit 0 |
| Convex build | `pnpm convex:dev --once` | Exit 0 |
| Operator full-batch re-run (when required for production accept) | `pnpm tsx scripts/backfill-curated-geometry.ts --all` | Completes or documents residual with non-truncated post-fix coverageReport; Founder must not accept on pre-fix truncated packet |

## AGENT ASSIGNMENT

- **Implementer:** `convex-implementer` — coverageReport live-branch lever counting, curated_routes hygiene (test:/seed: purge or exclusion), and any aggregate/pagination helpers are Convex-backend only. No RN UI. Primary proof is integration against real Convex with N>500 status buckets so a remaining take(500) cannot green.
- **Reviewer:** `convex-reviewer`
- **Proposed by:** `convex-planner`

## AGENT INSTRUCTIONS (TDD flow)

For each AC in order (AC-1 PRIMARY first):
1. **RED** — write the failing integration test at the VERIFY path; run it; capture failure evidence (must fail on current take(500) path).
2. **GREEN** — minimal implementation in WRITE-ALLOWED files until the AC's VERIFY exits 0.
3. **REFACTOR** — clean up without breaking VERIFY; keep exhaustive counting and test/seed hygiene.
4. Do not mark AC done without re-running its VERIFY command.

## ORCHESTRATOR VERIFICATION PROTOCOL

1. Confirm every AC VERIFY and the suite `npx vitest run convex/__tests__/REDHATFIX07-*.integration.test.ts` exit 0.
2. Confirm `pnpm type-check` and `pnpm exec biome check convex scripts` exit 0.
3. Confirm live counting path no longer ends in silent `.take(500)` as the final source of lever candidateCount.
4. Before Founder accept/reject: require a post-fix trustworthy coverageReport (not the pre-fix truncated packet).

## EVIDENCE GATES

- Integration test stdout for each AC (RED evidence before GREEN).
- API response captures of coverageReport levers with N>500 and minority provenance counts.
- Optional operator log of `pnpm tsx scripts/backfill-curated-geometry.ts --all` for full-catalog rebatch.

## REVIEW CRITERIA

- Behavioral ACs remain unfakeable (take(500) stub / hardcoded zeros must fail).
- CAP-GEO-04 boundary: honest lever candidateCounts for founder decisions.
- FIX-03 hygiene extended to coverage counts; prefix harness isolation preserved.
- REDHAT-FIX-01 live vs persisted semantics not re-broken.

## DEPENDENCIES

- **depends_on:** REDHAT-FIX-01, REDHAT-FIX-03, REDHAT-FIX-04, REDHAT-FIX-06
- **blocks:** S5-T4 founder accept/reject on live realized yield (honest packet), Sprint 05 gate: Founder-Operator acceptance of full-batch rider-ready vs expected-yield table, Sprint 10 honesty if still relying on truncated coverageReport lever zeros

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/CONVEX-RULES.md (if present)
- brain/docs/CONVEX-TESTING.md (if present)
- brain/docs/CODING-STANDARDS.md (if present)
- Validators-first; returns validators on public functions; withIndex not filter for status membership; no silent truncation

## NOTES

Orchestrator investigation 2026-07-25T03:35Z: 5959 total rows; ~2930 generated; ~2893 unresolved; 202 test/seed contamination still in curated_routes. BUG at curatedGeometry.ts:1330-1360 .take(500) per status → ai_reconstructed 71 real and name_routed 11 real undercounted to candidateCount:0. REDHAT-FIX-03 scrubbed listRetirementCandidates only — this task extends hygiene to coverageReport and optionally purges the table. Primary CI proof is integration with N>500 seeds on real Convex; full live --all rebatch is an operator verification step before production Founder accept, not a substitute for the unfakeable N>500 integration ACs. CAP-GEO-05 is consumed (couch unlock already done); CAP-GEO-04 boundary requires honest lever counts for founder escalation/accept. estimate_minutes kept at 120 as stubbed.

PRD refs: UC-REC-04 AC-7, T-REC-017, T-REC-019, CAP-GEO-04

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-07",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "redhatfix07-oversized-generated-bucket": {
      "description": "Seed N>500 generated rows under a unique production-like prefix so unscoped (or prefix-scoped production) live coverageReport must count beyond any take(500). Exact N is fixed and asserted.",
      "seed_method": "public_api",
      "records": [
        "520 rows geometryStatus=generated geometryProvenance=scraped_promoted routeId motorcycleroads:redhatfix07-gen-scraped-001..520 (or equivalent non-test production-like ids under a dedicated purgeable prefix)",
        "Optionally 30 generated with verificationVerdict=pass and curated_route_geometry for passCount proof",
        "Cleanup: delete/purge fixture prefix after test via public_api test support"
      ]
    },
    "redhatfix07-minority-buried-after-500": {
      "description": "Reproduces the false-zero bug: majority provenance fills the first 500 of a status bucket; minority ai_reconstructed and name_routed appear only after position 500.",
      "seed_method": "public_api",
      "records": [
        "500 rows geometryStatus=generated geometryProvenance=scraped_promoted (fill the would-be take(500) window first by insertion/order that matches by_geometry_status scan order)",
        "15 rows geometryStatus=generated geometryProvenance=ai_reconstructed routeId motorcycleroads:redhatfix07-ai-001..015",
        "12 rows geometryStatus=generated geometryProvenance=name_routed routeId motorcycleroads:redhatfix07-nr-001..012",
        "Truth: levers.ai_reconstructed.candidateCount == 15; name_routed.candidateCount == 12; scraped_promoted.candidateCount >= 500"
      ]
    },
    "redhatfix07-contamination-pool": {
      "description": "Mix of production-like routes and test:/seed: contamination that must not pollute unscoped lever/terminal counts (extends FIX-03 hygiene from export-only to coverage counts / optional table purge).",
      "seed_method": "public_api",
      "records": [
        "40 rows routeId test:redhatfix07-cont-001..040 geometryStatus=generated geometryProvenance=ai_reconstructed",
        "10 rows routeId seed:redhatfix07-cont-001..010 geometryStatus=unresolved",
        "5 rows routeId motorcycleroads:redhatfix07-real-001..005 geometryStatus=generated geometryProvenance=ai_reconstructed",
        "Unscoped coverageReport must not count the 40+10 test/seed into production levers; real ai_reconstructed candidates >= 5 (or exact after isolation)"
      ]
    },
    "redhatfix07-prefix-harness": {
      "description": "Prefix-scoped isolation for integration harnesses: routeIdPrefix=test:redhatfix07- must still see test rows when intentionally scoped.",
      "seed_method": "public_api",
      "records": [
        "routeId test:redhatfix07-harness-ai geometryStatus=generated geometryProvenance=ai_reconstructed",
        "routeId test:redhatfix07-harness-nr geometryStatus=generated geometryProvenance=name_routed",
        "coverageReport({ routeIdPrefix: 'test:redhatfix07-' }) counts harness rows"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN 520+ generated rows of known provenance WHEN live coverageReport runs THEN lever candidateCount equals exhaustive seeded count (not capped at 500, not false zero)",
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
            "take(500) still present on live coverage path",
            "hardcoded lever candidateCount",
            "stub empty zero candidates",
            "static report ignoring catalog size",
            "counts that only work for <=500-row buckets (candidates == 500 when seeded == 520)"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix07-oversized-generated-bucket",
            "action": {
              "actor": "operator",
              "steps": [
                "Seed 520 generated scraped_promoted rows via public_api",
                "Query live coverageReport",
                "Assert levers scraped_promoted candidateCount == 520"
              ]
            },
            "end_state": {
              "must_observe": [
                "levers[scraped_promoted].candidateCount == 520",
                "terminalStates.generated >= 520 || scoped generated count == 520"
              ],
              "must_not_observe": [
                "levers[scraped_promoted].candidateCount == 500",
                "levers[scraped_promoted].candidateCount == 0",
                "candidates == 0 when seeded >500",
                "take(500) path used for final count",
                "empty levers"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Live coverageReport returns scraped_promoted candidateCount == 520 when 520 generated scraped_promoted rows are seeded",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-exhaustive-over-500.integration.test.ts -t 'TC-1'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN 500 majority scraped_promoted generated plus 15 ai_reconstructed and 12 name_routed generated buried after the first 500 WHEN live coverageReport runs THEN minority candidateCounts equal 15 and 12 not 0",
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
            "take(500) still present on live coverage path",
            "ai_reconstructed candidateCount hardcoded 0",
            "name_routed candidateCount hardcoded 0",
            "stub empty zero candidates for minority levers",
            "static report ignoring buried rows past first 500 of status bucket"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix07-minority-buried-after-500",
            "action": {
              "actor": "operator",
              "steps": [
                "Seed majority+minority fixture via public_api",
                "Query live coverageReport",
                "Assert ai_reconstructed==15 and name_routed==12"
              ]
            },
            "end_state": {
              "must_observe": [
                "levers[ai_reconstructed].candidateCount == 15",
                "levers[name_routed].candidateCount == 12",
                "levers[scraped_promoted].candidateCount >= 500"
              ],
              "must_not_observe": [
                "levers[ai_reconstructed].candidateCount == 0",
                "levers[name_routed].candidateCount == 0",
                "candidates == 0 when seeded >0 for minority",
                "take(500) path used for final count",
                "empty levers"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "With 500 scraped_promoted + 15 ai_reconstructed + 12 name_routed generated, levers report candidateCount 15 and 12 respectively (not 0)",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-minority-provenance-not-zero.integration.test.ts -t 'TC-2'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN test:/seed: contamination mixed with production-like rows WHEN unscoped live coverageReport runs THEN test/seed do not contribute to lever/terminal counts; production rows still count (purge or exclude)",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-test-seed-hygiene.integration.test.ts",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "test: rows still counted in unscoped lever candidates",
            "seed: rows still counted in unscoped terminalStates",
            "stub empty report that zeros all levers including production rows",
            "mock scrub that only drops one prefix and leaves test: in counts",
            "take(500) still used so contamination crowds real rows out of the sample"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix07-contamination-pool",
            "action": {
              "actor": "operator",
              "steps": [
                "Seed contamination + real pool",
                "Optionally purge test/seed via public_api",
                "Query unscoped live coverageReport",
                "Assert production-only lever counts"
              ]
            },
            "end_state": {
              "must_observe": [
                "unscoped_test_prefix_contribution_to_lever_counts == 0",
                "unscoped_seed_prefix_contribution_to_lever_counts == 0",
                "levers[ai_reconstructed].candidateCount == 5 || equals real-only seeded count"
              ],
              "must_not_observe": [
                "levers[ai_reconstructed].candidateCount == 45",
                "levers[ai_reconstructed].candidateCount includes 40 test: rows",
                "empty scrub that zeros production levers",
                "candidates == 0 when 5 real rows exist"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Unscoped live coverageReport does not count test: or seed: routeIds toward lever candidateCount or terminalStates; production-like rows still count",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-test-seed-hygiene.integration.test.ts -t 'TC-3'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN prefix harness test rows WHEN coverageReport is scoped with routeIdPrefix test:redhatfix07- THEN harness rows count; live unscoped final path has no silent take(500) cap",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-prefix-and-no-take-cap.integration.test.ts",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "prefix path also scrubs empty removing harness rows",
            "hardcoded lever candidateCount on prefix path",
            "take(500) still present on live coverage path",
            "static report ignoring catalog size",
            "stub empty zero candidates"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix07-prefix-harness",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed prefix harness rows",
                "Call coverageReport with routeIdPrefix test:redhatfix07-",
                "Assert harness lever counts and no take(500) final path"
              ]
            },
            "end_state": {
              "must_observe": [
                "prefix_levers[ai_reconstructed].candidateCount >= 1",
                "prefix_levers[name_routed].candidateCount >= 1",
                "live_path_silent_take_500_final_count == false"
              ],
              "must_not_observe": [
                "prefix candidates.length == 0",
                "take(500) path used for final unscoped count",
                "empty levers",
                "candidates == 0 when seeded >0 under prefix"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "coverageReport({routeIdPrefix:'test:redhatfix07-'}) still counts harness test rows; live final counting path does not use silent take(500)",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-prefix-and-no-take-cap.integration.test.ts -t 'TC-4'"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN post-fix counting WHEN re-querying coverageReport on minority-buried fixture THEN counts remain exhaustive; Founder accept must not use pre-fix truncated report; operator full --all rebatch documented when required",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-post-fix-trustworthy-report.integration.test.ts",
      "test_tier": "integration",
      "flow_ref": "UC-REC-04",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "founder accept allowed to cite pre-fix truncated report as sole evidence",
            "hardcoded lever candidateCount",
            "take(500) still present on live coverage path",
            "static report ignoring catalog size",
            "stub empty zero candidates"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix07-minority-buried-after-500",
            "action": {
              "actor": "operator",
              "steps": [
                "Re-query live coverageReport after fix",
                "Assert no false zeros",
                "Document operator full-batch re-run command for production catalog"
              ]
            },
            "end_state": {
              "must_observe": [
                "levers[ai_reconstructed].candidateCount == 15",
                "levers[name_routed].candidateCount == 12",
                "post_fix_report_trustworthy == true"
              ],
              "must_not_observe": [
                "levers[ai_reconstructed].candidateCount == 0",
                "levers[name_routed].candidateCount == 0",
                "pre_fix_truncated_report_used_for_accept == true",
                "empty levers",
                "take(500) path used for final count"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Post-fix re-query of coverageReport on the minority-buried fixture remains exhaustive; pre-fix truncated zeros are not acceptable founder evidence",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHATFIX07-post-fix-trustworthy-report.integration.test.ts -t 'TC-5'"
    }
  ]
}
-->
