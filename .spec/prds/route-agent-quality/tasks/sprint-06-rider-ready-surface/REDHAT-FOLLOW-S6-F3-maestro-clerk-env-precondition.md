# REDHAT-FOLLOW-S6-F3 — Fail-closed Maestro Clerk precondition

> Status: ⬜ Backlog
> Finding: **S6-F3** · Severity: **MEDIUM**
> Gate blocker for Sprint 06: **No**
> Authority: `.spec/reviews/red-hat-sprint-06-rider-ready-surface-20260801T0356Z.md`

## Outcome

Make the saved-reachability Maestro flow fail immediately with a clear message naming missing
`CLERK_TEST_EMAIL` and/or `CLERK_TEST_PASSWORD`, before authentication taps or quarantine work.

## Acceptance criteria

- Missing or empty required variables produce a non-zero precondition result naming the variable.
- Both non-empty variables pass the precondition without performing login.
- The flow invokes the precondition before E2E authentication and never embeds credentials.
- Preserve fail-closed mid-flow quarantine behavior; run focused static/shell checks.

## Constraints

Non-blocking Sprint 06 configuration follow-up. Do not claim Maestro execution without the
required simulator/Convex environment, weaken quarantine, reintroduce dead selectors, or claim
the omitted S6-T7 device gate passed.

<!-- REQUIREMENT-CONTRACT v1
task_id: REDHAT-FOLLOW-S6-F3
finding_id: S6-F3
severity: MEDIUM
gate_blocking: false
-->
