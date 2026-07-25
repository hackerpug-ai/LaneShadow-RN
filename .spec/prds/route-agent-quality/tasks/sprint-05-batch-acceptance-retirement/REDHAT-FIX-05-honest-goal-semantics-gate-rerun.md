# REDHAT-FIX-05 — Honest goal semantics, real gate re-run, Sprint 10 blocked

> Status: ✅ Completed
> Commit: 3c3a235c59956d59bcdd48629a83d68d818f845e
> Reviewer: convex-reviewer+product-manager
> Completed: 2026-07-25T03:39:25Z
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | REDHAT-FIX-05 |
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
| CAPABILITIES | CAP-GEO-03, CAP-GEO-04, CAP-GEO-05 |
| DEPENDS_ON | REDHAT-FIX-01, REDHAT-FIX-02, REDHAT-FIX-03, REDHAT-FIX-04 |
| BLOCKS | Sprint 10 Founder-region Saturday-arc (until accepted catalog exists) |

RUNTIME_COMMANDS:
- integration: `npx vitest run convex/__tests__/REDHATFIX05-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex scripts`
- build: `pnpm convex:dev --once`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

deriveGoalState / sprint-goal-state refuse complete-on-reject; new gate evidence packet has non-identical step-3/4, row-level top-50, coherent rowCount vs riderReadyCount, zero test: contamination in retirement export, and Sprint 10 blocked flag when decision is not accepted.

## BACKGROUND

Red-hat review 2026-07-25T02:13:34Z (NEEDS_REVISION BLOCK). Closes F4, F5, F6, F16, F17. Terminal sprint outcome may remain rejected; honesty requires met:false and Sprint 10 blocked until a future accepted batch.

**Objective:** Make Sprint 05 completion and human-gate evidence honest: only accepted batches complete the goal; gate re-run is un-seeded with real negative control and observable top-50 road review; Sprint 10 is visibly blocked until acceptance exists.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** refuse to set sprint-goal-state goal:complete / met:true when the recorded batch decision is rejected or escalation_required unresolved
- **MUST** re-run Human Testing Gate on un-seeded live catalog after FIX-01..04 with unified runId across report read and accept
- **MUST** capture a real step-4 negative control that is not byte-identical to step-3 (e.g. attempt accept while escalation open → escalation_required/reject)
- **MUST** emit row-level top-50 evidence (route IDs, road identity, measured vs claimed length) not aggregate-only
- **MUST** reconcile top-50 rowCount with coverageReport riderReadyCount (explain shortfall or fail coherence check)
- **MUST** flag Sprint 10 blocked when no accepted catalog exists
- **NEVER** mark goal complete on a rejected batch
- **NEVER** re-display step-3 as step-4 evidence
- **NEVER** ship aggregate-only top-50 gate logs as human road-oracle proof
- **NEVER** leave Sprint 10 appearing unblocked without accepted catalog
- **STRICTLY** completion semantics are fail-closed: rejected/escalated unresolved ⇒ met:false and goal not complete

## SPECIFICATION

**Objective:** Make Sprint 05 completion and human-gate evidence honest: only accepted batches complete the goal; gate re-run is un-seeded with real negative control and observable top-50 road review; Sprint 10 is visibly blocked until acceptance exists.

**Success state:** deriveGoalState / sprint-goal-state refuse complete-on-reject; new gate evidence packet has non-identical step-3/4, row-level top-50, coherent rowCount vs riderReadyCount, zero test: contamination in retirement export, and Sprint 10 blocked flag when decision is not accepted.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `redhatfix05-rejected-batch-decision` (seed_method: `public_api`): Acceptance artifact with decision rejected / retirement locked
  - runId redhatfix05-rejected decision rejected retirementUnlockedAt null
- `redhatfix05-accepted-batch-decision` (seed_method: `public_api`): Acceptance artifact with decision accepted and retirementUnlockedAt set
  - runId redhatfix05-accepted decision accepted
- `redhatfix05-top50-row-export` (seed_method: `cli`): Top-50 manifest with per-row identity fields for gate capture
  - scripts/top-50-curated-review.ts output with rows[].routeId,name,measuredMiles,claimedMiles
- `redhatfix05-escalation-open-report` (seed_method: `public_api`): Provenanced completed report with low/zero yield that forces escalation on accept attempt
  - runId redhatfix05-neg-control with zero-candidate or low reconstruct

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Do not mark goal complete on rejected batch

**Requirement:** GIVEN batch acceptance decision is rejected (or unresolved escalation) WHEN sprint goal state is derived or written THEN goal is not complete, met is false, and status does not claim Completed solely from process-green CI

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX05-goal-semantics.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: goal == 'complete' hardcoded on rejected decision; met == true stub despite decision == rejected; static sprint-goal-state ignores acceptance outcome; empty decision still marks complete
- EVIDENCE: `file_artifact` (required_capture: True)
- CASE 1 — start_ref `redhatfix05-rejected-batch-decision`
  - ACTION (operator): Provide rejected acceptance decision as input to goal-state derivation helper; Capture derived goal/met/status fields
  - MUST_OBSERVE: `met == false`
  - MUST_OBSERVE: `goal != 'complete'`
  - MUST_OBSERVE: `decision == 'rejected'`
  - MUST_NOT_OBSERVE: `goal == 'complete' && decision == 'rejected'`
  - MUST_NOT_OBSERVE: `met == true && decision == rejected`
  - MUST_NOT_OBSERVE: `empty decision with met == true`
- CASE 2 — start_ref `redhatfix05-accepted-batch-decision`
  - ACTION (operator): Provide accepted decision with complete un-seeded evidence; Capture derived goal state
  - MUST_OBSERVE: `decision == 'accepted'`
  - MUST_OBSERVE: `met == true only if decision == 'accepted' && gate oracles pass`
  - MUST_NOT_OBSERVE: `met == true && decision == null`
  - MUST_NOT_OBSERVE: `goal == 'complete' without acceptance artifact`
  - MUST_NOT_OBSERVE: `empty accepted decision still fails complete when other oracles fail`

### AC-2 — Real step-4 negative control distinct from step-3

**Requirement:** GIVEN a provenanced report that escalates or rejects on accept attempt WHEN gate step-4 runs (attempt accept / show escalation or rejection) THEN step-4 artifact differs from step-3 (not byte-identical) and demonstrates a real negative control mutation

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX05-step4-negative-control.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: byte-identical step-3 and step-4 static copy; stub re-display only without accept mutation; hardcoded step-4 log copied from step-3; empty negative control with no decision change
- EVIDENCE: `file_artifact` (required_capture: True)
- CASE 1 — start_ref `redhatfix05-escalation-open-report`
  - ACTION (founder): Capture step-3 comparison artifact (yields vs assumptions); Mutate by calling requestBatchAcceptance accept on open low/zero yield; Capture step-4 response (escalation_required or reject)
  - MUST_OBSERVE: `step4_bytes != step3_bytes`
  - MUST_OBSERVE: `decision == 'escalation_required' || decision == 'rejected'`
  - MUST_OBSERVE: `retirementUnlockedAt == null`
  - MUST_NOT_OBSERVE: `step4_bytes == step3_bytes`
  - MUST_NOT_OBSERVE: `decision == 'accepted'`
  - MUST_NOT_OBSERVE: `retirementUnlockedAt != null`
  - MUST_NOT_OBSERVE: `empty step-4 mutation`

### AC-3 — Row-level top-50 evidence and rowCount vs riderReadyCount reconciliation

**Requirement:** GIVEN unscoped top-50 export and coverageReport for the same catalog state WHEN gate evidence for steps 5-6 is captured THEN each row includes routeId, road identity (name), measuredMiles, claimedMiles; and rowCount is reconciled to riderReadyCount (rowCount <= riderReadyCount after scrub, or explicit coherence failure)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX05-top50-row-evidence.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: aggregate-only evidence without row fields; static top-50 log with only contaminationCount; mock rowCount == 50 with riderReadyCount == 17 unreconciled; empty rows array
- EVIDENCE: `file_artifact` (required_capture: True)
- CASE 1 — start_ref `redhatfix05-top50-row-export`
  - ACTION (operator): Run top-50 export harness; Load coverageReport riderReadyCount; Validate each row has identity fields; compute coherence check
  - MUST_OBSERVE: `rows[i].routeId.length >= 1`
  - MUST_OBSERVE: `rows[i].name.length >= 1`
  - MUST_OBSERVE: `rows[i].measuredMiles >= 0`
  - MUST_OBSERVE: `rowCount <= riderReadyCount || coherenceNote.length >= 1`
  - MUST_OBSERVE: `test: rows count == 0`
  - MUST_OBSERVE: `rowCount >= 1`
  - MUST_NOT_OBSERVE: `rows.length == 0`
  - MUST_NOT_OBSERVE: `rowCount > riderReadyCount without coherenceNote`
  - MUST_NOT_OBSERVE: `test: rows count > 0`
  - MUST_NOT_OBSERVE: `empty aggregate-only {contaminationCount:0} without rows`

### AC-4 — Sprint 10 blocked without accepted catalog

**Requirement:** GIVEN no acceptance artifact with decision accepted for a live provenanced run WHEN downstream dependency status is computed THEN Sprint 10 is flagged blocked with reason no accepted post-batch catalog

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX05-sprint10-blocked.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: Sprint 10 unblocked hardcoded when decision == rejected; stub blocked == false without accepted catalog; static dependency graph ignoring acceptance; empty accepted catalog still unblocks
- EVIDENCE: `file_artifact` (required_capture: True)
- CASE 1 — start_ref `redhatfix05-rejected-batch-decision`
  - ACTION (operator): Derive dependency flags for Sprint 10 from acceptance state; Capture blocked flag and reason
  - MUST_OBSERVE: `sprint10.blocked == true`
  - MUST_OBSERVE: `reason includes 'no accepted catalog' || reason includes 'rejected'`
  - MUST_NOT_OBSERVE: `sprint10.blocked == false`
  - MUST_NOT_OBSERVE: `decision == 'rejected' && sprint10.blocked == false`
  - MUST_NOT_OBSERVE: `empty blocked reason`

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Goal derivation sets met false when acceptance decision is rejected | AC-1 | `npx vitest run convex/__tests__/REDHATFIX05-goal-semantics.integration.test.ts -t 'TC-1'` |
| TC-2 | Step-4 accept attempt on open escalation produces a non-identical artifact with escalation_required or rejected | AC-2 | `npx vitest run convex/__tests__/REDHATFIX05-step4-negative-control.integration.test.ts -t 'TC-2'` |
| TC-3 | Top-50 gate evidence includes per-row routeId name measuredMiles claimedMiles and passes rowCount vs riderReadyCount coherence | AC-3 | `npx vitest run convex/__tests__/REDHATFIX05-top50-row-evidence.integration.test.ts -t 'TC-3'` |
| TC-4 | Sprint 10 blocked flag is true when no accepted catalog exists | AC-4 | `npx vitest run convex/__tests__/REDHATFIX05-sprint10-blocked.integration.test.ts -t 'TC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/__tests__/REDHATFIX05-*.integration.test.ts (NEW)
- scripts/top-50-curated-review.ts (MODIFY row-level evidence export)
- scripts/geometry-coverage-report.ts (MODIFY if coherence helper needed)
- convex/top50Review.ts (MODIFY only if row evidence fields missing from API)
- convex/curatedGeometry.ts (MODIFY only goal/coherence helpers if server-side)
- .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/sprint-goal-state.json (MODIFY via honest re-derive)
- .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/SPRINT.md (MODIFY status notes / Sprint 10 blocked)
- .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs/** (NEW evidence only — never rewrite old logs as fake pass)
- .spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-results.json (MODIFY after real re-run)
- scripts/*gate* / tools for deriveGoalState (NEW/MODIFY as needed for semantics)

**writeProhibited:**
- react-native/**
- Marking goal complete while decision is rejected
- Copying step-3.log to step-4.log
- Re-authoring aggregate-only evidence as row-level without real export

## READING LIST

- `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/SPRINT.md` (31-48) — Human Testing Gate steps and accept language
- `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/sprint-goal-state.json` — goal:complete met:true on rejected evidence — to fix
- `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs/step-3.log` — step-3 acceptance artifact
- `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs/step-4.log` — byte-identical to step-3 (bad negative control)
- `.spec/prds/route-agent-quality/tasks/sprint-05-batch-acceptance-retirement/gate-logs/step-5.log` — aggregate-only top-50 evidence
- `scripts/top-50-curated-review.ts` — row fields for gate capture
- `convex/top50Review.ts` (198-220) — measured/claimed miles already on rows
- `.spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T021334Z.md` (54-65,97-101) — F4 F5 F6 F16 F17

## CODE PATTERN

**Pattern:** Decision-aware goal derivation + non-degenerate gate evidence contracts
**Source:** S5-T4 human gate + sprint-goal-state.json
**Anti-pattern:** process-green CI ⇒ goal complete despite rejected batch

**Interaction notes:**
- Run after FIX-01..04; human gate re-execution is part of done-when, not optional

## DESIGN

**References:**
- S5-T4
- SPRINT.md Human Testing Gate
- red-hat F4-F6 F16 F17

## VERIFICATION GATES

- **All Tests Pass**: `npx vitest run convex/__tests__/REDHATFIX05-` → Exit 0
- **Typecheck**: `pnpm type-check` → Exit 0
- **Lint**: `pnpm exec biome check convex scripts` → Exit 0
- **Convex build**: `pnpm convex:dev --once` → Exit 0
- **Human gate re-run (un-seeded)**: `pnpm tsx scripts/backfill-curated-geometry.ts --all && pnpm tsx scripts/geometry-coverage-report.ts --run-id=<realRunId> && pnpm tsx scripts/top-50-curated-review.ts --render` → Unified runId; step-4 distinct; row-level top-50; goal met only if accepted

## CAPABILITY CHAIN

- touches: CAP-GEO-03, CAP-GEO-04, CAP-GEO-05
- provides: honest_sprint_goal_semantics, row_level_top50_gate_evidence, real_step4_negative_control, sprint10_blocked_flag_without_accepted_catalog
- consumes: REDHAT-FIX-01 real batch, REDHAT-FIX-02 runId-bound acceptance, REDHAT-FIX-03 clean retirement export, REDHAT-FIX-04 zero-candidate escalation
- boundary_contracts:
  - goal:complete/met:true only when gate decision is accepted (or explicitly resolved accept after escalation) — never on rejected
  - Human gate step-4 must mutate decision path and capture distinct artifact from step-3
  - top-50 evidence includes per-row routeId, name/road identity, measuredMiles, claimedMiles
  - Sprint 10 blocked while no accepted catalog (decision !== accepted)

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — Needs gate harness helpers, status reconciliation scripts/JSON contracts, and top-50 row-level evidence fields on Convex/scripts — not pure process prose.
- Reviewer: `convex-reviewer`

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/RED-FIRST-TEST-GATE.md
- brain/docs/kanban/SCENARIO-CONTRACT-V1.md

## DEPENDENCIES

- depends_on: REDHAT-FIX-01, REDHAT-FIX-02, REDHAT-FIX-03, REDHAT-FIX-04
- blocks: Sprint 10 Founder-region Saturday-arc (until accepted catalog exists)

## NOTES

Closes F4, F5, F6, F16, F17. Terminal sprint outcome may remain rejected; honesty requires met:false and Sprint 10 blocked until a future accepted batch.

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-05",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "redhatfix05-rejected-batch-decision": {
      "description": "Acceptance artifact with decision rejected / retirement locked",
      "seed_method": "public_api",
      "records": [
        "runId redhatfix05-rejected decision rejected retirementUnlockedAt null"
      ]
    },
    "redhatfix05-accepted-batch-decision": {
      "description": "Acceptance artifact with decision accepted and retirementUnlockedAt set",
      "seed_method": "public_api",
      "records": [
        "runId redhatfix05-accepted decision accepted"
      ]
    },
    "redhatfix05-top50-row-export": {
      "description": "Top-50 manifest with per-row identity fields for gate capture",
      "seed_method": "cli",
      "records": [
        "scripts/top-50-curated-review.ts output with rows[].routeId,name,measuredMiles,claimedMiles"
      ]
    },
    "redhatfix05-escalation-open-report": {
      "description": "Provenanced completed report with low/zero yield that forces escalation on accept attempt",
      "seed_method": "public_api",
      "records": [
        "runId redhatfix05-neg-control with zero-candidate or low reconstruct"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN rejected batch WHEN goal state is derived THEN goal is not complete and met is false",
      "verify": "npx vitest run convex/__tests__/REDHATFIX05-goal-semantics.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "goal == 'complete' hardcoded on rejected decision",
            "met == true stub despite decision == rejected",
            "static sprint-goal-state ignores acceptance outcome",
            "empty decision still marks complete"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix05-rejected-batch-decision",
            "action": {
              "actor": "operator",
              "steps": [
                "Provide rejected acceptance decision as input to goal-state derivation helper",
                "Capture derived goal/met/status fields"
              ]
            },
            "end_state": {
              "must_observe": [
                "met == false",
                "goal != 'complete'",
                "decision == 'rejected'"
              ],
              "must_not_observe": [
                "goal == 'complete' && decision == 'rejected'",
                "met == true && decision == rejected",
                "empty decision with met == true"
              ]
            }
          },
          {
            "start_ref": "redhatfix05-accepted-batch-decision",
            "action": {
              "actor": "operator",
              "steps": [
                "Provide accepted decision with complete un-seeded evidence",
                "Capture derived goal state"
              ]
            },
            "end_state": {
              "must_observe": [
                "decision == 'accepted'",
                "met == true only if decision == 'accepted' && gate oracles pass"
              ],
              "must_not_observe": [
                "met == true && decision == null",
                "goal == 'complete' without acceptance artifact",
                "empty accepted decision still fails complete when other oracles fail"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Goal derivation sets met false when acceptance decision is rejected",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX05-goal-semantics.integration.test.ts -t 'TC-1'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN step-4 negative control WHEN accept attempted on escalating report THEN artifact differs from step-3 and shows escalation/reject",
      "verify": "npx vitest run convex/__tests__/REDHATFIX05-step4-negative-control.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "byte-identical step-3 and step-4 static copy",
            "stub re-display only without accept mutation",
            "hardcoded step-4 log copied from step-3",
            "empty negative control with no decision change"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix05-escalation-open-report",
            "action": {
              "actor": "founder",
              "steps": [
                "Capture step-3 comparison artifact (yields vs assumptions)",
                "Mutate by calling requestBatchAcceptance accept on open low/zero yield",
                "Capture step-4 response (escalation_required or reject)"
              ]
            },
            "end_state": {
              "must_observe": [
                "step4_bytes != step3_bytes",
                "decision == 'escalation_required' || decision == 'rejected'",
                "retirementUnlockedAt == null"
              ],
              "must_not_observe": [
                "step4_bytes == step3_bytes",
                "decision == 'accepted'",
                "retirementUnlockedAt != null",
                "empty step-4 mutation"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Step-4 accept attempt on open escalation produces a non-identical artifact with escalation_required or rejected",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX05-step4-negative-control.integration.test.ts -t 'TC-2'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN top-50 export WHEN gate evidence is captured THEN row-level fields exist and rowCount reconciles with riderReadyCount",
      "verify": "npx vitest run convex/__tests__/REDHATFIX05-top50-row-evidence.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "aggregate-only evidence without row fields",
            "static top-50 log with only contaminationCount",
            "mock rowCount == 50 with riderReadyCount == 17 unreconciled",
            "empty rows array"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix05-top50-row-export",
            "action": {
              "actor": "operator",
              "steps": [
                "Run top-50 export harness",
                "Load coverageReport riderReadyCount",
                "Validate each row has identity fields; compute coherence check"
              ]
            },
            "end_state": {
              "must_observe": [
                "rows[i].routeId.length >= 1",
                "rows[i].name.length >= 1",
                "rows[i].measuredMiles >= 0",
                "rowCount <= riderReadyCount || coherenceNote.length >= 1",
                "test: rows count == 0",
                "rowCount >= 1"
              ],
              "must_not_observe": [
                "rows.length == 0",
                "rowCount > riderReadyCount without coherenceNote",
                "test: rows count > 0",
                "empty aggregate-only {contaminationCount:0} without rows"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Top-50 gate evidence includes per-row routeId name measuredMiles claimedMiles and passes rowCount vs riderReadyCount coherence",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX05-top50-row-evidence.integration.test.ts -t 'TC-3'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN no accepted catalog WHEN Sprint 10 dependency is evaluated THEN blocked is true",
      "verify": "npx vitest run convex/__tests__/REDHATFIX05-sprint10-blocked.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "Sprint 10 unblocked hardcoded when decision == rejected",
            "stub blocked == false without accepted catalog",
            "static dependency graph ignoring acceptance",
            "empty accepted catalog still unblocks"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix05-rejected-batch-decision",
            "action": {
              "actor": "operator",
              "steps": [
                "Derive dependency flags for Sprint 10 from acceptance state",
                "Capture blocked flag and reason"
              ]
            },
            "end_state": {
              "must_observe": [
                "sprint10.blocked == true",
                "reason includes 'no accepted catalog' || reason includes 'rejected'"
              ],
              "must_not_observe": [
                "sprint10.blocked == false",
                "decision == 'rejected' && sprint10.blocked == false",
                "empty blocked reason"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Sprint 10 blocked flag is true when no accepted catalog exists",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHATFIX05-sprint10-blocked.integration.test.ts -t 'TC-4'"
    }
  ]
}
-->
