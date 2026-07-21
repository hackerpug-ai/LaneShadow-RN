# REDHAT-FIX-22 — Enforce exact HEAD-bound plan script/command match for off-plan rejection (not run-ID allow-list)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-22 |
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
| DEPENDS_ON | REDHAT-FIX-21 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-22-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Close HIGH-1: rejectOffPlanScripts must enforce exact command/script equality against HEAD-bound gate-plan literal_cmd entries so any substitute script under an allowed run directory is rejected.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST compare each step's executed command/script (repro_cmd) and bundle path against the exact HEAD-bound plan entry literal_cmd paths (exact string/path equality after canonicalization — not a run-ID prefix allow-list)
- MUST reject substitute scripts under an allowed run directory (e.g. bash .../.gate-evidence/2026-07-21T152805Z/scripts/not-in-gate-plan.sh) with OFF_PLAN_SCRIPT
- MUST fail closed when the HEAD-bound plan has no/malformed literal_cmds — do NOT return null and skip at the former :452-454 empty-literalCmds early-exit
- MUST consume FIX-21's HEAD-bound plan loader (or the same immutable HEAD plan object) — never re-introduce working-tree plan authority for binding
- MUST prove PRIMARY negative: substitute script under allowed 2026-07-21T152805Z run dir → OFF_PLAN_SCRIPT / met===false

**NEVER**
- NEVER own dirty-plan completeness shrink / expected-set authority (that is REDHAT-FIX-21)
- NEVER accept arbitrary scripts solely because they live under an allowed run-ID directory
- NEVER forge human PASS / S4-T7 Founder-Operator evidence or force state.met === true
- NEVER rebind gate-plan.json content or re-admit 2026-07-19T22:59:46Z as plan target
- NEVER weaken FIX-12 / FIX-18 / FIX-21 HEAD-bound checks

**STRICTLY**
- STRICTLY exact match is against plan-owned script paths extracted from HEAD-bound literal_cmds (canonicalized paths), not substring-of-runId membership alone
- STRICTLY withdrawn run paths and non-plan scripts under the honest run both produce OFF_PLAN_SCRIPT
- STRICTLY depends_on REDHAT-FIX-21 for immutable plan load

## DONE WHEN

- AC-1 [Substitute script under allowed run dir rejected OFF_PLAN_SCRIPT] [PRIMARY]: rejectOffPlanScripts / deriveGoalState returns OFF_PLAN_SCRIPT and state.met === false — not null/accepted
- AC-2 [Exact plan literal_cmd path is not OFF_PLAN on script axis]: off-plan axis does not return OFF_PLAN_SCRIPT for the exact plan path (null on this axis); any remaining met===false is founder/completeness/other — not false-p
- AC-3 [Empty/malformed plan literal_cmds fail closed]: fails closed with OFF_PLAN_SCRIPT (or explicit plan-binding error) — does NOT return null and skip validation
- AC-4 [Withdrawn forged run path still OFF_PLAN under exact match]: OFF_PLAN_SCRIPT / state.met === false (exact-match and run binding both reject withdrawn path)
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close HIGH-1: rejectOffPlanScripts must enforce exact command/script equality against HEAD-bound gate-plan literal_cmd entries so any substitute script under an allowed run directory is rejected.

**Success state:** Given a HEAD-bound plan with exact literal_cmds under 2026-07-21T152805Z, repro_cmd bash .../.gate-evidence/2026-07-21T152805Z/scripts/not-in-gate-plan.sh yields OFF_PLAN_SCRIPT and state.met === false (not null/accepted); exact plan literal_cmd paths still pass the off-plan axis; empty/malformed plan literal_cmds fail closed.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `head-bound-honest-plan-literal-cmds` (seed_method: `public_api`): Temp git repo with HEAD-bound gate-plan.json whose steps[].literal_cmd exactly name scripts under 2026-07-21T152805Z (post FIX-20 rebinding shape).
    - GATE_PLAN_REL committed at HEAD with steps 1..8
    - each literal_cmd is 'bash <path>/.gate-evidence/2026-07-21T152805Z/scripts/step{N}.sh'
    - plan loader is HEAD-bound (FIX-21)
- `substitute-script-under-allowed-run` (seed_method: `public_api`): A repro_cmd that lives under the allowed honest run directory but is not any plan literal_cmd script.
    - repro_cmd: bash <repo>/.gate-evidence/2026-07-21T152805Z/scripts/not-in-gate-plan.sh
    - runId 2026-07-21T152805Z is present in plan allow-list run set
    - script path is NOT equal to any plan step literal_cmd script path
- `exact-plan-step1-repro-cmd` (seed_method: `public_api`): A repro_cmd that exactly matches the HEAD-bound plan step1 literal_cmd path (off-plan axis should not fire).
    - repro_cmd equals plan steps.find(s => s.n === 1).literal_cmd (or its canonical script path)
    - used as control that exact match is not false-positive rejected solely by off-plan axis
- `malformed-empty-literal-cmds-plan` (seed_method: `public_api`): HEAD-bound plan present but steps lack usable literal_cmd strings (empty or missing).
    - plan JSON steps with n=1..8 but literal_cmd missing/empty/non-string
    - committed at HEAD; dirty check clean
    - must fail closed on off-plan axis rather than return null

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Substitute script under allowed run dir rejected OFF_PLAN_SCRIPT

**Requirement:** GIVEN HEAD-bound plan with exact literal_cmds under 2026-07-21T152805Z WHEN repro_cmd is bash path/to/.gate-evidence/2026-07-21T152805Z/scripts/not-in-gate-plan.sh (under allowed run, wrong script) THEN rejectOffPlanScripts / deriveGoalState returns OFF_PLAN_SCRIPT and state.met === false — not null/accepted

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: rejectOffPlanScripts is left as run-ID allow-list only so not-in-gate-plan.sh under 2026-07-21T152805Z returns null; off-plan check is stubbed to accept any path containing an allowed runId; static shell returns error === null for substitute-script-under-allowed-run
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `substitute-script-under-allowed-run`
  - ACTION: Create temp repo with head-bound-honest-plan-literal-cmds at HEAD (FIX-21 clean); Call rejectOffPlanScripts([{n:1,result:'PASS',repro_cmd: 'bash .../2026-07-21T152805Z/scripts/not-in-gate-plan.sh'}], undefined, cwd, head); Also invoke deriveGoalState with the same repro_cmd and capture state.met / error.code
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false; error.details.reason includes 'off-plan' || error.details.script includes 'not-in-gate-plan.sh'
  - MUST_NOT_OBSERVE: error === null; state.met === true; rejectOffPlanScripts returns null for not-in-gate-plan.sh; nothing rejected for not-in-gate-plan.sh

### AC-2 — Exact plan literal_cmd path is not OFF_PLAN on script axis

**Requirement:** GIVEN HEAD-bound plan and a repro_cmd that exactly matches step1's plan literal_cmd / canonical script path WHEN rejectOffPlanScripts runs for that exact match THEN off-plan axis does not return OFF_PLAN_SCRIPT for the exact plan path (null on this axis); any remaining met===false is founder/completeness/other — not false-positive off-plan

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: exact-match comparison is stubbed to reject all scripts including plan-owned step1.sh; path canonicalization is mocked to never equal plan literal_cmd; static shell always returns OFF_PLAN_SCRIPT for any .sh path
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `exact-plan-step1-repro-cmd`
  - ACTION: Resolve step1 literal_cmd from HEAD-bound plan; Call rejectOffPlanScripts with repro_cmd equal to that literal_cmd; Capture return value
  - MUST_OBSERVE: rejectOffPlanScripts(...) === null || error.code !== 'OFF_PLAN_SCRIPT'; exact plan step1 script path is in the allowed plan-owned path set
  - MUST_NOT_OBSERVE: error.code == 'OFF_PLAN_SCRIPT' for exact plan step1 path; false-positive off-plan on exact match; empty exact-match accept path (false-positive OFF_PLAN on plan script)

### AC-3 — Empty/malformed plan literal_cmds fail closed

**Requirement:** GIVEN HEAD-bound plan whose steps have missing/empty/non-string literal_cmds WHEN rejectOffPlanScripts / plan-binding runs THEN fails closed with OFF_PLAN_SCRIPT (or explicit plan-binding error) — does NOT return null and skip validation

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: empty literalCmds early-return null is left in place (former :452-454 skip); malformed plan is stubbed to skip off-plan validation; static shell treats missing literal_cmds as allow-all
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `malformed-empty-literal-cmds-plan`
  - ACTION: Commit HEAD plan with steps lacking usable literal_cmd strings; Call rejectOffPlanScripts with any repro_cmd / steps; Capture return value / error.code
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT' || error.code == 'PLAN_NOT_HEAD_BOUND' || error.details.reason includes 'literal_cmd' || error.details.reason includes 'no plan'; rejectOffPlanScripts does not return null solely because literalCmds.length === 0
  - MUST_NOT_OBSERVE: error === null; silent skip of off-plan validation on empty literalCmds; state.met === true

### AC-4 — Withdrawn forged run path still OFF_PLAN under exact match

**Requirement:** GIVEN HEAD-bound plan only lists 2026-07-21T152805Z scripts WHEN repro_cmd references 2026-07-19T22:59:46Z/scripts/step1.sh THEN OFF_PLAN_SCRIPT / state.met === false (exact-match and run binding both reject withdrawn path)

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: withdrawn run path is mocked as allowed because it is timestamp-shaped; exact-match check is stubbed to only enforce same-run-id membership; static shell returns null for 2026-07-19T22:59:46Z scripts
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `head-bound-honest-plan-literal-cmds`
  - ACTION: Invoke rejectOffPlanScripts / deriveGoalState with repro_cmd pointing at 2026-07-19T22:59:46Z/scripts/step1.sh; Capture error.code and state.met
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; state.goal === 'GATE-GOAL: ACHIEVED'; no OFF_PLAN_SCRIPT for withdrawn forged run

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd is not-in-gate-plan.sh under allowed run 2026-07-21T152805Z | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'` |
| TC-2 | state.met is false when deriveGoalState receives the substitute not-in-gate-plan.sh repro_cmd | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'` |
| TC-3 | rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for a repro_cmd that exactly matches plan step1 literal_cmd | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-2'` |
| TC-4 | rejectOffPlanScripts fails closed when HEAD-bound plan has empty or missing literal_cmds | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-3'` |
| TC-5 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for repro_cmd under withdrawn 2026-07-19T22:59:46Z | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-4'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/deriveGoalState.ts (MODIFY — rejectOffPlanScripts exact string/path match against HEAD-bound plan literal_cmds; fail closed on empty/malformed literal_cmds; consume FIX-21 HEAD plan loader)
- tools/gate/verifyEvidenceManifest.ts (MODIFY only if exporting a shared loadHeadBoundGatePlan binding helper already introduced by FIX-21 — no completeness changes)
- convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts (NEW)

**writeProhibited:**
- tools/gate/verifyEvidenceManifest.ts dirty-plan expected-set shrink authority — REDHAT-FIX-21 owns that
- Dirty one-step completeness reproducer ownership — REDHAT-FIX-21
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json rebinding
- Forging human PASS / S4-T7 Founder-Operator evidence
- Weakening FIX-12 / FIX-18 / FIX-21 checks
- Any RN/Expo/app client code
- convex/couchVerdict.ts — out of scope

## READING LIST

- `tools/gate/deriveGoalState.ts` (395-424) — loadGatePlanBinding — must consume FIX-21 HEAD-bound plan; exposes literalCmds used for exact match
- `tools/gate/deriveGoalState.ts` (447-487) — [PRIMARY BUG] rejectOffPlanScripts run-ID allow-list only; empty literalCmds returns null at :452-454 — exact path match + fail-closed
- `tools/gate/verifyEvidenceManifest.ts` (74-105) — Shared GATE_PLAN_REL and (after FIX-21) HEAD-bound plan loader to reuse
- `tools/gate/verifyEvidenceManifest.ts` (160-201) — FIX-12 v3 pattern reference for immutable authority (plan already HEAD-bound via FIX-21)
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T165629Z.md` (31-37) — HIGH-1 finding + fix: exact plan-owned paths; fail closed for malformed literal_cmds
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json` (9-113) — HEAD-bound literal_cmd paths under 2026-07-21T152805Z — exact match targets
- `convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts` (1-120) — Existing off-plan / stale-path test harness to extend with exact-script negative

## CODE PATTERN

- Pattern: const plan = loadHeadBoundGatePlan(cwd); // FIX-21 if (!plan.ok) return plan.error; const allowedScripts = new Set(plan.literalCmds.map(canonicalizeScriptPath)); if (allowedScripts.size === 0) return OFF_PLAN_SCRIPT (no_literal_cmds); for each repro_cmd: if (!allowedScripts.has(canonicalizeScriptPath(repro_cmd))) return OFF_PLAN_SCRIPT;
- Pattern source: `tools/gate/deriveGoalState.ts:447-487 + FIX-21 loadHeadBoundGatePlan`
- Anti-pattern: extractTimestampEvidenceRunIds + runIds.has(runId) only; if (binding.literalCmds.length === 0) return null; accepting any script under an allowed run directory
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T165629Z.md`, `tools/gate/deriveGoalState.ts:447-487`, `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json`

## VERIFICATION GATES

- AC-1 PRIMARY substitute script under allowed run rejected: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'` → Exit 0; error.code == 'OFF_PLAN_SCRIPT'; state.met === false
- AC-2 exact plan path not false-positive OFF_PLAN: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-2'` → Exit 0; exact step1 literal_cmd not OFF_PLAN_SCRIPT
- AC-3 empty/malformed literal_cmds fail closed: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-3'` → Exit 0; no null skip on empty literalCmds
- AC-4 withdrawn run still OFF_PLAN: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-4'` → Exit 0; OFF_PLAN_SCRIPT for 2026-07-19T22:59:46Z
- Full FIX-22 suite: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts` → Exit 0
- Typecheck: `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check tools/gate/deriveGoalState.ts convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only` → Only paths in guardrails.write_allowed
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-22-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns rejectOffPlanScripts in tools/gate/deriveGoalState.ts: upgrade off-plan validation from run-ID directory allow-list to exact command/script equality against HEAD-bound gate-plan literal_cmd entries.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced)
- Integration coverage: PRIMARY AC is integration against real services (filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: REDHAT-FIX-21
- Blocks: —
- Notes: Depends on REDHAT-FIX-21 HEAD-bound plan load; implement after or on top of FIX-21 loader Keep synthetic harness run dirs (non-timestamp) outside exact timestamp path enforcement if FIX-20/18 tests require — but never allow timestamp-shaped off-plan scripts

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

## NOTES

- Depends on REDHAT-FIX-21 HEAD-bound plan load; implement after or on top of that loader.
- MEDIUM-1 (non-blocking): serialize/isolate destructive FIX integration suites when feasible.
- Review source: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T165629Z.md` HIGH-1.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-22",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "head-bound-honest-plan-literal-cmds": {
      "description": "Temp git repo with HEAD-bound gate-plan.json whose steps[].literal_cmd exactly name scripts under 2026-07-21T152805Z (post FIX-20 rebinding shape).",
      "seed_method": "public_api",
      "records": [
        "GATE_PLAN_REL committed at HEAD with steps 1..8",
        "each literal_cmd is 'bash <path>/.gate-evidence/2026-07-21T152805Z/scripts/step{N}.sh'",
        "plan loader is HEAD-bound (FIX-21)"
      ]
    },
    "substitute-script-under-allowed-run": {
      "description": "A repro_cmd that lives under the allowed honest run directory but is not any plan literal_cmd script.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: bash <repo>/.gate-evidence/2026-07-21T152805Z/scripts/not-in-gate-plan.sh",
        "runId 2026-07-21T152805Z is present in plan allow-list run set",
        "script path is NOT equal to any plan step literal_cmd script path"
      ]
    },
    "exact-plan-step1-repro-cmd": {
      "description": "A repro_cmd that exactly matches the HEAD-bound plan step1 literal_cmd path (off-plan axis should not fire).",
      "seed_method": "public_api",
      "records": [
        "repro_cmd equals plan steps.find(s => s.n === 1).literal_cmd (or its canonical script path)",
        "used as control that exact match is not false-positive rejected solely by off-plan axis"
      ]
    },
    "malformed-empty-literal-cmds-plan": {
      "description": "HEAD-bound plan present but steps lack usable literal_cmd strings (empty or missing).",
      "seed_method": "public_api",
      "records": [
        "plan JSON steps with n=1..8 but literal_cmd missing/empty/non-string",
        "committed at HEAD; dirty check clean",
        "must fail closed on off-plan axis rather than return null"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN HEAD-bound plan with exact literal_cmds under 2026-07-21T152805Z WHEN repro_cmd is bash .../.gate-evidence/2026-07-21T152805Z/scripts/not-in-gate-plan.sh THEN error.code == 'OFF_PLAN_SCRIPT' and state.met === false — not null/accepted",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "rejectOffPlanScripts is left as run-ID allow-list only so not-in-gate-plan.sh under 2026-07-21T152805Z returns null",
            "off-plan check is stubbed to accept any path containing an allowed runId",
            "static shell returns error === null for substitute-script-under-allowed-run"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "substitute-script-under-allowed-run",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create temp repo with HEAD-bound honest plan",
                "Call rejectOffPlanScripts with repro_cmd not-in-gate-plan.sh under 2026-07-21T152805Z",
                "Invoke deriveGoalState and capture state.met / error.code"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'OFF_PLAN_SCRIPT'",
                "state.met === false",
                "error.details.reason includes 'off-plan' || error.details.script includes 'not-in-gate-plan.sh'"
              ],
              "must_not_observe": [
                "error === null",
                "state.met === true",
                "rejectOffPlanScripts returns null for not-in-gate-plan.sh",
                "nothing rejected for not-in-gate-plan.sh"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan and repro_cmd exactly matching step1 literal_cmd WHEN rejectOffPlanScripts runs THEN off-plan axis does not return OFF_PLAN_SCRIPT for that exact path",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts",
        "negative_control": {
          "would_fail_if": [
            "exact-match comparison is stubbed to reject all scripts including plan-owned step1.sh",
            "path canonicalization is mocked to never equal plan literal_cmd",
            "static shell always returns OFF_PLAN_SCRIPT for any .sh path"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "exact-plan-step1-repro-cmd",
            "action": {
              "actor": "api_client",
              "steps": [
                "Resolve step1 literal_cmd from HEAD-bound plan",
                "Call rejectOffPlanScripts with that exact repro_cmd",
                "Capture return value"
              ]
            },
            "end_state": {
              "must_observe": [
                "rejectOffPlanScripts(...) === null || error.code !== 'OFF_PLAN_SCRIPT'"
              ],
              "must_not_observe": [
                "error.code == 'OFF_PLAN_SCRIPT' for exact plan step1 path",
                "false-positive off-plan on exact match",
                "empty exact-match accept path (false-positive OFF_PLAN on plan script)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan with empty/missing literal_cmds WHEN rejectOffPlanScripts runs THEN fails closed — does not return null solely because literalCmds.length === 0",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts",
        "negative_control": {
          "would_fail_if": [
            "empty literalCmds early-return null is left in place (former :452-454 skip)",
            "malformed plan is stubbed to skip off-plan validation",
            "static shell treats missing literal_cmds as allow-all"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "malformed-empty-literal-cmds-plan",
            "action": {
              "actor": "api_client",
              "steps": [
                "Commit HEAD plan lacking usable literal_cmds",
                "Call rejectOffPlanScripts",
                "Capture error"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'OFF_PLAN_SCRIPT' || error.code == 'PLAN_NOT_HEAD_BOUND' || error.details.reason includes 'literal_cmd' || error.details.reason includes 'no plan'"
              ],
              "must_not_observe": [
                "error === null",
                "silent skip of off-plan validation on empty literalCmds",
                "state.met === true"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan listing only 2026-07-21T152805Z scripts WHEN repro_cmd references 2026-07-19T22:59:46Z/scripts/step1.sh THEN error.code == 'OFF_PLAN_SCRIPT' and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "withdrawn run path is mocked as allowed because it is timestamp-shaped",
            "exact-match check is stubbed to only enforce same-run-id membership",
            "static shell returns null for 2026-07-19T22:59:46Z scripts"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "head-bound-honest-plan-literal-cmds",
            "action": {
              "actor": "api_client",
              "steps": [
                "Invoke rejectOffPlanScripts with withdrawn 2026-07-19 repro_cmd",
                "Capture error.code and state.met"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'OFF_PLAN_SCRIPT'",
                "state.met === false"
              ],
              "must_not_observe": [
                "error === null",
                "state.met === true",
                "state.goal === 'GATE-GOAL: ACHIEVED'",
                "no OFF_PLAN_SCRIPT for withdrawn forged run"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd is not-in-gate-plan.sh under allowed run 2026-07-21T152805Z",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "state.met is false when deriveGoalState receives the substitute not-in-gate-plan.sh repro_cmd",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for a repro_cmd that exactly matches plan step1 literal_cmd",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts fails closed when HEAD-bound plan has empty or missing literal_cmds",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for repro_cmd under withdrawn 2026-07-19T22:59:46Z",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-4'"
    }
  ]
}
-->

</details>
