# REDHAT-FIX-23 — Change plan-freshness model so HEAD-bound plan blob is usable at current HEAD without last-touch==HEAD (close PLAN_STALE regression from FIX-21)
> Status: ✅ Completed
> Commit: c2799eb5a78c500dd19089f9f30e5b58ab999831
> Reviewer: convex-reviewer
> Completed: 2026-07-21T18:24:40Z

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-23 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 105 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | REDHAT-FIX-21 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-23-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Close HIGH-2 PLAN_STALE regression from FIX-21: change the plan-freshness model so the canonical gate is usable at current HEAD when the plan blob is committed and clean, without requiring the plan file's last-touch commit to equal repo HEAD, while retaining dirty WT rejection and immutable HEAD-blob plan authority.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST change plan freshness so a clean working-tree plan whose blob is present at HEAD is usable even when gitLastCommit(GATE_PLAN_REL) !== HEAD (unrelated commits advanced HEAD)
- MUST keep dirty working-tree rejection: wtHash !== headHash → PLAN_NOT_HEAD_BOUND or PLAN_DIRTY (reason dirty_working_tree); never re-open a working-tree plan authority seam
- MUST continue resolving plan authority ONLY from git show HEAD:<GATE_PLAN_REL> bytes — never readFileSync(working-tree gate-plan.json) as expected-set or binding authority
- MUST prove PRIMARY: clean deriveGoalState / loadHeadBoundGatePlan at a HEAD advanced past plan last-touch does NOT return PLAN_STALE and reaches step evaluation (honest human-step BLOCK / completeness is allowed; PLAN_STALE is not)
- MUST update FIX-21 AC-4 expectations that currently require PLAN_STALE when last-touch != HEAD so the new contract is the source of truth (stale-last-touch no longer fails closed IF blob is at HEAD and clean)
- MUST restore FIX-18 suite green under multi-commit plan-then-evidence fixtures via the freshness model change (prefer model change over forcing one-commit fixtures)

**NEVER**
- NEVER reintroduce readFileSync working-tree plan authority for expected steps, literal_cmds, or run binding
- NEVER weaken dirty-plan rejection (wtHash !== headHash must still fail closed)
- NEVER forge human PASS / S4-T7 Founder-Operator evidence or force state.met === true / founder.present === true
- NEVER implement full-command equality for off-plan rejection under this task (that is REDHAT-FIX-24)
- NEVER rebind gate-plan.json literal_cmd paths or re-admit withdrawn 2026-07-19T22:59:46Z as plan target
- NEVER treat PLAN_STALE as acceptable exit for clean HEAD-bound plan when last-touch != HEAD after this fix

**STRICTLY**
- STRICTLY plan freshness attests the plan blob AT HEAD (HEAD-bound by construction via gitShowHead), NOT plan file last-touch commit equality to HEAD
- STRICTLY PLAN_NOT_IN_HEAD remains fail-closed when the plan path is absent from HEAD or HEAD content cannot be resolved
- STRICTLY single source of freshness policy is loadHeadBoundGatePlan in tools/gate/verifyEvidenceManifest.ts; deriveGoalState only propagates PLAN_* from that loader
- STRICTLY GATE_PLAN_REL remains '.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json'

## DONE WHEN

- AC-1 [Does NOT return PLAN_STALE; planLoad.ok===true with expectedSteps===[1,2,3,4,5,6,7,8] from HEAD blob; deriveGoalState re] [PRIMARY]: Does NOT return PLAN_STALE; planLoad.ok===true with expectedSteps===[1,2,3,4,5,6,7,8] from HEAD blob; deriveGoalState reaches step evaluation (may still met===false for honest human BLOCK / completene
- AC-2 [Fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY (reason dirty_working_tree); does not use WT plan bytes as authority]: Fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY (reason dirty_working_tree); does not use WT plan bytes as authority; no PLAN_STALE-only path that would re-open WT authority
- AC-3 [Fails closed with PLAN_NOT_IN_HEAD (not silent success, not PLAN_STALE from last-touch)]: Fails closed with PLAN_NOT_IN_HEAD (not silent success, not PLAN_STALE from last-touch)
- AC-4 [Incomplete steps report INCOMPLETE_CANONICAL_STEPS / INVALID_STEP_IDENTITY (or INCOMPLETE_EVIDENCE_STEPS) — NOT PLAN_STA]: Incomplete steps report INCOMPLETE_CANONICAL_STEPS / INVALID_STEP_IDENTITY (or INCOMPLETE_EVIDENCE_STEPS) — NOT PLAN_STALE; suite returns green for those paths
- AC-5 [Stale-last-touch clean path succeeds (expectedSteps 1..8); dirty still fails; FIX-21 suite green under revised AC-4; opt]: Stale-last-touch clean path succeeds (expectedSteps 1..8); dirty still fails; FIX-21 suite green under revised AC-4; optional real HEAD path does not error PLAN_STALE (may BLOCK on human steps)
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close HIGH-2 PLAN_STALE regression from FIX-21: change the plan-freshness model so the canonical gate is usable at current HEAD when the plan blob is committed and clean, without requiring the plan file's last-touch commit to equal repo HEAD, while retaining dirty WT rejection and immutable HEAD-blob plan authority.

**Success state:** A temp (or real) repo with honest 8-step plan blob at HEAD, clean working tree (wtHash===headHash), and HEAD advanced by unrelated commits so gitLastCommit(GATE_PLAN_REL) !== HEAD loads successfully (planLoad.ok===true, expectedSteps===[1..8]) and deriveGoalState reaches step evaluation without PLAN_STALE; dirty WT still PLAN_NOT_HEAD_BOUND/PLAN_DIRTY; plan missing from HEAD still PLAN_NOT_IN_HEAD; FIX-18 multi-commit fixtures report INCOMPLETE_CANONICAL_STEPS / INVALID_STEP_IDENTITY (not PLAN_STALE); FIX-21 AC-4 revised to match the new contract.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `clean-plan-blob-at-head-last-touch-behind` (seed_method: `public_api`): Temp git repo with committed honest 8-step gate-plan at some commit, then an unrelated file commit advances HEAD so plan last-touch != HEAD, while WT plan bytes still equal HEAD plan blob (clean).
    - commit GATE_PLAN_REL with steps n=1..8 and literal_cmds under 2026-07-21T152805Z
    - commit unrelated.txt (or evidence bundle) without rewriting plan → HEAD advances
    - gitLastCommit(GATE_PLAN_REL) !== git rev-parse HEAD
    - gitBlobHashWorkingTree(GATE_PLAN_REL) === gitBlobHashHead(GATE_PLAN_REL)
    - gitShowHead(GATE_PLAN_REL) still has steps 1..8
- `dirty-wt-plan-after-unrelated-head-advance` (seed_method: `public_api`): Same as clean-plan-blob-at-head-last-touch-behind then overwrite working-tree gate-plan.json (e.g. one-step) without committing so wtHash !== headHash.
    - start from clean-plan-blob-at-head-last-touch-behind
    - writeFileSync(GATE_PLAN_REL) with mutated steps without git commit
    - wtHash !== headHash for GATE_PLAN_REL
    - HEAD blob still honest 1..8
- `plan-missing-from-head` (seed_method: `public_api`): Temp git repo where GATE_PLAN_REL is not present as a HEAD blob (never committed or deleted at HEAD).
    - temp git repo without committed GATE_PLAN_REL (or path removed in HEAD)
    - gitShowHead(GATE_PLAN_REL) returns empty/null
    - must fail closed PLAN_NOT_IN_HEAD
- `fix18-multi-commit-plan-then-evidence` (seed_method: `public_api`): FIX-18-style temp repo: plan committed first, evidence bundle committed in a later commit advancing HEAD past plan last-touch; used to prove completeness/identity codes not PLAN_STALE.
    - commit honest plan at init (as REDHAT-FIX-18 makeTempRepo)
    - commitBundle advances HEAD without re-touching plan
    - plan last-touch != HEAD after evidence commit
    - deriveGoalState / verifyEvidenceManifest must reach completeness path
- `clean-head-bound-eight-step-plan` (seed_method: `public_api`): Happy-path clean plan: wtHash===headHash and optionally last-touch===HEAD; loader returns expectedSteps [1..8].
    - committed 8-step plan; no WT mutation after commit
    - wtHash === headHash for GATE_PLAN_REL
    - loadHeadBoundGatePlan.ok === true; expectedSteps === [1,2,3,4,5,6,7,8]

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Does NOT return PLAN_STALE; planLoad.ok===true with expectedSteps===[1,2,3,4,5,6,7,8] from

**Requirement:** GIVEN A clean working tree where the plan blob is present at HEAD and gitLastCommit(GATE_PLAN_REL) !== HEAD because unrelated commits advanced HEAD WHEN loadHeadBoundGatePlan / deriveGoalState runs against that repo THEN Does NOT return PLAN_STALE; planLoad.ok===true with expectedSteps===[1,2,3,4,5,6,7,8] from HEAD blob; deriveGoalState reaches step evaluation (may still met===false for honest human BLOCK / completeness / other non-PLAN_STALE reasons)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + loadHeadBoundGatePlan/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: loadHeadBoundGatePlan still returns PLAN_STALE when planTouch !== headCommit even though wtHash===headHash and gitShowHead has the plan; freshness is stubbed to always fail closed on last-touch inequality regardless of HEAD blob presence; static shell returns error.code == 'PLAN_STALE' for clean-plan-blob-at-head-last-touch-behind without evaluating steps
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `clean-plan-blob-at-head-last-touch-behind`
  - ACTION: Create temp git repo; commit honest 8-step GATE_PLAN_REL; Commit unrelated file so HEAD advances past plan last-touch; Assert gitLastCommit(GATE_PLAN_REL) !== HEAD and wtHash === headHash; Call loadHeadBoundGatePlan(cwd, head) and deriveGoalState with incomplete/honest steps; Capture planLoad.ok, planLoad.code, expectedSteps, state.error?.code, state.met
  - MUST_OBSERVE: planLoad.ok === true; planLoad.expectedSteps === [1,2,3,4,5,6,7,8]; planLoad.code !== 'PLAN_STALE' || planLoad.ok === true; state.error?.code !== 'PLAN_STALE'; gitLastCommit(GATE_PLAN_REL) !== headCommit === true
  - MUST_NOT_OBSERVE: error.code == 'PLAN_STALE'; planLoad.ok === false && planLoad.code == 'PLAN_STALE'; state.met === true with empty step evaluation; empty accept of dirty plan; silent skip of plan load

### AC-2 — Fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY (reason dirty_working_tree); does not 

**Requirement:** GIVEN Working-tree plan bytes differ from HEAD plan blob (wtHash !== headHash) after HEAD advanced past plan last-touch WHEN loadHeadBoundGatePlan / deriveGoalState dirty check runs THEN Fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY (reason dirty_working_tree); does not use WT plan bytes as authority; no PLAN_STALE-only path that would re-open WT authority

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + gitBlobHashWorkingTree/gitBlobHashHead/loadHeadBoundGatePlan
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: dirty check is removed or stubbed so wtHash !== headHash returns planLoad.ok===true; loader falls back to readFileSync WT bytes after freshness model change; static shell returns ok:true for dirty-wt-plan-after-unrelated-head-advance
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `dirty-wt-plan-after-unrelated-head-advance`
  - ACTION: Seed clean-plan-blob-at-head-last-touch-behind; Mutate WT GATE_PLAN_REL without commit; Assert wtHash !== headHash; Call loadHeadBoundGatePlan and capture code/reason
  - MUST_OBSERVE: wtHash !== headHash === true; planLoad.ok === false; error.code == 'PLAN_NOT_HEAD_BOUND' || error.code == 'PLAN_DIRTY'; planLoad.details.reason includes 'dirty' || planLoad.details.reason == 'dirty_working_tree'
  - MUST_NOT_OBSERVE: planLoad.ok === true for dirty plan; error === null; expectedSteps sourced from dirty WT only; empty plan dirty rejection

### AC-3 — Fails closed with PLAN_NOT_IN_HEAD (not silent success, not PLAN_STALE from last-touch)

**Requirement:** GIVEN GATE_PLAN_REL is not present as a blob at HEAD WHEN loadHeadBoundGatePlan runs THEN Fails closed with PLAN_NOT_IN_HEAD (not silent success, not PLAN_STALE from last-touch)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + gitShowHead/loadHeadBoundGatePlan
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: loader falls back to package-root or cwd readFileSync when HEAD plan is missing; missing HEAD plan is treated as empty expectedSteps success; static shell returns planLoad.ok===true for plan-missing-from-head
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `plan-missing-from-head`
  - ACTION: Create temp git repo without committed GATE_PLAN_REL; Call loadHeadBoundGatePlan(cwd); Capture planLoad.ok and planLoad.code
  - MUST_OBSERVE: planLoad.ok === false; error.code == 'PLAN_NOT_IN_HEAD'
  - MUST_NOT_OBSERVE: planLoad.ok === true; error === null; expectedSteps === [1,2,3,4,5,6,7,8] without HEAD blob; empty missing-plan accept

### AC-4 — Incomplete steps report INCOMPLETE_CANONICAL_STEPS / INVALID_STEP_IDENTITY (or INCOMPLETE_

**Requirement:** GIVEN FIX-18 multi-commit fixture that commits plan then evidence separately so HEAD advances past plan last-touch WHEN REDHAT-FIX-18 suite / incomplete or identity-violation cases run THEN Incomplete steps report INCOMPLETE_CANONICAL_STEPS / INVALID_STEP_IDENTITY (or INCOMPLETE_EVIDENCE_STEPS) — NOT PLAN_STALE; suite returns green for those paths

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + deriveGoalState/verifyEvidenceManifest (FIX-18 harness)
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: multi-commit plan-then-evidence still exits with PLAN_STALE before completeness evaluation; AC assertions accept any error including PLAN_STALE as success for incompleteness; static shell returns PLAN_STALE for fix18-multi-commit-plan-then-evidence one-step bundle
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `fix18-multi-commit-plan-then-evidence`
  - ACTION: Build FIX-18-style temp repo with plan commit then evidence commit; Run deriveGoalState with 1-step all-PASS and identity-violation step sets; Capture state.error?.code and state.met; Also run full FIX-18 suite command as regression gate
  - MUST_OBSERVE: state.error?.code == 'INCOMPLETE_CANONICAL_STEPS' || state.error?.code == 'INVALID_STEP_IDENTITY' || state.error?.code == 'INCOMPLETE_EVIDENCE_STEPS'; state.met === false; state.error?.code !== 'PLAN_STALE'
  - MUST_NOT_OBSERVE: error.code == 'PLAN_STALE'; state.met === true; state.goal === 'GATE-GOAL: ACHIEVED'; empty incomplete rejection (accepted one-step as complete)

### AC-5 — Stale-last-touch clean path succeeds (expectedSteps 1..8); dirty still fails; FIX-21 suite

**Requirement:** GIVEN FIX-21 AC-4 previously required PLAN_STALE when last-touch != HEAD; new contract treats clean HEAD blob as sufficient WHEN REDHAT-FIX-21 AC-4 tests and optional clean deriveGoalState at real repo HEAD run THEN Stale-last-touch clean path succeeds (expectedSteps 1..8); dirty still fails; FIX-21 suite green under revised AC-4; optional real HEAD path does not error PLAN_STALE (may BLOCK on human steps)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git + FIX-21 suite + optional real-repo deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-5'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: FIX-21 AC-4 still asserts PLAN_STALE for clean last-touch != HEAD after model change; revised tests still require planTouch === head for planLoad.ok; static shell treats any non-PLAN_STALE as met===true / ACHIEVED
- EVIDENCE: `file_artifact` (required_capture: true)
- CASE 1 — start_ref `clean-head-bound-eight-step-plan`
  - ACTION: Load clean HEAD-bound plan (last-touch==HEAD) → expectedSteps 1..8; Construct clean last-touch-behind HEAD path → expect planLoad.ok===true (NOT PLAN_STALE); Construct dirty WT path → PLAN_NOT_HEAD_BOUND/PLAN_DIRTY; Update FIX-21 AC-4 assertions accordingly and run FIX-21 suite
  - MUST_OBSERVE: cleanPath: expectedSteps === [1,2,3,4,5,6,7,8]; lastTouchBehindCleanPath: planLoad.ok === true && expectedSteps === [1,2,3,4,5,6,7,8]; dirtyPath: error.code == 'PLAN_NOT_HEAD_BOUND' || error.code == 'PLAN_DIRTY'
  - MUST_NOT_OBSERVE: lastTouchBehindCleanPath: error.code == 'PLAN_STALE'; cleanPath: expectedSteps === []; dirtyPath: planLoad.ok === true; empty missing-steps set treated as complete

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | loadHeadBoundGatePlan returns ok:true with expectedSteps [1..8] when plan last-touch != HEAD but wtHash===headHash and plan exists at HEAD | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-1'` |
| TC-2 | deriveGoalState does not surface error.code PLAN_STALE for clean last-touch-behind-HEAD plan | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-1'` |
| TC-3 | Dirty WT plan still fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY after freshness model change | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-2'` |
| TC-4 | Missing HEAD plan blob fails closed with PLAN_NOT_IN_HEAD | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-3'` |
| TC-5 | FIX-18 multi-commit one-step incomplete path yields INCOMPLETE_CANONICAL_STEPS or INCOMPLETE_EVIDENCE_STEPS not PLAN_STALE | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-4'` |
| TC-6 | FIX-21 AC-4 no longer requires PLAN_STALE for clean last-touch != HEAD; asserts planLoad.ok and expectedSteps 1..8 instead | AC-5 | `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-5'` |
| TC-7 | Full FIX-18 suite exits 0 after freshness model change (regression green) | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/verifyEvidenceManifest.ts (MODIFY — loadHeadBoundGatePlan freshness: drop last-touch==HEAD PLAN_STALE requirement; keep HEAD blob + dirty checks)
- tools/gate/deriveGoalState.ts (MODIFY only if PLAN_STALE propagation / comments need update; prefer single source in loadHeadBoundGatePlan)
- convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts (NEW)
- convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts (MODIFY AC-4 stale last-touch expectations to new contract)
- convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts (MODIFY only if fixture needs adjustment; prefer model change so multi-commit fixtures work unchanged)

**writeProhibited:**
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json content rebinding
- tools/gate/deriveGoalState.ts full-command equality / canonicalizeCommand — REDHAT-FIX-24
- Forging S4-T7 Founder-Operator PASS or rewriting honest-step-results to ACHIEVED
- Reintroducing readFileSync working-tree plan authority
- Weakening dirty-plan rejection (wtHash vs headHash)
- Any RN/Expo/app client code
- convex/couchVerdict.ts — out of scope

## READING LIST

- `tools/gate/verifyEvidenceManifest.ts` (145-230) — [PRIMARY BUG] loadHeadBoundGatePlan steps 1-3: HEAD blob + dirty check OK; step 3 planTouch !== headCommit → PLAN_STALE is the HIGH-2 regression — remove/replace with HEAD-blob attestation only
- `tools/gate/deriveGoalState.ts` (590-680) — PLAN_STALE propagation from loadHeadBoundGatePlan; ensure comments/error mapping stay consistent after freshness model change; prefer no dual policy
- `tools/gate/gitUtils.ts` (1-100) — gitShowHead, gitBlobHashWorkingTree, gitBlobHashHead, gitLastCommit — keep dirty compare; last-touch no longer gates clean HEAD blob
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T175607Z.md` (39-59) — HIGH-2 + MEDIUM-1: PLAN_STALE at HEAD 91a05d9f; FIX-18 3/5 red due to multi-commit HEAD advance
- `convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts` (370-430) — AC-4 currently asserts PLAN_STALE for last-touch != HEAD — MUST revise under writeAllowed
- `convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts` (56-110) — commitBundle advances HEAD after plan commit; suite should go green from freshness model change alone
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json` (all) — READ-ONLY plan shape; do not rebind content under FIX-23

## CODE PATTERN

- Pattern: const headContent = gitShowHead(GATE_PLAN_REL, cwd); if (!headContent) return PLAN_NOT_IN_HEAD; const wtHash = gitBlobHashWorkingTree(planWtPath, cwd); const headHash = gitBlobHashHead(GATE_PLAN_REL, cwd); if (headHash && wtHash && wtHash !== headHash) return PLAN_NOT_HEAD_BOUND (dirty_working_tree); // REMOVE: if (gitLastCommit(GATE_PLAN_REL) !== head) return PLAN_STALE; const plan = JSON.parse(headContent); // HEAD-bound by construction
- Pattern source: `tools/gate/verifyEvidenceManifest.ts:145-230 + review HIGH-2 remediation guidance`
- Anti-pattern: Requiring plan last-touch commit == HEAD (breaks every clean checkout after any unrelated commit; red FIX-18 multi-commit fixtures); falling back to readFileSync WT plan; dropping dirty check when changing freshness
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T175607Z.md`, `tools/gate/verifyEvidenceManifest.ts:180-205`, `tools/gate/deriveGoalState.ts:645-664`, `convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts:370-430`

## VERIFICATION GATES

- AC-1 PRIMARY clean last-touch-behind: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-1'` → Exit 0; planLoad.ok; no PLAN_STALE
- AC-2 dirty still fail-closed: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-2'` → Exit 0; PLAN_NOT_HEAD_BOUND|PLAN_DIRTY
- AC-3 missing HEAD plan: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-3'` → Exit 0; PLAN_NOT_IN_HEAD
- AC-4 FIX-18 multi-commit not PLAN_STALE: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-4'` → Exit 0
- AC-5 FIX-21 contract revision: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-5'` → Exit 0
- Full FIX-23 suite: `npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts` → Exit 0
- FIX-18 regression: `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts` → Exit 0
- FIX-21 regression (revised AC-4): `npx vitest run convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts` → Exit 0
- Typecheck: `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check tools/gate/verifyEvidenceManifest.ts tools/gate/deriveGoalState.ts convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only` → Only paths in guardrails.write_allowed

- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-23-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns tools/gate loadHeadBoundGatePlan freshness contract in verifyEvidenceManifest.ts and propagation into deriveGoalState: remove last-touch==HEAD PLAN_STALE fail-closed while keeping HEAD-blob authority + dirty WT rejection, and update FIX-21 AC-4 + FIX-18 multi-commit fixture expectations to the new contract.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced)
- Integration coverage: PRIMARY AC is integration against real services (filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: REDHAT-FIX-21
- Blocks: —
- Notes: Review source: .spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T175607Z.md HIGH-2 (and MEDIUM-1 FIX-18 red from same root cause).

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md
- Command note: use `npx vitest run` not `pnpm test` (watch hang); vitest filter is `-t '<name>'`

## NOTES

- Review source: .spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T175607Z.md HIGH-2 (and MEDIUM-1 FIX-18 red from same root cause).
- FIX-21 correctly made plan content HEAD-bound; HIGH-2 is an availability defect from over-strict last-touch==HEAD freshness, not a reopening of WT authority.
- Prefer removing the planTouch !== headCommit block entirely; plan is HEAD-bound by gitShowHead construction. Optionally retain gitLastCommit only for details/diagnostics, never as fail-closed on clean blobs.
- PLAN_STALE code may remain in the type union for back-compat but should not be returned for clean last-touch-behind cases after this fix.
- Coordinate with FIX-24: FIX-23 unblocks gate usability; FIX-24 closes full-command OFF_PLAN equality. Implement FIX-23 first if ordering matters for real-repo verification.
- NEVER forge human PASS / S4-T7 evidence. Honest human-step BLOCK after reaching evaluation is success for AC-1.
- RED-first: write AC-1 failing against current PLAN_STALE behavior before removing the last-touch check.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-23",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "clean-plan-blob-at-head-last-touch-behind": {
      "description": "Temp git repo with committed honest 8-step gate-plan at some commit, then an unrelated file commit advances HEAD so plan last-touch != HEAD, while WT plan bytes still equal HEAD plan blob (clean).",
      "seed_method": "public_api",
      "records": [
        "commit GATE_PLAN_REL with steps n=1..8 and literal_cmds under 2026-07-21T152805Z",
        "commit unrelated.txt (or evidence bundle) without rewriting plan \u2192 HEAD advances",
        "gitLastCommit(GATE_PLAN_REL) !== git rev-parse HEAD",
        "gitBlobHashWorkingTree(GATE_PLAN_REL) === gitBlobHashHead(GATE_PLAN_REL)",
        "gitShowHead(GATE_PLAN_REL) still has steps 1..8"
      ]
    },
    "dirty-wt-plan-after-unrelated-head-advance": {
      "description": "Same as clean-plan-blob-at-head-last-touch-behind then overwrite working-tree gate-plan.json (e.g. one-step) without committing so wtHash !== headHash.",
      "seed_method": "public_api",
      "records": [
        "start from clean-plan-blob-at-head-last-touch-behind",
        "writeFileSync(GATE_PLAN_REL) with mutated steps without git commit",
        "wtHash !== headHash for GATE_PLAN_REL",
        "HEAD blob still honest 1..8"
      ]
    },
    "plan-missing-from-head": {
      "description": "Temp git repo where GATE_PLAN_REL is not present as a HEAD blob (never committed or deleted at HEAD).",
      "seed_method": "public_api",
      "records": [
        "temp git repo without committed GATE_PLAN_REL (or path removed in HEAD)",
        "gitShowHead(GATE_PLAN_REL) returns empty/null",
        "must fail closed PLAN_NOT_IN_HEAD"
      ]
    },
    "fix18-multi-commit-plan-then-evidence": {
      "description": "FIX-18-style temp repo: plan committed first, evidence bundle committed in a later commit advancing HEAD past plan last-touch; used to prove completeness/identity codes not PLAN_STALE.",
      "seed_method": "public_api",
      "records": [
        "commit honest plan at init (as REDHAT-FIX-18 makeTempRepo)",
        "commitBundle advances HEAD without re-touching plan",
        "plan last-touch != HEAD after evidence commit",
        "deriveGoalState / verifyEvidenceManifest must reach completeness path"
      ]
    },
    "clean-head-bound-eight-step-plan": {
      "description": "Happy-path clean plan: wtHash===headHash and optionally last-touch===HEAD; loader returns expectedSteps [1..8].",
      "seed_method": "public_api",
      "records": [
        "committed 8-step plan; no WT mutation after commit",
        "wtHash === headHash for GATE_PLAN_REL",
        "loadHeadBoundGatePlan.ok === true; expectedSteps === [1,2,3,4,5,6,7,8]"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN clean plan blob at HEAD where plan last-touch != HEAD (unrelated commits advanced HEAD) WHEN loadHeadBoundGatePlan / deriveGoalState runs THEN does NOT return PLAN_STALE; planLoad.ok===true with expectedSteps===[1,2,3,4,5,6,7,8]; reaches step evaluation (may still met===false for honest human BLOCK reasons)",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + loadHeadBoundGatePlan/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "loadHeadBoundGatePlan still returns PLAN_STALE when planTouch !== headCommit even though wtHash===headHash and gitShowHead has the plan",
            "freshness is stubbed to always fail closed on last-touch inequality regardless of HEAD blob presence",
            "static shell returns error.code == 'PLAN_STALE' for clean-plan-blob-at-head-last-touch-behind without evaluating steps"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "clean-plan-blob-at-head-last-touch-behind",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create temp git repo; commit honest 8-step GATE_PLAN_REL",
                "Commit unrelated file so HEAD advances past plan last-touch",
                "Assert gitLastCommit(GATE_PLAN_REL) !== HEAD and wtHash === headHash",
                "Call loadHeadBoundGatePlan(cwd, head) and deriveGoalState",
                "Capture planLoad.ok, expectedSteps, state.error?.code"
              ]
            },
            "end_state": {
              "must_observe": [
                "planLoad.ok === true",
                "planLoad.expectedSteps === [1,2,3,4,5,6,7,8]",
                "state.error?.code !== 'PLAN_STALE'",
                "gitLastCommit(GATE_PLAN_REL) !== headCommit === true"
              ],
              "must_not_observe": [
                "error.code == 'PLAN_STALE'",
                "planLoad.ok === false && planLoad.code == 'PLAN_STALE'",
                "state.met === true with empty step evaluation",
                "empty accept of dirty plan"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN dirty WT plan (wtHash !== headHash) after HEAD advanced past plan last-touch WHEN plan load runs THEN PLAN_NOT_HEAD_BOUND or PLAN_DIRTY; never WT plan authority",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + gitBlobHashWorkingTree/gitBlobHashHead/loadHeadBoundGatePlan",
        "negative_control": {
          "would_fail_if": [
            "dirty check is removed or stubbed so wtHash !== headHash returns planLoad.ok===true",
            "loader falls back to readFileSync WT bytes after freshness model change",
            "static shell returns ok:true for dirty-wt-plan-after-unrelated-head-advance"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "dirty-wt-plan-after-unrelated-head-advance",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed clean last-touch-behind plan then mutate WT GATE_PLAN_REL",
                "Call loadHeadBoundGatePlan",
                "Capture error.code and reason"
              ]
            },
            "end_state": {
              "must_observe": [
                "wtHash !== headHash === true",
                "error.code == 'PLAN_NOT_HEAD_BOUND' || error.code == 'PLAN_DIRTY'",
                "planLoad.ok === false"
              ],
              "must_not_observe": [
                "planLoad.ok === true for dirty plan",
                "error === null",
                "empty plan dirty rejection"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN plan not in HEAD WHEN loadHeadBoundGatePlan runs THEN PLAN_NOT_IN_HEAD fail-closed",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + gitShowHead/loadHeadBoundGatePlan",
        "negative_control": {
          "would_fail_if": [
            "loader falls back to package-root or cwd readFileSync when HEAD plan is missing",
            "missing HEAD plan is treated as empty expectedSteps success",
            "static shell returns planLoad.ok===true for plan-missing-from-head"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "plan-missing-from-head",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create temp repo without GATE_PLAN_REL at HEAD",
                "Call loadHeadBoundGatePlan",
                "Capture code"
              ]
            },
            "end_state": {
              "must_observe": [
                "planLoad.ok === false",
                "error.code == 'PLAN_NOT_IN_HEAD'"
              ],
              "must_not_observe": [
                "planLoad.ok === true",
                "error === null",
                "empty missing-plan accept"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN FIX-18 multi-commit plan-then-evidence fixture WHEN incomplete/identity cases run THEN INCOMPLETE_CANONICAL_STEPS / INVALID_STEP_IDENTITY / INCOMPLETE_EVIDENCE_STEPS \u2014 not PLAN_STALE; FIX-18 suite green",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + deriveGoalState/verifyEvidenceManifest (FIX-18 harness)",
        "negative_control": {
          "would_fail_if": [
            "multi-commit plan-then-evidence still exits with PLAN_STALE before completeness evaluation",
            "AC assertions accept any error including PLAN_STALE as success for incompleteness",
            "static shell returns PLAN_STALE for fix18-multi-commit-plan-then-evidence one-step bundle"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "fix18-multi-commit-plan-then-evidence",
            "action": {
              "actor": "api_client",
              "steps": [
                "Build multi-commit plan+evidence repo",
                "Run deriveGoalState incomplete / identity paths",
                "Capture error codes"
              ]
            },
            "end_state": {
              "must_observe": [
                "state.error?.code == 'INCOMPLETE_CANONICAL_STEPS' || state.error?.code == 'INVALID_STEP_IDENTITY' || state.error?.code == 'INCOMPLETE_EVIDENCE_STEPS'",
                "state.met === false",
                "state.error?.code !== 'PLAN_STALE'"
              ],
              "must_not_observe": [
                "error.code == 'PLAN_STALE'",
                "state.met === true",
                "state.goal === 'GATE-GOAL: ACHIEVED'",
                "empty incomplete rejection (accepted one-step as complete)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN revised FIX-21 AC-4 contract WHEN clean last-touch-behind and dirty paths run THEN clean succeeds with expectedSteps 1..8; dirty PLAN_NOT_HEAD_BOUND/PLAN_DIRTY; no PLAN_STALE for clean last-touch inequality",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-5'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git + FIX-21 suite + optional real-repo deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "FIX-21 AC-4 still asserts PLAN_STALE for clean last-touch != HEAD after model change",
            "revised tests still require planTouch === head for planLoad.ok",
            "static shell treats any non-PLAN_STALE as met===true / ACHIEVED"
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
                "Assert clean load expectedSteps 1..8",
                "Assert clean last-touch-behind load ok true",
                "Assert dirty fail-closed"
              ]
            },
            "end_state": {
              "must_observe": [
                "cleanPath: expectedSteps === [1,2,3,4,5,6,7,8]",
                "lastTouchBehindCleanPath: planLoad.ok === true && expectedSteps === [1,2,3,4,5,6,7,8]",
                "dirtyPath: error.code == 'PLAN_NOT_HEAD_BOUND' || error.code == 'PLAN_DIRTY'"
              ],
              "must_not_observe": [
                "lastTouchBehindCleanPath: error.code == 'PLAN_STALE'",
                "dirtyPath: planLoad.ok === true",
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
      "description": "loadHeadBoundGatePlan returns ok:true with expectedSteps [1..8] when plan last-touch != HEAD but wtHash===headHash and plan exists at HEAD",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "deriveGoalState does not surface error.code PLAN_STALE for clean last-touch-behind-HEAD plan",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Dirty WT plan still fails closed with PLAN_NOT_HEAD_BOUND or PLAN_DIRTY after freshness model change",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Missing HEAD plan blob fails closed with PLAN_NOT_IN_HEAD",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "FIX-18 multi-commit one-step incomplete path yields INCOMPLETE_CANONICAL_STEPS or INCOMPLETE_EVIDENCE_STEPS not PLAN_STALE",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-4'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "FIX-21 AC-4 no longer requires PLAN_STALE for clean last-touch != HEAD; asserts planLoad.ok and expectedSteps 1..8 instead",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-23-plan-freshness-head-blob.integration.test.ts -t 'AC-5'"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Full FIX-18 suite exits 0 after freshness model change (regression green)",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts"
    }
  ]
}
-->

</details>
