---
service: convex
feature: UC-VER-05
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-VER-05 edge: re-recorded verdicts and a sample that went stale under the founder

The founder records `off` for a route, the operator regenerates its line, and the founder
records `true` on the second look. The route doc must hold exactly one current verdict — the
newest — and the gate must judge against it, not the history; yet the fact that a re-verdict
happened should remain visible somewhere the operator can see (a timestamp change at
minimum), because a sample where half the routes needed regeneration is itself a signal the
gate band may need tuning before `--all`. Separately: between PNG render and verdict entry,
a background sample run replaces one route's candidate geometry. The verdict the founder
records must attach to what he actually looked at — if the stored line's verification
timestamp is newer than the rendered manifest's, the mutation should flag or refuse the stale
verdict rather than blessing geometry the founder never saw. Twenty-five PNGs on a couch only
protect trust if each verdict provably corresponds to the pixels reviewed.
