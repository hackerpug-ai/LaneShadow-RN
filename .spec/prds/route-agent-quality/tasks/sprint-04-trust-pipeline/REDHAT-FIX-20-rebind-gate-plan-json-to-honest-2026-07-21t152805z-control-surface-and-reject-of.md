# REDHAT-FIX-20 — Rebind gate-plan.json to honest 2026-07-21T152805Z control surface and reject off-plan scripts
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-20 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 75 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-20-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Retires the forged 2026-07-19T22:59:46Z gate-plan script paths, points every step at the honest 2026-07-21T152805Z control surface, and makes the goal-state writer reject bundles/scripts not referenced by that HEAD-bound plan. Red-hat HIGH-2: gate-plan.json still points all 8 steps at withdrawn forged scripts using bare s4-human-gate + lever2FixedGeometry; the honest blocked run is 2026-07-21T152805Z.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST rebind every gate-plan.json step literal_cmd away from .gate-evidence/2026-07-19T22:59:46Z/ to the honest control surface under .gate-evidence/2026-07-21T152805Z/
- MUST update planned_at (or equivalent metadata) so the plan no longer advertises the forged run identity
- MUST make the goal-state writer reject bundles/scripts not referenced by the HEAD-bound gate-plan (plan-binding rejection)
- MUST prove PRIMARY: gate-plan step1 literal_cmd does NOT reference 2026-07-19T22:59:46Z; writer rejects that stale bundle path when plan is HEAD-bound
- MUST keep human steps honest: if scripts for steps 3/4/5/7 are added under the honest run dir, they must report BLOCKED/human-pending — never forge PASS

**NEVER**
- NEVER leave any step literal_cmd pointing at 2026-07-19T22:59:46Z after this task
- NEVER reintroduce lever2FixedGeometry or bare s4-human-gate identity in the canonical plan control surface
- NEVER change S4-T7 human gate requirements or invent Founder-Operator pass evidence
- NEVER forge ACHIEVED / met:true by rewriting honest BLOCKED step results
- NEVER own canonical step-set completeness (missing 1..8) — REDHAT-FIX-18

**STRICTLY**
- STRICTLY plan rebinding targets the existing honest evidence dir .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-21T152805Z/
- STRICTLY writer plan-binding rejection is a separate slice from FIX-18 completeness (coordinate if both touch deriveGoalState.ts)

## DONE WHEN

- AC-1 [gate-plan no longer references forged 2026-07-19 timestamp] [PRIMARY]: no literal_cmd contains 2026-07-19T22:59:46Z; step1 points at the 2026-07-21T152805Z control surface
- AC-2 [Writer rejects stale forged script/bundle paths not in HEAD-bound plan]: met===false with an error/blocker naming off-plan/stale script not referenced by the HEAD-bound plan
- AC-3 [Honest step1 control surface has no lever2FixedGeometry seam]: script does not contain lever2FixedGeometry and does not use bare s4-human-gate as the operator identity
- AC-4 [Human steps remain honestly BLOCKED (no forged PASS)]: steps 3/4/5/7 remain non-PASS (BLOCKED/human pending); no ACHIEVED forged from plan rebinding alone
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Retire forged gate-plan script paths and bind the writer to the honest HEAD-bound plan control surface.

**Success state:** No gate-plan step references 2026-07-19T22:59:46Z; all steps point at 2026-07-21T152805Z; deriveGoalState rejects off-plan/stale forged script or bundle paths while remaining honestly BLOCKED on human steps.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `head-bound-gate-plan` (seed_method: `public_api`): The sprint gate-plan.json after rebinding (or the pre-fix plan used to show rejection of stale paths).
    - file .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json
- `honest-evidence-dir` (seed_method: `public_api`): Honest blocked run evidence at 2026-07-21T152805Z with scripts step1/2/6/8.
    - .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-21T152805Z/scripts/step1.sh exists and has no lever2FixedGeometry
    - honest-step-results.json documents steps 3/4/5/7 BLOCKED human work
- `forged-stale-script-path` (seed_method: `public_api`): Reference to the withdrawn forged path used as a negative input.
    - string path containing 2026-07-19T22:59:46Z/scripts/step1.sh with lever2FixedGeometry + s4-human-gate

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — gate-plan no longer references forged 2026-07-19 timestamp

**Requirement:** GIVEN The committed sprint gate-plan.json after this fix WHEN the plan file is read and every step.literal_cmd is inspected THEN no literal_cmd contains 2026-07-19T22:59:46Z; step1 points at the 2026-07-21T152805Z control surface

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem (committed gate-plan.json + honest evidence dir)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: gate-plan.json is left static with all 8 steps literal_cmd pointing at 2026-07-19T22:59:46Z; plan rebinding is a no-op stub that keeps the forged timestamp; empty rewrite leaves 2026-07-19T22:59:46Z in step1.literal_cmd
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `head-bound-gate-plan`
  - ACTION: Read .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json; Inspect planned_at and every steps[].literal_cmd
  - MUST_OBSERVE: gate-plan.json steps.every(s => !s.literal_cmd.includes('2026-07-19T22:59:46Z')) === true; gate-plan.json steps.find(s => s.n === 1).literal_cmd.includes('2026-07-21T152805Z') === true; gate-plan.json.steps.length === 8
  - MUST_NOT_OBSERVE: literal_cmd includes '2026-07-19T22:59:46Z'; empty rebinding (static forged plan); step1.literal_cmd includes 'lever2FixedGeometry'

### AC-2 — Writer rejects stale forged script/bundle paths not in HEAD-bound plan

**Requirement:** GIVEN A HEAD-bound plan rebound to 2026-07-21T152805Z and a step-results or repro_cmd referencing 2026-07-19T22:59:46Z scripts WHEN deriveGoalState plan-binding rejection runs THEN met===false with an error/blocker naming off-plan/stale script not referenced by the HEAD-bound plan

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git + deriveGoalState plan-binding rejection
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: deriveGoalState plan-binding is stubbed to a no-op that accepts arbitrary forged 2026-07-19 script paths; writer is mocked to return met === true for off-plan stale scripts; empty plan allow-list comparison is omitted
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `forged-stale-script-path`
  - ACTION: Invoke deriveGoalState with steps/repro_cmd pointing at 2026-07-19T22:59:46Z/scripts while plan is HEAD-bound to 2026-07-21T152805Z; Capture state.met and error/blocker
  - MUST_OBSERVE: state.met === false; error.code == 'OFF_PLAN_SCRIPT' || state.gate.blocker includes '2026-07-19T22:59:46Z' || state.gate.blocker includes 'off-plan'
  - MUST_NOT_OBSERVE: state.met === true; state.goal === 'GATE-GOAL: ACHIEVED'; empty off-plan rejection

### AC-3 — Honest step1 control surface has no lever2FixedGeometry seam

**Requirement:** GIVEN The honest 2026-07-21T152805Z step1.sh referenced by the rebound plan WHEN the script contents are inspected THEN script does not contain lever2FixedGeometry and does not use bare s4-human-gate as the operator identity

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem (honest scripts)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: plan still points at the static forged step1.sh which embeds lever2FixedGeometry and s4-human-gate; step1 resolution is stubbed to the 2026-07-19 path; empty script-body check is omitted
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `honest-evidence-dir`
  - ACTION: Resolve step1 literal_cmd from rebound gate-plan.json; Read the script file body
  - MUST_OBSERVE: scriptBody.includes('lever2FixedGeometry') === false; scriptBody.includes('s4-human-gate') === false; scriptPath.includes('2026-07-21T152805Z') === true
  - MUST_NOT_OBSERVE: scriptBody.includes('lever2FixedGeometry') === true; scriptPath includes '2026-07-19T22:59:46Z'; empty honest script body

### AC-4 — Human steps remain honestly BLOCKED (no forged PASS)

**Requirement:** GIVEN The rebound plan and honest step-results / human-step stubs for steps 3/4/5/7 WHEN honest evidence and plan-bound human steps are inspected THEN steps 3/4/5/7 remain non-PASS (BLOCKED/human pending); no ACHIEVED forged from plan rebinding alone

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem (honest-step-results + plan)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: rebinding invents PASS evidence for S4-T7 human steps or rewrites honest-step-results to ACHIEVED via a stub; human steps 3/4/5/7 are mocked to result === 'PASS'; empty human gate is replaced with a static PASS
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `honest-evidence-dir`
  - ACTION: Read honest-step-results.json for steps 3,4,5,7; Confirm plan rebinding did not claim human PASS
  - MUST_OBSERVE: honestStepResults.steps.filter(s => [3,4,5,7].includes(s.n)).every(s => s.result === 'BLOCKED') === true; state.met !== true from plan rebinding alone || sprintGoal.met === false
  - MUST_NOT_OBSERVE: steps 3/4/5/7 result === 'PASS'; state.met === true; GATE-GOAL: ACHIEVED from empty human work

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | gate-plan.json step1 literal_cmd does not contain 2026-07-19T22:59:46Z | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-1'` |
| TC-2 | every gate-plan step literal_cmd references 2026-07-21T152805Z | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-1'` |
| TC-3 | deriveGoalState.met is false when steps reference forged 2026-07-19 scripts not in the HEAD-bound plan | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-2'` |
| TC-4 | the plan-referenced step1 script does not contain lever2FixedGeometry | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-3'` |
| TC-5 | honest-step-results steps 3/4/5/7 remain BLOCKED after plan rebinding | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json (MODIFY — rebind all literal_cmd + planned_at to 2026-07-21T152805Z control surface)
- tools/gate/deriveGoalState.ts (MODIFY — plan-binding rejection of scripts/bundles not referenced by HEAD-bound plan ONLY; do not implement FIX-18 completeness here)
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-21T152805Z/scripts/step3.sh (NEW optional honest BLOCKED stub if needed for plan coverage)
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-21T152805Z/scripts/step4.sh (NEW optional honest BLOCKED stub if needed)
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-21T152805Z/scripts/step5.sh (NEW optional honest BLOCKED stub if needed)
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-21T152805Z/scripts/step7.sh (NEW optional honest BLOCKED stub if needed)
- convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts (NEW)

**writeProhibited:**
- tools/gate/deriveGoalState.ts canonical step completeness (missing 1..8) — REDHAT-FIX-18
- tools/gate/verifyEvidenceManifest.ts — REDHAT-FIX-18
- convex/couchVerdict.ts — REDHAT-FIX-17/19
- Rewriting honest-step-results.json steps 3/4/5/7 to PASS
- Restoring forged 2026-07-19 scripts as the plan target
- Synthesizing S4-T7 Founder-Operator visual review evidence
- Any RN/Expo/app client code

## READING LIST

- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json` (all) — [PRIMARY] all 8 steps still literal_cmd to 2026-07-19T22:59:46Z — rebind target
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (all) — Honest step1: real runSampleWaterfall, no lever2FixedGeometry
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-19T22:59:46Z/scripts/step1.sh` (1-20) — Withdrawn forged script: s4-human-gate + lever2FixedGeometry — must not remain plan target
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/honest-step-results.json` (all) — Honest BLOCKED human steps 3/4/5/7 — preserve
- `tools/gate/deriveGoalState.ts` (290-374,406-428) — Writer entry — add plan-binding rejection only (FIX-20 slice); completeness is FIX-18
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T153804Z.md` (38-40) — HIGH-2 finding text

## CODE PATTERN

- Pattern: const plan = loadHeadBoundGatePlan(cwd); assertNoForgedTimestamp(plan); rejectIfScriptsNotInPlan(opts.steps, plan);
- Pattern source: `gate-plan.json (all steps) + tools/gate/deriveGoalState.ts:290-374`
- Anti-pattern: leaving plan on forged scripts; accepting any CLI path; inventing human PASS to make the plan green; implementing FIX-18 completeness under this task id
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T153804Z.md`, `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json`, `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-21T152805Z/`

## VERIFICATION GATES

- AC-1 PRIMARY plan rebind: `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-1'` → Exit 0; no 2026-07-19T22:59:46Z in plan
- Full FIX-20 suite: `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts` → Exit 0
- Typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check tools/gate/deriveGoalState.ts convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only HEAD~1 HEAD | sort -u` → Only paths in guardrails.write_allowed
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-20-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns canonical gate-plan control surface rebinding and plan-bound script rejection in the goal-state writer so withdrawn forged 2026-07-19T22:59:46Z scripts cannot be the documented or accepted path.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced)
- Integration coverage: PRIMARY AC is integration against real services (Convex dev / filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: —
- Blocks: —
- Notes: Coordinate with REDHAT-FIX-18 on tools/gate/deriveGoalState.ts: FIX-20 owns reject-scripts-not-in-plan + gate-plan.json rebinding; FIX-18 owns canonical 1..8 completeness. S4-T7 human review remains external blocker.

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-20",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "head-bound-gate-plan": {
      "description": "The sprint gate-plan.json after rebinding (or the pre-fix plan used to show rejection of stale paths).",
      "seed_method": "public_api",
      "records": [
        "file .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json"
      ]
    },
    "honest-evidence-dir": {
      "description": "Honest blocked run evidence at 2026-07-21T152805Z with scripts step1/2/6/8.",
      "seed_method": "public_api",
      "records": [
        ".spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-21T152805Z/scripts/step1.sh exists and has no lever2FixedGeometry",
        "honest-step-results.json documents steps 3/4/5/7 BLOCKED human work"
      ]
    },
    "forged-stale-script-path": {
      "description": "Reference to the withdrawn forged path used as a negative input.",
      "seed_method": "public_api",
      "records": [
        "string path containing 2026-07-19T22:59:46Z/scripts/step1.sh with lever2FixedGeometry + s4-human-gate"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the committed gate-plan.json after this fix WHEN every step.literal_cmd is inspected THEN none contains 2026-07-19T22:59:46Z and step1 points at 2026-07-21T152805Z",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem (committed gate-plan.json + honest evidence dir)",
        "negative_control": {
          "would_fail_if": [
            "gate-plan.json is left static with all 8 steps literal_cmd pointing at 2026-07-19T22:59:46Z",
            "plan rebinding is a no-op stub that keeps the forged timestamp",
            "empty rewrite leaves 2026-07-19T22:59:46Z in step1.literal_cmd"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "head-bound-gate-plan",
            "action": {
              "actor": "api_client",
              "steps": [
                "Read .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json",
                "Inspect planned_at and every steps[].literal_cmd"
              ]
            },
            "end_state": {
              "must_observe": [
                "gate-plan.json steps.every(s => !s.literal_cmd.includes('2026-07-19T22:59:46Z')) === true",
                "gate-plan.json steps.find(s => s.n === 1).literal_cmd.includes('2026-07-21T152805Z') === true",
                "gate-plan.json.steps.length === 8"
              ],
              "must_not_observe": [
                "literal_cmd includes '2026-07-19T22:59:46Z'",
                "empty rebinding (static forged plan)",
                "step1.literal_cmd includes 'lever2FixedGeometry'"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN a HEAD-bound plan rebound to 2026-07-21T152805Z and steps referencing forged 2026-07-19 scripts WHEN deriveGoalState plan-binding runs THEN met===false with off-plan/stale error",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git + deriveGoalState plan-binding rejection",
        "negative_control": {
          "would_fail_if": [
            "deriveGoalState plan-binding is stubbed to a no-op that accepts arbitrary forged 2026-07-19 script paths",
            "writer is mocked to return met === true for off-plan stale scripts",
            "empty plan allow-list comparison is omitted"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "forged-stale-script-path",
            "action": {
              "actor": "api_client",
              "steps": [
                "Invoke deriveGoalState with steps/repro_cmd pointing at 2026-07-19T22:59:46Z/scripts while plan is HEAD-bound to 2026-07-21T152805Z",
                "Capture state.met and error/blocker"
              ]
            },
            "end_state": {
              "must_observe": [
                "state.met === false",
                "error.code == 'OFF_PLAN_SCRIPT' || state.gate.blocker includes '2026-07-19T22:59:46Z' || state.gate.blocker includes 'off-plan'"
              ],
              "must_not_observe": [
                "state.met === true",
                "state.goal === 'GATE-GOAL: ACHIEVED'",
                "empty off-plan rejection"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN the honest 2026-07-21T152805Z step1.sh referenced by the rebound plan WHEN inspected THEN it lacks lever2FixedGeometry and bare s4-human-gate",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem (honest scripts)",
        "negative_control": {
          "would_fail_if": [
            "plan still points at the static forged step1.sh which embeds lever2FixedGeometry and s4-human-gate",
            "step1 resolution is stubbed to the 2026-07-19 path",
            "empty script-body check is omitted"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "honest-evidence-dir",
            "action": {
              "actor": "api_client",
              "steps": [
                "Resolve step1 literal_cmd from rebound gate-plan.json",
                "Read the script file body"
              ]
            },
            "end_state": {
              "must_observe": [
                "scriptBody.includes('lever2FixedGeometry') === false",
                "scriptBody.includes('s4-human-gate') === false",
                "scriptPath.includes('2026-07-21T152805Z') === true"
              ],
              "must_not_observe": [
                "scriptBody.includes('lever2FixedGeometry') === true",
                "scriptPath includes '2026-07-19T22:59:46Z'",
                "empty honest script body"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN rebound plan and honest evidence WHEN human steps 3/4/5/7 are inspected THEN they remain BLOCKED/non-PASS and rebinding alone does not ACHIEVE",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem (honest-step-results + plan)",
        "negative_control": {
          "would_fail_if": [
            "rebinding invents PASS evidence for S4-T7 human steps or rewrites honest-step-results to ACHIEVED via a stub",
            "human steps 3/4/5/7 are mocked to result === 'PASS'",
            "empty human gate is replaced with a static PASS"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "honest-evidence-dir",
            "action": {
              "actor": "api_client",
              "steps": [
                "Read honest-step-results.json for steps 3,4,5,7",
                "Confirm plan rebinding did not claim human PASS"
              ]
            },
            "end_state": {
              "must_observe": [
                "honestStepResults.steps.filter(s => [3,4,5,7].includes(s.n)).every(s => s.result === 'BLOCKED') === true",
                "state.met !== true from plan rebinding alone || sprintGoal.met === false"
              ],
              "must_not_observe": [
                "steps 3/4/5/7 result === 'PASS'",
                "state.met === true",
                "GATE-GOAL: ACHIEVED from empty human work"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "gate-plan.json step1 literal_cmd does not contain 2026-07-19T22:59:46Z",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "every gate-plan step literal_cmd references 2026-07-21T152805Z",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "deriveGoalState.met is false when steps reference forged 2026-07-19 scripts not in the HEAD-bound plan",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "the plan-referenced step1 script does not contain lever2FixedGeometry",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "honest-step-results steps 3/4/5/7 remain BLOCKED after plan rebinding",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts -t 'AC-4'"
    }
  ]
}
-->

</details>
