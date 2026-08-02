Turn budget wrap-up was requested after 8 assistant turns (soft limit 8, grace 2). Process-mode live steering is unavailable, so the child was warned at launch to wrap up by this budget. Output may be partial.

## Test-Reality Review: REDHAT-FIX-27

**Verdict**: APPROVED  
**Probe coverage**: 5 of 5 behavioral ACs probed  
**Tree clean at exit**: not clean; pre-existing unrelated orchestration/generated-file changes remained. No audit edits were made.

### Oracle Verdicts
| AC | Test(s) | Mutants | Killed | Verdict |
|---|---|---:|---:|---|
| AC-1 Cyrillic `е` markers | `convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts:173` | 2 | 2 | ✅ strong |
| AC-2 Cyrillic `һ` / path | same:207 | 2 | 2 | ✅ strong |
| AC-3 ZWSP/full-width markers | same:240 | 2 | 2 | ✅ strong |
| AC-4 arbitrary non-ASCII/args | same:287 | 2 | 2 | ✅ strong |
| AC-5 exact ASCII uniqueness/regressions | same:321 | 2 | 2 | ✅ strong |

### Findings
No new CRITICAL oracle, fixture, or negative-control finding.

- Tests use real temporary filesystem/git repositories with committed HEAD-bound plans, not mocks.
- Every specified obfuscation vector is asserted through both `rejectOffPlanScripts` and `deriveGoalState`, including raw `details.script` preservation.
- Exact ASCII acceptance is controlled, while extra flags, env/interpreter changes, shell metacharacters, NBSP, and arbitrary normalized commands are rejected.

### Residual Risks
- Batch-running FIX-17..26 in one Vitest invocation produced two FIX-17 failures at `convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts:208,324`; FIX-17 passed when rerun alone. This indicates a possible cross-file/shared-state isolation issue, but is not a false-green oracle finding for FIX-27.
- S4-T7 human BLOCKED was not treated as a defect.

### Probe Log
- `./node_modules/.bin/vitest run convex/__tests__/REDHAT-FIX-27-unconditional-non-ascii-reject.integration.test.ts` → exit 0.
- M1 restored conditional marker gating → exit 1; all AC-1..5 failed.
- M2 made `isStrictAscii` always true → exit 1; all AC-1..5 failed.
- M3 inverted command equality, rejecting exact plan → `-t AC-5` exit 1.
- M4 accepted any normalized command → `-t AC-5` exit 1 on extra flag.
- FIX-17 standalone → exit 0; FIX-18..26 passed in batch, while FIX-17 had the noted batch-only failures.