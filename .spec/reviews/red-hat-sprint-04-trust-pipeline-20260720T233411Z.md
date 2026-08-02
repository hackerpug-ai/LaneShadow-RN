# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report date:** 2026-07-20T23:34:11Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Reviewed commit:** `a39c5850f4e8e8813013f0f0d403ed16ada3b112`  
**Disposition:** `needs-revision` — do not close Sprint 04 or regard its founder/live-provider gate as passed.

## Executive Summary

`REDHAT-FIX-16` closes the prior legacy-`routeHashes` bypass: missing, empty, incomplete, and duplicate hash baselines now block `--all`, and the reviewed refreeze path requires a new explicit activation and a new verdict. Its focused live Convex-dev test passed.

`REDHAT-FIX-12` adds a writer and correctly leaves the checked-in state BLOCKED today, but it does **not** make a completion claim non-forgeable. The CLI accepts all-PASS step data and `founderVerdict: true` from an arbitrary JSON file; it accepts an absent or clean untracked bundle; and it never compares a bundle's captured commit to actual `HEAD`. A direct black-box invocation at the reviewed HEAD produced `met:true`, `GATE-GOAL: ACHIEVED`, and exit 0 with no founder record, real provider call, or valid gate evidence.

## Completion Audit / Evidence Checklist

| Requirement | Evidence inspected | Result |
|---|---|---|
| Review current requested HEAD | `git rev-parse HEAD` → `a39c5850…`; inspected `git show 9a1b9596..a39c5850` | PASS |
| Recheck prior CRITICAL FIX-12 absence | Writer, four scripts, generated state, test, and an adversarial CLI invocation inspected | **FAIL — new implementation remains forgeable** |
| Recheck prior HIGH FIX-16 legacy-manifest bypass | `couchVerdict.ts:227-272`, `couchSampleAssembler.ts:761-851`, and focused integration test inspected | PASS |
| Inspect committed diff and tests | FIX-12/FIX-16 diffs and test sources read; both focused suites run | PASS |
| Do not treat sentinels, reports, passing tests, or generated evidence as founder/live-provider proof | No such inference made; active state explicitly remains BLOCKED | PASS |
| Fresh human founder review over a real ~25-route rendered sample and three real REVIEW dispositions | `sprint-goal-state.json:33-71,90-92` records steps 3–5 and 7 as BLOCKED/pending | FAIL — external S4-T7 blocker |
| Required report written | This file | PASS |

### Commands run

```text
npx vitest run convex/__tests__/REDHATFIX12-gate-evidence-integrity.integration.test.ts
# 1 file, 5 tests passed

npx vitest run convex/__tests__/REDHAT-FIX-16-legacy-manifest-fail-closed.integration.test.ts
# 1 file, 4 tests passed

npx tsc --noEmit -p convex/tsconfig.json
# exit 0 (only npm node-linker warning)
```

Adversarial writer check (temporary files only): an eight-PASS JSON input with `founderVerdict:true` and either no `--bundle` or a clean untracked bundle caused `npx tsx tools/gate/deriveGoalState.ts` to exit 0 and write `met:true`, `GATE-GOAL: ACHIEVED`, `gate.overall:"PASS"`, and `human_test.verdict:"pass"`. No Convex query, immutable founder record, rendered route review, or provider receipt was involved.

## Human Testing Gate Pre-check

| Gate condition | Result | Evidence |
|---|---|---|
| Current state claims a pass | PASS (it does not) | `sprint-goal-state.json:3-4,11-13` is BLOCKED / `met:false`. |
| Founder/live-provider gate completed | FAIL | Steps 3–5 and 7 are BLOCKED; `human_test.verdict` is `pending` (`sprint-goal-state.json:33-71,90-92`). |
| Current state is a fresh artifact for reviewed HEAD | FAIL | Generator metadata names `da67b6e9…`, not reviewed `a39c5850…` (`sprint-goal-state.json:131-135`). |
| Gate completion derivation authenticates real human/provider evidence | FAIL | It derives PASS from caller-controlled `steps` and `founderVerdict` (`tools/gate/deriveGoalState.ts:212-244`). |

## Findings

### CRITICAL

- [ ] **CRITICAL — REDHAT-FIX-12 can manufacture a completed founder/live-provider gate from caller-controlled JSON.**
  - **Evidence:** `DeriveOptions` permits arbitrary `steps`, `headCommit`, `bundlePath`, and `founderVerdict` (`tools/gate/deriveGoalState.ts:212-218`). `deriveGoalState` sets `founderVerdict = opts.founderVerdict === true`, treats every caller-labelled `PASS` / `PASS-real` as passing, and calculates `met = allStepsPass && bundleValid && founderVerdict` (`:231-244`). The CLI reads all of this from an arbitrary `--step-results` JSON file (`:269-272,300-309`). It never resolves an authenticated Convex S4-T7 verdict, immutable route-level decisions, the real ~25-route export, or live-provider receipts.
  - **Reproduction:** At reviewed HEAD, a temporary JSON containing eight `PASS` results and `founderVerdict:true` produced exit 0 and a goal state with `met:true`, `GATE-GOAL: ACHIEVED`, overall `PASS`, and human verdict `pass`.
  - **Impact:** The exact prior CRITICAL condition is reintroduced under a different mechanism: a stale/forged evidence package can be represented as fresh PASS input and falsely unlock closeout without Founder-Operator review.
  - **Required remediation:** Remove the boolean/step-input completion authority. Resolve the S4-T7 record, route-level decisions, active manifest hash, committed evidence manifests, and provider receipts from authenticated durable sources; require exact binding to actual `HEAD` and derive all results from those records. A human assertion must be cryptographically/operationally attributable to the authorized Founder-Operator, not a JSON flag.

### HIGH

- [ ] **HIGH — `validateBundle` does not enforce either required freshness or a required bundle.**
  - **Evidence:** A missing bundle directory returns `{ ok: true }` (`tools/gate/deriveGoalState.ts:122-130`); `deriveGoalState` only calls validation when a caller supplies `bundlePath` (`:224-229`). The validator scans script text for two literals and then returns `{ ok:true }` (`:147-181`). Although `gitLastCommit` is calculated for an error payload (`:158,175`), there is no comparison of a captured commit with the actual repository `HEAD`; `--head-commit` itself is caller-controlled (`:220-222,300-309`).
  - **Reproduction:** A clean untracked bundle containing only `scripts/step4.sh` plus the same all-PASS/`founderVerdict:true` input exited 0 and wrote PASS. Therefore a bundle with no captured git commit is accepted.
  - **Impact:** The stated FIX-12 requirement — captured commit must equal current HEAD and stale bundles must fail closed — is not implemented. The passing AC-2 test only trips the old bundle's forbidden seam string before it would need a genuine freshness check.
  - **Required remediation:** Make a signed/committed evidence manifest mandatory for every successful write; verify its immutable commit against `git rev-parse HEAD` (do not accept a CLI-supplied SHA), enumerate required step artifacts, and reject missing/untracked/empty/clean-but-stale bundles. Add negative tests for missing bundle, clean stale bundle, user-supplied bogus `--head-commit`, and altered step-results JSON.

### MEDIUM

- [ ] **MEDIUM — The checked-in blocked state is generated from the parent commit, not current HEAD, so it is not fresh attestation for this review.**
  - **Evidence:** Current HEAD is `a39c5850…`, while `generator.head_commit` is `da67b6e9…` (`sprint-goal-state.json:131-135`), and the source input is an ephemeral `/tmp/sprint04-honest-steps.json` (`:133`). Its output is fortunately BLOCKED (`:3-13`), so this is not a current false unlock.
  - **Impact:** The current sentinel remains useful as an honest blocked status but cannot substantiate current-code gate provenance. It should not be used to close the sprint.
  - **Required remediation:** Regenerate only through a hardened writer after the evidence-manifest fix; retain a repository-relative, immutable input manifest and record the actual HEAD internally.

### LOW

No independent LOW-severity code defect was substantiated. Specialist panel dispatch was attempted but unavailable because the configured reviewer model `local-router/implementer` is not installed; this report therefore does not claim multi-agent consensus.

## Recheck of Prior CRITICAL / HIGH Findings

| Prior finding | Status at `a39c5850` | Current evidence |
|---|---|---|
| Stale/forged human gate could be used as completion proof; FIX-12 required a machine-derived anti-forgery writer | **NOT FIXED — CRITICAL re-opened** | The writer exists, but its completion predicate trusts arbitrary `steps` and `founderVerdict` and bundle validation is optional/incomplete. See CRITICAL/HIGH findings. |
| Legacy frozen manifest with absent `routeHashes` bypassed revalidation | **FIXED (focused runtime-tested)** | Fail-closed complete-baseline check is before the drift loop (`convex/couchVerdict.ts:227-272`). Operator-only refreeze writes a new manifest without activation/verdict inheritance (`convex/couchSampleAssembler.ts:761-851`). The 4-test FIX-16 suite passed, including empty and duplicate baselines, `COUCH_GATE_BLOCKED`, refreeze/no-inherited-PASS, and a healthy complete baseline. |
| Provider-costing operations lacked operator authorization | **Previously fixed; not re-opened** | Not changed by the reviewed diff; no contrary path found in this review. |
| Active-manifest rotation lacked explicit operator transition | **Previously fixed; not re-opened** | FIX-16 continues to require later explicit activation; `refreezeCouchManifest` does not write an activation (`convex/couchSampleAssembler.ts:755-759,821-850`). |
| New hashed-manifest geometry drift did not invalidate PASS | **Previously fixed for complete baselines; not re-opened** | Complete baseline is checked then each current geometry hash is recomputed and compared (`convex/couchVerdict.ts:253-272`). |

## Test-Quality Notes

The 9 focused tests provide meaningful evidence for the FIX-16 database behavior and for narrow FIX-12 script authorization behavior. They are not evidence of the human S4-T7 review, a real 25-route catalog, map rendering inspection, real-provider success, or a safe completion predicate.

In particular, the FIX-12 suite tests a forged bundle that contains the forbidden seam, but does not test that a clean stale/missing/untracked bundle is rejected, that a JSON `founderVerdict:true` cannot close the gate, or that CLI `--head-commit` cannot be forged. The demonstrated passing exploit is outside its assertions.

## Recommendations

1. Treat Sprint 04 as **blocked**. Do not run `--all` based on this gate writer or use its generated state for closeout.
2. Redesign FIX-12 around authenticated, immutable evidence rather than caller input; add adversarial tests for all bypasses above.
3. Re-run FIX-12 and FIX-16 focused tests, then a fresh red-hat review after remediation.
4. Separately complete S4-T7 only with a genuine Founder-Operator inspection of a real stratified ~25-route rendered sample, route-level `true/off/wrong` decisions, a valid bound verdict, and three real REVIEW dispositions. Neither this report nor any test output substitutes for that gate.

## Metadata

- **Severity result:** 1 CRITICAL, 1 HIGH, 1 MEDIUM, 0 LOW findings.
- **Confidence:** High for all findings: direct source inspection plus executable black-box reproduction; FIX-16 closure is confirmed by source and focused live Convex-dev tests.
- **Review mode:** Read-only source, committed-diff, test, and gate-artifact audit. No application source was changed.
