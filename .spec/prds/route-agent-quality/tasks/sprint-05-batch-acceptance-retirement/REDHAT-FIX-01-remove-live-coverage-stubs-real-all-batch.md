# REDHAT-FIX-01 — Remove live coverageReport stubs and prove a real `--all` batch

> Status: Backlog
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | REDHAT-FIX-01 |
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
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-02, REDHAT-FIX-05 |

RUNTIME_COMMANDS:
- integration: `npx vitest run convex/__tests__/REDHATFIX01-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex scripts`
- build: `pnpm convex:dev --once`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

coverageReport (persisted by runId and any live path that claims batch completeness) returns real isDone/continueCursor/totalCostUSD from runFullBatch; a real --all execution leaves totalCostUSD > 0, a cursor transcript, and no isDone=true + unresolved residual contradiction; RED then GREEN integration tests prove the stub path is gone.

## BACKGROUND

Red-hat review 2026-07-25T02:13:34Z (NEEDS_REVISION BLOCK). Closes F2, F9 (undefined 0/0 context for live report honesty), F10, F11. Primary unblocks live acceptance binding and human gate re-run.

**Objective:** Eliminate the semantic stubs on the live coverageReport path and prove a real full-batch run produces non-degenerate cost, cursor, and completeness telemetry that operators and founders can trust for acceptance.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** derive isDone, continueCursor, and totalCostUSD from persisted full-batch state (batch_acceptance_artifacts coverage_report written by persistCoverageReport / runFullBatch), never hardcode them on the live branch
- **MUST** execute (or prove via integration against real Convex) a real pnpm tsx scripts/backfill-curated-geometry.ts --all path that yields totalCostUSD > 0 and a non-null cursor transcript when the batch is multi-page or cost-stopped
- **MUST** reconcile isDone with terminalStates.unresolved and continueCursor: isDone=true only when the batch truly completed (batchStopReason completed and no residual unprocessed work claimed complete)
- **NEVER** leave isDone:true and totalCostUSD:0 hardcoded on the live coverageReport branch (curatedGeometry.ts:1330-1344)
- **NEVER** treat a point-in-time catalog scan with unresolved residual as a completed full batch
- **NEVER** accept re-authored/seeded gate logs as proof of a real --all run
- **STRICTLY** a live unscoped coverageReport without a bound runId must either return source that does not claim completion, or surface the latest real full-batch runId's persisted fields — never invent completeness

## SPECIFICATION

**Objective:** Eliminate the semantic stubs on the live coverageReport path and prove a real full-batch run produces non-degenerate cost, cursor, and completeness telemetry that operators and founders can trust for acceptance.

**Success state:** coverageReport (persisted by runId and any live path that claims batch completeness) returns real isDone/continueCursor/totalCostUSD from runFullBatch; a real --all execution leaves totalCostUSD > 0, a cursor transcript, and no isDone=true + unresolved residual contradiction; RED then GREEN integration tests prove the stub path is gone.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `redhatfix01-cost-stop-resume-pool` (seed_method: `public_api`): Test-support route pool sized so a small --max-cost stops mid-batch with continueCursor and partial page totals; used to prove non-zero cost and non-null cursor without claiming isDone prematurely
  - routeIds test:redhatfix01-cost-01..N with couchGateStatus pass
  - runFullBatchWithSeams --max-cost small enough to stop mid-list
  - persisted coverage_report runId with totalCostUSD > 0, isDone false, continueCursor non-null
- `redhatfix01-completed-batch-report` (seed_method: `public_api`): Completed full-batch coverage_report artifact written only via persistCoverageReport from executeFullBatch (not seedS5T1* fixture seeds)
  - runId redhatfix01-completed-batch
  - isDone true, continueCursor null, totalCostUSD > 0, batchStopReason completed
  - terminalStates consistent with processed routes (not unresolved=500 with isDone true)
- `redhatfix01-live-scan-without-run` (seed_method: `public_api`): Catalog point-in-time scan with no bound full-batch runId — must not hardcode isDone true / totalCostUSD 0 as a completed batch
  - unscoped coverageReport with no runId and no latest completed coverage_report
  - or live branch explicitly labeled as scan-not-batch without claiming completeness

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Live coverageReport no longer hardcodes isDone/totalCostUSD

**Requirement:** GIVEN the live branch of curatedGeometry.coverageReport (no usable persisted runId path) exists at convex/curatedGeometry.ts ~1330-1344 WHEN an operator queries coverageReport without a real completed run binding or with a bound runId THEN isDone and totalCostUSD are never the hardcoded pair (true, 0) regardless of catalog state; when a runId is bound, values match the persisted coverage_report from persistCoverageReport; when unbound, the response does not claim a completed batch with zero cost

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX01-live-coverage-no-stubs.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: hardcoded isDone:true stub remains on live branch; hardcoded totalCostUSD:0 static return regardless of catalog state; mock coverageReport always returns isDone:true and totalCostUSD:0; empty live branch with no real run still claims completed batch
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix01-live-scan-without-run`
  - ACTION (operator): Query curatedGeometry:coverageReport with no runId on a catalog that has residual unresolved routes; Capture isDone, totalCostUSD, continueCursor, source, terminalStates
  - MUST_OBSERVE: `!(isDone == true && totalCostUSD == 0)`
  - MUST_OBSERVE: `source == 'live' || source == 'persisted'`
  - MUST_OBSERVE: `terminalStates.unresolved >= 0`
  - MUST_NOT_OBSERVE: `isDone == true && totalCostUSD == 0`
  - MUST_NOT_OBSERVE: `totalCostUSD == 0 with isDone == true as completed batch stub`
  - MUST_NOT_OBSERVE: `empty coverageReport with no fields`

### AC-2 — Persisted runId report returns real cost and isDone from runFullBatch

**Requirement:** GIVEN a full-batch was executed via runFullBatch / runFullBatchWithSeams which called persistCoverageReport WHEN coverageReport is queried with that runId THEN source is persisted, totalCostUSD equals the cumulative batch cost (>0 for a cost-bearing page), isDone and continueCursor match the last page of the batch

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX01-persisted-cost-cursor.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: hardcoded totalCostUSD:0 on persisted runId path; mock persistCoverageReport that never writes cost; stub runFullBatch that skips cost accounting; empty coverage_report with totalCostUSD missing
- EVIDENCE: `db_query` (required_capture: True)
- CASE 1 — start_ref `redhatfix01-cost-stop-resume-pool`
  - ACTION (operator): Seed cost-stop pool with couch PASS; Invoke runFullBatchWithSeams with small maxCost and unique runId; Query coverageReport({runId}); Optionally resume with continueCursor and re-query
  - MUST_OBSERVE: `totalCostUSD > 0`
  - MUST_OBSERVE: `source == 'persisted'`
  - MUST_OBSERVE: `isDone == false`
  - MUST_OBSERVE: `continueCursor.length >= 1`
  - MUST_OBSERVE: `pageCostUSD > 0 || cumulativeCostUSD > 0`
  - MUST_NOT_OBSERVE: `totalCostUSD == 0`
  - MUST_NOT_OBSERVE: `isDone == true && continueCursor.length >= 1`
  - MUST_NOT_OBSERVE: `continueCursor == null while isDone == false`
  - MUST_NOT_OBSERVE: `empty cost fields`

### AC-3 — isDone reconciles with terminalStates.unresolved and batchStopReason

**Requirement:** GIVEN a coverage report claims isDone true WHEN the report is inspected for terminalStates and stop reason THEN isDone true is only returned when the batch completed under an explicit batchStopReason of completed (or equivalent) and does not mislabel a pure unresolved-catalog scan as done

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX01-isDone-reconcile.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: hardcoded isDone:true on incomplete batch; static batchStopReason empty while isDone true; stub that sets isDone true without completed stop reason; mock terminalStates.unresolved == 500 with isDone true
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix01-completed-batch-report`
  - ACTION (operator): Produce a completed batch report via real persistCoverageReport path; Produce a cost-stopped partial report; Assert isDone/continueCursor/batchStopReason/terminalStates consistency for both
  - MUST_OBSERVE: `completed.isDone == true`
  - MUST_OBSERVE: `completed.continueCursor == null`
  - MUST_OBSERVE: `completed.batchStopReason == 'completed'`
  - MUST_OBSERVE: `partial.isDone == false`
  - MUST_OBSERVE: `partial.continueCursor.length >= 1`
  - MUST_OBSERVE: `incomplete_run rejection reason == 'incomplete_run'`
  - MUST_NOT_OBSERVE: `isDone == true && continueCursor.length >= 1`
  - MUST_NOT_OBSERVE: `batchStopReason == null && isDone == true`
  - MUST_NOT_OBSERVE: `empty batchStopReason on completed report`
  - MUST_NOT_OBSERVE: `totalCostUSD == 0 forced on completed multi-page batch`

### AC-4 — Real --all operator path leaves a non-null cursor/cost transcript

**Requirement:** GIVEN Sprint 04 couch gate is PASS on the real deployment WHEN the operator runs pnpm tsx scripts/backfill-curated-geometry.ts --all (or a cost-capped multi-page equivalent that exercises the same driver) THEN stdout/transcript includes totalCostUSD or cumulativeCostUSD > 0 (or pageCostUSD on at least one page), runId, and continueCursor fields; the transcript is not empty of provider/cost signals

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX01-operator-all-transcript.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: static shell that never calls runFullBatch; hardcoded totalCostUSD:0 in operator transcript; mock driver that skips provider cost accounting; empty transcript with no runId or cost fields
- EVIDENCE: `stdout` (required_capture: True)
- CASE 1 — start_ref `redhatfix01-cost-stop-resume-pool`
  - ACTION (operator): Ensure couch gate PASS for the test subject pool; Invoke full-batch driver (runFullBatchWithSeams or backfill --all --waterfall with max-cost) against real Convex; Capture stdout JSON for totalCostUSD/cumulativeCostUSD/continueCursor/runId/isDone
  - MUST_OBSERVE: `totalCostUSD > 0 || cumulativeCostUSD > 0 || pageCostUSD > 0`
  - MUST_OBSERVE: `runId.length >= 1`
  - MUST_OBSERVE: `isDone == false`
  - MUST_OBSERVE: `continueCursor.length >= 1`
  - MUST_NOT_OBSERVE: `totalCostUSD == 0 && isDone == true`
  - MUST_NOT_OBSERVE: `runId.length == 0`
  - MUST_NOT_OBSERVE: `empty transcript`
  - MUST_NOT_OBSERVE: `continueCursor == null while isDone == false`

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Unscoped or unbound live coverageReport does not return the hardcoded pair isDone true and totalCostUSD 0 as a completed batch | AC-1 | `npx vitest run convex/__tests__/REDHATFIX01-live-coverage-no-stubs.integration.test.ts -t 'TC-1'` |
| TC-2 | coverageReport for a runId produced by runFullBatch returns totalCostUSD greater than 0 after a cost-bearing page | AC-2 | `npx vitest run convex/__tests__/REDHATFIX01-persisted-cost-cursor.integration.test.ts -t 'TC-2'` |
| TC-3 | Partial batch reports have isDone false and non-null continueCursor; completed reports have isDone true and null continueCursor | AC-3 | `npx vitest run convex/__tests__/REDHATFIX01-isDone-reconcile.integration.test.ts -t 'TC-3'` |
| TC-4 | Operator full-batch driver transcript includes runId and a positive cost field from the real Convex action | AC-4 | `npx vitest run convex/__tests__/REDHATFIX01-operator-all-transcript.integration.test.ts -t 'TC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometry.ts (MODIFY)
- convex/waterfallOrchestrator.ts (MODIFY, only if needed to surface cost/cursor into report)
- scripts/backfill-curated-geometry.ts (MODIFY, minimal driver wiring)
- scripts/geometry-coverage-report.ts (MODIFY, minimal)
- convex/__tests__/REDHATFIX01-*.integration.test.ts (NEW)
- convex/schema.ts (MODIFY only if additive fields for batch completeness provenance)

**writeProhibited:**
- react-native/**
- re-authoring seeded gate logs as proof
- convex/__tests__/S5T1-*.integration.test.ts (do not weaken existing oracles)
- Marking sprint goal complete without a real batch

## READING LIST

- `convex/curatedGeometry.ts` (1330-1344) — live coverageReport stubs isDone:true totalCostUSD:0
- `convex/curatedGeometry.ts` (1145-1192) — persistCoverageReport real fields
- `convex/curatedGeometry.ts` (1198-1231) — persisted runId branch of coverageReport
- `convex/waterfallOrchestrator.ts` (890-1136) — buildCoverageFromWaterfall + persistCoverageReport + cost/cursor
- `convex/waterfallOrchestrator.ts` (1142-1180) — runFullBatch / runFullBatchWithSeams entrypoints
- `scripts/backfill-curated-geometry.ts` (1-80) — operator --all driver
- `scripts/geometry-coverage-report.ts` (1-80) — operator report reader
- `.spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T021334Z.md` (42-44,79-83) — F2 F10 F11 findings
- `convex/_generated/ai/guidelines.md` — Convex API rules

## CODE PATTERN

**Pattern:** Derive isDone/totalCostUSD/continueCursor from persistCoverageReport / runFullBatch page state
**Source:** convex/waterfallOrchestrator.ts:executeFullBatch + curatedGeometry.persistCoverageReport
**Anti-pattern:** Hardcoding isDone:true and totalCostUSD:0 on the live branch

**Interaction notes:**
- Persisted path already correct; fix the live fallback and prove operator --all path writes real cost

## DESIGN

**References:**
- SPRINT.md
- .spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T021334Z.md
- S5-T1-full-all-batch-coverage-report-acceptance-low-yield-escalation.md

## VERIFICATION GATES

- **All Tests Pass**: `npx vitest run convex/__tests__/REDHATFIX01-` → Exit 0
- **Typecheck**: `pnpm type-check` → Exit 0
- **Lint**: `pnpm exec biome check convex scripts` → Exit 0
- **Convex build**: `pnpm convex:dev --once` → Exit 0
- **Operator full batch (evidence)**: `pnpm tsx scripts/backfill-curated-geometry.ts --all` → Transcript with runId, totalCostUSD/cumulativeCostUSD > 0 or multi-page cursor; not isDone+0 cost stub

## CAPABILITY CHAIN

- touches: CAP-GEO-05
- provides: real_full_batch_coverage_report, non_stub_isDone_totalCostUSD, cursor_transcript_for_gate
- consumes: CAP-GEO-05 couch-sample PASS, runFullBatch / backfill --all driver
- boundary_contracts:
  - coverageReport live branch must not claim isDone=true or totalCostUSD=0 without a real persisted runFullBatch artifact
  - isDone must reconcile with terminalStates and continueCursor (unresolved>0 + isDone=true is invalid without explicit batchStopReason)

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — Live coverageReport stubs and full-batch cost/cursor persistence live entirely in Convex + the operator driver; no UI surface.
- Reviewer: `convex-reviewer`

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/RED-FIRST-TEST-GATE.md
- brain/docs/kanban/SCENARIO-CONTRACT-V1.md

## DEPENDENCIES

- depends_on: —
- blocks: REDHAT-FIX-02, REDHAT-FIX-05

## NOTES

Closes F2, F9 (undefined 0/0 context for live report honesty), F10, F11. Primary unblocks live acceptance binding and human gate re-run.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-01",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "redhatfix01-cost-stop-resume-pool": {
      "description": "Test-support route pool sized so a small --max-cost stops mid-batch with continueCursor and partial page totals; used to prove non-zero cost and non-null cursor without claiming isDone prematurely",
      "seed_method": "public_api",
      "records": [
        "routeIds test:redhatfix01-cost-01..N with couchGateStatus pass",
        "runFullBatchWithSeams --max-cost small enough to stop mid-list",
        "persisted coverage_report runId with totalCostUSD > 0, isDone false, continueCursor non-null"
      ]
    },
    "redhatfix01-completed-batch-report": {
      "description": "Completed full-batch coverage_report artifact written only via persistCoverageReport from executeFullBatch (not seedS5T1* fixture seeds)",
      "seed_method": "public_api",
      "records": [
        "runId redhatfix01-completed-batch",
        "isDone true, continueCursor null, totalCostUSD > 0, batchStopReason completed",
        "terminalStates consistent with processed routes (not unresolved=500 with isDone true)"
      ]
    },
    "redhatfix01-live-scan-without-run": {
      "description": "Catalog point-in-time scan with no bound full-batch runId \u2014 must not hardcode isDone true / totalCostUSD 0 as a completed batch",
      "seed_method": "public_api",
      "records": [
        "unscoped coverageReport with no runId and no latest completed coverage_report",
        "or live branch explicitly labeled as scan-not-batch without claiming completeness"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN the live branch of coverageReport WHEN queried without inventing a completed batch THEN isDone/totalCostUSD are never the hardcoded (true, 0) stub pair",
      "verify": "npx vitest run convex/__tests__/REDHATFIX01-live-coverage-no-stubs.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "hardcoded isDone:true stub remains on live branch",
            "hardcoded totalCostUSD:0 static return regardless of catalog state",
            "mock coverageReport always returns isDone:true and totalCostUSD:0",
            "empty live branch with no real run still claims completed batch"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix01-live-scan-without-run",
            "action": {
              "actor": "operator",
              "steps": [
                "Query curatedGeometry:coverageReport with no runId on a catalog that has residual unresolved routes",
                "Capture isDone, totalCostUSD, continueCursor, source, terminalStates"
              ]
            },
            "end_state": {
              "must_observe": [
                "!(isDone == true && totalCostUSD == 0)",
                "source == 'live' || source == 'persisted'",
                "terminalStates.unresolved >= 0"
              ],
              "must_not_observe": [
                "isDone == true && totalCostUSD == 0",
                "totalCostUSD == 0 with isDone == true as completed batch stub",
                "empty coverageReport with no fields"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Unscoped or unbound live coverageReport does not return the hardcoded pair isDone true and totalCostUSD 0 as a completed batch",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX01-live-coverage-no-stubs.integration.test.ts -t 'TC-1'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN a real runFullBatch persist WHEN coverageReport is queried by runId THEN totalCostUSD and isDone/continueCursor match persisted batch state with totalCostUSD > 0 after cost-bearing work",
      "verify": "npx vitest run convex/__tests__/REDHATFIX01-persisted-cost-cursor.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "hardcoded totalCostUSD:0 on persisted runId path",
            "mock persistCoverageReport that never writes cost",
            "stub runFullBatch that skips cost accounting",
            "empty coverage_report with totalCostUSD missing"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix01-cost-stop-resume-pool",
            "action": {
              "actor": "operator",
              "steps": [
                "Seed cost-stop pool with couch PASS",
                "Invoke runFullBatchWithSeams with small maxCost and unique runId",
                "Query coverageReport({runId})",
                "Optionally resume with continueCursor and re-query"
              ]
            },
            "end_state": {
              "must_observe": [
                "totalCostUSD > 0",
                "source == 'persisted'",
                "isDone == false",
                "continueCursor.length >= 1",
                "pageCostUSD > 0 || cumulativeCostUSD > 0"
              ],
              "must_not_observe": [
                "totalCostUSD == 0",
                "isDone == true && continueCursor.length >= 1",
                "continueCursor == null while isDone == false",
                "empty cost fields"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "coverageReport for a runId produced by runFullBatch returns totalCostUSD greater than 0 after a cost-bearing page",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX01-persisted-cost-cursor.integration.test.ts -t 'TC-2'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN isDone claims WHEN inspecting terminalStates and batchStopReason THEN completeness is reconciled and unresolved-scan-as-done is impossible",
      "verify": "npx vitest run convex/__tests__/REDHATFIX01-isDone-reconcile.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "hardcoded isDone:true on incomplete batch",
            "static batchStopReason empty while isDone true",
            "stub that sets isDone true without completed stop reason",
            "mock terminalStates.unresolved == 500 with isDone true"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix01-completed-batch-report",
            "action": {
              "actor": "operator",
              "steps": [
                "Produce a completed batch report via real persistCoverageReport path",
                "Produce a cost-stopped partial report",
                "Assert isDone/continueCursor/batchStopReason/terminalStates consistency for both"
              ]
            },
            "end_state": {
              "must_observe": [
                "completed.isDone == true",
                "completed.continueCursor == null",
                "completed.batchStopReason == 'completed'",
                "partial.isDone == false",
                "partial.continueCursor.length >= 1",
                "incomplete_run rejection reason == 'incomplete_run'"
              ],
              "must_not_observe": [
                "isDone == true && continueCursor.length >= 1",
                "batchStopReason == null && isDone == true",
                "empty batchStopReason on completed report",
                "totalCostUSD == 0 forced on completed multi-page batch"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Partial batch reports have isDone false and non-null continueCursor; completed reports have isDone true and null continueCursor",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX01-isDone-reconcile.integration.test.ts -t 'TC-3'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN couch PASS WHEN operator full-batch path runs THEN transcript has positive cost and cursor/runId fields from real Convex",
      "verify": "npx vitest run convex/__tests__/REDHATFIX01-operator-all-transcript.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "static shell that never calls runFullBatch",
            "hardcoded totalCostUSD:0 in operator transcript",
            "mock driver that skips provider cost accounting",
            "empty transcript with no runId or cost fields"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix01-cost-stop-resume-pool",
            "action": {
              "actor": "operator",
              "steps": [
                "Ensure couch gate PASS for the test subject pool",
                "Invoke full-batch driver (runFullBatchWithSeams or backfill --all --waterfall with max-cost) against real Convex",
                "Capture stdout JSON for totalCostUSD/cumulativeCostUSD/continueCursor/runId/isDone"
              ]
            },
            "end_state": {
              "must_observe": [
                "totalCostUSD > 0 || cumulativeCostUSD > 0 || pageCostUSD > 0",
                "runId.length >= 1",
                "isDone == false",
                "continueCursor.length >= 1"
              ],
              "must_not_observe": [
                "totalCostUSD == 0 && isDone == true",
                "runId.length == 0",
                "empty transcript",
                "continueCursor == null while isDone == false"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Operator full-batch driver transcript includes runId and a positive cost field from the real Convex action",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHATFIX01-operator-all-transcript.integration.test.ts -t 'TC-4'"
    }
  ]
}
-->
