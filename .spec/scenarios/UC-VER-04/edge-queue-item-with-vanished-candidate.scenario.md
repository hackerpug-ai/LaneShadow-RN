---
service: convex
feature: UC-VER-04
priority: P1
type: error_handling
tier: holdout
scope: task-local
---

# UC-VER-04 edge: approving a queue item whose candidate geometry has vanished

The queue join is two tables pretending to be one. Construct the mismatch case: a route doc
sits at `geometryStatus='review'` but its side-table candidate row is gone (a teardown
deleted it, or the no-candidate path never wrote one) — then the founder taps approve anyway.
Approval must not manufacture a servable route out of nothing: the mutation either refuses
with a clear error naming the missing candidate, or moves the route to a state that is
honest about having no line (back to `unresolved`), but under no interpretation does the
route become `generated`-with-no-geometry or `riderReady=true`. The queue listing itself must
also render the mismatch case without crashing — the row appears with its failure reason and
an explicit no-candidate marker rather than being silently dropped from the list (a dropped
row would hide work from the founder and make queue counts disagree with the coverage
report's review count).
