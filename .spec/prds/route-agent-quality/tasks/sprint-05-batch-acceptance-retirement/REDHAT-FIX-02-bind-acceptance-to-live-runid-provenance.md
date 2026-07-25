# REDHAT-FIX-02 — Bind acceptance to live runId with provenance, identity, timestamp

> Status: Backlog
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | REDHAT-FIX-02 |
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
| CAPABILITIES | CAP-GEO-04, CAP-GEO-05 |
| DEPENDS_ON | REDHAT-FIX-01, REDHAT-FIX-04 |
| BLOCKS | REDHAT-FIX-05 |

RUNTIME_COMMANDS:
- integration: `npx vitest run convex/__tests__/REDHATFIX02-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex scripts`
- build: `pnpm convex:dev --once`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

requestBatchAcceptance refuses fixture-seeded reports; accepts only provenance-tied runFullBatch reports; every decision stores operatorIdentity + ISO timestamp; s5t4-live-acceptance is gone; observed lever counts match the bound report.

## BACKGROUND

Red-hat review 2026-07-25T02:13:34Z (NEEDS_REVISION BLOCK). Closes F1, F8, F15. Depends on FIX-01 for real reports and FIX-04 so live accept cannot skip escalation.

**Objective:** Close SEED_SUBSTITUTION by making acceptance auditable: same runId as the founder-read report, attested operator + time, and provenance proving the report came from a real full-batch invocation — not a seeded fixture.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** bind acceptance to the exact coverage_report runId the founder read; observedRates on the acceptance artifact must equal that report's levers
- **MUST** persist non-null operatorIdentity (len>=1) and decision.timestamp as ISO-8601 on every acceptance decision artifact
- **MUST** reject acceptance when the coverage_report lacks runFullBatch provenance (e.g. only seedS5T1LowYieldReport / fixture seed paths)
- **MUST** delete or tombstone the seeded s5t4-live-acceptance artifact so it cannot satisfy a live gate
- **NEVER** allow a seed/fixture coverage_report to satisfy a production/live acceptance step
- **NEVER** persist acceptance without operatorIdentity or ISO timestamp
- **NEVER** accept when report.isDone is false (existing incomplete_run lock must remain)
- **STRICTLY** provenance is fail-closed: missing provenance fields → NOT_PROVENANCED / rejection, not silent accept

## SPECIFICATION

**Objective:** Close SEED_SUBSTITUTION by making acceptance auditable: same runId as the founder-read report, attested operator + time, and provenance proving the report came from a real full-batch invocation — not a seeded fixture.

**Success state:** requestBatchAcceptance refuses fixture-seeded reports; accepts only provenance-tied runFullBatch reports; every decision stores operatorIdentity + ISO timestamp; s5t4-live-acceptance is gone; observed lever counts match the bound report.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `redhatfix02-real-batch-report` (seed_method: `public_api`): coverage_report written via persistCoverageReport from runFullBatch with provenance markers (batchStopReason, totalCostUSD, sourceRunKind=runFullBatch or equivalent)
  - runId redhatfix02-real-batch
  - artifactKind coverage_report
  - isDone true, totalCostUSD > 0, levers with real candidate counts
  - provenance: producedBy=runFullBatch|persistCoverageReport
- `redhatfix02-seeded-fixture-report` (seed_method: `public_api`): coverage_report shaped like s5t1-low-yield-reconstruct / s5t4-live-acceptance (10/10/10 candidates) written via seed helper only
  - runId s5t4-live-acceptance or redhatfix02-seeded
  - levers candidateCount 10/10/10 from seedS5T1LowYieldReport
  - no runFullBatch provenance
- `redhatfix02-founder-identity` (seed_method: `public_api`): Founder-authenticated caller for requestBatchAcceptance
  - devSetupFounderUser with clerkUserId used as operatorIdentity

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Acceptance binds to the same coverage_report runId the founder read

**Requirement:** GIVEN a persisted coverage_report for runId R with known lever candidateCounts WHEN the founder calls requestBatchAcceptance({runId: R, decision}) THEN the acceptance artifact references R and observedRates/levers equal the coverage_report for R (not a different report or live-unscoped scan)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX02-runId-binding.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: seed fixture report accepted under a different live scan runId; hardcoded observedRates unrelated to bound report; mock requestBatchAcceptance ignoring runId binding; empty acceptance artifact with decision == null still passes
- EVIDENCE: `db_query` (required_capture: True)
- CASE 1 — start_ref `redhatfix02-real-batch-report`
  - ACTION (founder): Read coverageReport({runId: R}); Call requestBatchAcceptance({runId: R, decision}); Query getBatchAcceptance({runId: R}) and compare levers to the report
  - MUST_OBSERVE: `acceptance.runId == R`
  - MUST_OBSERVE: `acceptance.observedRates[i].candidateCount == report.levers[i].candidateCount`
  - MUST_OBSERVE: `acceptance.decision == 'accepted' || acceptance.decision == 'rejected' || acceptance.decision == 'escalation_required'`
  - MUST_NOT_OBSERVE: `acceptance.runId != R`
  - MUST_NOT_OBSERVE: `observedRates candidateCount == 10 when report candidateCount != 10`
  - MUST_NOT_OBSERVE: `decision == null`
  - MUST_NOT_OBSERVE: `empty acceptance artifact`

### AC-2 — operatorIdentity and decision.timestamp ISO are required

**Requirement:** GIVEN a founder-authenticated acceptance call on a provenance-valid report WHEN requestBatchAcceptance succeeds for accept, reject, or escalation_required THEN the acceptance artifact includes non-null operatorIdentity (length >= 1) and decision.timestamp as a parseable ISO-8601 string

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX02-operator-timestamp.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: operatorIdentity absent/empty on acceptance artifact; hardcoded decision.timestamp omitted; stub accept path that drops identity fields; empty timestamp string still passes
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix02-founder-identity`
  - ACTION (founder): Accept or reject a provenance-valid completed report; Inspect returned payload and persisted acceptance row for operatorIdentity and decision.timestamp
  - MUST_OBSERVE: `operatorIdentity.length >= 1`
  - MUST_OBSERVE: `decision.timestamp matches ISO pattern with 'T'`
  - MUST_OBSERVE: `decision.timestamp includes 'Z' || offset`
  - MUST_NOT_OBSERVE: `operatorIdentity == null`
  - MUST_NOT_OBSERVE: `operatorIdentity == ''`
  - MUST_NOT_OBSERVE: `decision.timestamp == null`
  - MUST_NOT_OBSERVE: `decision.timestamp == ''`
  - MUST_NOT_OBSERVE: `empty identity fields`

### AC-3 — Fixture/seed coverage_report cannot satisfy acceptance

**Requirement:** GIVEN a coverage_report created only via seed helpers (e.g. seedS5T1LowYieldReport / s5t4-live-acceptance shape) without runFullBatch provenance WHEN requestBatchAcceptance is called for that runId THEN the mutation rejects with a provenance error and does not set decision accepted or retirementUnlockedAt

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX02-provenance-reject-seed.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: seed report accepted without runFullBatch provenance; mock provenance check always true; stub that skips provenance and unlocks retirement; empty provenance fields treated as valid
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix02-seeded-fixture-report`
  - ACTION (founder): Seed fixture coverage_report without runFullBatch provenance; Call requestBatchAcceptance accept; Assert rejection and lock state
  - MUST_OBSERVE: `error.code == 'NOT_PROVENANCED' || error.code == 'VALIDATION_ERROR'`
  - MUST_OBSERVE: `retirementUnlockedAt == null`
  - MUST_OBSERVE: `decision != 'accepted'`
  - MUST_NOT_OBSERVE: `decision == 'accepted'`
  - MUST_NOT_OBSERVE: `retirementUnlockedAt != null`
  - MUST_NOT_OBSERVE: `empty error (silent success)`
  - MUST_NOT_OBSERVE: `escalations.length ignored with unlock`

### AC-4 — Delete s5t4-live-acceptance seed artifact and block re-use

**Requirement:** GIVEN the seeded s5t4-live-acceptance artifact exists or is re-seeded WHEN cleanup runs and acceptance is attempted against that runId THEN the artifact is removed (or provenance-invalid) and cannot unlock retirement

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX02-delete-s5t4-seed.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: s5t4-live-acceptance seed still accepted; static seed artifact retained as live acceptance; mock delete that leaves accept path open; empty cleanup leaving retirementUnlockedAt set
- EVIDENCE: `db_query` (required_capture: True)
- CASE 1 — start_ref `redhatfix02-seeded-fixture-report`
  - ACTION (operator): Ensure s5t4-live-acceptance rows exist (coverage_report and/or acceptance); Run delete/tombstone helper or migration path; Query by runId 's5t4-live-acceptance'; Attempt requestBatchAcceptance if residual row remains
  - MUST_OBSERVE: `runId == 's5t4-live-acceptance' unlock forbidden`
  - MUST_OBSERVE: `retirementUnlockedAt == null`
  - MUST_OBSERVE: `decision == null || decision == 'rejected' || provenance reject`
  - MUST_NOT_OBSERVE: `decision == 'accepted' for 's5t4-live-acceptance'`
  - MUST_NOT_OBSERVE: `retirementUnlockedAt != null from seed`
  - MUST_NOT_OBSERVE: `empty delete with residual unlock`
  - MUST_NOT_OBSERVE: `seed artifact still satisfies live gate`

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Acceptance observedRates match the bound coverage_report levers for the same runId | AC-1 | `npx vitest run convex/__tests__/REDHATFIX02-runId-binding.integration.test.ts -t 'TC-1'` |
| TC-2 | Acceptance artifact includes non-null operatorIdentity and ISO decision.timestamp | AC-2 | `npx vitest run convex/__tests__/REDHATFIX02-operator-timestamp.integration.test.ts -t 'TC-2'` |
| TC-3 | requestBatchAcceptance rejects a seed-only coverage_report lacking runFullBatch provenance | AC-3 | `npx vitest run convex/__tests__/REDHATFIX02-provenance-reject-seed.integration.test.ts -t 'TC-3'` |
| TC-4 | s5t4-live-acceptance cannot unlock retirement after cleanup | AC-4 | `npx vitest run convex/__tests__/REDHATFIX02-delete-s5t4-seed.integration.test.ts -t 'TC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometry.ts (MODIFY)
- convex/schema.ts (MODIFY additive fields for operatorIdentity, decisionTimestamp, reportProvenance)
- convex/waterfallOrchestrator.ts (MODIFY stamp provenance on persist)
- convex/__tests__/REDHATFIX02-*.integration.test.ts (NEW)
- scripts/geometry-coverage-report.ts (MODIFY if needed to always print runId)

**writeProhibited:**
- react-native/**
- re-seeding s5t4-live-acceptance as live gate proof
- Weakening incomplete_run or low-yield locks
- Accepting seed reports by prefix allow-list bypass

## READING LIST

- `convex/curatedGeometry.ts` (1443-1541) — requestBatchAcceptance loads coverage_report by runId only; no identity/timestamp/provenance
- `convex/curatedGeometry.ts` (1145-1192) — persistCoverageReport — attach provenance here
- `convex/curatedGeometry.ts` (1910-1960) — seedS5T1LowYieldReport fixture shape used for s5t4-live-acceptance
- `convex/schema.ts` (440-488) — batch_acceptance_artifacts fields to extend (operatorIdentity, timestamp, provenance)
- `convex/waterfallOrchestrator.ts` (1091-1103) — persistCoverageReport call site for provenance stamping
- `.spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T021334Z.md` (38-39,73-74,94-95) — F1 F8 F15

## CODE PATTERN

**Pattern:** Fail-closed provenance stamp at persistCoverageReport; require founder identity fields on accept
**Source:** requireFounder + batch_acceptance_artifacts upsert
**Anti-pattern:** Accept any coverage_report by runId including seed fixtures

**Interaction notes:**
- Coordinate with REDHAT-FIX-04 so accept on live zero-candidate data cannot auto-unlock before provenance binds

## DESIGN

**References:**
- S5-T1 task
- S5-T4 AC-1
- red-hat F1/F8/F15

## VERIFICATION GATES

- **All Tests Pass**: `npx vitest run convex/__tests__/REDHATFIX02-` → Exit 0
- **Typecheck**: `pnpm type-check` → Exit 0
- **Lint**: `pnpm exec biome check convex scripts` → Exit 0
- **Convex build**: `pnpm convex:dev --once` → Exit 0

## CAPABILITY CHAIN

- touches: CAP-GEO-04, CAP-GEO-05
- provides: runId_bound_acceptance_artifact, operatorIdentity_and_ISO_timestamp_on_decision, coverage_report_runFullBatch_provenance_gate
- consumes: real_full_batch_coverage_report (REDHAT-FIX-01), detectLowYieldEscalations safety (REDHAT-FIX-04)
- boundary_contracts:
  - requestBatchAcceptance only accepts coverage_report rows provenance-tied to runFullBatch/persistCoverageReport (not seedS5T1* / fixture seeds)
  - acceptance artifact must carry non-null operatorIdentity and decision.timestamp ISO
  - founder-read report runId must equal acceptance runId (no cross-report accept)

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — Acceptance mutation, artifact schema, and provenance checks are Convex-only; founder identity already enforced via requireFounder.
- Reviewer: `convex-reviewer`

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/RED-FIRST-TEST-GATE.md
- brain/docs/kanban/SCENARIO-CONTRACT-V1.md

## DEPENDENCIES

- depends_on: REDHAT-FIX-01, REDHAT-FIX-04
- blocks: REDHAT-FIX-05

## NOTES

Closes F1, F8, F15. Depends on FIX-01 for real reports and FIX-04 so live accept cannot skip escalation.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-02",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "redhatfix02-real-batch-report": {
      "description": "coverage_report written via persistCoverageReport from runFullBatch with provenance markers (batchStopReason, totalCostUSD, sourceRunKind=runFullBatch or equivalent)",
      "seed_method": "public_api",
      "records": [
        "runId redhatfix02-real-batch",
        "artifactKind coverage_report",
        "isDone true, totalCostUSD > 0, levers with real candidate counts",
        "provenance: producedBy=runFullBatch|persistCoverageReport"
      ]
    },
    "redhatfix02-seeded-fixture-report": {
      "description": "coverage_report shaped like s5t1-low-yield-reconstruct / s5t4-live-acceptance (10/10/10 candidates) written via seed helper only",
      "seed_method": "public_api",
      "records": [
        "runId s5t4-live-acceptance or redhatfix02-seeded",
        "levers candidateCount 10/10/10 from seedS5T1LowYieldReport",
        "no runFullBatch provenance"
      ]
    },
    "redhatfix02-founder-identity": {
      "description": "Founder-authenticated caller for requestBatchAcceptance",
      "seed_method": "public_api",
      "records": [
        "devSetupFounderUser with clerkUserId used as operatorIdentity"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN coverage_report runId R WHEN founder accepts THEN acceptance binds to R and observedRates match that report",
      "verify": "npx vitest run convex/__tests__/REDHATFIX02-runId-binding.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "seed fixture report accepted under a different live scan runId",
            "hardcoded observedRates unrelated to bound report",
            "mock requestBatchAcceptance ignoring runId binding",
            "empty acceptance artifact with decision == null still passes"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix02-real-batch-report",
            "action": {
              "actor": "founder",
              "steps": [
                "Read coverageReport({runId: R})",
                "Call requestBatchAcceptance({runId: R, decision})",
                "Query getBatchAcceptance({runId: R}) and compare levers to the report"
              ]
            },
            "end_state": {
              "must_observe": [
                "acceptance.runId == R",
                "acceptance.observedRates[i].candidateCount == report.levers[i].candidateCount",
                "acceptance.decision == 'accepted' || acceptance.decision == 'rejected' || acceptance.decision == 'escalation_required'"
              ],
              "must_not_observe": [
                "acceptance.runId != R",
                "observedRates candidateCount == 10 when report candidateCount != 10",
                "decision == null",
                "empty acceptance artifact"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Acceptance observedRates match the bound coverage_report levers for the same runId",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX02-runId-binding.integration.test.ts -t 'TC-1'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN founder accept/reject/escalate WHEN artifact is persisted THEN operatorIdentity and ISO decision.timestamp are non-null",
      "verify": "npx vitest run convex/__tests__/REDHATFIX02-operator-timestamp.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "operatorIdentity absent/empty on acceptance artifact",
            "hardcoded decision.timestamp omitted",
            "stub accept path that drops identity fields",
            "empty timestamp string still passes"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix02-founder-identity",
            "action": {
              "actor": "founder",
              "steps": [
                "Accept or reject a provenance-valid completed report",
                "Inspect returned payload and persisted acceptance row for operatorIdentity and decision.timestamp"
              ]
            },
            "end_state": {
              "must_observe": [
                "operatorIdentity.length >= 1",
                "decision.timestamp matches ISO pattern with 'T'",
                "decision.timestamp includes 'Z' || offset"
              ],
              "must_not_observe": [
                "operatorIdentity == null",
                "operatorIdentity == ''",
                "decision.timestamp == null",
                "decision.timestamp == ''",
                "empty identity fields"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Acceptance artifact includes non-null operatorIdentity and ISO decision.timestamp",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX02-operator-timestamp.integration.test.ts -t 'TC-2'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN seed-only coverage_report WHEN accept is requested THEN provenance check rejects and retirement stays locked",
      "verify": "npx vitest run convex/__tests__/REDHATFIX02-provenance-reject-seed.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "seed report accepted without runFullBatch provenance",
            "mock provenance check always true",
            "stub that skips provenance and unlocks retirement",
            "empty provenance fields treated as valid"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix02-seeded-fixture-report",
            "action": {
              "actor": "founder",
              "steps": [
                "Seed fixture coverage_report without runFullBatch provenance",
                "Call requestBatchAcceptance accept",
                "Assert rejection and lock state"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'NOT_PROVENANCED' || error.code == 'VALIDATION_ERROR'",
                "retirementUnlockedAt == null",
                "decision != 'accepted'"
              ],
              "must_not_observe": [
                "decision == 'accepted'",
                "retirementUnlockedAt != null",
                "empty error (silent success)",
                "escalations.length ignored with unlock"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "requestBatchAcceptance rejects a seed-only coverage_report lacking runFullBatch provenance",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX02-provenance-reject-seed.integration.test.ts -t 'TC-3'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN s5t4-live-acceptance seed WHEN cleanup/accept attempted THEN artifact is gone or fail-closed and cannot unlock retirement",
      "verify": "npx vitest run convex/__tests__/REDHATFIX02-delete-s5t4-seed.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "s5t4-live-acceptance seed still accepted",
            "static seed artifact retained as live acceptance",
            "mock delete that leaves accept path open",
            "empty cleanup leaving retirementUnlockedAt set"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix02-seeded-fixture-report",
            "action": {
              "actor": "operator",
              "steps": [
                "Ensure s5t4-live-acceptance rows exist (coverage_report and/or acceptance)",
                "Run delete/tombstone helper or migration path",
                "Query by runId 's5t4-live-acceptance'",
                "Attempt requestBatchAcceptance if residual row remains"
              ]
            },
            "end_state": {
              "must_observe": [
                "runId == 's5t4-live-acceptance' unlock forbidden",
                "retirementUnlockedAt == null",
                "decision == null || decision == 'rejected' || provenance reject"
              ],
              "must_not_observe": [
                "decision == 'accepted' for 's5t4-live-acceptance'",
                "retirementUnlockedAt != null from seed",
                "empty delete with residual unlock",
                "seed artifact still satisfies live gate"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "s5t4-live-acceptance cannot unlock retirement after cleanup",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHATFIX02-delete-s5t4-seed.integration.test.ts -t 'TC-4'"
    }
  ]
}
-->
