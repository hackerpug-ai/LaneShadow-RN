# REDHAT-FIX-26 — Enforce STRICTLY ASCII + BYTE-EXACT command language (reject Unicode whitespace / homoglyph / zero-width bypass of FIX-25)

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-26 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 75 min |
| EFFORT | S |
| PRIORITY | P0 |
| STATUS | ✅ Completed |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-05 |
| DEPENDS_ON | REDHAT-FIX-25 |
| BLOCKS | — |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHAT-FIX-26-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Close HIGH-1 (cycle-5 re-review 2026-07-21T185814Z): FIX-25's shell-SAFE exact-command comparison is still bypassable because `normalizeFullCommand()` tokenizes with JS `\s+`, which treats Unicode whitespace (NBSP U+00A0, figure space U+2007, narrow NBSP U+202F, line separator U+2028) as argument separators. `bash<U+00A0><plan-script>` therefore normalizes to the same stable key as the plan ASCII command and is accepted by `rejectOffPlanScripts` despite not being byte-identical and not being a valid Bash simple command. **FUNDAMENTAL fix:** make the accepted command language STRICTLY ASCII and BYTE-EXACT — reject ANY non-ASCII character (Unicode whitespace, zero-width U+200B/U+FEFF, Cyrillic/Latin homoglyphs, full-width forms, etc.); treat ONLY ASCII whitespace as separators; require the normalized ASCII token sequence to EQUAL the HEAD-bound plan command exactly. Any non-ASCII code unit → `OFF_PLAN_SCRIPT`. This closes the entire Unicode/encoding surface at once (not incrementally).

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST reject ANY non-ASCII character (code point > 0x7F) in the executed/repro command before or as part of normalization — Unicode whitespace (NBSP U+00A0, U+2007, U+202F, U+2028), zero-width (U+200B, U+FEFF), Cyrillic/Latin homoglyphs, full-width punctuation, and every other non-ASCII code unit all → `OFF_PLAN_SCRIPT`
- MUST tokenize ONLY on ASCII whitespace (U+0020 space; U+0009/U+000A/U+000D already fail shell-SAFE from FIX-25) — NEVER use JS `\s+` (which matches Unicode whitespace) for plan-command equality
- MUST require the normalized ASCII token sequence (interpreter + script path + args) to EQUAL the HEAD-bound plan command exactly after ASCII-only tokenization
- MUST still accept the exact ASCII plan full command on the off-plan axis (null / not `OFF_PLAN_SCRIPT`) and preserve FIX-24/FIX-25 rejections (extra flag, env-prefix, interpreter swap, shell metachar suffixes)
- MUST consume HEAD-bound plan loader (FIX-21/23) — never re-introduce working-tree plan authority for binding
- MUST cover the adversarial matrix in integration tests: Unicode whitespace separators (U+00A0, U+2007, U+202F, U+2028), zero-width injection (U+200B, U+FEFF), at least one homoglyph path, and the exact ASCII plan accept control

**NEVER**
- NEVER treat Unicode whitespace as an argument separator that recovers a plan match
- NEVER strip / normalize / NFKC / case-fold non-ASCII away to recover a clean plan key
- NEVER forge human PASS / S4-T7 Founder-Operator evidence or force `state.met === true`
- NEVER rebind `gate-plan.json` content or re-admit `2026-07-19T22:59:46Z` as plan target
- NEVER weaken FIX-22 empty/malformed `literal_cmds` fail-closed behavior or FIX-24/FIX-25 flag/env/interpreter/metachar rejections

**STRICTLY**
- STRICTLY the accepted command language is ASCII-only simple-command grammar: every character of the executed command must be in the ASCII range (0x00–0x7F), and after ASCII-whitespace tokenization the stable full-command key must equal a HEAD-bound plan `literal_cmd` key
- STRICTLY depend on REDHAT-FIX-25 shell-SAFE comparison remaining as the base; this task closes the Unicode/encoding residual left by JS `\s+`
- STRICTLY fail closed on any non-ASCII byte — do not attempt partial tokenization of mixed ASCII+Unicode strings

## DONE WHEN

- AC-1 [PRIMARY]: `rejectOffPlanScripts` / `deriveGoalState` returns `OFF_PLAN_SCRIPT` and `state.met === false` for `bash` + NBSP (U+00A0) + plan-script (and U+2007 / U+202F / U+2028 separator variants) — not null/accepted via `\s+` normalization
- AC-2: `OFF_PLAN_SCRIPT` / `met===false` for zero-width injection (U+200B ZWSP, U+FEFF BOM/ZWNBSP) in/after the plan command
- AC-3: `OFF_PLAN_SCRIPT` / `met===false` for homoglyph / non-ASCII lookalike interpreter or path (e.g. Cyrillic `а` for Latin `a`, full-width forms)
- AC-4: blanket — ANY non-ASCII character anywhere in the executed command yields `OFF_PLAN_SCRIPT` / `met===false`
- AC-5: exact ASCII plan full command still accepted on off-plan axis; FIX-24 named attacks and FIX-25 metachar vectors still reject
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Close HIGH-1 (cycle-5 re-review 2026-07-21T185814Z): Unicode-whitespace exact-command bypass of FIX-25. `normalizeFullCommand` uses `text.trim().split(/\s+/)` — JS `\s` includes U+00A0/U+2007/U+202F/U+2028 — so `bash\u00A0.gate-evidence/…/step1.sh` yields the same stable key as the plan ASCII command and is accepted despite not being byte-identical and failing as a real Bash command (exit 127).

**Success state:** Given HEAD-bound plan `literal_cmd` `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh`, repro_cmds that replace the ASCII space with U+00A0 / U+2007 / U+202F / U+2028, inject U+200B / U+FEFF, or substitute homoglyph characters all yield `OFF_PLAN_SCRIPT` with `met===false`; exact ASCII plan `literal_cmd` still returns null on the off-plan axis; FIX-24 extras and FIX-25 metachar suffixes remain rejected. Implementation: reject any char with code point > 0x7F before equality; tokenize only with an ASCII whitespace class (e.g. `/[ \t\n\r]+/`), never `/\s+/`.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `head-bound-plan-step1-bash-literal` (seed_method: `public_api`): Temp git repo with HEAD-bound clean plan whose step1 `literal_cmd` is exactly the ASCII string `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (relative or absolute-canonicalizable).
    - GATE_PLAN_REL committed at HEAD with steps 1..8
    - step1.literal_cmd == 'bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh' (ASCII only)
    - plan loader HEAD-bound + clean (FIX-21/23)
    - wtHash === headHash
- `repro-unicode-ws-nbsp-separator` (seed_method: `public_api`): repro_cmd that keeps plan interpreter+script but uses NBSP (U+00A0) as the separator instead of ASCII space.
    - repro_cmd: `bash\u00A0.gate-evidence/2026-07-21T152805Z/scripts/step1.sh`
    - ALSO variants: U+2007 figure space, U+202F narrow NBSP, U+2028 line separator between `bash` and path
    - FIX-25 path would accept because `\s+` splits these as whitespace (bug)
    - must be OFF_PLAN under STRICTLY-ASCII command language
- `repro-zero-width-injection` (seed_method: `public_api`): repro_cmd with zero-width characters injected into or after the plan command.
    - repro_cmd: `bash .gate-evidence/…/step1.sh` with U+200B (ZWSP) between tokens or inside path; and U+FEFF (BOM/ZWNBSP) prefix/mid
    - must be OFF_PLAN under STRICTLY-ASCII command language
- `repro-homoglyph-non-ascii` (seed_method: `public_api`): repro_cmd that substitutes a lookalike non-ASCII character for an ASCII letter in interpreter or path.
    - e.g. Cyrillic `а` (U+0430) in place of Latin `a` in `bash`, or full-width characters in path segments
    - must be OFF_PLAN under STRICTLY-ASCII command language
- `repro-any-non-ascii-blanket` (seed_method: `public_api`): repro_cmd containing any non-ASCII code unit outside the named whitespace/zero-width/homoglyph families (e.g. emoji, accented Latin, CJK) while otherwise matching plan shape.
    - must be OFF_PLAN — blanket non-ASCII reject
- `repro-exact-ascii-plan-full-command` (seed_method: `public_api`): repro_cmd that exactly matches normalized plan step1 `literal_cmd` using only ASCII characters and ASCII space separators (control accept on off-plan axis).
    - repro_cmd equals plan step1.literal_cmd after same ASCII-only normalization
    - off-plan axis must not return OFF_PLAN_SCRIPT
    - other axes (founder/completeness) may still yield met===false

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Unicode whitespace separators rejected (NBSP / U+2007 / U+202F / U+2028)

**Requirement:** GIVEN HEAD-bound plan with step1 `literal_cmd` exactly the ASCII string `bash …/step1.sh` WHEN repro_cmd is `bash` + U+00A0 + plan-script (or U+2007 / U+202F / U+2028 as the separator instead of ASCII space) THEN `rejectOffPlanScripts` / `deriveGoalState` returns `OFF_PLAN_SCRIPT` and `state.met === false` — not null/accepted because JS `\s+` treated Unicode whitespace as an argument separator and produced the same stable key as the plan

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-1'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `normalizeFullCommand` still splits on JS `\s+` and treats U+00A0/U+2007/U+202F/U+2028 as separators so the stable key equals the plan; non-ASCII is silently stripped/NFKC-normalized before equality; static shell returns `error === null` for `repro-unicode-ws-nbsp-separator`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-unicode-ws-nbsp-separator`
  - ACTION: Create temp repo with head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with `bash\u00A0…/step1.sh` and at least U+2007, U+202F, U+2028 variants; Invoke deriveGoalState with same repro_cmd; capture error.code and state.met
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false; error.details.reason includes 'off-plan' || error.details.script includes '\u00A0' || error.details.script includes 'step1.sh'
  - MUST_NOT_OBSERVE: error === null; state.met === true; rejectOffPlanScripts returns null for NBSP-separator command; Unicode-whitespace accepted as plan match; empty off-plan rejection (Unicode accept)

### AC-2 — Zero-width injection rejected (U+200B / U+FEFF)

**Requirement:** GIVEN HEAD-bound plan with step1 bash `literal_cmd` WHEN repro_cmd injects U+200B (zero-width space) or U+FEFF (BOM / zero-width no-break space) into or between plan tokens THEN `OFF_PLAN_SCRIPT` / `met===false` — zero-width characters never silently disappear from equality

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-2'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: zero-width characters are stripped before tokenization and remaining ASCII matches plan; `\s+` or trim discards U+FEFF and accepts; static shell returns null for `repro-zero-width-injection`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-zero-width-injection`
  - ACTION: Seed head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with plan command containing U+200B between tokens and with U+FEFF prefix/mid; Capture error.code and state.met
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; zero-width injection accepted as plan match; empty off-plan rejection for U+200B / U+FEFF

### AC-3 — Homoglyph / non-ASCII lookalike interpreter or path rejected

**Requirement:** GIVEN HEAD-bound plan WHEN repro_cmd substitutes a non-ASCII lookalike (e.g. Cyrillic `а` U+0430 for Latin `a` in `bash`, or full-width characters in the path) THEN `OFF_PLAN_SCRIPT` / `met===false`

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-3'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: homoglyph interpreter is NFKC-folded to ASCII `bash` and accepted; path lookalikes are canonically decomposed to match plan path; static shell always accepts any lookalike of a plan-owned `.sh`
- EVIDENCE: `api_response` (required_capture: true)
- CASE 1 — start_ref `repro-homoglyph-non-ascii`
  - ACTION: Seed head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts for Cyrillic-homoglyph interpreter and/or full-width path variant; Capture error codes
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; homoglyph command accepted as plan match; empty off-plan rejection for homoglyph vectors

### AC-4 — Blanket reject of ANY non-ASCII character

**Requirement:** GIVEN HEAD-bound plan WHEN repro_cmd contains ANY character with code point > 0x7F (including characters outside the named whitespace/zero-width/homoglyph matrix, e.g. emoji, accented Latin, CJK) THEN `OFF_PLAN_SCRIPT` / `met===false` — the accepted language is STRICTLY ASCII, not a denylist of known Unicode whitespace

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-4'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: only a denylist of known Unicode whitespace is rejected while other non-ASCII passes; allowlist is Unicode-letter-permissive; static shell returns null for `repro-any-non-ascii-blanket`
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-any-non-ascii-blanket`
  - ACTION: Seed head-bound-plan-step1-bash-literal; Call rejectOffPlanScripts with plan-shaped command containing at least one non-ASCII non-whitespace code unit (e.g. emoji or accented character); Capture error
  - MUST_OBSERVE: error.code == 'OFF_PLAN_SCRIPT'; state.met === false
  - MUST_NOT_OBSERVE: error === null; state.met === true; non-ASCII non-whitespace accepted as plan match; empty off-plan rejection for blanket non-ASCII

### AC-5 — Exact ASCII plan full command accepted; FIX-24/FIX-25 named attacks still reject

**Requirement:** GIVEN HEAD-bound plan WHEN repro_cmd exactly matches normalized plan step1 full `literal_cmd` using only ASCII characters and ASCII space separators THEN off-plan axis does not return `OFF_PLAN_SCRIPT` (null / not OFF_PLAN); AND when repro_cmd is a FIX-24 named attack (`--unreviewed-flag`, `env FOO=attacker`, `sh`/`python` interpreter swap) OR a FIX-25 metachar suffix (`…/step1.sh;:`, `…/step1.sh$(true)`) THEN still `OFF_PLAN_SCRIPT` — STRICTLY-ASCII hardening must not regress FIX-24/FIX-25 or false-positive-reject the plan's own ASCII command

- TEST_TIER: `integration` · VERIFICATION_SERVICE: filesystem+git temp repo + rejectOffPlanScripts
- FLOW_REF: UC-VER-05
- VERIFY: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-5'`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: ASCII gate is so strict it rejects the plan's own `bash …/step1.sh` (false positive); absolute vs relative plan paths fail equality for identical ASCII simple commands; static shell always returns OFF_PLAN_SCRIPT for any `.sh` including exact plan match; FIX-24 extra-flag / env / interpreter or FIX-25 metachar cases silently pass again
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `repro-exact-ascii-plan-full-command`
  - ACTION: Resolve step1 literal_cmd from HEAD-bound plan; Call rejectOffPlanScripts with exact same ASCII full command; Also call with FIX-24 attack vectors and FIX-25 metachar suffix; Capture return values
  - MUST_OBSERVE: rejectOffPlanScripts(exact ASCII plan) === null; rejectOffPlanScripts('bash …/step1.sh --unreviewed-flag').code == 'OFF_PLAN_SCRIPT'; rejectOffPlanScripts('env FOO=attacker bash …/step1.sh').code == 'OFF_PLAN_SCRIPT'; rejectOffPlanScripts('sh …/step1.sh').code == 'OFF_PLAN_SCRIPT'; rejectOffPlanScripts('bash …/step1.sh;:').code == 'OFF_PLAN_SCRIPT'
  - MUST_NOT_OBSERVE: error.code == 'OFF_PLAN_SCRIPT' for exact ASCII plan step1 full command; false-positive off-plan on exact match; rejectOffPlanScripts('--unreviewed-flag') === null; empty off-plan rejection for FIX-24/FIX-25 vectors; error === null for env-prefix attack

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd is bash + NBSP + plan-step1.sh | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-1'` |
| TC-2 | state.met is false when deriveGoalState receives bash + U+00A0/U+2007/U+202F/U+2028 + plan-script | AC-1 | `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-1'` |
| TC-3 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for U+200B and U+FEFF zero-width injection into plan command | AC-2 | `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-2'` |
| TC-4 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for homoglyph / non-ASCII lookalike interpreter or path | AC-3 | `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-3'` |
| TC-5 | rejectOffPlanScripts returns OFF_PLAN_SCRIPT for any non-ASCII character outside the named whitespace matrix | AC-4 | `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-4'` |
| TC-6 | rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for exact normalized ASCII plan step1 full command | AC-5 | `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-5'` |
| TC-7 | FIX-24 named attacks (extra flag, env prefix, interpreter swap) still return OFF_PLAN_SCRIPT after ASCII-strict upgrade | AC-5 | `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts` |
| TC-8 | FIX-25 metachar suffix attacks still return OFF_PLAN_SCRIPT after ASCII-strict upgrade | AC-5 | `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- tools/gate/deriveGoalState.ts (MODIFY — STRICTLY-ASCII + BYTE-EXACT full-command comparison: reject any non-ASCII code unit before equality; replace JS `\s+` tokenization with ASCII-only whitespace split in `normalizeFullCommand` / `canonicalizeScriptPath` / any other plan-equality tokenizer; surface reject via `rejectOffPlanScripts` as `OFF_PLAN_SCRIPT`)
- convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts (NEW)

**writeProhibited:**
- tools/gate/verifyEvidenceManifest.ts plan freshness / dirty-plan expected-set — REDHAT-FIX-23 / REDHAT-FIX-21
- .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json rebinding
- Forging human PASS / S4-T7 Founder-Operator evidence
- Weakening FIX-12 / FIX-18 / FIX-21 / FIX-22 / FIX-23 / FIX-24 / FIX-25 checks
- Any RN/Expo/app client code
- convex/couchVerdict.ts — out of scope

## READING LIST

- `tools/gate/deriveGoalState.ts` (543-614) — [PRIMARY BUG] `normalizeFullCommand` tokenizes with `text.trim().split(/\s+/)` — JS `\s` includes U+00A0/U+2007/U+202F/U+2028 so Unicode whitespace separators yield the same stable key as the plan ASCII command
- `tools/gate/deriveGoalState.ts` (469-503) — [RELATED] `canonicalizeScriptPath` also splits on `\s+` and can participate in Unicode-separator recovery
- `tools/gate/deriveGoalState.ts` (434-439) — FIX-25 `SHELL_UNSAFE_RE` / `containsShellUnsafeChars` forbids only selected ASCII metachar set; does not prohibit non-ASCII
- `tools/gate/deriveGoalState.ts` (650-750) — `rejectOffPlanScripts` allowedFullCmds membership — must reject non-ASCII commands before or as part of full-command equality
- `tools/gate/verifyEvidenceManifest.ts` (145-230) — loadHeadBoundGatePlan — consume for literalCmds (FIX-21); FIX-23 freshness if multi-commit fixtures used
- `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T185814Z.md` (29-57) — HIGH-1 finding: `bash<U+00A0><plan-script>` and U+2007/U+202F/U+2028 accepted (null) with same stable key as plan; Bash treats them as part of the command name (exit 127)
- `convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts` (1-280) — Existing shell-SAFE harness; preserve metachar negatives and exact-match accept; extend pattern for Unicode matrix
- `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/gate-plan.json` (9-40) — Example `literal_cmd` shape: `bash <abs>/.gate-evidence/2026-07-21T152805Z/scripts/stepN.sh` — plan cmds themselves are pure ASCII simple commands

## CODE PATTERN

- Pattern: Before equality, assert STRICTLY-ASCII command text: `function isStrictAscii(text: string): boolean { for (let i = 0; i < text.length; i++) { if (text.charCodeAt(i) > 0x7f) return false } return true }` — if `!isStrictAscii(text)` return null / `OFF_PLAN_SCRIPT`. Tokenize ONLY with ASCII whitespace: `text.trim().split(/[ \t\n\r]+/).filter(Boolean)` — NEVER `/\s+/`. Keep FIX-25 `containsShellUnsafeChars` fail-closed for metachar/control/quote. Plan equality remains `stableFullCommandKey(normalizeFullCommand(repro)) ∈ allowedFullCmds`.
- Pattern source: `tools/gate/deriveGoalState.ts:434-614 + review HIGH-1 remediation 20260721T185814Z`
- Anti-pattern: `const tokens = text.trim().split(/\s+/)` // accepts `bash\u00A0…/step1.sh` as equal to `bash …/step1.sh` then `allowedFullCmds.has(stableKey(...))` // Unicode whitespace forged as plan command
- Design references: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T185814Z.md`, `tools/gate/deriveGoalState.ts:434-750`, `convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts`

## VERIFICATION GATES

- AC-1 PRIMARY Unicode whitespace separators rejected: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-1'` → Exit 0; OFF_PLAN_SCRIPT; met===false
- AC-2 zero-width injection rejected: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-2'` → Exit 0; OFF_PLAN_SCRIPT
- AC-3 homoglyph rejected: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-3'` → Exit 0; OFF_PLAN_SCRIPT
- AC-4 blanket non-ASCII rejected: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-4'` → Exit 0; OFF_PLAN_SCRIPT
- AC-5 exact ASCII plan accept + FIX-24/25 still reject: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-5'` → Exit 0
- Full FIX-26 suite: `npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts` → Exit 0
- FIX-25 regression: `npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts` → Exit 0
- FIX-24 regression: `npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts` → Exit 0
- Typecheck: `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- Lint: `pnpm exec biome check tools/gate/deriveGoalState.ts convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts` → Exit 0
- Scope compliance: `git diff --name-only` → Only paths in guardrails.write_allowed

- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-26-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Owns `rejectOffPlanScripts` / command canonicalization in `tools/gate/deriveGoalState.ts`: harden FIX-25 shell-SAFE full-command equality with STRICTLY-ASCII + BYTE-EXACT comparison that rejects any non-ASCII character (Unicode whitespace, zero-width, homoglyphs, and the rest of the encoding surface), tokenizes only on ASCII whitespace (never JS `\s+`), and requires the normalized ASCII token sequence to equal the HEAD-bound plan command exactly, while preserving exact ASCII plan `literal_cmd` accept and FIX-24/FIX-25 flag/env/interpreter/metachar rejects.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (pre-fix bug reproduced — at HEAD `84a857b2`, `bash\u00A0…/step1.sh` and U+2007/U+202F/U+2028 variants return null / accepted)
- Integration coverage: PRIMARY AC is integration against real services (filesystem+git)
- Scenario un-fakeable: validate_scenario exit 0 on every behavioral AC; captured EVIDENCE shows concrete must_observe values

## DEPENDENCIES

- Depends on: REDHAT-FIX-25
- Blocks: —
- Notes: Review source: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T185814Z.md` HIGH-1 (Unicode whitespace exact-command bypass). Cycle 5 remediation — convergence-seeking FUNDAMENTAL fix to the command-authority surface (closes whole Unicode/encoding edge at once).

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md
- Command note: use `npx vitest run` not `pnpm test` (watch hang); vitest filter is `-t '<name>'`

## NOTES

- Review source: `.spec/reviews/red-hat-sprint-04-trust-pipeline-20260721T185814Z.md` HIGH-1.
- FIX-25 closed shell metachar / control / quote-IFS evasion. HIGH residual: JS `\s+` treats Unicode whitespace as separators so non-byte-identical commands normalize equal to the plan.
- Implementation guidance: fail closed on any `charCodeAt > 0x7F`; replace every plan-equality `split(/\s+/)` with ASCII-only `/[ \t\n\r]+/`; do not strip/NFKC/normalize non-ASCII to recover a plan match.
- Preserve withdrawn-run OFF_PLAN and empty literal_cmds fail-closed from FIX-22; preserve FIX-24 flag/env/interpreter rejects; preserve FIX-25 metachar rejects.
- NEVER forge human PASS / S4-T7 evidence.
- RED-first: write AC-1 failing against current accept of `bash\u00A0…/step1.sh` before implementing STRICTLY-ASCII comparison.

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-26",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "head-bound-plan-step1-bash-literal": {
      "description": "Temp git repo with HEAD-bound clean plan whose step1 literal_cmd is exactly the ASCII string `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh` (relative or absolute-canonicalizable).",
      "seed_method": "public_api",
      "records": [
        "GATE_PLAN_REL committed at HEAD with steps 1..8",
        "step1.literal_cmd == 'bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh' (ASCII only)",
        "plan loader HEAD-bound + clean (FIX-21/23)",
        "wtHash === headHash"
      ]
    },
    "repro-unicode-ws-nbsp-separator": {
      "description": "repro_cmd that keeps plan interpreter+script but uses NBSP (U+00A0) or other Unicode whitespace as the separator instead of ASCII space.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: bash\\u00A0.gate-evidence/2026-07-21T152805Z/scripts/step1.sh",
        "variants: U+2007 figure space, U+202F narrow NBSP, U+2028 line separator",
        "FIX-25 path would accept because \\s+ splits these as whitespace (bug)",
        "must be OFF_PLAN under STRICTLY-ASCII command language"
      ]
    },
    "repro-zero-width-injection": {
      "description": "repro_cmd with zero-width characters (U+200B ZWSP, U+FEFF BOM/ZWNBSP) injected into or after the plan command.",
      "seed_method": "public_api",
      "records": [
        "repro_cmd: plan command with U+200B between tokens or inside path",
        "repro_cmd: plan command with U+FEFF prefix/mid",
        "must be OFF_PLAN under STRICTLY-ASCII command language"
      ]
    },
    "repro-homoglyph-non-ascii": {
      "description": "repro_cmd that substitutes a lookalike non-ASCII character for an ASCII letter in interpreter or path.",
      "seed_method": "public_api",
      "records": [
        "e.g. Cyrillic a (U+0430) in place of Latin a in bash",
        "or full-width characters in path segments",
        "must be OFF_PLAN under STRICTLY-ASCII command language"
      ]
    },
    "repro-any-non-ascii-blanket": {
      "description": "repro_cmd containing any non-ASCII code unit outside the named whitespace/zero-width/homoglyph families while otherwise matching plan shape.",
      "seed_method": "public_api",
      "records": [
        "e.g. emoji, accented Latin, or CJK character in plan-shaped command",
        "must be OFF_PLAN — blanket non-ASCII reject"
      ]
    },
    "repro-exact-ascii-plan-full-command": {
      "description": "repro_cmd that exactly matches normalized plan step1 literal_cmd using only ASCII characters and ASCII space separators (control accept on off-plan axis).",
      "seed_method": "public_api",
      "records": [
        "repro_cmd equals plan step1.literal_cmd after same ASCII-only normalization",
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
      "description": "GIVEN HEAD-bound plan with step1 literal_cmd ASCII bash .../step1.sh WHEN repro_cmd is bash + U+00A0/U+2007/U+202F/U+2028 + plan-script THEN error.code == 'OFF_PLAN_SCRIPT' and state.met === false — not null/accepted via JS \\s+ Unicode whitespace normalization",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-1'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "normalizeFullCommand still splits on JS \\s+ and treats U+00A0/U+2007/U+202F/U+2028 as separators so the stable key equals the plan",
            "non-ASCII is silently stripped/NFKC-normalized before equality",
            "static shell returns error === null for repro-unicode-ws-nbsp-separator"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-unicode-ws-nbsp-separator",
            "action": {
              "actor": "api_client",
              "steps": [
                "Create temp repo with HEAD-bound bash step1 plan",
                "Call rejectOffPlanScripts with bash + U+00A0 + plan-script and U+2007/U+202F/U+2028 variants",
                "Capture error.code and state.met"
              ]
            },
            "end_state": {
              "must_observe": [
                "error.code == 'OFF_PLAN_SCRIPT'",
                "state.met === false",
                "error.details.reason includes 'off-plan' || error.details.script includes step1.sh || error.details.script contains non-ASCII separator"
              ],
              "must_not_observe": [
                "error === null",
                "state.met === true",
                "rejectOffPlanScripts returns null for NBSP-separator command",
                "Unicode-whitespace accepted as plan match",
                "empty off-plan rejection (Unicode accept)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan bash step1 WHEN repro_cmd injects U+200B or U+FEFF into or between plan tokens THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-2'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "zero-width characters are stripped before tokenization and remaining ASCII matches plan",
            "trim or \\s+ discards U+FEFF and accepts",
            "static shell returns null for repro-zero-width-injection"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-zero-width-injection",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound plan",
                "Call rejectOffPlanScripts with plan command containing U+200B and U+FEFF variants",
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
                "zero-width injection accepted as plan match",
                "empty off-plan rejection for U+200B / U+FEFF"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan WHEN repro_cmd substitutes a non-ASCII lookalike (Cyrillic/Latin homoglyph or full-width) in interpreter or path THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-3'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "homoglyph interpreter is NFKC-folded to ASCII bash and accepted",
            "path lookalikes are canonically decomposed to match plan path",
            "static shell always accepts any lookalike of a plan-owned .sh"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-homoglyph-non-ascii",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound bash plan",
                "Call rejectOffPlanScripts for Cyrillic-homoglyph interpreter and/or full-width path variant",
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
                "homoglyph command accepted as plan match",
                "empty off-plan rejection for homoglyph vectors"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan WHEN repro_cmd contains ANY character with code point > 0x7F (including outside named whitespace/zero-width/homoglyph matrix) THEN OFF_PLAN_SCRIPT and state.met === false",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-4'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts/deriveGoalState",
        "negative_control": {
          "would_fail_if": [
            "only a denylist of known Unicode whitespace is rejected while other non-ASCII passes",
            "allowlist is Unicode-letter-permissive",
            "static shell returns null for repro-any-non-ascii-blanket"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repro-any-non-ascii-blanket",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed HEAD-bound plan",
                "Call rejectOffPlanScripts with plan-shaped command containing non-ASCII non-whitespace (emoji or accented character)",
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
                "non-ASCII non-whitespace accepted as plan match",
                "empty off-plan rejection for blanket non-ASCII"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN HEAD-bound plan WHEN exact ASCII plan step1 full command THEN null / not OFF_PLAN_SCRIPT; WHEN FIX-24 named attacks or FIX-25 metachar suffixes THEN still OFF_PLAN_SCRIPT",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-5'",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "topology": "single-node",
        "verification_service": "filesystem+git temp repo + rejectOffPlanScripts",
        "negative_control": {
          "would_fail_if": [
            "ASCII gate is so strict it rejects the plan's own bash .../step1.sh (false positive)",
            "absolute vs relative plan paths fail equality for identical ASCII simple commands",
            "static shell always returns OFF_PLAN_SCRIPT for any .sh including exact plan match",
            "FIX-24 extra-flag / env / interpreter or FIX-25 metachar cases silently pass again"
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
                "Call rejectOffPlanScripts with FIX-24 attack vectors and FIX-25 metachar suffix",
                "Capture returns"
              ]
            },
            "end_state": {
              "must_observe": [
                "rejectOffPlanScripts(exact ASCII plan) === null",
                "rejectOffPlanScripts('bash …/step1.sh --unreviewed-flag').code == 'OFF_PLAN_SCRIPT'",
                "rejectOffPlanScripts('env FOO=attacker bash …/step1.sh').code == 'OFF_PLAN_SCRIPT'",
                "rejectOffPlanScripts('sh …/step1.sh').code == 'OFF_PLAN_SCRIPT'",
                "rejectOffPlanScripts('bash …/step1.sh;:').code == 'OFF_PLAN_SCRIPT'"
              ],
              "must_not_observe": [
                "error.code == 'OFF_PLAN_SCRIPT' for exact ASCII plan step1 full command",
                "false-positive off-plan on exact match",
                "rejectOffPlanScripts('--unreviewed-flag') === null",
                "empty off-plan rejection for FIX-24/FIX-25 vectors",
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
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT when repro_cmd is bash + NBSP + plan-step1.sh",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "state.met is false when deriveGoalState receives bash + U+00A0/U+2007/U+202F/U+2028 + plan-script",
      "maps_to_ac": "AC-1",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-1'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for U+200B and U+FEFF zero-width injection into plan command",
      "maps_to_ac": "AC-2",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-2'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for homoglyph / non-ASCII lookalike interpreter or path",
      "maps_to_ac": "AC-3",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-3'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts returns OFF_PLAN_SCRIPT for any non-ASCII character outside the named whitespace matrix",
      "maps_to_ac": "AC-4",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-4'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "rejectOffPlanScripts does not return OFF_PLAN_SCRIPT for exact normalized ASCII plan step1 full command",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts -t 'AC-5'"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "FIX-24 named attacks (extra flag, env prefix, interpreter swap) still return OFF_PLAN_SCRIPT after ASCII-strict upgrade",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-24-full-command-equality.integration.test.ts"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "FIX-25 metachar suffix attacks still return OFF_PLAN_SCRIPT after ASCII-strict upgrade",
      "maps_to_ac": "AC-5",
      "verify": "npx vitest run convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts"
    }
  ]
}
-->

</details>
