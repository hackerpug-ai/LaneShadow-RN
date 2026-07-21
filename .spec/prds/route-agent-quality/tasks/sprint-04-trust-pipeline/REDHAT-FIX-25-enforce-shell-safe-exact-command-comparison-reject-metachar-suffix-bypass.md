# REDHAT-FIX-25 — Enforce shell-SAFE exact command comparison (reject metacharacter suffix bypass of FIX-24)

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-25 |
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
| DEPENDS_ON | REDHAT-FIX-24 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-25-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Close HIGH (cycle-4 re-review 2026-07-21T182858Z): FIX-24's exact full-command equality is bypassable by appending shell metacharacters after the plan-owned command (`script.sh;:`, `script.sh$(true)`, etc.). Enforce shell-SAFE exact command comparison so ONLY the exact plan command (declared interpreter + script path + declared args — nothing more) is accepted; any shell metacharacter / control character / trailing suffix is `OFF_PLAN_SCRIPT`.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST enforce shell-SAFE exact command comparison against HEAD-bound plan `literal_cmd` entries so that ONLY the exact plan command (declared interpreter + script path + declared args) is accepted
- MUST reject any executed/repro command containing shell metacharacters or control characters: `;` `&` `|` `$` backticks `` ` `` `(` `)` `<` `>` newline tab (and compound forms `&&` `||` `$()`)
- MUST reject trailing metacharacter suffixes glued to the script token (e.g. `…/step1.sh;:`, `…/step1.sh$(true)`) — `canonicalizeScriptPath`'s `\S+\.sh` prefix extract MUST NOT recover a clean plan key that equals the plan command
- MUST reject IFS/quote-based and escaped variants that smuggle the same metachar authority bypass
- MUST still accept the exact plan full command on the off-plan axis (null / not `OFF_PLAN_SCRIPT`) and preserve FIX-24 rejections (extra flag, env-prefix, interpreter swap)
- MUST consume HEAD-bound plan loader (FIX-21/23) — never re-introduce working-tree plan authority for binding

**NEVER**
- NEVER accept path-only or token-prefix recovery that strips `;:`, `$(…)`, backticks, `&&`/`||`/`|`, redirects, or control characters to recover a plan match
- NEVER forge human PASS / S4-T7 Founder-Operator evidence or force `state.met === true`
- NEVER rebind `gate-plan.json` content or re-admit `2026-07-19T22:59:46Z` as plan target
- NEVER own plan freshness last-touch policy (REDHAT-FIX-23) or dirty-plan expected-set shrink (REDHAT-FIX-21)
- NEVER weaken FIX-22 empty/malformed `literal_cmds` fail-closed behavior or FIX-24 flag/env/interpreter rejections

**STRICTLY**
- STRICTLY either (a) reject any command containing shell grammar/metacharacters/quotes/substitutions and require a strict argv representation, OR (b) use a real shell parser and reject anything except precisely one allowed simple-command AST (`bash`, exact script argument, no redirects/operators/expansions/assignments/extra arguments) — prefer (a) for this control surface unless (b) is already available without new deps
- STRICTLY depend on REDHAT-FIX-24 full-command equality remaining as the base; this task hardens the normalizer so metachar-glued tokens cannot normalize to the plan key
- STRICTLY timestamp-shaped `.gate-evidence` script commands remain the enforced surface; keep synthetic harness dirs outside timestamp path enforcement only if FIX-18/20 still require

## DONE WHEN

- AC-1 [PRIMARY]: `rejectOffPlanScripts` / `deriveGoalState` returns `OFF_PLAN_SCRIPT` and `state.met === false` for plan-owned command with trailing semicolon / metachar suffix (e.g. `bash …/step1.sh;:`) — not null/accepted via `.sh` prefix extract
- AC-2: `OFF_PLAN_SCRIPT` / `met===false` for command substitution `$()` and backtick variants glued to the plan script
- AC-3: `OFF_PLAN_SCRIPT` / `met===false` for `&&` / `||` / `|` and redirect (`>` / `<`) suffixes
- AC-4: `OFF_PLAN_SCRIPT` / `met===false` for newline/tab control characters and IFS/quote-based evasion of the same vectors
- AC-5: exact plan full command still accepted on off-plan axis; FIX-24 named attacks still reject
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close HIGH (cycle-4 re-review): shell-metacharacter suffix bypass of FIX-24's exact-command match. Appended shell metacharacters after the plan-owned command are accepted today because `canonicalizeScriptPath` falls back to `/\S+\.sh/`, extracting a valid `.sh` prefix from a larger shell token, and `normalizeFullCommand` then yields the same stable key as the plan command.

**Success state:** Given HEAD-bound plan `literal_cmd` `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh`, repro_cmds `bash …/step1.sh;:`, `bash …/step1.sh$(true)`, `bash …/step1.sh&&:`, `bash …/step1.sh||:`, `bash …/step1.sh|cat`, backticks / `$()`, redirects, newline/tab, and quote/IFS evasion all yield `OFF_PLAN_SCRIPT` with `met===false`; exact normalized plan `literal_cmd` still returns null on the off-plan axis; FIX-24 extras (flag / env / interpreter) remain rejected.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `head-bound-plan-step1-bash-literal` (seed_method: `public_api`): Temp git repo with HEAD-bound clean plan whose step1 `literal_cmd` is exactly `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (relative or absolute-canonicalizable).
    - GATE_PLAN_REL committed at HEAD with steps 1..8
    - step1.literal_cmd == 'bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh'
    - plan loader HEAD-bound + clean (FIX-21/23)
    - wtHash === headHash
- `repro-metachar-semicolon-suffix` (seed_method: `public_api`): repro_cmd that keeps plan interpreter+script but appends `;:` / `;` after the `.sh` token.
    - repro_cmd: bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh;:
    - FIX-24 full-command key would match plan if `.sh` prefix is extracted (bug)
    - must be OFF_PLAN under shell-SAFE comparison
- `repro-metachar-cmd-substitution` (seed_method: `public_api`): repro_cmd with `$()` or backticks glued to plan script.
    - repro_cmd: bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh$(true)
    - OR: bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh`true`
    - must be OFF_PLAN under shell-SAFE comparison
- `repro-metachar-operators-redirects` (seed_method: `public_api`): repro_cmd with `&&` / `||` / `|` / `>` / `<` after plan script.
    - repro_cmd variants: …/step1.sh&&: · …/step1.sh||: · …/step1.sh|cat · …/step1.sh>/tmp/x · …/step1.sh</tmp/y
    - must be OFF_PLAN under shell-SAFE comparison
- `repro-metachar-control-and-quote-evasion` (seed_method: `public_api`): repro_cmd with newline/tab after plan command and/or quoted/IFS variants that still smuggle metachar execution.
    - repro_cmd variants: plan cmd + newline + `:`; plan cmd + tab + extra; quoted `$()` / escaped metachar forms
    - must be OFF_PLAN under shell-SAFE comparison
- `repro-exact-plan-full-command` (seed_method: `public_api`): repro_cmd that exactly matches normalized plan step1 `literal_cmd` (control accept on off-plan axis).
    - repro_cmd equals plan step1.literal_cmd after same normalization
    - off-plan axis must not return OFF_PLAN_SCRIPT
    - other axes (founder/completeness) may still yield met===false

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Semicolon / trailing metachar suffix rejected (not accepted via `.sh` prefix extract)

**Requirement:** GIVEN HEAD-bound plan with step1 `literal_cmd` `bash …/step1.sh` only WHEN repro_cmd is `bash …/step1.sh;:` (or equivalent trailing `;` metachar suffix glued to the script token) THEN `rejectOffPlanScripts` / `deriveGoalState` returns `OFF_PLAN_SCRIPT` and `state.met === false` — not null/accepted because `canonicalizeScriptPath` extracted a clean `.sh` key equal to the plan

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `canonicalizeScriptPath` still extracts `.gate-evidence/…/step1.sh` from `…/step1.sh;:` and `normalizeFullCommand` yields the same stable key as the plan; off-plan check only compares canonical script path; static shell returns `error === null` for `repro-metachar-semicolon-suffix`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-metachar-semicolon-suffix`
  - ACTION: Create temp repo with head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with repro_cmd `bash …/step1.sh;:`; Invoke deriveGoalState with same repro_cmd; capture error.code and state.met
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false; error.details.reason includes 'off-plan' || error.details.script includes ';' || error.details.script includes 'step1.sh'
  - MUST_NOT_OBSERVE: error === null; state.met === true; rejectOffPlanScripts returns null for semicolon-suffix command; path-only / `.sh`-prefix accept of metachar suffix; empty off-plan rejection (metachar accept)

### AC-2 — Command substitution `$()` and backticks rejected

**Requirement:** GIVEN HEAD-bound plan with step1 bash `literal_cmd` WHEN repro_cmd is `bash …/step1.sh$(true)` or uses backticks glued to the plan script THEN `OFF_PLAN_SCRIPT` / `met===false` — command substitution not treated as equal full command

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `$()` / backticks after `.sh` are discarded by `\S+\.sh` extract and remaining path matches plan; off-plan check ignores `$` and backtick characters; static shell returns null for `repro-metachar-cmd-substitution`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-metachar-cmd-substitution`
  - ACTION: Seed head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with `bash …/step1.sh$(true)` and backtick variant; Capture error.code and state.met
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; command-substitution accepted as plan match; empty off-plan rejection for `$()` / backticks

### AC-3 — Operators `&&` / `||` / `|` and redirects rejected

**Requirement:** GIVEN HEAD-bound plan with bash step1 WHEN repro_cmd appends `&&:` / `||:` / `|…` / `>…` / `<…` after the plan script path THEN `OFF_PLAN_SCRIPT` / `met===false`

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: operators/redirects are stripped and remaining bash+script path-matches as accept; only whitespace-separated argv is compared while glued operator suffixes are ignored; static shell always accepts any suffix after a plan-owned `.sh`
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `repro-metachar-operators-redirects`
  - ACTION: Seed head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts for `…/step1.sh&&:`, `…/step1.sh||:`, pipe, and redirect variants; Capture error codes
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; operator/redirect suffix accepted; empty off-plan rejection for `&&`/`||`/`|`/`>`/`<`

### AC-4 — Newline/tab control characters and IFS/quote-based evasion rejected

**Requirement:** GIVEN HEAD-bound plan WHEN repro_cmd embeds newline or tab after the plan command, OR uses quote/IFS/escape forms that smuggle the same metachar vectors THEN `OFF_PLAN_SCRIPT` / `met===false`

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: newline/tab is treated as whitespace and remainder dropped before equality; quoted `$()` or escaped `;` is accepted when unquoted form is rejected; static shell returns null for `repro-metachar-control-and-quote-evasion`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-metachar-control-and-quote-evasion`
  - ACTION: Seed head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with plan cmd + newline + `:`, plan cmd + tab, and at least one quote/IFS evasion form; Capture error
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; control-char / quote evasion accepted as plan match; empty off-plan rejection for control/quote vectors

### AC-5 — Exact plan full command accepted; FIX-24 named attacks still reject

**Requirement:** GIVEN HEAD-bound plan WHEN repro_cmd exactly matches normalized plan step1 full `literal_cmd` THEN off-plan axis does not return `OFF_PLAN_SCRIPT` (null / not OFF_PLAN); AND when repro_cmd is a FIX-24 named attack (`--unreviewed-flag`, `env FOO=attacker`, `sh`/`python` interpreter swap) THEN still `OFF_PLAN_SCRIPT` — shell-SAFE hardening must not regress FIX-24 or false-positive-reject the plan's own command

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-5'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: shell-SAFE check is so strict it rejects the plan's own `bash …/step1.sh` (false positive); absolute vs relative plan paths fail equality for identical simple commands; static shell always returns OFF_PLAN_SCRIPT for any `.sh` including exact plan match; FIX-24 extra-flag / env / interpreter cases silently pass again
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-exact-plan-full-command`
  - ACTION: Resolve step1 literal_cmd from HEAD-bound plan; Call rejectOffPlanScripts with exact same full command; Also call with FIX-24 attack vectors; Capture return values
  - MUST_OBSERVE: rejectOffPlanScripts(exact plan) === null; rejectOffPlanScripts('bash …/step1.sh --unreviewed-flag').code == 'OFF_PLAN_SCRIPT'; rejectOffPlanScripts('env FOO=attacker bash …/step1.sh').code == 'OFF_PLAN_SCRIPT'; rejectOffPlanScripts('sh …/step1.sh').code == 'OFF_PLAN_SCRIPT'
  - MUST_NOT_OBSERVE: error.code == 'OFF_PLAN_SCRIPT' for exact plan step1 full command; false-positive off-plan on exact match; rejectOffPlanScripts('--unreviewed-flag') === null; empty off-plan rejection for FIX-24 vectors; error === null for env-prefix attack

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd is bash plan-step1.sh;: | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-1'` |
| TC-2 | state.met is false when deriveGoalState receives bash plan-script.sh;: | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-1'` |
| TC-3 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for bash plan-script.sh$(true) and backtick form | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-2'` |
| TC-4 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for && / \|\| / \| / redirect suffixes on plan script | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-3'` |
| TC-5 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for newline/tab and quote/IFS evasion vectors | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-4'` |
| TC-6 | rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for exact normalized plan step1 full command | AC-5 | `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-5'` |
| TC-7 | FIX-24 named attacks (extra flag, env prefix, interpreter swap) still return OFF_PLAN_SCRIPT after shell-SAFE upgrade | AC-5 | `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts` |
| TC-8 | FIX-22 substitute not-in-gate-plan.sh under allowed run still returns OFF_PLAN_SCRIPT | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/deriveGoalState.ts (MODIFY — shell-SAFE full-command comparison: reject metacharacters/control chars/trailing suffixes in normalizeFullCommand / rejectOffPlanScripts; do not recover plan match via `\S+\.sh` prefix extract from a larger shell token)
- convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts (NEW)

**writeProhibited:**
- tools/gate/verifyEvidenceManifest.ts plan freshness / dirty-plan expected-set — REDHAT-FIX-23 / REDHAT-FIX-21
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json rebinding
- Forging human PASS / S4-T7 Founder-Operator evidence
- Weakening FIX-12 / FIX-18 / FIX-21 / FIX-22 / FIX-23 / FIX-24 checks
- Any RN/Expo/app client code
- convex/couchVerdict.ts — out of scope

## READING LIST

- `tools/gate/deriveGoalState.ts` (433-447) — [PRIMARY BUG] `canonicalizeScriptPath` falls back to `/\S+\.sh/`, extracting a valid `.sh` prefix from a larger shell token (`step1.sh;:`, `step1.sh$(true)`) so metachar suffixes disappear before equality
- `tools/gate/deriveGoalState.ts` (481-547) — [PRIMARY BUG] `normalizeFullCommand` tokenizes on whitespace only; glued metachar suffixes never become argv and yield the same stable key as the plan
- `tools/gate/deriveGoalState.ts` (560-668) — `rejectOffPlanScripts` allowedFullCmds membership — must reject shell-unsafe commands before or as part of full-command equality
- `tools/gate/verifyEvidenceManifest.ts` (145-230) — loadHeadBoundGatePlan — consume for literalCmds (FIX-21); FIX-23 freshness if multi-commit fixtures used
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T182858Z.md` (29-42) — HIGH finding: `bash …/step1.sh;:` and `bash …/step1.sh$(true)` accepted (null) with same stable key as plan
- `convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts` (1-200) — Existing full-command harness; preserve flag/env/interpreter negatives and exact-match accept; extend pattern for metachar negatives
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json` (9-40) — Example `literal_cmd` shape: `bash <abs>/.gate-evidence/2026-07-21T152805Z/scripts/stepN.sh` — plan cmds themselves must remain shell-safe simple commands

## CODE PATTERN

- Pattern: Before equality, assert shell-SAFE command text: reject if raw command matches `/[;&|$\x60()<>\n\t]/` (forbid `; & | $ \` ( ) < >` newline tab) OR any token after the script path / any token that is not a pure path/interpreter/arg word without those chars. Prefer fail-closed: `if (containsShellMetachar(text)) return OFF_PLAN_SCRIPT`. Additionally require that the script token itself equals a clean path ending in `.sh` with NO suffix junk (`token === path` or `token` matches `/^\S+\.sh$/` with no metachar). Do NOT use `\S+\.sh` extract that trims a trailing `;:` / `$(…)` to recover a plan key.
- Pattern source: `tools/gate/deriveGoalState.ts:433-547 + review HIGH remediation 20260721T182858Z`
- Anti-pattern: `const key = canonicalizeScriptPath(cmd)` via `/\S+\.sh/` on `…/step1.sh;:` or `…/step1.sh$(true)` then `allowedFullCmds.has(stableKey({…, scriptKey: key, args: []}))` // accepts shell grammar that is not the plan literal
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T182858Z.md`, `tools/gate/deriveGoalState.ts:433-658`, `convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts`

## VERIFICATION GATES

- AC-1 PRIMARY semicolon suffix rejected: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-1'` → Exit 0; OFF_PLAN_SCRIPT; met===false
- AC-2 command substitution rejected: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-2'` → Exit 0; OFF_PLAN_SCRIPT
- AC-3 operators/redirects rejected: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-3'` → Exit 0; OFF_PLAN_SCRIPT
- AC-4 control/quote evasion rejected: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-4'` → Exit 0; OFF_PLAN_SCRIPT
- AC-5 exact plan accept + FIX-24 still reject: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-5'` → Exit 0
- Full FIX-25 suite: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts` → Exit 0
- FIX-24 regression: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts` → Exit 0
- FIX-22 regression: `npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts` → Exit 0
- Typecheck: `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check tools/gate/deriveGoalState.ts convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only` → Only paths in guardrails.write_allowed

- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-25-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns `rejectOffPlanScripts` / command canonicalization in `tools/gate/deriveGoalState.ts`: harden FIX-24 full-command equality with shell-SAFE comparison that rejects metacharacter suffixes, command substitution, operators, redirects, control characters, and quote/IFS evasion, while preserving exact plan `literal_cmd` accept and FIX-24 flag/env/interpreter rejects.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced — at HEAD `170009b5`, `bash …/step1.sh;:` and `bash …/step1.sh$(true)` return null)
- Integration coverage: PRIMARY AC is integration against real services (filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: REDHAT-FIX-24
- Blocks: —
- Notes: Review source: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T182858Z.md` HIGH (shell-metacharacter suffix bypass). Cycle 4 remediation past default --max-cycles cap (Stop hook refused BLOCKED-as-terminal while automatable code work remained).

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md
- Command note: use `npx vitest run` not `pnpm test` (watch hang); vitest filter is `-t '<name>'`

## NOTES

- Review source: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T182858Z.md` HIGH.
- FIX-24 closed extra flag / env prefix / interpreter swap. HIGH residual: whitespace tokenize + `\S+\.sh` extract discards glued shell metacharacters, so the normalized key equals the plan command.
- Implementation guidance: fail closed on any raw command containing shell metachar/control characters (`; & | $ \` ( ) < >` newline tab); require script tokens to be clean paths ending in `.sh` with no suffix junk; do not recover a plan match by stripping metachar suffixes.
- Preserve withdrawn-run OFF_PLAN and empty literal_cmds fail-closed from FIX-22; preserve FIX-24 flag/env/interpreter rejects.
- NEVER forge human PASS / S4-T7 evidence.
- RED-first: write AC-1 failing against current accept of `bash …/step1.sh;:` before implementing shell-SAFE comparison.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-25",
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
    "repro-metachar-semicolon-suffix": {
      "description": "repro_cmd that keeps plan interpreter+script but appends semicolon metachar suffix after the .sh token.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh;:",
        "FIX-24 full-command key would match plan if .sh prefix is extracted (bug)",
        "must be OFF_PLAN under shell-SAFE comparison"
      ]
    },
    "repro-metachar-cmd-substitution": {
      "description": "repro_cmd with $() or backticks glued to plan script path.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh$(true)",
        "OR: bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh`true`",
        "must be OFF_PLAN under shell-SAFE comparison"
      ]
    },
    "repro-metachar-operators-redirects": {
      "description": "repro_cmd with && / || / | / redirect suffixes after plan script.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd variants: .../step1.sh&&: · .../step1.sh||: · .../step1.sh|cat · .../step1.sh>/tmp/x · .../step1.sh</tmp/y",
        "must be OFF_PLAN under shell-SAFE comparison"
      ]
    },
    "repro-metachar-control-and-quote-evasion": {
      "description": "repro_cmd with newline/tab after plan command and/or quoted/IFS variants that smuggle metachar execution.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd variants: plan cmd + newline + : ; plan cmd + tab + extra; quoted $() / escaped metachar forms",
        "must be OFF_PLAN under shell-SAFE comparison"
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
      "description": "GIVEN HEAD-bound plan with step1 literal_cmd bash .../step1.sh WHEN repro_cmd is bash .../step1.sh;: THEN error.code == 'OFF_PLAN_SCRIPT' and state.met === false — not null/accepted via .sh prefix extract",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "canonicalizeScriptPath still extracts .gate-evidence/.../step1.sh from .../step1.sh;: and normalizeFullCommand yields the same stable key as the plan",
            "off-plan check only compares canonical script path",
            "static shell returns error === null for repro-metachar-semicolon-suffix"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-metachar-semicolon-suffix",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create temp repo with HEAD-bound bash step1 plan",
                "Call rejectOffPlanScripts with bash .../step1.sh;:",
                "Capture error.code and state.met"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'OFF_PLAN_SCRIPT'",
                "state.met === false",
                "error.details.reason includes 'off-plan' || error.details.script includes ';' || error.details.script includes 'step1.sh'"
              ],
              "must_not_observe": [
                "error === null",
                "state.met === true",
                "rejectOffPlanScripts returns null for semicolon-suffix command",
                "path-only / .sh-prefix accept of metachar suffix",
                "empty off-plan rejection (metachar accept)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan bash step1 WHEN repro_cmd is bash .../step1.sh$(true) or backtick form THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "$() / backticks after .sh are discarded by \\S+\\.sh extract and remaining path matches plan",
            "off-plan check ignores $ and backtick characters",
            "static shell returns null for repro-metachar-cmd-substitution"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-metachar-cmd-substitution",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound plan",
                "Call rejectOffPlanScripts with bash .../step1.sh$(true) and backtick variant",
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
                "command-substitution accepted as plan match",
                "empty off-plan rejection for $() / backticks"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan bash step1 WHEN repro_cmd appends && / || / | / redirect after plan script THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "operators/redirects are stripped and remaining bash+script path-matches as accept",
            "only whitespace-separated argv is compared while glued operator suffixes are ignored",
            "static shell always accepts any suffix after a plan-owned .sh"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-metachar-operators-redirects",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound bash plan",
                "Call rejectOffPlanScripts for && / || / pipe / redirect variants",
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
                "operator/redirect suffix accepted",
                "empty off-plan rejection for && / || / | / > / <"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan WHEN repro_cmd embeds newline/tab or quote/IFS evasion of metachar vectors THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "newline/tab is treated as whitespace and remainder dropped before equality",
            "quoted $() or escaped ; is accepted when unquoted form is rejected",
            "static shell returns null for repro-metachar-control-and-quote-evasion"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-metachar-control-and-quote-evasion",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound plan",
                "Call rejectOffPlanScripts with newline/tab and quote/IFS evasion forms",
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
                "control-char / quote evasion accepted as plan match",
                "empty off-plan rejection for control/quote vectors"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan WHEN exact plan step1 full command THEN null / not OFF_PLAN_SCRIPT; WHEN FIX-24 named attacks THEN still OFF_PLAN_SCRIPT",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-5'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts",
        "negative_control": {
          "would_fail_if": [
            "shell-SAFE check is so strict it rejects the plan's own bash .../step1.sh (false positive)",
            "absolute vs relative plan paths fail equality for identical simple commands",
            "static shell always returns OFF_PLAN_SCRIPT for any .sh including exact plan match",
            "FIX-24 extra-flag / env / interpreter cases silently pass again"
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
                "Call rejectOffPlanScripts with FIX-24 attack vectors",
                "Capture returns"
              ]
            },
            "end_state": {
              "must_observe": [
                "rejectOffPlanScripts(exact plan) === null",
                "rejectOffPlanScripts('bash …/step1.sh --unreviewed-flag').code == 'OFF_PLAN_SCRIPT'",
                "rejectOffPlanScripts('env FOO=attacker bash …/step1.sh').code == 'OFF_PLAN_SCRIPT'",
                "rejectOffPlanScripts('sh …/step1.sh').code == 'OFF_PLAN_SCRIPT'"
              ],
              "must_not_observe": [
                "error.code == 'OFF_PLAN_SCRIPT' for exact plan step1 full command",
                "false-positive off-plan on exact match",
                "rejectOffPlanScripts('--unreviewed-flag') === null",
                "empty off-plan rejection for FIX-24 vectors",
                "error === null for env-prefix attack"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd is bash plan-step1.sh;:",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "state.met is false when deriveGoalState receives bash plan-script.sh;:",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for bash plan-script.sh$(true) and backtick form",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for && / || / | / redirect suffixes on plan script",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for newline/tab and quote/IFS evasion vectors",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-4'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for exact normalized plan step1 full command",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts -t 'AC-5'"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "FIX-24 named attacks (extra flag, env prefix, interpreter swap) still return OFF_PLAN_SCRIPT after shell-SAFE upgrade",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "FIX-22 substitute not-in-gate-plan.sh under allowed run still returns OFF_PLAN_SCRIPT",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts -t 'AC-1'"
    }
  ]
}
-->

</details>
