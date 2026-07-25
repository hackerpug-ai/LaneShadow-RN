# REDHAT-FIX-04 — Escalate zero-candidate levers (close live auto-unlock)

> Status: ✅ Completed
> Commit: 97bada1d68ba79b36e00e46647dddfb2bd5ebafc
> Reviewer: convex-reviewer+product-manager
> Completed: 2026-07-25T03:39:23Z
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | REDHAT-FIX-04 |
| SPRINT | [Sprint 05 — Batch acceptance + retirement](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 90 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-04, CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-02, REDHAT-FIX-05 |

RUNTIME_COMMANDS:
- integration: `npx vitest run convex/__tests__/REDHATFIX04-*.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check convex scripts`
- build: `pnpm convex:dev --once`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

detectLowYieldEscalations escalates zero-candidate floored levers; accept stays locked until founder resolution; reason text does not misstate 0/0 as 0.0%.

## BACKGROUND

Red-hat review 2026-07-25T02:13:34Z (NEEDS_REVISION BLOCK). Closes F7 and the live-path half of F9. Must land before FIX-02 acceptance binding is proven safe on live-shaped data.

**Objective:** Close the live-data auto-unlock path where reconstruct/reroute candidateCount=0 silently skipped floor checks, allowing accept without escalation.

## 🚫 CRITICAL CONSTRAINTS (Never tier)

- **MUST** remove the silent continue when candidateCount<=0 for levers with non-null escalationFloor
- **MUST** emit an escalation with an explicit reason code for zero_candidates / undefined_rate inspection
- **MUST** keep requestBatchAcceptance(decision=accept) returning escalation_required when such escalations exist (retirementUnlockedAt null)
- **NEVER** treat 0/0 as realizedRate 0.0% mathematically for floor comparison without labeling undefined
- **NEVER** allow live reconstruct/reroute candidateCount=0 to auto-accept and unlock retirement
- **NEVER** escalate lever 1 when escalationFloor is null (still unproven assumption)
- **STRICTLY** zero-candidate levers with a floor are fail-closed inspection signals, not success

## SPECIFICATION

**Objective:** Close the live-data auto-unlock path where reconstruct/reroute candidateCount=0 silently skipped floor checks, allowing accept without escalation.

**Success state:** detectLowYieldEscalations escalates zero-candidate floored levers; accept stays locked until founder resolution; reason text does not misstate 0/0 as 0.0%.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `redhatfix04-zero-candidate-levers` (seed_method: `public_api`): Completed coverage_report with promote candidates>0 and reconstruct/reroute candidateCount=0 (live-shaped), escalationFloor 0.4 on levers 2/3
  - runId redhatfix04-zero-cand with runFullBatch provenance for accept path tests
  - levers: promote candidates>=1; reconstruct candidates=0; reroute candidates=0
  - isDone true
- `redhatfix04-low-yield-nonzero` (seed_method: `public_api`): Existing low-yield reconstruct 1/10 still escalates (regression)
  - reconstruct candidates=10 passCount=1 realizedRate=0.1
- `redhatfix04-promote-only-floor-null` (seed_method: `public_api`): Only promote lever has data; escalationFloor null — no zero-candidate escalation for promote
  - promote candidates=5; reconstruct/reroute 0 still escalate as floored levers

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Zero-candidate floored lever produces escalation

**Requirement:** GIVEN a completed report where reconstruct and/or reroute have candidateCount=0 and non-null escalationFloor WHEN detectLowYieldEscalations runs (via requestBatchAcceptance accept) THEN escalations include those levers with reason indicating zero_candidates or undefined_rate inspection (not silent skip)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX04-zero-candidate-escalation.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: hardcoded candidateCount<=0 continue skip still present; stub detectLowYieldEscalations that returns escalations.length == 0; mock requestBatchAcceptance that auto-accepts on zero candidates; empty escalations with decision == accepted unlock
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix04-zero-candidate-levers`
  - ACTION (founder): Persist zero-candidate reconstruct/reroute report; Call requestBatchAcceptance({decision:'accept'}); Inspect escalations array
  - MUST_OBSERVE: `decision == 'escalation_required'`
  - MUST_OBSERVE: `escalations.length >= 1`
  - MUST_OBSERVE: `escalations includes lever == 'reconstruct' || lever == 'reroute'`
  - MUST_OBSERVE: `reason includes 'zero_candidates' || reason includes 'undefined_rate'`
  - MUST_OBSERVE: `retirementUnlockedAt == null`
  - MUST_NOT_OBSERVE: `decision == 'accepted'`
  - MUST_NOT_OBSERVE: `escalations.length == 0`
  - MUST_NOT_OBSERVE: `retirementUnlockedAt != null`
  - MUST_NOT_OBSERVE: `empty escalations silent pass`

### AC-2 — 0/0 is not reported as a defined 0.0% rate below floor

**Requirement:** GIVEN candidateCount=0 for a floored lever WHEN escalation reason is generated THEN reason does not claim a defined realized rate of 0.0% as the sole mathematical basis; it states zero candidates / undefined rate / inspection required

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX04-undefined-rate-reason.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: hardcoded reason only says realized rate 0.0% is below floor; stub that treats 0/0 as defined rate 0 without zero-candidate label; mock reason builder omitting undefined_rate; empty reason string
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix04-zero-candidate-levers`
  - ACTION (api_client): Trigger escalation for zero-candidate reconstruct; Capture escalation.reason and any rate fields
  - MUST_OBSERVE: `reason includes 'zero_candidates' || reason includes 'undefined_rate' || reason includes 'inspection'`
  - MUST_OBSERVE: `candidateCount == 0`
  - MUST_OBSERVE: `candidates == 0`
  - MUST_NOT_OBSERVE: `reason == 'reconstruct realized rate 0.0% is below escalation floor 40%' only`
  - MUST_NOT_OBSERVE: `candidateCount > 0 falsely`
  - MUST_NOT_OBSERVE: `empty reason`

### AC-3 — Non-zero low yield still escalates (regression)

**Requirement:** GIVEN reconstruct 1 PASS / 10 candidates (rate 0.1 < 0.4 floor) WHEN accept is requested THEN escalation_required still fires for low realized rate (existing S5-T1 behavior preserved)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX04-nonzero-low-yield-regression.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: regression removing low-yield floor check; stub that only handles zero-candidate path; mock accept that unlocks on realizedRate == 0.1; empty escalations for 1/10 reconstruct
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix04-low-yield-nonzero`
  - ACTION (founder): Seed low-yield reconstruct report; requestBatchAcceptance accept
  - MUST_OBSERVE: `decision == 'escalation_required'`
  - MUST_OBSERVE: `escalations[0].lever == 'reconstruct'`
  - MUST_OBSERVE: `passCount == 1`
  - MUST_OBSERVE: `candidates == 10`
  - MUST_OBSERVE: `realizedRate == 0.1`
  - MUST_OBSERVE: `retirementUnlockedAt == null`
  - MUST_NOT_OBSERVE: `decision == 'accepted'`
  - MUST_NOT_OBSERVE: `escalations.length == 0`
  - MUST_NOT_OBSERVE: `retirementUnlockedAt != null`
  - MUST_NOT_OBSERVE: `empty low-yield regression`

### AC-4 — Promote with null floor does not zero-candidate-escalate

**Requirement:** GIVEN PRD promote lever has escalationFloor null (unproven) WHEN promote candidateCount is 0 or >0 THEN promote is not escalated solely for zero candidates; floored levers 2/3 still escalate when zero

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-REC-04
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX04-promote-floor-null.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- tier: `visible` · test_tier: `integration` · verification_service: `Convex dev deployment` · topology: `single-node`
- NEGATIVE_CONTROL — would fail if: promote escalated despite null escalationFloor stub; hardcoded all levers always escalate; mock floor check ignoring escalationFloor == null; empty promote floor handling
- EVIDENCE: `api_response` (required_capture: True)
- CASE 1 — start_ref `redhatfix04-promote-only-floor-null`
  - ACTION (api_client): Build lever rows from PRD_YIELD_ASSUMPTIONS; Run detectLowYieldEscalations via accept path
  - MUST_OBSERVE: `promote escalations count == 0`
  - MUST_OBSERVE: `escalations for lever == 'promote' count == 0`
  - MUST_OBSERVE: `reconstruct escalations count >= 1 || reroute escalations count >= 1`
  - MUST_NOT_OBSERVE: `lever == 'promote' in escalations`
  - MUST_NOT_OBSERVE: `escalations.length == 0 when reconstruct/reroute candidates == 0`
  - MUST_NOT_OBSERVE: `empty floor-null handling for promote`

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | requestBatchAcceptance returns escalation_required when reconstruct candidateCount is 0 with non-null escalationFloor | AC-1 | `npx vitest run convex/__tests__/REDHATFIX04-zero-candidate-escalation.integration.test.ts -t 'TC-1'` |
| TC-2 | Zero-candidate escalation reason labels undefined rate or zero candidates rather than only 0.0% below floor | AC-2 | `npx vitest run convex/__tests__/REDHATFIX04-undefined-rate-reason.integration.test.ts -t 'TC-2'` |
| TC-3 | Low non-zero reconstruct rate still escalates | AC-3 | `npx vitest run convex/__tests__/REDHATFIX04-nonzero-low-yield-regression.integration.test.ts -t 'TC-3'` |
| TC-4 | Promote lever with null escalationFloor is not escalated for zero candidates | AC-4 | `npx vitest run convex/__tests__/REDHATFIX04-promote-floor-null.integration.test.ts -t 'TC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometry.ts (MODIFY detectLowYieldEscalations + related reason builders)
- convex/__tests__/REDHATFIX04-*.integration.test.ts (NEW)

**writeProhibited:**
- react-native/**
- Removing low-yield floor entirely
- Auto-accepting zero-candidate levers

## READING LIST

- `convex/curatedGeometry.ts` (1409-1441) — detectLowYieldEscalations silent skip at candidateCount<=0
- `convex/curatedGeometry.ts` (1039-1064) — PRD_YIELD_ASSUMPTIONS floors
- `convex/curatedGeometry.ts` (1488-1506) — accept path uses escalations to block unlock
- `convex/__tests__/S5T1-low-yield-escalation.integration.test.ts` — existing low-yield tests to keep green
- `.spec/reviews/red-hat-sprint-05-batch-acceptance-retirement-20260725T021334Z.md` (70-77) — F7 F9

## CODE PATTERN

**Pattern:** Zero-candidate + non-null floor → escalation inspection signal; non-zero below floor → existing rate escalation
**Source:** detectLowYieldEscalations
**Anti-pattern:** if (candidateCount <= 0) continue

**Interaction notes:**
- Blocks FIX-02 live accept safety and FIX-05 gate honesty

## DESIGN

**References:**
- S5-T1 AC-3
- red-hat F7/F9

## VERIFICATION GATES

- **All Tests Pass**: `npx vitest run convex/__tests__/REDHATFIX04-` → Exit 0
- **S5T1 low-yield regression**: `npx vitest run convex/__tests__/S5T1-low-yield-escalation.integration.test.ts` → Exit 0
- **Typecheck**: `pnpm type-check` → Exit 0
- **Lint**: `pnpm exec biome check convex scripts` → Exit 0
- **Convex build**: `pnpm convex:dev --once` → Exit 0

## CAPABILITY CHAIN

- touches: CAP-GEO-04, CAP-GEO-05
- provides: zero_candidate_escalation_signal, live_path_no_auto_unlock
- consumes: PRD_YIELD_ASSUMPTIONS escalationFloor
- boundary_contracts:
  - Levers with non-null escalationFloor and candidateCount<=0 produce escalation_required (inspection signal), not silent pass
  - 0/0 is not a defined realized rate; reason must not claim '0.0% below floor' without defining undefined rate
  - Lever 1 promote with escalationFloor null still skips (unproven assumption)

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — Pure Convex escalation logic in detectLowYieldEscalations and requestBatchAcceptance; no UI.
- Reviewer: `convex-reviewer`

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/RED-FIRST-TEST-GATE.md
- brain/docs/kanban/SCENARIO-CONTRACT-V1.md

## DEPENDENCIES

- depends_on: —
- blocks: REDHAT-FIX-02, REDHAT-FIX-05

## NOTES

Closes F7 and the live-path half of F9. Must land before FIX-02 acceptance binding is proven safe on live-shaped data.

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-04",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "redhatfix04-zero-candidate-levers": {
      "description": "Completed coverage_report with promote candidates>0 and reconstruct/reroute candidateCount=0 (live-shaped), escalationFloor 0.4 on levers 2/3",
      "seed_method": "public_api",
      "records": [
        "runId redhatfix04-zero-cand with runFullBatch provenance for accept path tests",
        "levers: promote candidates>=1; reconstruct candidates=0; reroute candidates=0",
        "isDone true"
      ]
    },
    "redhatfix04-low-yield-nonzero": {
      "description": "Existing low-yield reconstruct 1/10 still escalates (regression)",
      "seed_method": "public_api",
      "records": [
        "reconstruct candidates=10 passCount=1 realizedRate=0.1"
      ]
    },
    "redhatfix04-promote-only-floor-null": {
      "description": "Only promote lever has data; escalationFloor null \u2014 no zero-candidate escalation for promote",
      "seed_method": "public_api",
      "records": [
        "promote candidates=5; reconstruct/reroute 0 still escalate as floored levers"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN floored lever candidateCount=0 WHEN accept is requested THEN escalation_required and retirement stays locked",
      "verify": "npx vitest run convex/__tests__/REDHATFIX04-zero-candidate-escalation.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "hardcoded candidateCount<=0 continue skip still present",
            "stub detectLowYieldEscalations that returns escalations.length == 0",
            "mock requestBatchAcceptance that auto-accepts on zero candidates",
            "empty escalations with decision == accepted unlock"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix04-zero-candidate-levers",
            "action": {
              "actor": "founder",
              "steps": [
                "Persist zero-candidate reconstruct/reroute report",
                "Call requestBatchAcceptance({decision:'accept'})",
                "Inspect escalations array"
              ]
            },
            "end_state": {
              "must_observe": [
                "decision == 'escalation_required'",
                "escalations.length >= 1",
                "escalations includes lever == 'reconstruct' || lever == 'reroute'",
                "reason includes 'zero_candidates' || reason includes 'undefined_rate'",
                "retirementUnlockedAt == null"
              ],
              "must_not_observe": [
                "decision == 'accepted'",
                "escalations.length == 0",
                "retirementUnlockedAt != null",
                "empty escalations silent pass"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "requestBatchAcceptance returns escalation_required when reconstruct candidateCount is 0 with non-null escalationFloor",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHATFIX04-zero-candidate-escalation.integration.test.ts -t 'TC-1'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN 0/0 WHEN escalation reason is formed THEN undefined/zero-candidate language is used not bare 0.0%",
      "verify": "npx vitest run convex/__tests__/REDHATFIX04-undefined-rate-reason.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "hardcoded reason only says realized rate 0.0% is below floor",
            "stub that treats 0/0 as defined rate 0 without zero-candidate label",
            "mock reason builder omitting undefined_rate",
            "empty reason string"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix04-zero-candidate-levers",
            "action": {
              "actor": "api_client",
              "steps": [
                "Trigger escalation for zero-candidate reconstruct",
                "Capture escalation.reason and any rate fields"
              ]
            },
            "end_state": {
              "must_observe": [
                "reason includes 'zero_candidates' || reason includes 'undefined_rate' || reason includes 'inspection'",
                "candidateCount == 0",
                "candidates == 0"
              ],
              "must_not_observe": [
                "reason == 'reconstruct realized rate 0.0% is below escalation floor 40%' only",
                "candidateCount > 0 falsely",
                "empty reason"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Zero-candidate escalation reason labels undefined rate or zero candidates rather than only 0.0% below floor",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHATFIX04-undefined-rate-reason.integration.test.ts -t 'TC-2'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN non-zero low yield WHEN accept THEN still escalates (regression)",
      "verify": "npx vitest run convex/__tests__/REDHATFIX04-nonzero-low-yield-regression.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "regression removing low-yield floor check",
            "stub that only handles zero-candidate path",
            "mock accept that unlocks on realizedRate == 0.1",
            "empty escalations for 1/10 reconstruct"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix04-low-yield-nonzero",
            "action": {
              "actor": "founder",
              "steps": [
                "Seed low-yield reconstruct report",
                "requestBatchAcceptance accept"
              ]
            },
            "end_state": {
              "must_observe": [
                "decision == 'escalation_required'",
                "escalations[0].lever == 'reconstruct'",
                "passCount == 1",
                "candidates == 10",
                "realizedRate == 0.1",
                "retirementUnlockedAt == null"
              ],
              "must_not_observe": [
                "decision == 'accepted'",
                "escalations.length == 0",
                "retirementUnlockedAt != null",
                "empty low-yield regression"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Low non-zero reconstruct rate still escalates",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHATFIX04-nonzero-low-yield-regression.integration.test.ts -t 'TC-3'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN promote escalationFloor null WHEN zero or non-zero candidates THEN promote is not zero-candidate-escalated",
      "verify": "npx vitest run convex/__tests__/REDHATFIX04-promote-floor-null.integration.test.ts",
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment",
        "topology": "single-node",
        "negative_control": {
          "would_fail_if": [
            "promote escalated despite null escalationFloor stub",
            "hardcoded all levers always escalate",
            "mock floor check ignoring escalationFloor == null",
            "empty promote floor handling"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "redhatfix04-promote-only-floor-null",
            "action": {
              "actor": "api_client",
              "steps": [
                "Build lever rows from PRD_YIELD_ASSUMPTIONS",
                "Run detectLowYieldEscalations via accept path"
              ]
            },
            "end_state": {
              "must_observe": [
                "promote escalations count == 0",
                "escalations for lever == 'promote' count == 0",
                "reconstruct escalations count >= 1 || reroute escalations count >= 1"
              ],
              "must_not_observe": [
                "lever == 'promote' in escalations",
                "escalations.length == 0 when reconstruct/reroute candidates == 0",
                "empty floor-null handling for promote"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Promote lever with null escalationFloor is not escalated for zero candidates",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHATFIX04-promote-floor-null.integration.test.ts -t 'TC-4'"
    }
  ]
}
-->
