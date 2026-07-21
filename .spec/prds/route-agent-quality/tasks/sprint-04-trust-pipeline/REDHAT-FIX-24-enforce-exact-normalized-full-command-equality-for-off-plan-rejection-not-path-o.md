# REDHAT-FIX-24 — Enforce exact NORMALIZED FULL-COMMAND equality for off-plan rejection (not path-only)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-24 |
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
| DEPENDS_ON | REDHAT-FIX-21, REDHAT-FIX-22 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-24-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Close HIGH-1: rejectOffPlanScripts must enforce exact normalized full-command equality against HEAD-bound gate-plan literal_cmd entries so appended flags, env-prefix wrappers, and interpreter swaps are rejected — not merely path-only .sh key match.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST enforce exact NORMALIZED FULL-COMMAND equality against HEAD-bound plan literal_cmds (interpreter + canonical script path + argument vector), not path-only .sh substring match
- MUST reject repro_cmd that appends unreviewed flags/args (e.g. bash plan-script.sh --unreviewed-flag) with OFF_PLAN_SCRIPT and met===false
- MUST reject environment-prefix wrappers (e.g. env FOO=attacker bash plan-script.sh) with OFF_PLAN_SCRIPT
- MUST reject different interpreters (e.g. sh plan-script.sh or python plan-script.sh vs plan bash) with OFF_PLAN_SCRIPT
- MUST still accept exact normalized full command matching plan literal_cmd on the off-plan axis (null / not OFF_PLAN_SCRIPT)
- MUST preserve FIX-22 path match for substitute scripts under allowed runs (not-in-gate-plan.sh still OFF_PLAN_SCRIPT)
- MUST consume HEAD-bound plan loader (FIX-21/23) — never re-introduce working-tree plan authority for binding

**NEVER**
- NEVER accept path-only match that ignores extra args, env KEY=val prefixes, or interpreter changes
- NEVER forge human PASS / S4-T7 Founder-Operator evidence or force state.met === true
- NEVER rebind gate-plan.json content or re-admit 2026-07-19T22:59:46Z as plan target
- NEVER own plan freshness last-touch policy (REDHAT-FIX-23) or dirty-plan expected-set shrink (REDHAT-FIX-21)
- NEVER weaken FIX-22 empty/malformed literal_cmds fail-closed behavior

**STRICTLY**
- STRICTLY normalize by tokenizing the full command; compare interpreter token + canonical script path + remaining arg vector equality
- STRICTLY reject env KEY=val prefixes and any argv not present on the matching plan literal_cmd
- STRICTLY depends_on REDHAT-FIX-22 path match remaining as a necessary subset of full-command equality; may depend on FIX-21 HEAD plan (and FIX-23 if real-repo clean HEAD is needed for end-to-end)
- STRICTLY timestamp-shaped .gate-evidence script commands remain the enforced surface; keep synthetic harness dirs outside timestamp path enforcement only if FIX-18/20 still require

## DONE WHEN

- AC-1 [rejectOffPlanScripts / deriveGoalState returns OFF_PLAN_SCRIPT and state.met === false — not null/accepted on path-only ] [PRIMARY]: rejectOffPlanScripts / deriveGoalState returns OFF_PLAN_SCRIPT and state.met === false — not null/accepted on path-only match
- AC-2 [OFF_PLAN_SCRIPT / met===false — env-prefix not treated as equal full command]: OFF_PLAN_SCRIPT / met===false — env-prefix not treated as equal full command
- AC-3 [OFF_PLAN_SCRIPT / met===false]: OFF_PLAN_SCRIPT / met===false
- AC-4 [off-plan axis does not return OFF_PLAN_SCRIPT (null / not OFF_PLAN); any remaining met===false is founder/completeness/o]: off-plan axis does not return OFF_PLAN_SCRIPT (null / not OFF_PLAN); any remaining met===false is founder/completeness/other — not false-positive full-command reject
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close HIGH-1: rejectOffPlanScripts must enforce exact normalized full-command equality against HEAD-bound gate-plan literal_cmd entries so appended flags, env-prefix wrappers, and interpreter swaps are rejected — not merely path-only .sh key match.

**Success state:** Given HEAD-bound plan literal_cmd `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh`, repro_cmds `bash .../step1.sh --unreviewed-flag`, `env FOO=attacker bash .../step1.sh`, and `sh .../step1.sh` / `python .../step1.sh` all yield OFF_PLAN_SCRIPT with met===false; exact normalized plan literal_cmd still returns null on the off-plan axis; FIX-22 substitute not-in-gate-plan.sh remains rejected.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `head-bound-plan-step1-bash-literal` (seed_method: `public_api`): Temp git repo with HEAD-bound clean plan whose step1 literal_cmd is exactly `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (relative or absolute-canonicalizable).
    - GATE_PLAN_REL committed at HEAD with steps 1..8
    - step1.literal_cmd == 'bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh'
    - plan loader HEAD-bound + clean (FIX-21/23)
    - wtHash === headHash
- `repro-extra-unreviewed-flag` (seed_method: `public_api`): repro_cmd that keeps plan script path but appends --unreviewed-flag.
    - repro_cmd: bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh --unreviewed-flag
    - script path alone would path-match plan step1 under FIX-22
    - must be OFF_PLAN under full-command equality
- `repro-env-prefix-wrapper` (seed_method: `public_api`): repro_cmd that prefixes env VAR=value before the plan bash+script.
    - repro_cmd: env FOO=attacker bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh
    - script path alone would path-match plan step1 under FIX-22
    - must be OFF_PLAN under full-command equality
- `repro-different-interpreter` (seed_method: `public_api`): repro_cmd that uses a different interpreter than plan bash for the same script path.
    - repro_cmd variants: sh .gate-evidence/2026-07-21T152805Z/scripts/step1.sh OR python .gate-evidence/2026-07-21T152805Z/scripts/step1.sh
    - plan literal_cmd interpreter is bash
    - must be OFF_PLAN under full-command equality
- `repro-exact-plan-full-command` (seed_method: `public_api`): repro_cmd that exactly matches normalized plan step1 literal_cmd (control accept on off-plan axis).
    - repro_cmd equals plan step1.literal_cmd after same normalization
    - off-plan axis must not return OFF_PLAN_SCRIPT
    - other axes (founder/completeness) may still yield met===false

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — rejectOffPlanScripts / deriveGoalState returns OFF_PLAN_SCRIPT and state.met === false — n

**Requirement:** GIVEN HEAD-bound plan with step1 literal_cmd `bash .../step1.sh` only WHEN repro_cmd is `bash .../step1.sh --unreviewed-flag` THEN rejectOffPlanScripts / deriveGoalState returns OFF_PLAN_SCRIPT and state.met === false — not null/accepted on path-only match

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: canonicalizeScriptPath path-only match still accepts --unreviewed-flag because .sh key equals plan script; off-plan check is stubbed to compare only basename of .sh; static shell returns error === null for repro-extra-unreviewed-flag
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-extra-unreviewed-flag`
  - ACTION: Create temp repo with head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with repro_cmd bash .../step1.sh --unreviewed-flag; Invoke deriveGoalState with same repro_cmd; capture error.code and state.met
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false; error.details.reason includes 'off-plan' || error.details.script includes '--unreviewed-flag' || error.details.script includes 'step1.sh'
  - MUST_NOT_OBSERVE: error === null; state.met === true; rejectOffPlanScripts returns null for --unreviewed-flag; path-only accept of extra args; empty off-plan rejection (path-only accept)

### AC-2 — OFF_PLAN_SCRIPT / met===false — env-prefix not treated as equal full command

**Requirement:** GIVEN HEAD-bound plan with step1 bash literal_cmd WHEN repro_cmd is `env FOO=attacker bash .../step1.sh` THEN OFF_PLAN_SCRIPT / met===false — env-prefix not treated as equal full command

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: env FOO=attacker prefix is stripped and remaining bash+script path-matches as accept; off-plan check only scans for .sh substring after env tokens; static shell returns null for repro-env-prefix-wrapper
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-env-prefix-wrapper`
  - ACTION: Seed head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with env FOO=attacker bash .../step1.sh; Capture error.code and state.met
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; env-prefix accepted as path-only match; empty off-plan rejection for env wrapper

### AC-3 — OFF_PLAN_SCRIPT / met===false

**Requirement:** GIVEN HEAD-bound plan with bash interpreter for step1 WHEN repro_cmd uses sh or python for the same script path THEN OFF_PLAN_SCRIPT / met===false

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: interpreter token is ignored and only .sh path is compared; sh/python substituted commands return null when script path matches plan; static shell always accepts any interpreter for plan-owned scripts
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `repro-different-interpreter`
  - ACTION: Seed head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts for sh .../step1.sh and/or python .../step1.sh; Capture error codes
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; interpreter mismatch accepted; empty off-plan rejection for sh/python swap

### AC-4 — off-plan axis does not return OFF_PLAN_SCRIPT (null / not OFF_PLAN); any remaining met===f

**Requirement:** GIVEN HEAD-bound plan and repro_cmd that exactly matches normalized plan step1 full literal_cmd WHEN rejectOffPlanScripts runs THEN off-plan axis does not return OFF_PLAN_SCRIPT (null / not OFF_PLAN); any remaining met===false is founder/completeness/other — not false-positive full-command reject

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: full-command normalization is so strict it rejects the plan's own literal_cmd (false positive); canonicalization of absolute vs relative plan paths fails equality for identical commands; static shell always returns OFF_PLAN_SCRIPT for any .sh command including exact plan match
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-exact-plan-full-command`
  - ACTION: Resolve step1 literal_cmd from HEAD-bound plan; Call rejectOffPlanScripts with exact same full command; Capture return value
  - MUST_OBSERVE: rejectOffPlanScripts(...) === null || error.code !== 'OFF_PLAN_SCRIPT'; exact plan step1 full command is in the allowed plan-owned command set
  - MUST_NOT_OBSERVE: error.code == 'OFF_PLAN_SCRIPT' for exact plan step1 full command; false-positive off-plan on exact match; empty exact-match accept path (false-positive OFF_PLAN on plan command)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd appends --unreviewed-flag to plan bash step1.sh | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-1'` |
| TC-2 | state.met is false when deriveGoalState receives bash plan-script.sh --unreviewed-flag | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-1'` |
| TC-3 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for env FOO=attacker bash plan-script.sh | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-2'` |
| TC-4 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT when interpreter differs (sh/python vs plan bash) for same script path | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-3'` |
| TC-5 | rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for exact normalized plan step1 full command | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-4'` |
| TC-6 | FIX-22 substitute not-in-gate-plan.sh under allowed run still returns OFF_PLAN_SCRIPT after full-command upgrade | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/deriveGoalState.ts (MODIFY — canonicalize / rejectOffPlanScripts full-command equality: interpreter + script path + args; reject env-prefix and extra flags)
- convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts (NEW)

**writeProhibited:**
- tools/gate/verifyEvidenceManifest.ts plan freshness / dirty-plan expected-set — REDHAT-FIX-23 / REDHAT-FIX-21
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json rebinding
- Forging human PASS / S4-T7 Founder-Operator evidence
- Weakening FIX-12 / FIX-18 / FIX-21 / FIX-22 / FIX-23 checks
- Any RN/Expo/app client code
- convex/couchVerdict.ts — out of scope

## READING LIST

- `tools/gate/deriveGoalState.ts` (433-549) — [PRIMARY BUG] canonicalizeScriptPath extracts \S+\.sh only; rejectOffPlanScripts allowedScripts Set is path-only — upgrade to full-command normalize+equality
- `tools/gate/deriveGoalState.ts` (471-560) — rejectOffPlanScripts binding rules; keep empty literal_cmds fail-closed; replace path Set membership with normalized full-command Set/equality
- `tools/gate/verifyEvidenceManifest.ts` (145-230) — loadHeadBoundGatePlan — consume for literalCmds (FIX-21); FIX-23 freshness if multi-commit fixtures used
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T175607Z.md` (27-37) — HIGH-1 finding: --unreviewed-flag and env FOO=attacker accepted (null) against path-only match
- `convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts` (1-200) — Existing path-match harness; preserve substitute-script and empty-literal_cmds behavior; extend pattern for full-command negatives
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json` (9-40) — Example literal_cmd shape: bash <abs>/.gate-evidence/2026-07-21T152805Z/scripts/stepN.sh — normalization must handle absolute vs relative equality carefully without accepting extra args

## CODE PATTERN

- Pattern: function normalizeFullCommand(text): { interpreter, scriptKey, args } | null { tokenize; reject leading env KEY=val tokens as non-equal to bare plan cmd (treat as mismatch); identify interpreter + script path + trailing args; canonicalize script path like FIX-22 }; const allowed = new Set(plan.literalCmds.map(c => stableKey(normalizeFullCommand(c)))); for each repro_cmd: if (!allowed.has(stableKey(normalize(repro)))) return OFF_PLAN_SCRIPT; // path-only Set of .sh is insufficient
- Pattern source: `tools/gate/deriveGoalState.ts:491-549 + review HIGH-1 remediation`
- Anti-pattern: const key = canonicalizeScriptPath(cmd); allowedScripts.has(key) // accepts bash script.sh --evil and env X=y bash script.sh; substring .sh match; ignoring interpreter
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T175607Z.md`, `tools/gate/deriveGoalState.ts:433-549`, `convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts`

## VERIFICATION GATES

- AC-1 PRIMARY extra flag rejected: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-1'` → Exit 0; OFF_PLAN_SCRIPT; met===false
- AC-2 env prefix rejected: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-2'` → Exit 0; OFF_PLAN_SCRIPT
- AC-3 interpreter mismatch rejected: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-3'` → Exit 0; OFF_PLAN_SCRIPT
- AC-4 exact full command accepted on off-plan axis: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-4'` → Exit 0; not OFF_PLAN_SCRIPT
- Full FIX-24 suite: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts` → Exit 0
- FIX-22 regression: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts` → Exit 0
- Typecheck: `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check tools/gate/deriveGoalState.ts convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only` → Only paths in guardrails.write_allowed

- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-24-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns rejectOffPlanScripts / command canonicalization in tools/gate/deriveGoalState.ts: upgrade from path-only .sh substring match (FIX-22) to exact normalized full-command equality (interpreter + script path + args), rejecting env-prefix and extra flags while preserving exact plan literal_cmd accept path.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced)
- Integration coverage: PRIMARY AC is integration against real services (filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: REDHAT-FIX-21, REDHAT-FIX-22
- Blocks: —
- Notes: Review source: .spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T175607Z.md HIGH-1.

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md
- Command note: use `npx vitest run` not `pnpm test` (watch hang); vitest filter is `-t '<name>'`

## NOTES

- Review source: .spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T175607Z.md HIGH-1.
- FIX-22 closed substitute script under allowed run (path equality). HIGH-1 is residual: path equality is not full-command equality.
- Soft dependency on FIX-23: temp-repo fixtures that commit plan then evidence need clean HEAD-bound load; if tests use multi-commit fixtures, land FIX-23 first or keep plan last-touch at HEAD in FIX-24 fixtures.
- Normalization guidance: tokenize full command; compare interpreter + canonical script path + arg vector; reject env KEY=val prefixes; reject extra args/flags; do not silently strip prefixes to recover a path match.
- Preserve withdrawn-run OFF_PLAN and empty literal_cmds fail-closed from FIX-22.
- NEVER forge human PASS / S4-T7 evidence.
- RED-first: write AC-1 failing against current path-only accept of --unreviewed-flag before implementing full-command equality.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-24",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "head-bound-plan-step1-bash-literal": {
      "description": "Temp git repo with HEAD-bound clean plan whose step1 literal_cmd is exactly `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (relative or absolute-canonicalizable).",
      "seed_method": "public_api",
      "records": [
        "GATE_PLAN_REL committed at HEAD with steps 1..8",
        "step1.literal_cmd == 'bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh'",
        "plan loader HEAD-bound + clean (FIX-21/23)",
        "wtHash === headHash"
      ]
    },
    "repro-extra-unreviewed-flag": {
      "description": "repro_cmd that keeps plan script path but appends --unreviewed-flag.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh --unreviewed-flag",
        "script path alone would path-match plan step1 under FIX-22",
        "must be OFF_PLAN under full-command equality"
      ]
    },
    "repro-env-prefix-wrapper": {
      "description": "repro_cmd that prefixes env VAR=value before the plan bash+script.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: env FOO=attacker bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh",
        "script path alone would path-match plan step1 under FIX-22",
        "must be OFF_PLAN under full-command equality"
      ]
    },
    "repro-different-interpreter": {
      "description": "repro_cmd that uses a different interpreter than plan bash for the same script path.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd variants: sh .gate-evidence/2026-07-21T152805Z/scripts/step1.sh OR python .gate-evidence/2026-07-21T152805Z/scripts/step1.sh",
        "plan literal_cmd interpreter is bash",
        "must be OFF_PLAN under full-command equality"
      ]
    },
    "repro-exact-plan-full-command": {
      "description": "repro_cmd that exactly matches normalized plan step1 literal_cmd (control accept on off-plan axis).",
      "seed_method": "public_api",
      "records": [
        "repro_cmd equals plan step1.literal_cmd after same normalization",
        "off-plan axis must not return OFF_PLAN_SCRIPT",
        "other axes (founder/completeness) may still yield met===false"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN HEAD-bound plan with step1 literal_cmd bash .../step1.sh WHEN repro_cmd is bash .../step1.sh --unreviewed-flag THEN error.code == 'OFF_PLAN_SCRIPT' and state.met === false \u2014 not null/accepted via path-only match",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "canonicalizeScriptPath path-only match still accepts --unreviewed-flag because .sh key equals plan script",
            "off-plan check is stubbed to compare only basename of .sh",
            "static shell returns error === null for repro-extra-unreviewed-flag"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-extra-unreviewed-flag",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create temp repo with HEAD-bound bash step1 plan",
                "Call rejectOffPlanScripts with bash .../step1.sh --unreviewed-flag",
                "Capture error.code and state.met"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'OFF_PLAN_SCRIPT'",
                "state.met === false",
                "error.details.reason includes 'off-plan' || error.details.script includes '--unreviewed-flag' || error.details.script includes 'step1.sh'"
              ],
              "must_not_observe": [
                "error === null",
                "state.met === true",
                "rejectOffPlanScripts returns null for --unreviewed-flag",
                "path-only accept of extra args",
                "empty off-plan rejection (path-only accept)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan bash step1 WHEN repro_cmd is env FOO=attacker bash .../step1.sh THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "env FOO=attacker prefix is stripped and remaining bash+script path-matches as accept",
            "off-plan check only scans for .sh substring after env tokens",
            "static shell returns null for repro-env-prefix-wrapper"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-env-prefix-wrapper",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound plan",
                "Call rejectOffPlanScripts with env FOO=attacker bash .../step1.sh",
                "Capture error.code"
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
                "env-prefix accepted as path-only match",
                "empty off-plan rejection for env wrapper"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan with bash interpreter WHEN repro_cmd uses sh or python for same script path THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "interpreter token is ignored and only .sh path is compared",
            "sh/python substituted commands return null when script path matches plan",
            "static shell always accepts any interpreter for plan-owned scripts"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-different-interpreter",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound bash plan",
                "Call rejectOffPlanScripts for sh and/or python .../step1.sh",
                "Capture error"
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
                "interpreter mismatch accepted",
                "empty off-plan rejection for sh/python swap"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan and exact normalized plan step1 full command WHEN rejectOffPlanScripts runs THEN null / not OFF_PLAN_SCRIPT on off-plan axis",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts",
        "negative_control": {
          "would_fail_if": [
            "full-command normalization is so strict it rejects the plan's own literal_cmd (false positive)",
            "canonicalization of absolute vs relative plan paths fails equality for identical commands",
            "static shell always returns OFF_PLAN_SCRIPT for any .sh command including exact plan match"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-exact-plan-full-command",
            "action": {
              "actor": "api_client",
              "steps": [
                "Resolve step1 literal_cmd from HEAD plan",
                "Call rejectOffPlanScripts with exact command",
                "Capture return"
              ]
            },
            "end_state": {
              "must_observe": [
                "rejectOffPlanScripts(...) === null || error.code !== 'OFF_PLAN_SCRIPT'"
              ],
              "must_not_observe": [
                "error.code == 'OFF_PLAN_SCRIPT' for exact plan step1 full command",
                "false-positive off-plan on exact match",
                "empty exact-match accept path (false-positive OFF_PLAN on plan command)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd appends --unreviewed-flag to plan bash step1.sh",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "state.met is false when deriveGoalState receives bash plan-script.sh --unreviewed-flag",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for env FOO=attacker bash plan-script.sh",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT when interpreter differs (sh/python vs plan bash) for same script path",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for exact normalized plan step1 full command",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts -t 'AC-4'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "FIX-22 substitute not-in-gate-plan.sh under allowed run still returns OFF_PLAN_SCRIPT after full-command upgrade",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'"
    }
  ]
}
-->

</details>
