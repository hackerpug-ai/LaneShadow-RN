# REDHAT-FOLLOW-S6-F2 — Honest canonical-redirect integrity fault

> Status: ⬜ Backlog
> Finding: **S6-F2** · Severity: **MEDIUM**
> Gate blocker for Sprint 06: **No** · Preferred execution: Sprint 07 honest-states
> Authority: `.spec/reviews/red-hat-sprint-06-rider-ready-surface-20260801T0356Z.md`

## Outcome

Keep the single-hop `duplicateOf` redirect and gate-independent saved detail, while exposing a
structured integrity/unavailable signal when the canonical row also has `duplicateOf`, so that
case is distinguishable from a genuinely missing route.

## Acceptance criteria

- Double-`duplicateOf` returns a renderable integrity/unavailable signal without following a
  second hop or fabricating geometry.
- A truly missing route remains distinct not-found/null behavior.
- Clean shadow-to-canonical redirect remains green.
- Focused Convex integration tests, `pnpm type-check`, and Biome on touched files pass.

## Constraints

Non-blocking Sprint 06 follow-up, preferably delivered with Sprint 07. Never mutate
`saved_routes.curatedRouteRef` on the read path and never claim or reopen S6-T7.

<!-- REQUIREMENT-CONTRACT v1
task_id: REDHAT-FOLLOW-S6-F2
finding_id: S6-F2
severity: MEDIUM
gate_blocking: false
target_sprint: sprint-07
-->
