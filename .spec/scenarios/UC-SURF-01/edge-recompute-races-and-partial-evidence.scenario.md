---
service: convex
feature: UC-SURF-01
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-SURF-01 edge: a route with geometry but no classifier verdict yet

The batch is mid-flight: a route has just gained gate-passing `ai_reconstructed` geometry but
the catalog-wide classifier hasn't reached it, so `rideWorthiness` is absent entirely — not
`ride`, not `not_a_ride`, just missing. The flag computation must have a defined answer for
this in-between state and it must be conservative or explicitly chosen — whichever the
implementation picks, the same route must not flicker between suggested and hidden as
unrelated pipeline writes land. Then the mirror case: a verdict exists but geometry is still
`unresolved`. And the degenerate ordering case: retirement lands while a recompute sweep is
walking the table — the sweep must not resurrect `riderReady=true` on a row retired an
instant earlier (last-writer honesty: the recompute reads the row state it patches). Finally,
the batch sweep over ~5,757 rows completes within Convex limits by pagination, and running
two sweeps back-to-back produces identical flags (the predicate is a pure function of row
state, so a second pass is a no-op).
