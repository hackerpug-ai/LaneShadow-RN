# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report date:** 2026-07-21T18:58:14Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Scope:** FIX-25 shell-command authority, regression review of FIX-17…24, and the next off-plan command-authority seam.  
**Verdict:** **needs-revision**

## Executive Summary

FIX-25 correctly rejects the requested ASCII shell-metacharacter, control-character, IFS, quote, and escaped variants; the exact committed plan command remains accepted. All focused FIX-17…25 regression suites passed (43 tests), and source inspection supports the intended couch/plan authority properties.

However, the control plane is **not severity-CLEAN of CRITICAL/HIGH**. `normalizeFullCommand()` uses JavaScript `\s+`, which treats several Unicode whitespace code points as argument separators even though Bash does not. As a result, `bash<U+00A0><plan-script>` (and U+2007/U+202F/U+2028 variants) is accepted as an exact plan command by `rejectOffPlanScripts`, despite not being byte-identical to the plan and failing as a shell command. This violates FIX-25's “ONLY exact plan command” contract and permits a forged/non-executable `repro_cmd` to pass the command-authority check.

The Founder-Operator S4-T7 gate remains **externally BLOCKED and is not a code finding**.

## Severity Verdict

| Severity | Count | Verdict |
|---|---:|---|
| CRITICAL | 0 | None found in the reviewed scope |
| HIGH | 1 | Unicode-whitespace exact-command bypass (HIGH-1) |
| MEDIUM | 0 | None found in the reviewed scope |
| LOW | 0 | None reported |

**Control-plane resolution:** **NO — not severity-CLEAN of CRITICAL/HIGH.**

## HIGH Findings

### HIGH-1 — Unicode whitespace is normalized to ASCII argument separation and accepted as a plan command

**Evidence**

- `tools/gate/deriveGoalState.ts:434` forbids only a selected ASCII set; it does not prohibit Unicode whitespace.
- `tools/gate/deriveGoalState.ts:547` tokenizes with `text.trim().split(/\s+/)`. In JavaScript, `\s` includes U+00A0 (NBSP), U+2007 (figure space), U+202F (narrow NBSP), and U+2028 (line separator).
- `tools/gate/deriveGoalState.ts:728-747` compares the resulting normalized key, not the raw command bytes, against the plan key.

**Reproduction against current HEAD (`84a857b2`)**

```text
rejectOffPlanScripts([{ n: 1, result: 'PASS', repro_cmd: `bash<U+00A0>${planStep1}` }], …)
→ null / accepted

U+00A0 NBSP          accepted=true, normalizeEquals=true
U+2007 FIGURE SPACE  accepted=true, normalizeEquals=true
U+202F NARROW NBSP   accepted=true, normalizeEquals=true
U+2028 LINE SEPARATOR accepted=true, normalizeEquals=true
```

In contrast, invoking those text values with Bash returns exit 127: Bash treats the Unicode character as part of the command name (for example `bash .spec/...`), not as the ASCII separator that the verifier accepted.

**Impact**

This is not OS command execution through the verifier—the verifier does not execute `repro_cmd`. It is nevertheless a trust/evidence integrity breach: a non-plan, non-executable command text is attested as the canonical plan command. That directly contradicts FIX-25's strict “declared interpreter + script path + declared args — nothing more, nothing less” authority contract.

**Required remediation**

Fail closed before normalization unless the entire command is in a narrowly defined ASCII simple-command grammar, including ASCII space (`U+0020`) as the only allowed separator. Add integration negatives for U+00A0, U+2007, U+202F, and U+2028 both between `bash` and the path and in/after the path. Raw-byte equality after canonical absolute/relative path resolution is another defensible design, but must not treat Unicode whitespace as an ASCII separator.

## FIX-25 Vector Matrix

All values below were exercised through `rejectOffPlanScripts` against the current, HEAD-bound project plan. “Rejected” means `OFF_PLAN_SCRIPT`; acceptance was checked with the exact plan step-1 literal command.

| Vector | Result |
|---|---|
| `;` suffix | Rejected |
| `&&` suffix | Rejected |
| `||` suffix | Rejected |
| `|` suffix | Rejected |
| backtick substitution | Rejected |
| `$()` substitution | Rejected |
| `>` redirect | Rejected |
| `<` redirect | Rejected |
| LF newline | Rejected |
| tab | Rejected |
| `$IFS` / `${IFS}` separator evasion | Rejected |
| single-quoted path | Rejected |
| double-quoted path | Rejected |
| escaped semicolon | Rejected |
| full-width semicolon / dollar and zero-width-space variants | Rejected |
| **Unicode whitespace as separator (NBSP/U+2007/U+202F/U+2028)** | **Accepted — HIGH-1** |
| Exact committed plan command | Accepted (expected control) |

The existing FIX-25 suite independently covers the ASCII metacharacter families and its exact-plan control: `convex/__tests__/REDHAT-FIX-25-shell-safe-command-equality.integration.test.ts:144-278`.

## Regression Checklist: FIX-17…24

| Fix | Requirement checked | Evidence | Result |
|---|---|---|---|
| 17 | Latest bound fail revokes prior pass | `couchVerdict.ts:284-328`; focused integration suite | PASS |
| 18 | Canonical 1..8 completeness and identity | `deriveGoalState.ts:272-368`; focused integration suite | PASS |
| 19 | Non-empty strict manifest/catalog bindings | `couchVerdict.ts:288-305`, `resolveFounderVerdict.ts:115-163`; focused suite | PASS |
| 20 | Honest plan control surface; stale/off-plan rejection | focused integration suite | PASS |
| 21 | Immutable HEAD blob plan; dirty working-tree rejection | `verifyEvidenceManifest.ts:142-195`; focused suite | PASS |
| 22 | Exact script rather than allowed-directory match | focused integration suite | PASS |
| 23 | Clean last-touch-behind HEAD works; dirty remains blocked | `verifyEvidenceManifest.ts:149-195`; focused suite | PASS |
| 24 | Exact normalized interpreter/script/args; flags/env/interpreter swaps reject | `deriveGoalState.ts:518-614,728-747`; focused suite | PASS, subject to HIGH-1 Unicode normalization seam |

### Verification run

```text
npx vitest run REDHAT-FIX-{17..25} integration files --maxWorkers=1 --minWorkers=1
→ 9 files passed, 43 tests passed, exit 0 (88.05s)

npx tsc --noEmit -p convex/tsconfig.json
→ exit 0

pnpm exec biome check [reviewed source + FIX-17…25 test files]
→ Checked 13 files; no fixes applied; exit 0
```

## Human Gate Status (external, not a finding)

`sprint-goal-state.json:3-4,29-66,83-85` records `GATE-GOAL: BLOCKED`, `met:false`, and steps 3/4/5/7 as pending genuine Founder-Operator action. This is correct and remains outside this code review's remediation scope. No human PASS was inferred or manufactured.

## Prompt-to-Artifact Completion Audit

| Requested item | Evidence | Status |
|---|---|---|
| Reproduce `;`, `&&`, `||`, `|`, backticks, `$()`, `<`/`>`, LF | Direct current-HEAD `rejectOffPlanScripts` matrix; FIX-25 suite | Complete: rejected |
| IFS / quote evasion | Direct `$IFS`, `${IFS}`, quote, backslash probes; FIX-25 AC-4 | Complete: rejected |
| Unicode evasion | Direct U+00A0/U+2007/U+202F/U+2028/U+200B/full-width probes | **Incomplete: four separator variants accepted** |
| Exact plan command accepted | Direct current-HEAD probe and FIX-25 AC-5 | Complete |
| FIX-17…24 regressions | Nine focused suites and source review | Complete: green, with FIX-24 constrained by HIGH-1 |
| Hunt next off-plan authority seam | Unicode normalization finding above | Complete: HIGH-1 found |
| S4-T7 disposition | `sprint-goal-state.json` external BLOCKED evidence | Correctly external/unresolved |
| Fresh report | This file | Complete |

## Recommended Next Step

Create a follow-up remediation for HIGH-1 that makes the accepted command language ASCII-only/simple-command-only, with explicit Unicode whitespace tests. Re-run the exact 9-suite command and the expanded Unicode matrix after implementation. Do not mark the trust/couch gate control plane clean until those variants return `OFF_PLAN_SCRIPT` and the exact ASCII plan command remains the only accepted representation.
