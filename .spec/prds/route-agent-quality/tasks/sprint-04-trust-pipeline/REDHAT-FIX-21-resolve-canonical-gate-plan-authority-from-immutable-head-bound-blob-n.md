# REDHAT-FIX-21 — Resolve canonical gate-plan authority from immutable HEAD-bound blob (not working-tree)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-21 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 135 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-22 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-21-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Close the mutable gate-plan authority hole: loadGatePlanExpectedSteps and loadGatePlanBinding (or a unified loadHeadBoundGatePlan) resolve expected step IDs and plan binding only from an immutable HEAD-bound gate-plan blob with dirty + per-file freshness fail-closed checks, matching FIX-12 v3.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST resolve the canonical gate-plan (expected step IDs + allowed run paths / literal_cmds) from a committed HEAD git-blob using the SAME immutable-resolution pattern FIX-12 v3 uses for the evidence manifest (gitShowHead + working-tree-blob-hash vs HEAD-blob-hash + per-file gitLastCommit === HEAD)
- MUST fail closed when the working-tree plan blob does not equal the HEAD blob (PLAN_NOT_HEAD_BOUND / PLAN_DIRTY) or when the plan's own last-touch commit is not HEAD (PLAN_STALE / PLAN_NOT_IN_HEAD)
- MUST parse HEAD plan content ONLY — never use readFileSync of working-tree gate-plan.json as authority for expected steps or plan binding
- MUST prove PRIMARY: dirty one-step working-tree plan + one-step stale-run evidence bundle is rejected (expected remains [1,2,3,4,5,6,7,8] from HEAD; never expected:[1] + offPlan:null + manifest.ok:true)
- MUST keep a single parsed immutable plan object as the source for both loadGatePlanExpectedSteps completeness and loadGatePlanBinding / run-path allow-list consumers

**NEVER**
- NEVER rebind gate-plan.json literal_cmd paths or planned_at content under this task
- NEVER implement exact script-path equality for repro_cmd (that is REDHAT-FIX-22)
- NEVER forge S4-T7 Founder-Operator human PASS or force founder.present=true
- NEVER weaken FIX-12 HEAD-bound manifest / artifact freshness / path-escape / dirty-tree checks
- NEVER fall back to package-root or cwd working-tree readFileSync when HEAD plan resolution fails — fail closed instead

**STRICTLY**
- STRICTLY reuse exports from tools/gate/gitUtils.ts: gitShowHead, gitBlobHashWorkingTree, gitBlobHashHead, gitLastCommit
- STRICTLY GATE_PLAN_REL remains '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json'
- STRICTLY a dirty one-step plan cannot shrink the canonical expected set or re-admit withdrawn run 2026-07-19T22:59:46Z via plan-binding

## DONE WHEN

- AC-1 [Dirty one-step WT plan + one-step stale-run bundle rejected] [PRIMARY]: expected steps remain [1,2,3,4,5,6,7,8] from HEAD (NOT [1]); dirty plan fails closed OR completeness still requires 1..8; withdrawn run / incomplete set rejecte
- AC-2 [HEAD-bound expected steps ignore dirty one-step WT plan]: returned expected step IDs are exactly [1,2,3,4,5,6,7,8] from HEAD content, or the loader fails closed with PLAN_NOT_HEAD_BOUND/PLAN_DIRTY — never silently retu
- AC-3 [Dirty plan fails closed with PLAN_NOT_HEAD_BOUND/PLAN_DIRTY]: loader/verifier fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY (reason dirty_working_tree) and does not use WT plan bytes as expected-set authority
- AC-4 [Stale plan last-touch != HEAD fails closed; clean HEAD plan loads 1..8]: stale plan fails closed with PLAN_STALE / PLAN_NOT_IN_HEAD / EVIDENCE_FILE_STALE-style plan freshness error; clean plan returns expectedSteps === [1,2,3,4,5,6,7
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close the mutable gate-plan authority hole: loadGatePlanExpectedSteps and loadGatePlanBinding (or a unified loadHeadBoundGatePlan) resolve expected step IDs and plan binding only from an immutable HEAD-bound gate-plan blob with dirty + per-file freshness fail-closed checks, matching FIX-12 v3.

**Success state:** A temp git repo with committed honest 8-step plan at HEAD, a dirty one-step working-tree plan (optionally re-pointing to 2026-07-19T22:59:46Z), and a one-step stale-run evidence bundle yields expected steps [1..8] from HEAD (not [1]), plan dirty/stale fails closed or completeness still requires 1..8, and never produces expected:[1] + offPlan:null + manifest.ok:true.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `honest-eight-step-head-plan` (seed_method: `public_api`): Temp git repo with committed honest 8-step gate-plan.json at HEAD (steps n=1..8, literal_cmds under 2026-07-21T152805Z).
    - temp git repo init + commit GATE_PLAN_REL with planned_steps=8 and steps[].n == 1..8
    - each step.literal_cmd references .gate-evidence/2026-07-21T152805Z/scripts/step{N}.sh
    - git rev-parse HEAD is the plan's content of record
- `dirty-one-step-working-tree-plan` (seed_method: `public_api`): Same temp repo after overwriting working-tree gate-plan.json to only step n=1 (not committed); may re-admit withdrawn 2026-07-19T22:59:46Z in literal_cmd.
    - writeFileSync(GATE_PLAN_REL) with steps:[{n:1, literal_cmd containing 2026-07-19T22:59:46Z}] without git commit
    - git hash-object of WT plan differs from git rev-parse HEAD:GATE_PLAN_REL
    - HEAD blob still has steps 1..8
- `one-step-stale-run-bundle` (seed_method: `public_api`): HEAD-committed one-step evidence bundle under withdrawn run path with only evidence_steps step 1 PASS.
    - bundle at .gate-evidence/2026-07-19T22:59:46Z/ with manifest.json evidence_steps:{'1':{result:'PASS',artifacts:['evidence/step1.json']}}
    - matching artifact committed at HEAD
    - step-results JSON steps:[{n:1,result:'PASS',repro_cmd referencing that run}]
- `clean-head-bound-eight-step-plan` (seed_method: `public_api`): Temp git repo where working-tree plan byte-equals HEAD plan and plan last-touch commit equals HEAD (happy path for HEAD loader).
    - committed 8-step plan; no WT mutation after commit
    - gitLastCommit(GATE_PLAN_REL) === git rev-parse HEAD
    - wtHash === headHash for GATE_PLAN_REL

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Dirty one-step WT plan + one-step stale-run bundle rejected

**Requirement:** GIVEN A temp git repo with committed honest 8-step plan at HEAD, a dirty working-tree plan reduced to only step 1 (and optionally withdrawn 2026-07-19 run), and a one-step stale-run evidence bundle committed under that withdrawn path WHEN loadGatePlanExpectedSteps / verifyEvidenceManifest / deriveGoalState plan load runs against that repo THEN expected steps remain [1,2,3,4,5,6,7,8] from HEAD (NOT [1]); dirty plan fails closed OR completeness still requires 1..8; withdrawn run / incomplete set rejected — never expected:[1] + offPlan:null + manifest.ok:true

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + loadGatePlanExpectedSteps/verifyEvidenceManifest/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: loadGatePlanExpectedSteps is stubbed to readFileSync working-tree plan so expectedSteps becomes [1]; verifyEvidenceManifest is mocked to ok:true for a one-step stale-run bundle when WT plan is dirty one-step; static shell returns expected:[1], offPlan:null, and manifest.ok:true without HEAD-blob resolution
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `dirty-one-step-working-tree-plan`
  - ACTION: Create temp git repo with honest-eight-step-head-plan committed at HEAD; Overwrite working-tree GATE_PLAN_REL with only step n=1 (optionally literal_cmd under 2026-07-19T22:59:46Z) without committing; Commit one-step-stale-run-bundle under withdrawn run path; Call loadGatePlanExpectedSteps(cwd), rejectOffPlanScripts / loadGatePlanBinding path, and verifyEvidenceManifest on the one-step bundle; Capture expectedSteps, offPlan error, manifest.ok, and/or deriveGoalState state.met
  - MUST_OBSERVE: expectedSteps === [1,2,3,4,5,6,7,8] OR planLoadError.code == 'PLAN_NOT_HEAD_BOUND' || planLoadError.code == 'PLAN_DIRTY' || planLoadError.code == 'PLAN_STALE'; manifest.ok === false || error.code == 'INCOMPLETE_EVIDENCE_STEPS' || error.code == 'INCOMPLETE_CANONICAL_STEPS' || error.code == 'OFF_PLAN_SCRIPT' || error.code == 'PLAN_NOT_HEAD_BOUND'; state.met === false
  - MUST_NOT_OBSERVE: expectedSteps === [1]; offPlan === null && manifest.ok === true; state.met === true; empty off-plan rejection (null accept) with expectedSteps from working-tree only

### AC-2 — HEAD-bound expected steps ignore dirty one-step WT plan

**Requirement:** GIVEN Committed honest 8-step plan at HEAD and a dirty working-tree plan containing only step 1 WHEN loadGatePlanExpectedSteps (or unified loadHeadBoundGatePlan) runs THEN returned expected step IDs are exactly [1,2,3,4,5,6,7,8] from HEAD content, or the loader fails closed with PLAN_NOT_HEAD_BOUND/PLAN_DIRTY — never silently returns [1]

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + loadGatePlanExpectedSteps
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: loadGatePlanExpectedSteps still uses readFileSync(join(cwd, GATE_PLAN_REL)) as authority; loader is stubbed to return dirty WT steps array [1] without consulting gitShowHead; empty expected-set fallback treats missing HEAD plan as success with WT steps
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `dirty-one-step-working-tree-plan`
  - ACTION: Seed honest-eight-step-head-plan at HEAD then apply dirty-one-step-working-tree-plan; Call loadGatePlanExpectedSteps(cwd) / loadHeadBoundGatePlan(cwd); Capture returned IDs or fail-closed error code
  - MUST_OBSERVE: expectedSteps === [1,2,3,4,5,6,7,8] || error.code == 'PLAN_NOT_HEAD_BOUND' || error.code == 'PLAN_DIRTY'; gitShowHead(GATE_PLAN_REL) still contains steps n=1..8
  - MUST_NOT_OBSERVE: expectedSteps === [1]; error === null && expectedSteps.length === 1; silent WT-only plan authority; empty expectedSteps authority from working-tree only

### AC-3 — Dirty plan fails closed with PLAN_NOT_HEAD_BOUND/PLAN_DIRTY

**Requirement:** GIVEN HEAD plan blob differs from working-tree plan blob hash (dirty WT plan) WHEN HEAD-bound plan load performs dirty check (wtHash vs headHash) THEN loader/verifier fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY (reason dirty_working_tree) and does not use WT plan bytes as expected-set authority

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + gitBlobHashWorkingTree/gitBlobHashHead
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: dirty check is stubbed to always pass when wtHash !== headHash; plan loader is mocked to ignore dirty WT and parse readFileSync bytes; static shell returns ok with no PLAN_NOT_HEAD_BOUND when plan is dirty
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `dirty-one-step-working-tree-plan`
  - ACTION: Compute wtHash = gitBlobHashWorkingTree(GATE_PLAN_REL) and headHash = gitBlobHashHead(GATE_PLAN_REL); Assert wtHash !== headHash; Invoke HEAD-bound plan loader / deriveGoalState path that requires clean plan; Capture error.code and details.reason
  - MUST_OBSERVE: wtHash !== headHash === true; error.code == 'PLAN_NOT_HEAD_BOUND' || error.code == 'PLAN_DIRTY'; state.met === false || planLoad.ok === false
  - MUST_NOT_OBSERVE: error === null; planLoad.ok === true for dirty plan; expectedSteps sourced from dirty WT only; empty plan dirty rejection

### AC-4 — Stale plan last-touch != HEAD fails closed; clean HEAD plan loads 1..8

**Requirement:** GIVEN Either (a) plan file last-touch commit is not equal to HEAD (stale), or (b) clean-head-bound-eight-step-plan with plan touch == HEAD and wtHash == headHash WHEN HEAD-bound plan load runs freshness + happy-path load THEN stale plan fails closed with PLAN_STALE / PLAN_NOT_IN_HEAD / EVIDENCE_FILE_STALE-style plan freshness error; clean plan returns expectedSteps === [1,2,3,4,5,6,7,8] from gitShowHead content

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + gitLastCommit/gitShowHead
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: freshness check is stubbed to skip when gitLastCommit(plan) !== HEAD; happy-path loader is mocked to return hard-coded [1,2,3,4,5,6,7,8] without parsing gitShowHead content; empty plan HEAD content is treated as expectedSteps === [1,2,3,4,5,6,7,8]
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `clean-head-bound-eight-step-plan`
  - ACTION: Create clean-head-bound-eight-step-plan (wtHash===headHash, last-touch===HEAD); Call loadGatePlanExpectedSteps / loadHeadBoundGatePlan; Also construct a repo where an intermediate commit leaves plan last-touch behind HEAD and assert fail-closed
  - MUST_OBSERVE: cleanPath: expectedSteps === [1,2,3,4,5,6,7,8]; stalePath: error.code == 'PLAN_STALE' || error.code == 'PLAN_NOT_IN_HEAD' || error.code == 'PLAN_NOT_HEAD_BOUND'
  - MUST_NOT_OBSERVE: cleanPath: expectedSteps === []; stalePath: error === null; cleanPath: expectedSteps === [1]; empty missing-steps set treated as complete

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Dirty one-step working-tree plan plus one-step stale-run bundle never yields expectedSteps === [1] with offPlan === null and manifest.ok === true | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-1'` |
| TC-2 | state.met is false when the plan is dirty one-step and the evidence bundle covers only step 1 | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-1'` |
| TC-3 | loadGatePlanExpectedSteps returns [1,2,3,4,5,6,7,8] from HEAD or fails closed when the working-tree plan is only step 1 | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-2'` |
| TC-4 | Plan load fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY when wtHash !== headHash for GATE_PLAN_REL | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-3'` |
| TC-5 | Clean HEAD-bound plan load returns expectedSteps === [1,2,3,4,5,6,7,8] from gitShowHead content | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-4'` |
| TC-6 | Stale plan last-touch commit not equal to HEAD fails closed with PLAN_STALE or PLAN_NOT_IN_HEAD | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/verifyEvidenceManifest.ts (MODIFY — loadGatePlanExpectedSteps / unified loadHeadBoundGatePlan from HEAD blob with dirty+freshness fail-closed; completeness still uses HEAD expected set)
- tools/gate/deriveGoalState.ts (MODIFY — loadGatePlanBinding must use same HEAD-bound plan loader; do NOT implement FIX-22 exact script equality here)
- tools/gate/gitUtils.ts (MODIFY only if a tiny shared helper is required for plan HEAD resolution; prefer existing exports)
- convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts (NEW)

**writeProhibited:**
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json content rebinding — never rebind literal_cmd/planned_at under FIX-21
- tools/gate/deriveGoalState.ts rejectOffPlanScripts exact script-path equality — REDHAT-FIX-22
- Forging S4-T7 Founder-Operator PASS or rewriting honest-step-results to ACHIEVED
- Weakening FIX-12 manifest path-escape / dirty / per-file freshness checks
- Any RN/Expo/app client code
- convex/couchVerdict.ts — out of scope

## READING LIST

- `tools/gate/verifyEvidenceManifest.ts` (74-105) — [PRIMARY BUG] loadGatePlanExpectedSteps uses readFileSync working-tree plan — must become HEAD-blob only
- `tools/gate/verifyEvidenceManifest.ts` (160-201) — FIX-12 v3 immutable pattern: gitShowHead + wtHash/headHash dirty check + gitLastCommit === HEAD freshness — REUSE for plan
- `tools/gate/verifyEvidenceManifest.ts` (283-315) — Completeness uses loadGatePlanExpectedSteps(cwd) — must consume HEAD-bound expected set
- `tools/gate/deriveGoalState.ts` (395-424) — [PRIMARY BUG] loadGatePlanBinding uses readFileSync working-tree plan for runIds/literalCmds
- `tools/gate/deriveGoalState.ts` (447-487) — rejectOffPlanScripts consumes loadGatePlanBinding — FIX-21 owns HEAD plan source (not exact script equality)
- `tools/gate/deriveGoalState.ts` (552-577) — deriveGoalState uses loadGatePlanExpectedSteps for identity/completeness — must be HEAD-bound
- `tools/gate/gitUtils.ts` (54-75) — gitLastCommit, gitShowHead, gitBlobHashWorkingTree, gitBlobHashHead — reuse, do not reimplement
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T165629Z.md` (23-29) — CRITICAL-1 finding + fix guidance: gitShowHead only; dirty + last-touch == HEAD fail-closed
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json` (all) — READ-ONLY expected plan shape (steps 1..8); do not rebind content under FIX-21
- `convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts` (1-180) — Temp-repo harness patterns for gate completeness; extend pattern for dirty-plan reproducer

## CODE PATTERN

- Pattern: const headContent = gitShowHead(GATE_PLAN_REL, cwd); if (!headContent) return PLAN_NOT_IN_HEAD; const wtHash = gitBlobHashWorkingTree(planWtPath, cwd); const headHash = gitBlobHashHead(GATE_PLAN_REL, cwd); if (wtHash && headHash && wtHash !== headHash) return PLAN_NOT_HEAD_BOUND; if (gitLastCommit(GATE_PLAN_REL, cwd) !== head) return PLAN_STALE; const plan = JSON.parse(headContent); // parse HEAD only — never readFileSync for authority
- Pattern source: `tools/gate/verifyEvidenceManifest.ts:160-201 + tools/gate/gitUtils.ts:54-75`
- Anti-pattern: readFileSync(join(cwd, GATE_PLAN_REL)) as expected-set authority; falling back to package-root WT plan when HEAD is missing; accepting dirty one-step plan that shrinks expected to [1]
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T165629Z.md`, `tools/gate/verifyEvidenceManifest.ts:160-201`, `tools/gate/gitUtils.ts`, `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json`

## VERIFICATION GATES

- AC-1 PRIMARY dirty-plan + one-step stale-run rejected: `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-1'` → Exit 0; never expected:[1] + offPlan:null + manifest.ok:true; state.met === false
- AC-2 HEAD expected steps ignore dirty WT: `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-2'` → Exit 0; expectedSteps === [1,2,3,4,5,6,7,8] or PLAN_NOT_HEAD_BOUND/PLAN_DIRTY
- AC-3 dirty plan fail-closed: `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-3'` → Exit 0; error.code == PLAN_NOT_HEAD_BOUND or PLAN_DIRTY
- AC-4 clean + stale plan paths: `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-4'` → Exit 0; clean expectedSteps 1..8; stale PLAN_STALE/PLAN_NOT_IN_HEAD
- Full FIX-21 suite: `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts` → Exit 0
- Typecheck: `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check tools/gate/verifyEvidenceManifest.ts tools/gate/deriveGoalState.ts convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only` → Only paths in guardrails.write_allowed
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-21-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns tools/gate plan loaders and verifyEvidenceManifest integrity: make the canonical expected step set and plan binding resolve only from an immutable HEAD-bound gate-plan blob, closing the FIX-18/CRITICAL-2 authority hole re-opened by working-tree readFileSync.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced)
- Integration coverage: PRIMARY AC is integration against real services (filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: —
- Blocks: REDHAT-FIX-22
- Notes: FIX-22 depends on this HEAD-bound plan load; share loadHeadBoundGatePlan rather than duplicating dirty/freshness checks Completeness (FIX-18) and plan-binding both must consume the same immutable plan object

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

## NOTES

- Coordinate with REDHAT-FIX-22: FIX-21 owns HEAD-bound plan authority; FIX-22 owns exact script-path match on top of that loader.
- MEDIUM-1 (non-blocking, flagged twice): focused FIX integration suites share destructive global deployment state and are unsafe under normal Vitest file parallelism — opportunistically serialize/isolate if touching test config.
- Review source: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T165629Z.md` CRITICAL-1.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-21",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "honest-eight-step-head-plan": {
      "description": "Temp git repo with committed honest 8-step gate-plan.json at HEAD (steps n=1..8, literal_cmds under 2026-07-21T152805Z).",
      "seed_method": "public_api",
      "records": [
        "temp git repo init + commit GATE_PLAN_REL with planned_steps=8 and steps[].n == 1..8",
        "each step.literal_cmd references .gate-evidence/2026-07-21T152805Z/scripts/step{N}.sh",
        "git rev-parse HEAD is the plan's content of record"
      ]
    },
    "dirty-one-step-working-tree-plan": {
      "description": "Same temp repo after overwriting working-tree gate-plan.json to only step n=1 (not committed); may re-admit withdrawn 2026-07-19T22:59:46Z in literal_cmd.",
      "seed_method": "public_api",
      "records": [
        "writeFileSync(GATE_PLAN_REL) with steps:[{n:1, literal_cmd containing 2026-07-19T22:59:46Z}] without git commit",
        "git hash-object of WT plan differs from git rev-parse HEAD:GATE_PLAN_REL",
        "HEAD blob still has steps 1..8"
      ]
    },
    "one-step-stale-run-bundle": {
      "description": "HEAD-committed one-step evidence bundle under withdrawn run path with only evidence_steps step 1 PASS.",
      "seed_method": "public_api",
      "records": [
        "bundle at .gate-evidence/2026-07-19T22:59:46Z/ with manifest.json evidence_steps:{'1':{result:'PASS',artifacts:['evidence/step1.json']}}",
        "matching artifact committed at HEAD",
        "step-results JSON steps:[{n:1,result:'PASS',repro_cmd referencing that run}]"
      ]
    },
    "clean-head-bound-eight-step-plan": {
      "description": "Temp git repo where working-tree plan byte-equals HEAD plan and plan last-touch commit equals HEAD (happy path for HEAD loader).",
      "seed_method": "public_api",
      "records": [
        "committed 8-step plan; no WT mutation after commit",
        "gitLastCommit(GATE_PLAN_REL) === git rev-parse HEAD",
        "wtHash === headHash for GATE_PLAN_REL"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN committed honest 8-step plan at HEAD, dirty WT plan with only step 1 (optionally withdrawn 2026-07-19 run), and a one-step stale-run evidence bundle WHEN loadGatePlanExpectedSteps / verifyEvidenceManifest / deriveGoalState plan load runs THEN expected steps remain [1..8] from HEAD (NOT [1]), dirty plan fails closed OR completeness still requires 1..8, withdrawn run rejected — never expected:[1] + offPlan:null + manifest.ok:true",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + loadGatePlanExpectedSteps/verifyEvidenceManifest/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "loadGatePlanExpectedSteps is stubbed to readFileSync working-tree plan so expectedSteps becomes [1]",
            "verifyEvidenceManifest is mocked to ok:true for a one-step stale-run bundle when WT plan is dirty one-step",
            "static shell returns expected:[1], offPlan:null, and manifest.ok:true without HEAD-blob resolution"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "dirty-one-step-working-tree-plan",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create temp git repo with honest-eight-step-head-plan committed at HEAD",
                "Overwrite working-tree GATE_PLAN_REL with only step n=1 without committing",
                "Commit one-step-stale-run-bundle under withdrawn run path",
                "Call loadGatePlanExpectedSteps, plan binding / off-plan check, and verifyEvidenceManifest",
                "Capture expectedSteps, offPlan, manifest.ok, state.met"
              ]
            },
            "end_state": {
              "must_observe": [
                "expectedSteps === [1,2,3,4,5,6,7,8] OR planLoadError.code == 'PLAN_NOT_HEAD_BOUND' || planLoadError.code == 'PLAN_DIRTY' || planLoadError.code == 'PLAN_STALE'",
                "manifest.ok === false || error.code == 'INCOMPLETE_EVIDENCE_STEPS' || error.code == 'INCOMPLETE_CANONICAL_STEPS' || error.code == 'OFF_PLAN_SCRIPT' || error.code == 'PLAN_NOT_HEAD_BOUND'",
                "state.met === false"
              ],
              "must_not_observe": [
                "expectedSteps === [1]",
                "offPlan === null && manifest.ok === true",
                "state.met === true",
                "empty off-plan rejection (null accept) with expectedSteps from working-tree only"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN committed honest 8-step plan at HEAD and dirty WT plan with only step 1 WHEN loadGatePlanExpectedSteps runs THEN expectedSteps === [1,2,3,4,5,6,7,8] from HEAD or fail-closed PLAN_NOT_HEAD_BOUND/PLAN_DIRTY — never silently [1]",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + loadGatePlanExpectedSteps",
        "negative_control": {
          "would_fail_if": [
            "loadGatePlanExpectedSteps still uses readFileSync(join(cwd, GATE_PLAN_REL)) as authority",
            "loader is stubbed to return dirty WT steps array [1] without consulting gitShowHead",
            "empty expected-set fallback treats missing HEAD plan as success with WT steps"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "dirty-one-step-working-tree-plan",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed honest-eight-step-head-plan at HEAD then apply dirty-one-step-working-tree-plan",
                "Call loadGatePlanExpectedSteps(cwd)",
                "Capture returned IDs or fail-closed error code"
              ]
            },
            "end_state": {
              "must_observe": [
                "expectedSteps === [1,2,3,4,5,6,7,8] || error.code == 'PLAN_NOT_HEAD_BOUND' || error.code == 'PLAN_DIRTY'"
              ],
              "must_not_observe": [
                "expectedSteps === [1]",
                "error === null && expectedSteps.length === 1",
                "empty expectedSteps authority from working-tree only"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN wtHash !== headHash for GATE_PLAN_REL WHEN HEAD-bound plan load dirty check runs THEN error.code == PLAN_NOT_HEAD_BOUND or PLAN_DIRTY and plan is not accepted as authority",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + gitBlobHashWorkingTree/gitBlobHashHead",
        "negative_control": {
          "would_fail_if": [
            "dirty check is stubbed to always pass when wtHash !== headHash",
            "plan loader is mocked to ignore dirty WT and parse readFileSync bytes",
            "static shell returns ok with no PLAN_NOT_HEAD_BOUND when plan is dirty"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "dirty-one-step-working-tree-plan",
            "action": {
              "actor": "api_client",
              "steps": [
                "Assert wtHash !== headHash for GATE_PLAN_REL",
                "Invoke HEAD-bound plan loader",
                "Capture error.code"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'PLAN_NOT_HEAD_BOUND' || error.code == 'PLAN_DIRTY'",
                "state.met === false || planLoad.ok === false"
              ],
              "must_not_observe": [
                "error === null",
                "planLoad.ok === true for dirty plan",
                "empty plan dirty rejection"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN clean HEAD-bound 8-step plan OR stale plan last-touch != HEAD WHEN plan load runs THEN clean returns expectedSteps === [1,2,3,4,5,6,7,8]; stale fails closed with PLAN_STALE or PLAN_NOT_IN_HEAD",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + gitLastCommit/gitShowHead",
        "negative_control": {
          "would_fail_if": [
            "freshness check is stubbed to skip when gitLastCommit(plan) !== HEAD",
            "happy-path loader is mocked to return hard-coded [1,2,3,4,5,6,7,8] without parsing gitShowHead content",
            "empty plan HEAD content is treated as expectedSteps === [1,2,3,4,5,6,7,8]"
          ]
        },
        "evidence": {
          "artifact_type": "file_artifact",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "clean-head-bound-eight-step-plan",
            "action": {
              "actor": "api_client",
              "steps": [
                "Load clean HEAD-bound plan and assert expectedSteps",
                "Construct stale last-touch plan path and assert fail-closed"
              ]
            },
            "end_state": {
              "must_observe": [
                "cleanPath: expectedSteps === [1,2,3,4,5,6,7,8]",
                "stalePath: error.code == 'PLAN_STALE' || error.code == 'PLAN_NOT_IN_HEAD' || error.code == 'PLAN_NOT_HEAD_BOUND'"
              ],
              "must_not_observe": [
                "cleanPath: expectedSteps === []",
                "stalePath: error === null",
                "cleanPath: expectedSteps === [1]",
                "empty missing-steps set treated as complete"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Dirty one-step working-tree plan plus one-step stale-run bundle never yields expectedSteps === [1] with offPlan === null and manifest.ok === true",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "state.met is false when the plan is dirty one-step and the evidence bundle covers only step 1",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "loadGatePlanExpectedSteps returns [1,2,3,4,5,6,7,8] from HEAD or fails closed when the working-tree plan is only step 1",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Plan load fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY when wtHash !== headHash for GATE_PLAN_REL",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Clean HEAD-bound plan load returns expectedSteps === [1,2,3,4,5,6,7,8] from gitShowHead content",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-4'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Stale plan last-touch commit not equal to HEAD fails closed with PLAN_STALE or PLAN_NOT_IN_HEAD",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts -t 'AC-4'"
    }
  ]
}
-->

</details>
