# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report date:** 2026-07-21T19:26:18Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Reviewed HEAD:** `41eca15c9ef9c1f513149a4af32dea7ba362b935`  
**Scope:** Fresh independent convergence re-review of REDHAT-FIX-26, regression verification of REDHAT-FIX-17…25, and command-authority bypass hunting.  
**Verdict:** **needs-revision**

## Executive Summary

FIX-26 correctly closes the *named* Unicode separator, zero-width, homoglyph-interpreter, and arbitrary-suffix cases. The focused FIX-17…26 integration suite passes (48 tests), TypeScript and scoped Biome checks pass, and the real S4-T7 human gate is honestly still `BLOCKED`.

However, FIX-26 does **not** implement its stated unconditional rule that *any non-ASCII character in the executed command* must be `OFF_PLAN_SCRIPT`. Its rejection is conditional on recognition heuristics that themselves require exact ASCII substrings such as `.gate-evidence` and `.sh`. A single non-ASCII character in either marker makes all enforcement predicates false, so the untrusted command is accepted (`null`). This is a HIGH command-authority/evidence-integrity bypass.

## Severity Verdict

| Severity | Count | Verdict |
|---|---:|---|
| CRITICAL | 0 | None found in reviewed scope |
| HIGH | 1 | Unicode-obfuscated marker bypass of FIX-26 |
| MEDIUM | 0 | None reported |
| LOW | 0 | None reported |

**Trust/couch gate control plane severity-CLEAN of CRITICAL/HIGH?** **NO.** HIGH-1 remains open.

## AC Verdict Table — REDHAT-FIX-26

| AC | Verdict | Evidence | Notes |
|---|---|---|---|
| AC-1 Unicode whitespace separators | PASS | `REDHAT-FIX-26-*.test.ts:164-188`; direct current-HEAD matrix rejected U+00A0/U+2007/U+202F/U+2028 | The known separator seam is closed when the rest of the marker remains ASCII-recognizable. |
| AC-2 zero-width injection | PARTIAL | Test `:195-218` passes; direct matrix rejects ZWSP in `step1` and FEFF prefix, but accepts ZWSP inside `.gate-evidence` marker | The blanket command-language promise is not met. |
| AC-3 homoglyph/non-ASCII lookalike | PARTIAL | Test `:225-242` passes for Cyrillic `а` in `bash` and full-width slash after an intact marker; direct matrix accepts Cyrillic `е` in `.gate-evidence`/`evidence` and Cyrillic `һ` in `.sh` | Marker-obfuscation variants are uncovered and fail open. |
| AC-4 any non-ASCII | FAIL | `deriveGoalState.ts:778-797`; direct current-HEAD probes below return `null` | Non-ASCII rejection is guarded by `namesGateEvidenceScript`, not unconditional. |
| AC-5 exact ASCII control and FIX-24/25 regressions | PASS | `REDHAT-FIX-26-*.test.ts:268-300`; focused suites green | Exact plan command returns `null`; flags, env prefix, interpreter swap, and metachar suffixes reject. |

**Completion gate:** `needs-revision` — AC-2/3 are partial and AC-4 fails.

## HIGH Findings

### HIGH-1 — Unicode can blind the command-recognition predicates and bypass all FIX-26 enforcement

**Evidence**

- The claimed strict-ASCII predicate itself works: `isStrictAscii()` returns false for code units above `0x7F` at `tools/gate/deriveGoalState.ts:447-452`, and normalization rejects them at `:585-593`.
- But the only enforcement call is conditional: `!isStrictAscii(text) && namesGateEvidenceScript(text)` at `:778-797`.
- `namesGateEvidenceScript()` first uses the strict ASCII regexp at `:467-471`; its fallback requires literal ASCII `.gate-evidence` **and** `.sh` substrings at `:479-485`.
- `canonicalizeScriptPath()` returns `null` for non-ASCII text at `:504-507`, so `isTimestampShapedScriptPath()` is false at `:543-548`.
- Consequently a Unicode alteration to any recognition marker skips the non-ASCII check and then skips the exact-full-command check at `:799-817`.

**Direct reproduction at reviewed HEAD**

The following read-only probe loaded the real HEAD-bound plan command and called the production export `rejectOffPlanScripts([{ n: 1, result: 'PASS', repro_cmd }], undefined, cwd, HEAD)`:

```text
ASCII exact control                         -> null (expected)
NBSP/U+00A0 separator                       -> OFF_PLAN_SCRIPT
U+2007/U+202F/U+2028 separators             -> OFF_PLAN_SCRIPT
ZWSP in step filename                       -> OFF_PLAN_SCRIPT
FEFF prefix                                 -> OFF_PLAN_SCRIPT
Cyrillic а in `bash`                        -> OFF_PLAN_SCRIPT
emoji suffix                                -> OFF_PLAN_SCRIPT

Cyrillic е in `.gatе-evidence`              -> null  (BYPASS)
Cyrillic е in `.gate-evidеnce`              -> null  (BYPASS)
Cyrillic һ in `.sһ`                         -> null  (BYPASS)
ZWSP in `.gate-\u200bevidence`              -> null  (BYPASS)
full-width dot before `．gate-evidence`      -> null  (BYPASS)
full-width slash before marker `／gate...`   -> null  (BYPASS)
```

The successful published test only exercises a full-width slash *after* an otherwise literal `.gate-evidence` marker (`convex/__tests__/REDHAT-FIX-26-strict-ascii-byte-exact-command.integration.test.ts:235-241`), which is why it does not expose the bypass.

**Impact**

`repro_cmd` is attestation input; the verifier does not execute it. An attacker can therefore attach a visually plausible but non-plan/non-executable command to a PASS step, evade `OFF_PLAN_SCRIPT`, and rely on the remaining evidence path. This contradicts the task's mandatory contract that **any** non-ASCII code unit in an executed/repro command fails closed, and it reopens command-authority evidence laundering.

**Required remediation**

Before run-ID extraction, marker recognition, path canonicalization, or command normalization, apply an unconditional fail-closed rule to every command-bearing `StepResult.repro_cmd` (and to command-bearing bundle fields if any):

```ts
if (!isStrictAscii(text)) return offPlanScript(...)
```

Do not use a marker-detection predicate as a precondition. Preserve synthetic harness behavior only for **ASCII** paths. Add integration negatives mutating each recognizer boundary: `.gate-evidence`, `evidence`, `.sh`, the slash/dot immediately preceding the marker, `scripts`, timestamp separators/digits, and a ZWSP in each. Every one must produce `OFF_PLAN_SCRIPT` and `state.met === false`.

## Regression Checklist — REDHAT-FIX-17…25

| Fix | Verified property | Evidence | Result |
|---|---|---|---|
| 17 | Latest bound `fail` revokes prior `pass` | focused integration suite | PASS |
| 18 | Canonical 1..8 completeness / identity | focused integration suite | PASS |
| 19 | Non-empty strict manifest/catalog bindings | focused integration suite | PASS |
| 20 | Honest plan surface; stale scripts reject | focused integration suite | PASS |
| 21 | HEAD-blob plan authority; dirty plan rejects | focused integration suite | PASS |
| 22 | Exact script binding, not run-directory allow-list | focused integration suite | PASS |
| 23 | Current HEAD may use committed plan whose last-touch precedes HEAD | focused integration suite | PASS |
| 24 | Extra flags, env prefix, and interpreter swap reject | focused integration suite and FIX-26 AC-5 | PASS |
| 25 | Metacharacter/control/quote/IFS vectors reject | focused integration suite and FIX-26 AC-5 | PASS |

The FIX-24/25 results remain valid for their tested ASCII command grammar. They do not clear HIGH-1 because the Unicode marker mutation prevents those checks from being reached.

## Verification Evidence

```text
npx vitest run convex/__tests__/REDHAT-FIX-{17,18,19,20,21,22,23,24,25,26}-*.integration.test.ts --maxWorkers=1 --minWorkers=1
=> 10 test files passed, 48 tests passed, exit 0 (87.10s)

npx tsc --noEmit -p convex/tsconfig.json
=> exit 0

pnpm exec biome check tools/gate/deriveGoalState.ts convex/__tests__/REDHAT-FIX-{17,18,19,20,21,22,23,24,25,26}-*.integration.test.ts
=> Checked 11 files; no fixes applied; exit 0

[FIX-26 requirement contract] validate_scenario
=> { "ok": true, "scenario_count": 5, "violations": [] }
```

These are useful regression signals, but they do not cover Unicode changes to the detector's own ASCII markers; therefore they cannot establish FIX-26 closure.

## Human Testing Gate — External / Correctly Blocked

This is **not a code finding**. `sprint-goal-state.json:3-4,29-74,79-85` records `met:false`, `GATE-GOAL: BLOCKED`, and pending Founder-Operator S4-T7 steps 3/4/5/7. No human PASS was inferred or manufactured.

## Prompt-to-Artifact Completion Audit

| Requested deliverable | Evidence | Status |
|---|---|---|
| Review current HEAD `41eca15c` | `git rev-parse HEAD` and `git show` | Complete |
| Reproduce U+00A0/U+2007/U+202F/U+2028 | Direct production-export matrix + FIX-26 AC-1 | Complete: rejected |
| Reproduce U+200B/U+FEFF | Direct matrix + FIX-26 AC-2 | Complete: normal named-path variants reject; marker-mutated ZWSP bypass found |
| Reproduce Cyrillic/Latin homoglyphs | Direct matrix + FIX-26 AC-3 | Complete: interpreter variant rejects; marker/extension variants bypass |
| Test arbitrary non-ASCII | Direct emoji control rejects; marker-obfuscated non-ASCII inputs accept | Complete: blanket claim disproved |
| Confirm exact plan control | Direct production-export matrix + AC-5 | Complete: accepted |
| Reconfirm FIX-17…25 | 10 focused integration files / 48 tests | Complete: green for their tested properties |
| Hunt a new seam | HIGH-1 direct production reproduction | Complete: found |
| Assess human gate accurately | `sprint-goal-state.json` | Complete: external BLOCKED, not a code finding |
| Fresh red-hat report | This file | Complete |

## Recommendations

1. Create a targeted remediation for HIGH-1: unconditional ASCII rejection over every untrusted `repro_cmd` before any recognition heuristic.
2. Add the marker-obfuscation matrix listed above to the integration test, including a `deriveGoalState` assertion of `OFF_PLAN_SCRIPT`/`met:false` for each.
3. Re-run the same FIX-17…26 command, TypeScript, and Biome checks after remediation.
4. Keep S4-T7 as an honest external human blocker; do not use this code remediation to claim the couch gate passed.

## Metadata

- **Review mode:** independent, read-only, adversarial.
- **Specialist dispatch:** attempted for `convex-reviewer`, `security-auditor`, and a generic reviewer; all were unavailable because the configured local model was missing or the provider connection failed. Findings above are independently reproduced from production exports and source, not delegated assertions.
- **Confidence:** HIGH — direct current-HEAD reproduction, clear fail-open control flow, and an explicit contradiction of FIX-26 AC-4.
