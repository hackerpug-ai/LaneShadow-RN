# REDHAT-FIX-12 — Rebuild founder/live-provider gate evidence harness so goal-state cannot claim completion from stale/forged bundles (UC-VER-05)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-12 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 150 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX12-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

A machine-derived goal-state writer (`tools/gate/deriveGoalState.ts`) recomputes `sprint-goal-state.json` from the actual gate step results and fails closed: it emits `met:false` / `goal:"GATE-GOAL: BLOCKED"` and exits nonzero whenever any of the 8 steps is BLOCKED/FAIL, and it rejects a stale/pre-remediation evidence bundle (a bundle whose reproduced step captured a git commit != current HEAD, or whose repro scripts pass the removed `lever2FixedGeometry` seam arg). The gate-evidence step3/4/5/7 scripts are rebuilt to seed/bootstrap a real operator identity and exercise the current operator-gated public Convex surface instead of reusing a bare `s4-human-gate` identity; the actual human founder visual review remains S4-T7-owned and is NEVER synthesized by this harness. The stale forged `.gate-evidence/2026-07-19T22:59:46Z` bundle can no longer reproduce against current public validators, and `sprint-goal-state.json` can no longer be hand-set to `met:true` inconsistent with the honest re-audit.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST make sprint-goal-state.json a machine-derived artifact produced only by deriveGoalState.ts — the writer recomputes met/goal/gate.overall from the per-step results and NEVER accepts a hand-supplied met:true that contradicts any BLOCKED/FAIL step result
- MUST reject a stale/pre-remediation evidence bundle: require the reproduced step's captured git commit to equal current HEAD, AND fail if any repro script passes the removed lever2FixedGeometry seam arg or authenticates as a bare non-operator s4-human-gate identity
- MUST rebuild the gate-evidence step3/4/5/7 scripts to bootstrap/seed a real operator identity (role founder|operator) and call the current operator-gated public Convex APIs (recordCouchVerdict, disposition mutations, couch export) without any seam args

**NEVER**
- NEVER synthesize, fabricate, or auto-pass the human founder visual review (human_test.verdict) — that stays human/Founder-Operator-owned under S4-T7; the writer must leave human_test unresolved/pending unless a genuine S4-T7 founder verdict record exists
- NEVER allow sprint-goal-state.json to report met:true or gate.overall:PASS while any step result is BLOCKED/FAIL or while the evidence bundle fails the stale/seam/commit checks
- NEVER re-introduce the lever2FixedGeometry seam path or a bare s4-human-gate identity into any rebuilt gate-evidence script
- NEVER edit the honest top-level GATE-RESULTS.md (read-only source of truth) or perform FIX-01's live-provider closeout scope

**STRICTLY**
- STRICTLY the goal-state writer is the ONLY writer of sprint-goal-state.json; the file is a generated output, never hand-edited in this task
- STRICTLY the stale/commit/seam/operator checks are load-bearing and must be exercised by the retained forged bundle as a mandatory negative control

## DONE WHEN

- AC-1 [Goal-state writer fails closed on any BLOCKED/FAIL step] [PRIMARY]: deriveGoalState emits met:false / goal BLOCKED and exits nonzero when ≥1 step is BLOCKED/FAIL and can never be hand-set to met:true
- AC-2 [Stale/forged evidence bundle is rejected]: a bundle whose reproduced step commit != HEAD or whose scripts pass lever2FixedGeometry is rejected with STALE_EVIDENCE_BUNDLE and no met:true is written
- AC-3 [Rebuilt gate-evidence scripts run against the operator-gated surface]: rebuilt step3/4/5/7 scripts succeed under a seeded operator identity while a bare s4-human-gate control fails with FORBIDDEN
- AC-4 [Harness never fabricates the human founder review]: deriveGoalState leaves human_test pending/unresolved unless a genuine S4-T7 founder verdict record exists and never synthesizes verdict:pass
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Make the Sprint-04 gate evidence harness trustworthy and non-forgeable: sprint-goal-state.json becomes a machine-derived, fail-closed artifact that cannot claim completion from a stale/forged bundle, and the gate-evidence step scripts are rebuilt to exercise the current operator-gated public Convex APIs on a real operator identity.

**Success state:** deriveGoalState.ts recomputes sprint-goal-state.json from actual step results and refuses met:true whenever any step is BLOCKED/FAIL or the evidence bundle is stale (commit != HEAD), passes a removed seam arg, or authenticates as a bare non-operator identity; rebuilt step3/4/5/7 scripts pass under a seeded operator and fail under a bare s4-human-gate; the human founder review is never synthesized.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `blocked-step-results` (seed_method: `public_api`): A computed 8-step gate results set in which at least one step (e.g. step 1 live waterfall) has result BLOCKED/FAIL, fed to deriveGoalState.
    - `stepResults=[{n:1,result:'BLOCKED'},{n:2..8,result:'PASS'}]` passed to `deriveGoalState({stepResults, headCommit})`
- `stale-forged-bundle` (seed_method: `public_api`): The retained withdrawn bundle `.gate-evidence/2026-07-19T22:59:46Z` whose step1/2/7 scripts pass `lever2FixedGeometry` under a bare `s4-human-gate` identity and whose captured commit differs from current HEAD.
    - `.gate-evidence/2026-07-19T22:59:46Z/scripts/{step1,step2,step7}.sh` with `lever2FixedGeometry` + captured commit `4240ea01` != HEAD `135f8fc6`
- `operator-gate-identity` (seed_method: `public_api`): A bootstrapped operator/founder identity used by the rebuilt step scripts to call operator-gated public Convex APIs.
    - users row upserted for clerkUserId `'s4t12-operator'` with role `'founder'`
- `bare-closeout-identity` (seed_method: `public_api`): A bare `'s4-human-gate'` authenticated identity with NO operator/founder role, used as the negative control for the rebuilt scripts.
    - users row for clerkUserId `'s4-human-gate'` with no role (defaults to rider)

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Goal-state writer fails closed on any BLOCKED/FAIL step

**Requirement:** GIVEN a computed 8-step gate results set in which at least one step result is BLOCKED/FAIL WHEN deriveGoalState recomputes sprint-goal-state.json from those step results THEN it emits met:false, goal 'GATE-GOAL: BLOCKED', gate.overall 'BLOCKED', exits nonzero, and there is no code path by which a hand-supplied met:true survives when any step is BLOCKED/FAIL

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState writer invoked against a real step-results input + the emitted goal-state file
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: deriveGoalState copies a caller-supplied met:true through without recomputing from step results; the writer treats a BLOCKED step as PASS and still emits gate.overall PASS
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `blocked-step-results`
  - ACTION: Provide blocked-step-results (step 1 BLOCKED, rest PASS) plus current HEAD commit to deriveGoalState; run deriveGoalState and capture the emitted sprint-goal-state.json and its exit code
  - MUST_OBSERVE: emitted met == false; emitted goal == 'GATE-GOAL: BLOCKED' and gate.overall == 'BLOCKED'; writer exit code != 0
  - MUST_NOT_OBSERVE: emitted met == true; gate.overall == 'PASS' while a step result is BLOCKED

### AC-2 — Stale/forged evidence bundle is rejected

**Requirement:** GIVEN the retained forged bundle whose reproduced step commit != current HEAD and whose scripts pass the removed lever2FixedGeometry seam arg WHEN deriveGoalState validates the evidence bundle before writing goal-state THEN it rejects with STALE_EVIDENCE_BUNDLE, exits nonzero, and writes no met:true goal-state

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState bundle validator against the retained .gate-evidence/2026-07-19T22:59:46Z bundle
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the validator ignores the captured commit and accepts a bundle from an older commit; the validator does not scan repro scripts for the removed lever2FixedGeometry seam arg
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `stale-forged-bundle`
  - ACTION: Point deriveGoalState at the retained .gate-evidence/2026-07-19T22:59:46Z bundle with current HEAD 135f8fc6; run the bundle validation and capture the thrown error and emitted goal-state (if any)
  - MUST_OBSERVE: validation throws/reports error code == 'STALE_EVIDENCE_BUNDLE'; captured bundle commit (4240ea01) is detected as != HEAD; no goal-state with met:true is written
  - MUST_NOT_OBSERVE: the forged bundle is accepted as reproducible; a lever2FixedGeometry-bearing script passes the seam scan

### AC-3 — Rebuilt gate-evidence scripts run against the operator-gated surface

**Requirement:** GIVEN the rebuilt step3/4/5/7 scripts that bootstrap a seeded operator identity, and a bare s4-human-gate control identity with no role WHEN the rebuilt scripts execute against the current public Convex APIs under each identity THEN the operator identity passes the operator-gated mutations while the bare s4-human-gate identity is rejected with FORBIDDEN

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real requireOperator + recordCouchVerdict + disposition mutations)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the rebuilt scripts still authenticate as a bare s4-human-gate identity and the operator-gated mutation silently succeeds; the scripts pass a seam arg to reach a deterministic result
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `operator-gate-identity`
  - ACTION: Seed operator-gate-identity and bare-closeout-identity; run the rebuilt step4 (recordCouchVerdict) and step7 (disposition) scripts as 's4t12-operator'; re-run the same scripts as the bare 's4-human-gate' identity; query couch_verdicts and the disposition records
  - MUST_OBSERVE: operator run: recordCouchVerdict/disposition succeed and rows are written with recordedBy == 's4t12-operator'; bare s4-human-gate run: the call throws error.code == 'FORBIDDEN'
  - MUST_NOT_OBSERVE: the bare s4-human-gate identity records a couch verdict or disposition; any script passes a lever2FixedGeometry or other seam arg

### AC-4 — Harness never fabricates the human founder review

**Requirement:** GIVEN deriveGoalState runs with no genuine S4-T7 founder verdict record present WHEN the goal-state is recomputed THEN human_test is left pending/unresolved and human_test.verdict is never synthesized to 'pass'

- TEST_TIER: `integration` · VERIFICATION_SERVICE: deriveGoalState writer + emitted goal-state file
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: deriveGoalState hardcodes human_test.verdict = 'pass' with no S4-T7 record; the writer copies a stale human_test block from the forged bundle
- EVIDENCE: `file_snapshot` (required_capture: true)
- CASE 1 — start_ref `blocked-step-results`
  - ACTION: Run deriveGoalState with no S4-T7 founder verdict record present; capture the emitted human_test block in sprint-goal-state.json
  - MUST_OBSERVE: human_test.verdict is 'pending'/unresolved (not 'pass'); the writer surfaces that a human/S4-T7 review is still required
  - MUST_NOT_OBSERVE: human_test.verdict == 'pass' synthesized without an S4-T7 record; a stale human_test.run_id from the forged bundle is carried forward as passing

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | deriveGoalState emits met:false and exits nonzero when any step result is BLOCKED/FAIL | AC-1 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'` |
| TC-2 | a hand-supplied met:true cannot survive a BLOCKED step through deriveGoalState | AC-1 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'` |
| TC-3 | a bundle whose captured commit != HEAD is rejected with STALE_EVIDENCE_BUNDLE | AC-2 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'` |
| TC-4 | a repro script passing lever2FixedGeometry fails the seam scan and blocks met:true | AC-2 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'` |
| TC-5 | rebuilt step scripts succeed under a seeded operator identity | AC-3 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'` |
| TC-6 | rebuilt step scripts fail with FORBIDDEN under a bare s4-human-gate identity | AC-3 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'` |
| TC-7 | deriveGoalState leaves human_test pending when no S4-T7 founder verdict exists | AC-4 | `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/deriveGoalState.ts (NEW) - machine-derived, fail-closed goal-state writer + stale/commit/seam/operator bundle validator
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/sprint-goal-state.json (MODIFY - regenerated ONLY by deriveGoalState, never hand-edited)
- .gate-evidence/2026-07-19T22:59:46Z/scripts/step3.sh (MODIFY - rebuild to operator-gated couch export, no seam args)
- .gate-evidence/2026-07-19T22:59:46Z/scripts/step4.sh (MODIFY - rebuild to operator-gated recordCouchVerdict, seed operator identity)
- .gate-evidence/2026-07-19T22:59:46Z/scripts/step5.sh (MODIFY - rebuild to operator-gated getCouchVerdict, no seam args)
- .gate-evidence/2026-07-19T22:59:46Z/scripts/step7.sh (MODIFY - rebuild to operator-gated disposition mutations, no seam args)
- convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts (NEW)

**writeProhibited:**
- convex/waterfallOrchestrator.ts, convex/actions/rideWorthinessClassifier.ts - live-provider closeout + guard changes are REDHAT-FIX-01/REDHAT-FIX-13 scope
- convex/guards.ts - requireOperator/assertTestSubjectOrThrow already exist; import/call only
- GATE-RESULTS.md - honest re-audit record is read-only source of truth
- The actual human founder visual review (S4-T7) - must not be synthesized by this harness
- Any RN/Expo/app client code

## READING LIST

- `convex/_generated/ai/guidelines.md` (all) — Convex API rules that override training data (mandatory per CLAUDE.md)
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/sprint-goal-state.json` (1-195) — the stale hand-set met:true / all-PASS structure this task must make machine-derived
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-results.json` (all) — the honest BLOCKED re-audit that goal-state must reconcile against (read-only)
- `convex/guards.ts` (143-193) — requireOperator (operator-gated surface the rebuilt scripts must satisfy) + assertTestSubjectOrThrow/TEST_SUBJECT_PREFIXES (seam gating the validator scans for)
- `convex/waterfallOrchestrator.ts` (801-835) — runSampleWaterfall (no seam args) vs runSampleWaterfallWithSeams (lever2FixedGeometry) — the forged bundle used the seam variant; the validator must reject seam args
- `convex/couchVerdict.ts` (51-58,180-268) — recordCouchVerdict/couchGateStatus/clearCouchVerdictsPublic are operator/founder-gated; rebuilt step scripts must authenticate as an operator

## CODE PATTERN

- Pattern: Fail-closed derivation: `deriveGoalState(stepResults, headCommit)` recomputes `met = stepResults.every(s => s.result === 'PASS') && bundleValid`; goal/gate.overall derived from the same predicate; bundle validation rejects when capturedCommit !== headCommit, when any repro script text matches `/lever2FixedGeometry/` or a bare s4-human-gate identity, and leaves human_test pending unless an S4-T7 verdict record is present. Rebuilt step scripts bootstrap an operator identity (role founder|operator) then call operator-gated public APIs with no seam args.
- Pattern source: `convex/guards.ts:143-193` (operator + seam gating) + `convex/couchVerdict.ts:180-240` (couchGateStatus fail-closed shape)
- Anti-pattern: a hand-set met:true / all-PASS goal-state that contradicts the honest re-audit; repro scripts that pass lever2FixedGeometry under a bare s4-human-gate identity on test: fixtures; synthesizing human_test.verdict='pass' with no founder review

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-12-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; fail-closed gate evidence harness
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is integration against the writer + real Convex dev deployment
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows the fail-closed goal-state and the rejected forged bundle

## DEPENDENCIES

- Depends on: —
- Blocks: —
- Coordinate with S4-T7 (human founder visual review stays human-owned — this harness must never synthesize it), REDHAT-FIX-01 (removed the seam from public entries; this task consumes that by scanning for and rejecting seam args), and REDHAT-FIX-06 (requireOperator already exists; rebuilt scripts consume it).

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-12",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "blocked-step-results": { "description": "A computed 8-step gate results set with at least one BLOCKED/FAIL step.", "seed_method": "public_api", "records": ["stepResults=[{n:1,result:'BLOCKED'},{n:2..8,result:'PASS'}] passed to deriveGoalState({stepResults, headCommit})"] },
    "stale-forged-bundle": { "description": "The retained withdrawn bundle .gate-evidence/2026-07-19T22:59:46Z with lever2FixedGeometry + stale commit.", "seed_method": "public_api", "records": [".gate-evidence/2026-07-19T22:59:46Z/scripts/{step1,step2,step7}.sh with lever2FixedGeometry + captured commit 4240ea01 != HEAD 135f8fc6"] },
    "operator-gate-identity": { "description": "Bootstrapped operator/founder identity for rebuilt step scripts.", "seed_method": "public_api", "records": ["users row upserted for clerkUserId 's4t12-operator' with role 'founder'"] },
    "bare-closeout-identity": { "description": "Bare 's4-human-gate' identity with NO operator/founder role.", "seed_method": "public_api", "records": ["users row for clerkUserId 's4-human-gate' with no role (defaults to rider)"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Goal-state writer fails closed on any BLOCKED/FAIL step", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "deriveGoalState writer invoked against a real step-results input + the emitted goal-state file", "topology": "single-node",
        "negative_control": { "would_fail_if": ["deriveGoalState copies a caller-supplied met:true through without recomputing from step results", "the writer treats a BLOCKED step as PASS and still emits gate.overall PASS"] },
        "evidence": { "artifact_type": "file_snapshot", "required_capture": true },
        "cases": [ { "start_ref": "blocked-step-results", "action": { "actor": "api_client", "steps": ["Provide blocked-step-results (step 1 BLOCKED, rest PASS) plus current HEAD commit to deriveGoalState", "Run deriveGoalState and capture the emitted sprint-goal-state.json and its exit code"] },
          "end_state": { "must_observe": ["emitted met == false", "emitted goal == 'GATE-GOAL: BLOCKED' and gate.overall == 'BLOCKED'", "writer exit code != 0"], "must_not_observe": ["emitted met == true", "gate.overall == 'PASS' while a step result is BLOCKED"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Stale/forged evidence bundle is rejected", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "deriveGoalState bundle validator against the retained .gate-evidence/2026-07-19T22:59:46Z bundle", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the validator ignores the captured commit and accepts a bundle from an older commit", "the validator does not scan repro scripts for the removed lever2FixedGeometry seam arg"] },
        "evidence": { "artifact_type": "file_snapshot", "required_capture": true },
        "cases": [ { "start_ref": "stale-forged-bundle", "action": { "actor": "api_client", "steps": ["Point deriveGoalState at the retained .gate-evidence/2026-07-19T22:59:46Z bundle with current HEAD 135f8fc6", "Run the bundle validation and capture the thrown error and emitted goal-state (if any)"] },
          "end_state": { "must_observe": ["validation throws/reports error code == 'STALE_EVIDENCE_BUNDLE'", "captured bundle commit (4240ea01) is detected as != HEAD", "no goal-state with met:true is written"], "must_not_observe": ["the forged bundle is accepted as reproducible", "a lever2FixedGeometry-bearing script passes the seam scan"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Rebuilt gate-evidence scripts run against the operator-gated surface", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real requireOperator + recordCouchVerdict + disposition mutations)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["the rebuilt scripts still authenticate as a bare s4-human-gate identity and the operator-gated mutation silently succeeds", "the scripts pass a seam arg to reach a deterministic result"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "operator-gate-identity", "action": { "actor": "api_client", "steps": ["Seed operator-gate-identity and bare-closeout-identity", "Run the rebuilt step4 (recordCouchVerdict) and step7 (disposition) scripts as 's4t12-operator'", "Re-run the same scripts as the bare 's4-human-gate' identity", "Query couch_verdicts and the disposition records"] },
          "end_state": { "must_observe": ["operator run: recordCouchVerdict/disposition succeed and rows are written with recordedBy == 's4t12-operator'", "bare s4-human-gate run: the call throws error.code == 'FORBIDDEN'"], "must_not_observe": ["the bare s4-human-gate identity records a couch verdict or disposition", "any script passes a lever2FixedGeometry or other seam arg"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Harness never fabricates the human founder review", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "deriveGoalState writer + emitted goal-state file", "topology": "single-node",
        "negative_control": { "would_fail_if": ["deriveGoalState hardcodes human_test.verdict = 'pass' with no S4-T7 record", "the writer copies a stale human_test block from the forged bundle"] },
        "evidence": { "artifact_type": "file_snapshot", "required_capture": true },
        "cases": [ { "start_ref": "blocked-step-results", "action": { "actor": "api_client", "steps": ["Run deriveGoalState with no S4-T7 founder verdict record present", "Capture the emitted human_test block in sprint-goal-state.json"] },
          "end_state": { "must_observe": ["human_test.verdict is 'pending'/unresolved (not 'pass')", "the writer surfaces that a human/S4-T7 review is still required"], "must_not_observe": ["human_test.verdict == 'pass' synthesized without an S4-T7 record", "a stale human_test.run_id from the forged bundle is carried forward as passing"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "deriveGoalState emits met:false and exits nonzero when any step result is BLOCKED/FAIL", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "a hand-supplied met:true cannot survive a BLOCKED step through deriveGoalState", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-1'" },
    { "id": "TC-3", "type": "test_criterion", "description": "a bundle whose captured commit != HEAD is rejected with STALE_EVIDENCE_BUNDLE", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'" },
    { "id": "TC-4", "type": "test_criterion", "description": "a repro script passing lever2FixedGeometry fails the seam scan and blocks met:true", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-2'" },
    { "id": "TC-5", "type": "test_criterion", "description": "rebuilt step scripts succeed under a seeded operator identity", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'" },
    { "id": "TC-6", "type": "test_criterion", "description": "rebuilt step scripts fail with FORBIDDEN under a bare s4-human-gate identity", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-3'" },
    { "id": "TC-7", "type": "test_criterion", "description": "deriveGoalState leaves human_test pending when no S4-T7 founder verdict exists", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts -t 'AC-4'" }
  ]
}
-->

</details>
