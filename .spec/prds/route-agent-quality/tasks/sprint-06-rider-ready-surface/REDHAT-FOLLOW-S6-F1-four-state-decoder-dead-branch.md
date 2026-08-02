# REDHAT-FOLLOW-S6-F1 — Intentional four-state discovery decoder

> Status: ⬜ Backlog
> Finding: **S6-F1** · Severity: **MEDIUM**
> Gate blocker for Sprint 06: **No**
> Authority: `.spec/reviews/red-hat-sprint-06-rider-ready-surface-20260801T0356Z.md`

## Outcome

Make every `(isLoading, isEmpty, fellBackToBest)` discovery state intentional and remove the
dead final `isEmpty` decoder arm without changing the single `useCuratedDiscovery` gate, honest
copy, stable testIDs, or accessibility behavior.

## Acceptance criteria

- `isEmpty && fellBackToBest` has an explicit, tested honest state.
- No unreachable ternary/branch remains after the loading short-circuit.
- Existing thin-empty, labeled-national-fallback, and single-gate tests remain green.
- Run the focused Vitest discovery tests, `pnpm type-check`, and Biome on touched files.

## Constraints

Non-blocking Sprint 06 follow-up. Do not claim or reopen the omitted S6-T7 device gate; do not
reintroduce fabricated `0mi`, mock stores, or a second discovery query.

<!-- REQUIREMENT-CONTRACT v1
task_id: REDHAT-FOLLOW-S6-F1
finding_id: S6-F1
severity: MEDIUM
gate_blocking: false
-->
