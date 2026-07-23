# REDHAT-FIX-27 — Make non-ASCII rejection UNCONDITIONAL (before marker heuristics)

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-27 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 60 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | ✅ Completed |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | REDHAT-FIX-26 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-27-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Close HIGH-1 (cycle-6 re-review 2026-07-21T192618Z / HEAD 41eca15c): FIX-26 claimed blanket non-ASCII reject but implemented it **CONDITIONAL** on `namesGateEvidenceScript(text)`, which requires literal ASCII `.gate-evidence` AND `.sh` (or a timestamp-shaped path). Mutating those markers with Cyrillic `е`/`һ`, ZWSP, or full-width `．`/`／` makes `namesGateEvidenceScript` false → non-ASCII check skipped → full-command check also skipped (`isTimestampShapedScriptPath` / `mentionsTimestampShapedScript` also fail) → returns `null` (ACCEPTED). **Fix:** apply UNCONDITIONAL fail-closed `if (!isStrictAscii(text)) return OFF_PLAN_SCRIPT` on every command-bearing text **FIRST**, independent of marker/path heuristics; keep exact ASCII byte-equality (FIX-24/25/26) after the gate.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST reject ANY non-ASCII code unit (`charCode > 0x7F`) in `repro_cmd` / command-bearing bundle text **UNCONDITIONALLY** — before `namesGateEvidenceScript` / `mentionsTimestampShapedScript` / `isTimestampShapedScriptPath` / `normalizeFullCommand` / run-ID extraction that could short-circuit past the ASCII gate for marker-obfuscated text
- MUST return `OFF_PLAN_SCRIPT` (not `null`) for every marker-obfuscated non-ASCII vector confirmed at HEAD in red-hat review 20260721T192618Z: Cyrillic `е` in `.gatе-evidence`, Cyrillic `е` in `.gate-evidеnce`, Cyrillic `һ` in `.sһ`, ZWSP in `.gate-\u200bevidence`, full-width dot `．gate-evidence`, full-width slash `／gate...`
- MUST keep exact ASCII full-command equality after the unconditional ASCII gate (FIX-24/25/26 path) — exact plan `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh` still returns `null` on the off-plan axis
- MUST leave synthetic harness ASCII dirs alone (only timestamp-shaped + non-ASCII paths are off-plan axis concerns; pure-ASCII synthetic harness paths remain outside the timestamp-shaped enforcement arm)
- MUST preserve `details.script` as the raw attack text (no strip/NFKC of non-ASCII in error details)
- MUST cover the adversarial matrix in integration tests with `deriveGoalState` asserting `OFF_PLAN_SCRIPT` + `state.met === false` for each marker-obfuscation case

**NEVER**
- NEVER gate non-ASCII rejection on `namesGateEvidenceScript` or any other marker-detection predicate (`mentionsTimestampShapedScript`, `isTimestampShapedScriptPath`, `includes('.gate-evidence')`, `includes('.sh')`)
- NEVER strip / NFKC / normalize / case-fold non-ASCII to recover a plan key
- NEVER forge human PASS / S4-T7 Founder-Operator evidence or force `state.met === true`
- NEVER rebind `gate-plan.json` content or re-admit `2026-07-19T22:59:46Z` as plan target
- NEVER weaken FIX-22 empty/malformed `literal_cmds` fail-closed or FIX-24/25/26 flag/env/interpreter/metachar/Unicode-separator rejections that still match ASCII markers

**STRICTLY**
- STRICTLY order in `checkText` is: `if (!isStrictAscii(text)) return OFF_PLAN_SCRIPT;` then continue existing shell-SAFE + full-command equality for ASCII text only
- STRICTLY depend on REDHAT-FIX-26 `isStrictAscii` helper remaining unchanged; this task only fixes the CONDITIONAL call site at `rejectOffPlanScripts` checkText step 3 (~:784)
- STRICTLY fail closed on any non-ASCII code unit in every command-bearing `StepResult.repro_cmd` and command-bearing bundle field — independent of whether the command "looks like" a gate-evidence script

## DONE WHEN

- AC-1 [PRIMARY]: `rejectOffPlanScripts` / `deriveGoalState` returns `OFF_PLAN_SCRIPT` and `state.met === false` for Cyrillic `е` in `.gatе-evidence` / `.gate-evidеnce` — not `null`/accepted via blinded marker heuristics
- AC-2: `OFF_PLAN_SCRIPT` / `met===false` for Cyrillic `һ` in `.sһ` and non-ASCII path segment before extension
- AC-3: `OFF_PLAN_SCRIPT` / `met===false` for ZWSP inside `.gate-\u200bevidence`, full-width `．gate-evidence`, full-width slash preceding marker
- AC-4: blanket unconditional — non-ASCII in args (markers intact) AND non-ASCII with no gate-evidence markers both → `OFF_PLAN_SCRIPT` / `met===false`
- AC-5: exact ASCII plan full command still accepted on off-plan axis; FIX-24/25/26 named attacks still reject; non-ASCII reject path does not require `namesGateEvidenceScript`
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close HIGH-1 (cycle-6 re-review 2026-07-21T192618Z / HEAD 41eca15c): FIX-26's non-ASCII rejection is CONDITIONAL on recognition heuristics that require exact ASCII substrings (`.gate-evidence`, `.sh`). Production call site `tools/gate/deriveGoalState.ts:784` is `if (!isStrictAscii(text) && namesGateEvidenceScript(text))` — a single non-ASCII char in either marker blinds all enforcement predicates and the untrusted command is accepted (`null`).

**Success state:** Given HEAD-bound plan step1 `literal_cmd` `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh`, every marker-obfuscated non-ASCII `repro_cmd` (Cyrillic in `.gate-evidence` / `evidence` / `.sh`, ZWSP inside marker, full-width dot/slash preceding marker, non-ASCII in args without intact markers) yields `OFF_PLAN_SCRIPT` with `state.met === false`; exact ASCII plan command still returns `null` on the off-plan axis; FIX-24/25/26 named attacks still reject. Implementation order: unconditional `isStrictAscii` first, then existing ASCII shell-SAFE + full-command equality.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `head-bound-plan-step1-bash-literal` (seed_method: `public_api`): Temp git repo with HEAD-bound clean plan whose step1 `literal_cmd` is exactly the ASCII string `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (relative or absolute-canonicalizable). Same shape as FIX-26 harness.
    - GATE_PLAN_REL committed at HEAD with steps 1..8
    - step1.literal_cmd == 'bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh' (ASCII only)
    - plan loader HEAD-bound + clean (FIX-21/23)
    - wtHash === headHash
- `repro-marker-cyrillic-gate-evidence` (seed_method: `public_api`): repro_cmd that mutates the ASCII `.gate-evidence` / `evidence` marker with Cyrillic lookalike so `namesGateEvidenceScript` returns false at HEAD, bypassing FIX-26's conditional non-ASCII reject.
    - repro_cmd: `bash .gatе-evidence/2026-07-21T152805Z/scripts/step1.sh` (Cyrillic е U+0435 in place of Latin e in 'gate')
    - repro_cmd: `bash .gate-evidеnce/2026-07-21T152805Z/scripts/step1.sh` (Cyrillic е U+0435 in 'evidence')
    - At HEAD 41eca15c both return null (BYPASS) because namesGateEvidenceScript requires literal ASCII '.gate-evidence'
    - must be OFF_PLAN under UNCONDITIONAL isStrictAscii gate
- `repro-marker-cyrillic-sh-ext` (seed_method: `public_api`): repro_cmd that mutates the ASCII `.sh` extension or a path segment before the extension with Cyrillic so marker recognition fails open.
    - repro_cmd: `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sһ` (Cyrillic һ U+04BB in extension)
    - variant: non-ASCII in path segment before extension while markers otherwise look plan-shaped
    - At HEAD returns null (BYPASS) because namesGateEvidenceScript requires literal ASCII '.sh'
    - must be OFF_PLAN under UNCONDITIONAL isStrictAscii gate
- `repro-marker-zwsp-fullwidth` (seed_method: `public_api`): repro_cmd that blinds ASCII markers via ZWSP inside `.gate-evidence` or full-width punctuation preceding the marker.
    - repro_cmd: `bash .gate-\u200bevidence/2026-07-21T152805Z/scripts/step1.sh` (ZWSP U+200B inside marker)
    - repro_cmd: `bash ．gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (full-width ideographic full stop U+FF0E)
    - repro_cmd: `bash ／gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (full-width solidus U+FF0F preceding marker without leading ASCII dot)
    - At HEAD all return null (BYPASS)
    - must be OFF_PLAN under UNCONDITIONAL isStrictAscii gate
- `repro-nonascii-args-or-unrecognized` (seed_method: `public_api`): repro_cmd with non-ASCII in args or any position even when markers are intact OR when the command no longer looks like gate-evidence at all — proves rejection is not gated on recognition.
    - repro_cmd with intact ASCII markers + non-ASCII arg: `bash .gate-evidence/.../step1.sh --label=café`
    - repro_cmd with no gate-evidence markers at all + non-ASCII: `bash /tmp/run-é.sh`
    - repro_cmd with completely unrecognized shape + emoji/CJK
    - must be OFF_PLAN — unconditional, not recognition-gated
- `repro-exact-ascii-plan-full-command` (seed_method: `public_api`): repro_cmd that exactly matches normalized plan step1 `literal_cmd` using only ASCII characters and ASCII space separators (control accept on off-plan axis).
    - repro_cmd equals plan step1.literal_cmd after same ASCII-only normalization
    - off-plan axis must not return OFF_PLAN_SCRIPT
    - other axes (founder/completeness) may still yield met===false
    - FIX-24/25/26 named attack vectors still OFF_PLAN_SCRIPT

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Non-ASCII in `.gate-evidence` / `evidence` marker substrings rejected unconditionally

**Requirement:** GIVEN HEAD-bound plan with ASCII step1 `literal_cmd` WHEN repro_cmd contains non-ASCII inside the marker (Cyrillic `е` U+0435 in `.gatе-evidence` or `.gate-evidеnce`) THEN `rejectOffPlanScripts` / `deriveGoalState` returns `OFF_PLAN_SCRIPT` and `state.met === false` — NOT `null`/accepted because `namesGateEvidenceScript` failed and the conditional non-ASCII check was skipped

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: non-ASCII reject remains gated on `namesGateEvidenceScript` so Cyrillic `е` in `.gate-evidence`/`evidence` returns null; marker-obfuscated non-ASCII is NFKC-folded back to ASCII `.gate-evidence` and accepted; static shell returns `error === null` for `repro-marker-cyrillic-gate-evidence`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-marker-cyrillic-gate-evidence`
  - ACTION: Create temp repo with head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with `bash .gatе-evidence/.../step1.sh` (Cyrillic е in 'gate'); Call rejectOffPlanScripts with `bash .gate-evidеnce/.../step1.sh` (Cyrillic е in 'evidence'); Invoke deriveGoalState with same repro_cmds; capture error.code and state.met
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false; error.details.reason includes 'off-plan' || error.details.reason includes 'non-ASCII'; error.details.script includes U+0435 (Cyrillic е) OR hasNonAscii(script) === true with script === raw attack text
  - MUST_NOT_OBSERVE: error === null; state.met === true; rejectOffPlanScripts returns null for Cyrillic-marker commands; marker-obfuscated non-ASCII accepted as plan match; empty off-plan rejection (marker-blind accept)

### AC-2 — Non-ASCII in `.sh` extension / path segment rejected

**Requirement:** GIVEN HEAD-bound plan WHEN repro_cmd has Cyrillic `һ` U+04BB in `.sһ` or non-ASCII in a path segment before the extension THEN `OFF_PLAN_SCRIPT` + `met===false` — not null because `namesGateEvidenceScript` requires literal ASCII `.sh`

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: Cyrillic `һ` in `.sһ` causes `namesGateEvidenceScript` false and non-ASCII check is skipped → null accept; extension lookalike is NFKC-folded to `.sh` and accepted; static shell returns null for `repro-marker-cyrillic-sh-ext`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-marker-cyrillic-sh-ext`
  - ACTION: Seed head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with `bash .gate-evidence/.../step1.sһ` (Cyrillic һ in extension); Call rejectOffPlanScripts with non-ASCII in path segment before extension; Capture error.code and state.met via deriveGoalState
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; Cyrillic-.sh accepted as plan match; empty off-plan rejection for extension/path non-ASCII

### AC-3 — Zero-width / full-width blinding of markers rejected

**Requirement:** GIVEN HEAD-bound plan WHEN ZWSP U+200B is inside `.gate-\u200bevidence` OR full-width dot `．gate-evidence` OR full-width slash precedes the marker (`／gate...`) THEN `OFF_PLAN_SCRIPT` + `met===false` — vectors that return null at HEAD because they break ASCII marker `includes()`

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: ZWSP inside `.gate-evidence` is stripped before marker detection and remaining ASCII matches plan; full-width `．` or `／` is normalized to ASCII `.` or `/` and accepted; static shell returns null for `repro-marker-zwsp-fullwidth`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-marker-zwsp-fullwidth`
  - ACTION: Seed HEAD-bound plan; Call rejectOffPlanScripts for ZWSP-in-marker variant; Call rejectOffPlanScripts for full-width-dot and full-width-slash-preceding-marker variants; Capture error.code and state.met
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false; details.script includes U+200B OR U+FF0E OR U+FF0F (ZWSP/full-width code units present)
  - MUST_NOT_OBSERVE: error === null; state.met === true; ZWSP-in-marker accepted as plan match; full-width dot/slash marker-blind accept; empty off-plan rejection for ZWSP/full-width marker vectors

### AC-4 — Non-ASCII in args / elsewhere still rejected without needing markers

**Requirement:** GIVEN HEAD-bound plan WHEN repro_cmd has non-ASCII in args or any position even if markers are intact OR even if the command no longer looks like gate-evidence THEN `OFF_PLAN_SCRIPT` + `met===false` — unconditional, not gated on recognition

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: non-ASCII only rejected when `namesGateEvidenceScript` is true, so commands without markers with non-ASCII return null; only denylist of known marker-adjacent positions is checked; static shell returns null for `repro-nonascii-args-or-unrecognized`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-nonascii-args-or-unrecognized`
  - ACTION: Seed HEAD-bound plan; Call rejectOffPlanScripts with intact-marker command + non-ASCII arg (e.g. `--label=café`); Call rejectOffPlanScripts with non-gate-evidence path containing non-ASCII; Call rejectOffPlanScripts with unrecognized shape + emoji/CJK; Capture error for each
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; non-ASCII args accepted because markers intact; non-ASCII unrecognized command accepted because no marker match; empty off-plan rejection for unconditional non-ASCII

### AC-5 — Exact ASCII plan still accepted; FIX-24/25/26 regressions still reject; order is non-ASCII first then exact ASCII equality

**Requirement:** GIVEN HEAD-bound plan WHEN exact ASCII plan command THEN null on off-plan axis; WHEN FIX-24/25/26 named attacks still OFF_PLAN; AND implementation must scan raw command for any non-ASCII FIRST (independent of `namesGateEvidenceScript`) before continuing shell-SAFE + full-command equality for ASCII text

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-5'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: unconditional ASCII gate is so strict it rejects the plan's own `bash …/step1.sh` (false positive); synthetic harness pure-ASCII non-timestamp dirs are newly rejected on the off-plan axis; FIX-24 extra-flag / env / interpreter, FIX-25 metachar, or FIX-26 Unicode-separator cases silently pass again; implementation keeps `&& namesGateEvidenceScript(text)` on the non-ASCII reject (order/gating regression)
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-exact-ascii-plan-full-command`
  - ACTION: Resolve step1 literal_cmd from HEAD-bound plan; Call rejectOffPlanScripts with exact same ASCII full command → expect null; Call rejectOffPlanScripts with FIX-24 attack vectors (extra flag, env prefix, interpreter swap); Call rejectOffPlanScripts with FIX-25 metachar suffix and FIX-26 Unicode-whitespace separator; Assert production checkText source (or behavioral equivalent) rejects non-ASCII without namesGateEvidenceScript precondition; Capture return values
  - MUST_OBSERVE: rejectOffPlanScripts(exact ASCII plan) === null; rejectOffPlanScripts('bash …/step1.sh --unreviewed-flag').code == 'OFF_PLAN_SCRIPT'; rejectOffPlanScripts('env FOO=attacker bash …/step1.sh').code == 'OFF_PLAN_SCRIPT'; rejectOffPlanScripts('sh …/step1.sh').code == 'OFF_PLAN_SCRIPT'; rejectOffPlanScripts('bash …/step1.sh;:').code == 'OFF_PLAN_SCRIPT'; rejectOffPlanScripts('bash\u00A0…/step1.sh').code == 'OFF_PLAN_SCRIPT'; source checkText has `if (!isStrictAscii(text))` without `&& namesGateEvidenceScript` OR rejectOffPlanScripts(non-marker non-ASCII).code == 'OFF_PLAN_SCRIPT'
  - MUST_NOT_OBSERVE: error.code == 'OFF_PLAN_SCRIPT' for exact ASCII plan step1 full command; false-positive off-plan on exact match; rejectOffPlanScripts('--unreviewed-flag') === null; empty off-plan rejection for FIX-24/25/26 vectors; error === null for env-prefix attack; conditional `!isStrictAscii(text) && namesGateEvidenceScript(text)` still present as the only non-ASCII gate

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd has Cyrillic е in `.gatе-evidence` (marker-obfuscation that returns null at HEAD) | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-1'` |
| TC-2 | state.met is false when deriveGoalState receives Cyrillic е in `.gate-evidеnce` marker substrings | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-1'` |
| TC-3 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for Cyrillic һ in `.sһ` and non-ASCII path segment before extension | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-2'` |
| TC-4 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for ZWSP inside `.gate-evidence`, full-width dot `．gate-evidence`, and full-width slash preceding marker | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-3'` |
| TC-5 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for non-ASCII in args with intact markers AND for non-ASCII commands with no gate-evidence markers | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-4'` |
| TC-6 | rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for exact normalized ASCII plan step1 full command | AC-5 | `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-5'` |
| TC-7 | FIX-24 named attacks (extra flag, env prefix, interpreter swap) and FIX-25 metachar suffixes still return OFF_PLAN_SCRIPT after unconditional ASCII gate | AC-5 | `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-5'` |
| TC-8 | FIX-26 regression suite still passes (Unicode-whitespace / zero-width / homoglyph / blanket non-ASCII with intact markers still OFF_PLAN; exact ASCII still null) | AC-5 | `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/deriveGoalState.ts (MODIFY — unconditional non-ASCII reject in `rejectOffPlanScripts` checkText: drop `namesGateEvidenceScript` precondition; apply `if (!isStrictAscii(text)) return OFF_PLAN_SCRIPT` first among command-language checks or before any marker-dependent check; keep existing ASCII shell-SAFE + full-command equality after)
- convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts (NEW)

**writeProhibited:**
- tools/gate/verifyEvidenceManifest.ts plan freshness / dirty-plan expected-set — REDHAT-FIX-23 / REDHAT-FIX-21
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json rebinding
- Forging human PASS / S4-T7 Founder-Operator evidence
- Weakening FIX-12 / FIX-17 / FIX-18 / FIX-21 / FIX-22 / FIX-23 / FIX-24 / FIX-25 / FIX-26 checks
- Any RN/Expo/app client code
- convex/couchVerdict.ts — out of scope
- Changing `isStrictAscii` predicate semantics (keep FIX-26 helper; only fix call-site gating)

## READING LIST

- `tools/gate/deriveGoalState.ts` (778-797) — [PRIMARY BUG] CONDITIONAL non-ASCII reject: `if (!isStrictAscii(text) && namesGateEvidenceScript(text))` — marker-obfuscation blinds enforcement and returns null
- `tools/gate/deriveGoalState.ts` (447-452) — `isStrictAscii` predicate is correct (any charCode > 0x7F → false); wrong call-site gating is the defect, not this helper
- `tools/gate/deriveGoalState.ts` (479-485) — `namesGateEvidenceScript` requires literal ASCII `.gate-evidence` AND `.sh` (or timestamp-shaped path) — precondition that enables the bypass
- `tools/gate/deriveGoalState.ts` (700-830) — `rejectOffPlanScripts` checkText flow steps 1–4: run-ID allow-list → shell-SAFE → CONDITIONAL non-ASCII → full-command equality; unconditional ASCII gate must run before marker-dependent short-circuits for non-ASCII text
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T192618Z.md` (40-85) — HIGH-1 finding + confirmed HEAD bypass matrix (Cyrillic е/һ, ZWSP-in-marker, full-width ．/／) and required remediation: unconditional `isStrictAscii` before recognition heuristics
- `convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts` (1-300) — Prior harness pattern (temp git repo, honestEightStepPlan, expectOffPlanStrictAscii, AC structure); FIX-27 tests mirror this, add marker-obfuscation matrix that FIX-26 missed
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-26-enforce-strictly-ascii-byte-exact-command-language-reject-any-non-ascii.md` (1-80) — FIX-26 claimed blanket non-ASCII reject but implementation was conditional; FIX-27 closes that residual

## CODE PATTERN

- Pattern:
```ts
// BEFORE (buggy):
if (!isStrictAscii(text) && namesGateEvidenceScript(text)) {
  return { ok: false, code: 'OFF_PLAN_SCRIPT', ... }
}

// AFTER (fix):
if (!isStrictAscii(text)) {
  return {
    ok: false,
    code: 'OFF_PLAN_SCRIPT',
    details: {
      reason: `off-plan non-ASCII command not an exact HEAD-bound plan literal_cmd match (${text})`,
      step,
      script: text,
      capturedCommit: '',
      headCommit: head,
    },
  }
}
// then existing ASCII shell-SAFE + full-command equality for recognized scripts
```
- Pattern source: `tools/gate/deriveGoalState.ts:778-797 + red-hat HIGH-1 remediation 20260721T192618Z`
- Anti-pattern: Keeping `&& namesGateEvidenceScript(text)` or any other marker-detection precondition on the non-ASCII reject; stripping/NFKC-normalizing non-ASCII to recover a plan key; denylist-only rejection of known Unicode whitespace while marker-obfuscated non-ASCII still accepts
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T192618Z.md`, `tools/gate/deriveGoalState.ts:447-452,700-830`, `convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts`

## VERIFICATION GATES

- AC-1 PRIMARY marker-Cyrillic in `.gate-evidence`/`evidence` rejected: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-1'` → Exit 0; OFF_PLAN_SCRIPT; met===false for Cyrillic-е marker variants
- AC-2 Cyrillic in `.sh` / path segment rejected: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-2'` → Exit 0; OFF_PLAN_SCRIPT; met===false
- AC-3 ZWSP / full-width marker blinding rejected: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-3'` → Exit 0; OFF_PLAN_SCRIPT; met===false
- AC-4 unconditional non-ASCII without markers rejected: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-4'` → Exit 0; OFF_PLAN_SCRIPT; met===false
- AC-5 exact ASCII accept + FIX-24/25/26 still reject: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-5'` → Exit 0
- Full FIX-27 suite: `npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts` → Exit 0
- FIX-26 regression: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts` → Exit 0
- Typecheck: `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check tools/gate/deriveGoalState.ts convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only` → Only paths in guardrails.write_allowed

- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-27-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns `rejectOffPlanScripts` / `isStrictAscii` enforcement order in `tools/gate/deriveGoalState.ts`: move non-ASCII fail-closed to first command-language check, drop `namesGateEvidenceScript` precondition, preserve FIX-24/25/26 ASCII equality after the gate, while preserving exact ASCII plan `literal_cmd` accept and prior named-attack rejects.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced — at HEAD `41eca15c`, Cyrillic-marker / ZWSP-in-marker / full-width marker vectors return null / accepted)
- Integration coverage: PRIMARY AC is integration against real services (filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: REDHAT-FIX-26
- Blocks: —
- Notes: Review source: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T192618Z.md` HIGH-1 (Unicode marker-obfuscation bypass of FIX-26). Cycle 6 remediation — make non-ASCII rejection unconditional.

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md
- Command note: use `npx vitest run` not `pnpm test` (watch hang); vitest filter is `-t '<name>'`

## NOTES

- Review source: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T192618Z.md` HIGH-1 (HEAD 41eca15c).
- FIX-26 closed Unicode-whitespace / zero-width / homoglyph / blanket non-ASCII *when markers remain ASCII-recognizable*, but gated the non-ASCII reject on `namesGateEvidenceScript`. Confirmed bypasses: Cyrillic `е` in `.gatе-evidence` / `.gate-evidеnce`, Cyrillic `һ` in `.sһ`, ZWSP in `.gate-\u200bevidence`, full-width `．gate-evidence`, full-width `／gate...` all return null.
- Implementation: drop `&& namesGateEvidenceScript(text)`; `if (!isStrictAscii(text)) return OFF_PLAN_SCRIPT` first; keep FIX-26 `isStrictAscii` helper and post-gate exact ASCII equality.
- Preferred checkText order: non-ASCII fail-closed first for command-language integrity, then withdrawn-run reject, shell-SAFE, full-command equality. If run-ID extraction currently precedes non-ASCII, ensure non-ASCII gate still fires for every command-bearing text (or reorder).
- `namesGateEvidenceScript` may remain as a detection helper for other purposes but MUST NOT be a precondition of the non-ASCII reject.
- Preserve withdrawn-run OFF_PLAN and empty literal_cmds fail-closed from FIX-22; preserve FIX-24/25/26 named rejects.
- NEVER forge human PASS / S4-T7 evidence.
- RED-first: write AC-1 failing against current accept of Cyrillic-marker commands before changing the call site.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-27",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "head-bound-plan-step1-bash-literal": {
      "description": "Temp git repo with HEAD-bound clean plan whose step1 literal_cmd is exactly the ASCII string `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (relative or absolute-canonicalizable). Same shape as FIX-26 harness.",
      "seed_method": "public_api",
      "records": [
        "GATE_PLAN_REL committed at HEAD with steps 1..8",
        "step1.literal_cmd == 'bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh' (ASCII only)",
        "plan loader HEAD-bound + clean (FIX-21/23)",
        "wtHash === headHash"
      ]
    },
    "repro-marker-cyrillic-gate-evidence": {
      "description": "repro_cmd that mutates the ASCII `.gate-evidence` / `evidence` marker with Cyrillic lookalike so namesGateEvidenceScript returns false at HEAD, bypassing FIX-26's conditional non-ASCII reject.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: bash .gat\u0435-evidence/2026-07-21T152805Z/scripts/step1.sh (Cyrillic \u0435 U+0435 in place of Latin e in 'gate')",
        "repro_cmd: bash .gate-evid\u0435nce/2026-07-21T152805Z/scripts/step1.sh (Cyrillic \u0435 U+0435 in 'evidence')",
        "At HEAD 41eca15c both return null (BYPASS) because namesGateEvidenceScript requires literal ASCII '.gate-evidence'",
        "must be OFF_PLAN under UNCONDITIONAL isStrictAscii gate"
      ]
    },
    "repro-marker-cyrillic-sh-ext": {
      "description": "repro_cmd that mutates the ASCII `.sh` extension or a path segment before the extension with Cyrillic so marker recognition fails open.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: bash .gate-evidence/2026-07-21T152805Z/scripts/step1.s\u04bb (Cyrillic \u04bb U+04BB in extension)",
        "variant: non-ASCII in path segment before extension while markers otherwise look plan-shaped",
        "At HEAD returns null (BYPASS) because namesGateEvidenceScript requires literal ASCII '.sh'",
        "must be OFF_PLAN under UNCONDITIONAL isStrictAscii gate"
      ]
    },
    "repro-marker-zwsp-fullwidth": {
      "description": "repro_cmd that blinds ASCII markers via ZWSP inside `.gate-evidence` or full-width punctuation preceding the marker.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: bash .gate-\\u200bevidence/2026-07-21T152805Z/scripts/step1.sh (ZWSP U+200B inside marker)",
        "repro_cmd: bash \uff0egate-evidence/2026-07-21T152805Z/scripts/step1.sh (full-width ideographic full stop U+FF0E)",
        "repro_cmd: bash \uff0fgate-evidence/2026-07-21T152805Z/scripts/step1.sh (full-width solidus U+FF0F preceding marker without leading ASCII dot)",
        "At HEAD all return null (BYPASS)",
        "must be OFF_PLAN under UNCONDITIONAL isStrictAscii gate"
      ]
    },
    "repro-nonascii-args-or-unrecognized": {
      "description": "repro_cmd with non-ASCII in args or any position even when markers are intact OR when the command no longer looks like gate-evidence at all \u2014 proves rejection is not gated on recognition.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd with intact ASCII markers + non-ASCII arg: bash .gate-evidence/.../step1.sh --label=caf\u00e9",
        "repro_cmd with no gate-evidence markers at all + non-ASCII: bash /tmp/run-\u00e9.sh",
        "repro_cmd with completely unrecognized shape + emoji/CJK",
        "must be OFF_PLAN \u2014 unconditional, not recognition-gated"
      ]
    },
    "repro-exact-ascii-plan-full-command": {
      "description": "repro_cmd that exactly matches normalized plan step1 literal_cmd using only ASCII characters and ASCII space separators (control accept on off-plan axis).",
      "seed_method": "public_api",
      "records": [
        "repro_cmd equals plan step1.literal_cmd after same ASCII-only normalization",
        "off-plan axis must not return OFF_PLAN_SCRIPT",
        "other axes (founder/completeness) may still yield met===false",
        "FIX-24/25/26 named attack vectors still OFF_PLAN_SCRIPT"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN HEAD-bound plan with ASCII step1 literal_cmd WHEN repro_cmd contains non-ASCII inside the marker (Cyrillic \u0435 in `.gat\u0435-evidence` or `.gate-evid\u0435nce`) THEN error.code == 'OFF_PLAN_SCRIPT' and state.met === false \u2014 NOT null/accepted because namesGateEvidenceScript failed and conditional non-ASCII check was skipped",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "flow_ref": "UC-VER-05",
      "unit_test_justified": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "non-ASCII reject remains gated on namesGateEvidenceScript so Cyrillic \u0435 in `.gate-evidence`/`evidence` returns null under static/stubbed marker heuristics",
            "marker-obfuscated non-ASCII is NFKC-folded back to ASCII `.gate-evidence` and accepted",
            "static shell returns error === null for repro-marker-cyrillic-gate-evidence"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-marker-cyrillic-gate-evidence",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create temp repo with HEAD-bound bash step1 plan",
                "Call rejectOffPlanScripts with Cyrillic \u0435 in `.gat\u0435-evidence` and in `.gate-evid\u0435nce`",
                "Capture error.code and state.met"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'OFF_PLAN_SCRIPT'",
                "state.met === false",
                "error.details.reason includes 'off-plan' || error.details.reason includes 'non-ASCII'",
                "error.details.script includes U+0435 (Cyrillic e) AND script equals raw attack text"
              ],
              "must_not_observe": [
                "error === null",
                "state.met === true",
                "rejectOffPlanScripts returns null for Cyrillic-marker commands",
                "marker-obfuscated non-ASCII accepted as plan match",
                "empty off-plan rejection (marker-blind accept)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN HEAD-bound plan WHEN repro_cmd has Cyrillic \u04bb in `.s\u04bb` or non-ASCII in path segment before extension THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "flow_ref": "UC-VER-05",
      "unit_test_justified": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "Cyrillic \u04bb in `.s\u04bb` causes namesGateEvidenceScript false and non-ASCII check is skipped \u2192 null accept",
            "extension lookalike is NFKC-folded to `.sh` and accepted",
            "static shell returns null for repro-marker-cyrillic-sh-ext"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-marker-cyrillic-sh-ext",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound plan",
                "Call rejectOffPlanScripts with Cyrillic \u04bb extension and non-ASCII path segment variants",
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
                "Cyrillic-.sh accepted as plan match",
                "empty off-plan rejection for extension/path non-ASCII"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN HEAD-bound plan WHEN ZWSP inside `.gate-\\u200bevidence` OR full-width dot `\uff0egate-evidence` OR full-width slash preceding marker THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "flow_ref": "UC-VER-05",
      "unit_test_justified": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "ZWSP inside `.gate-evidence` is stripped before marker detection and remaining ASCII matches plan",
            "full-width \uff0e or \uff0f is normalized to ASCII . or / and accepted",
            "static shell returns null for repro-marker-zwsp-fullwidth"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-marker-zwsp-fullwidth",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound plan",
                "Call rejectOffPlanScripts for ZWSP-in-marker, full-width-dot, full-width-slash-preceding-marker",
                "Capture error.code and state.met"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'OFF_PLAN_SCRIPT'",
                "state.met === false",
                "details.script includes U+200B OR U+FF0E OR U+FF0F (ZWSP/full-width code units present)"
              ],
              "must_not_observe": [
                "error === null",
                "state.met === true",
                "ZWSP-in-marker accepted as plan match",
                "full-width dot/slash marker-blind accept",
                "empty off-plan rejection for ZWSP/full-width marker vectors"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN HEAD-bound plan WHEN repro_cmd has non-ASCII in args or any position even if markers are intact OR command no longer looks like gate-evidence THEN OFF_PLAN_SCRIPT and state.met === false \u2014 unconditional",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "flow_ref": "UC-VER-05",
      "unit_test_justified": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "non-ASCII only rejected when namesGateEvidenceScript is true, so commands without markers with non-ASCII return null",
            "only denylist of known marker-adjacent positions is checked",
            "static shell returns null for repro-nonascii-args-or-unrecognized"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-nonascii-args-or-unrecognized",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound plan",
                "Call rejectOffPlanScripts with intact markers + non-ASCII arg",
                "Call rejectOffPlanScripts with non-marker path + non-ASCII and unrecognized + emoji/CJK",
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
                "non-ASCII args accepted because markers intact",
                "non-ASCII unrecognized command accepted because no marker match",
                "empty off-plan rejection for unconditional non-ASCII"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN HEAD-bound plan WHEN exact ASCII plan step1 full command THEN null / not OFF_PLAN_SCRIPT; WHEN FIX-24/25/26 named attacks THEN still OFF_PLAN_SCRIPT; implementation scans raw command for any non-ASCII FIRST independent of namesGateEvidenceScript",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-5'",
      "maps_to_ac": null,
      "flow_ref": "UC-VER-05",
      "unit_test_justified": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts",
        "negative_control": {
          "would_fail_if": [
            "unconditional ASCII gate is so strict it rejects the plan's own bash .../step1.sh (false positive)",
            "synthetic harness pure-ASCII non-timestamp dirs are newly rejected on the off-plan axis",
            "FIX-24 extra-flag / env / interpreter, FIX-25 metachar, or FIX-26 Unicode-separator cases silently pass again",
            "implementation keeps `&& namesGateEvidenceScript(text)` on the non-ASCII reject",
            "static shell / mocked isStrictAscii always-true path accepts non-ASCII"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-exact-ascii-plan-full-command",
            "action": {
              "actor": "api_client",
              "steps": [
                "Resolve step1 literal_cmd from HEAD plan",
                "Call rejectOffPlanScripts with exact ASCII command",
                "Call rejectOffPlanScripts with FIX-24/25/26 attack vectors",
                "Capture returns"
              ]
            },
            "end_state": {
              "must_observe": [
                "rejectOffPlanScripts(exact ASCII plan) === null",
                "rejectOffPlanScripts('bash \u2026/step1.sh --unreviewed-flag').code == 'OFF_PLAN_SCRIPT'",
                "rejectOffPlanScripts('env FOO=attacker bash \u2026/step1.sh').code == 'OFF_PLAN_SCRIPT'",
                "rejectOffPlanScripts('sh \u2026/step1.sh').code == 'OFF_PLAN_SCRIPT'",
                "rejectOffPlanScripts('bash \u2026/step1.sh;:').code == 'OFF_PLAN_SCRIPT'",
                "rejectOffPlanScripts('bash\\u00A0\u2026/step1.sh').code == 'OFF_PLAN_SCRIPT'",
                "source checkText has `if (!isStrictAscii(text))` without `&& namesGateEvidenceScript` OR rejectOffPlanScripts(non-marker non-ASCII).code == 'OFF_PLAN_SCRIPT'"
              ],
              "must_not_observe": [
                "error.code == 'OFF_PLAN_SCRIPT' for exact ASCII plan step1 full command",
                "false-positive off-plan on exact match",
                "rejectOffPlanScripts('--unreviewed-flag') === null",
                "empty off-plan rejection for FIX-24/25/26 vectors",
                "error === null for env-prefix attack",
                "conditional `!isStrictAscii(text) && namesGateEvidenceScript(text)` still present as the only non-ASCII gate"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd has Cyrillic \u0435 in `.gat\u0435-evidence` (marker-obfuscation that returns null at HEAD)",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "state.met is false when deriveGoalState receives Cyrillic \u0435 in `.gate-evid\u0435nce` marker substrings",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for Cyrillic \u04bb in `.s\u04bb` and non-ASCII path segment before extension",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for ZWSP inside `.gate-evidence`, full-width dot `\uff0egate-evidence`, and full-width slash preceding marker",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for non-ASCII in args with intact markers AND for non-ASCII commands with no gate-evidence markers",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-4'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for exact normalized ASCII plan step1 full command",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-5'"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "FIX-24 named attacks and FIX-25 metachar suffixes still return OFF_PLAN_SCRIPT after unconditional ASCII gate",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -t 'AC-5'"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "FIX-26 regression suite still passes after unconditional non-ASCII gate",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts"
    }
  ]
}
-->

</details>
