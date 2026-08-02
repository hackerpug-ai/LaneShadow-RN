# Red-Hat Review Report — Sprint 04 Trust Pipeline

**Report Date:** 2026-07-21T17:56:07Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Scope:** Independent re-review of FIX-17 through FIX-22, with explicit adversarial reproductions for the canonical plan and off-plan command boundaries.

## Severity Verdict: NEEDS REVISION

**No CRITICAL finding.** FIX-21 does make the *plan content authority* immutable and HEAD-bound: a dirty one-step working-tree plan was rejected with `PLAN_NOT_HEAD_BOUND`. However, two HIGH findings prevent acceptance: FIX-22 does not match the command exactly, and the newly strict plan freshness check makes the current canonical plan unusable at `HEAD` (and breaks the focused FIX-18 suite). The S4-T7 Founder-Operator review remains a correctly external, unresolved human blocker and is **not** a code finding.

## Verification Matrix

| Surface / requirement | Verdict | Evidence |
|---|---|---|
| FIX-17 latest bound `fail` revokes prior `pass` | PASS | Live Convex suite: `REDHAT-FIX-17-*.integration.test.ts`, 4/4 passed. `couchGateStatus` selects the newest strictly bound verdict at `convex/couchVerdict.ts:284-305`; `runAllWaterfall` blocks when `allowed` is false at `:657-665`. |
| FIX-18 canonical 1..8 completeness | PARTIAL / regression | The implementation has identity/completeness checks, but `REDHAT-FIX-18-*.integration.test.ts` failed 3/5 because its plan loader returns `PLAN_STALE`, rather than reaching the asserted completeness/identity verdict. See HIGH-2 and MEDIUM-1. |
| FIX-19 strict manifest/catalog binding | PASS | Live Convex suite: `REDHAT-FIX-19-*.integration.test.ts`, 4/4 passed. Strict non-empty equality is at `convex/couchVerdict.ts:291-305`; founder attestation also fails closed at `tools/gate/resolveFounderVerdict.ts:114-163`. |
| FIX-20 honest plan rebinding and blocked human steps | PASS | `REDHAT-FIX-20-*.integration.test.ts`, 6/6 passed. All eight plan commands target `2026-07-21T152805Z`; honest steps 3/4/5/7 are still `BLOCKED`. |
| FIX-21 no working-tree plan authority | PASS, with availability defect | `REDHAT-FIX-21-*.integration.test.ts`, 5/5 passed. Direct reproduction: dirty working-tree one-step plan pointing at withdrawn run + stale bundle exited 1 with `PLAN_NOT_HEAD_BOUND` / `dirty_working_tree`. Source reads authoritative bytes using `git show HEAD` at `tools/gate/verifyEvidenceManifest.ts:145-210`; no production `readFileSync(gate-plan.json)` remains. |
| FIX-22 substitute script under allowed run rejected | PASS | `REDHAT-FIX-22-*.integration.test.ts`, 4/4 passed: `not-in-gate-plan.sh` is rejected and malformed plans fail closed. |
| FIX-22 **exact command** equality | FAIL | Independent black-box temp-repo reproduction: both `bash .../step1.sh --unreviewed-flag` and `env FOO=attacker bash .../step1.sh` returned `null` (accepted) against a plan containing only `bash .../step1.sh`. See HIGH-1. |
| Current clean checkout derives only the human block | FAIL | At current `HEAD` `91a05d9f`, clean `deriveGoalState` exits 1 with `PLAN_STALE`: plan touch `1082ca7d` != HEAD. It does not reach S4-T7 evaluation. See HIGH-2. |
| Targeted static validation | PASS | Scoped Biome check passed; `npx tsc --noEmit -p convex/tsconfig.json` passed. |

## HIGH Findings

### HIGH-1 — FIX-22 accepts changed executable command text when the `.sh` suffix is plan-owned

`rejectOffPlanScripts` claims to enforce exact command/script matching, but it canonicalizes only the script path. `canonicalizeScriptPath` extracts any `\S+\.sh` substring; the caller then compares that path key, not the full command. Consequently, arbitrary shell prefixes and post-script arguments preserve the accepted script key.

- **Location:** `tools/gate/deriveGoalState.ts:491-549`, especially `:493-496` and `:531-548`.
- **Reproduction:** In a fresh temporary git repository with the sole plan command `bash .gate-evidence/2026-07-21T152805Z/scripts/step1.sh`, all of these results were `null` (accepted):
  - exact command: `bash .../step1.sh`
  - changed command: `bash .../step1.sh --unreviewed-flag`
  - changed command environment: `env FOO=attacker bash .../step1.sh`
- **Impact:** The recorded `repro_cmd` is not an exact attestation of the HEAD-bound planned command. A caller can attach unreviewed arguments or environment behavior while retaining the approved script filename.
- **Required remediation:** Normalize and compare the **entire parsed command** (executable, arguments, and script path) to the corresponding plan-owned `literal_cmd`, or reject any non-identical normalized command. Add negative tests for both an extra argument and an environment/executable prefix.

### HIGH-2 — The plan freshness rule currently disables the canonical gate at main HEAD

FIX-21 correctly rejects dirty plans, but it additionally requires the plan file's *last-touch commit* to equal the repository HEAD (`PLAN_STALE`). The plan was last changed in `1082ca7d`, while current HEAD is `91a05d9f` after FIX-21/22. Thus every clean current invocation blocks before it can evaluate canonical steps, evidence, or S4-T7.

- **Location:** `tools/gate/verifyEvidenceManifest.ts:180-205`; propagated by `deriveGoalState` at `tools/gate/deriveGoalState.ts:645-664` and evidence verification at `verifyEvidenceManifest.ts:459-480`.
- **Direct evidence:** A clean current invocation with all eight plan-owned commands and the honest bundle returned:
  ```json
  {"ok":false,"code":"PLAN_STALE","details":{"reason":"file_not_at_head","capturedCommit":"1082ca7d...","headCommit":"91a05d9f..."}}
  ```
- **Impact:** This is fail-closed (not an unsafe unlock), but the gate is not operationally verifiable at current main. It also means the machine state is blocked by a code-control-plane defect in addition to the external S4-T7 gate.
- **Required remediation:** Either re-attest/rewrite the plan in the same current commit as its intended evidence/control surface, or change the freshness contract to bind the plan blob to HEAD without requiring an unrelated subsequent commit to touch the unchanged plan. The policy must retain dirty working-tree rejection.

## MEDIUM Findings

### MEDIUM-1 — FIX-18’s focused suite is red and masks its own requested verdicts

`npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts --maxWorkers=1 --minWorkers=1` produced **3 failures of 5 tests**. Its helper commits the plan, then commits the evidence bundle separately; the latter advances HEAD and makes the unchanged plan stale. AC-1 and AC-2 therefore receive `PLAN_STALE` instead of the expected `INCOMPLETE_CANONICAL_STEPS` / `INVALID_STEP_IDENTITY`; AC-4 accepts a failure but asserts the error reason must name incompleteness and fails.

- **Location:** test fixture commit ordering at `convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts:56-104`; stale policy at `tools/gate/verifyEvidenceManifest.ts:180-205`.
- **Impact:** The focused regression suite cannot prove the FIX-18 contract under the current policy. AC-3 passes only because it merely asserts the error is not an incomplete/identity error; it can pass while `PLAN_STALE` prevents the intended path.
- **Required remediation:** Make each fixture's plan and evidence satisfy the chosen freshness contract in one final commit, and make AC-3 explicitly reject unexpected `PLAN_*` failures.

## LOW Findings / Next Seam

### LOW-1 — Append-only verdict lookup remains unbounded in the authorization decision

`couchGateStatus` calls `.collect()` on all verdicts for an active sample, then sorts them in memory (`convex/couchVerdict.ts:295-305`). Because verdicts are append-only, a frequently reviewed sample can eventually hit query/resource limits and fail closed. This is an availability seam, not an unlock bypass, and was previously identified as non-blocking.

**Recommendation:** add an index/order compatible with newest verdict lookup and fetch only the authoritative newest bound row(s), retaining strict binding and revocation semantics.

## Resolved / Reconfirmed Controls

- **Immutable canonical-plan authority:** confirmed. `gitShowHead` supplies plan content; dirty-plan mutation is rejected before step completeness or off-plan logic can trust it.
- **Latest verdict revocation (FIX-17):** confirmed with live `pass → fail` and `COUCH_GATE_BLOCKED` tests.
- **Strict bindings (FIX-19):** confirmed with live missing-hash and missing-catalog-version negatives.
- **Honest run rebind (FIX-20):** confirmed. The plan no longer references the withdrawn `2026-07-19T22:59:46Z` control surface.
- **Exact script *path* match:** confirmed. A different script in the allowed timestamped run is rejected; the remaining HIGH issue is command-text exactness, not path equality.
- **Founder resolver:** remains fail-closed on missing/unequal bindings and non-allowed status (`tools/gate/resolveFounderVerdict.ts:101-170,239-249`).

## Human Gate Status (Informational — not a code finding)

The honest evidence and `sprint-goal-state.json` retain steps **3, 4, 5, and 7** as `BLOCKED`, with `human_test.verdict: "pending"`. That accurately reflects the external S4-T7 Founder-Operator visual review and REVIEW-queue disposition work. No PASS was synthesized. The stale-plan defect above is separate: it currently prevents a fresh writer from reaching and reporting that otherwise correct human-owned blocker.

## Commands Run

```bash
# Filesystem/git control-plane suites
npx vitest run \
  convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts \
  convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts \
  convex/__tests__/REDHAT-FIX-21-head-bound-gate-plan.integration.test.ts \
  convex/__tests__/REDHAT-FIX-22-exact-plan-script-match.integration.test.ts \
  --maxWorkers=1 --minWorkers=1
# Result: FIX-20/21/22 passed; FIX-18 3/5 failed as documented.

# Live Convex control-plane suites
npx vitest run \
  convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts \
  convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts \
  --maxWorkers=1 --minWorkers=1
# Result: 8/8 passed.

pnpm exec biome check [targeted files]
npx tsc --noEmit -p convex/tsconfig.json
# Result: both passed.
```

## Next Steps

1. Fix HIGH-1 with true normalized full-command equality, plus new adversarial argument/environment-prefix tests.
2. Resolve HIGH-2 by reattesting plan freshness at current HEAD or by changing the freshness model without restoring a working-tree authority seam.
3. Repair the FIX-18 fixtures/assertions and rerun all FIX-17 through FIX-22 suites serially.
4. Only after code findings are closed, proceed with the external S4-T7 Founder-Operator review.
