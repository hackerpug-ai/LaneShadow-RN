---
service: convex
feature: UC-REC-05
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-REC-05 edge: a retirement candidate rescued at the last minute leaves the kill list

A route sits on the retirement-candidate list after levers 1–3 all failed during the batch.
Before the founder confirms anything, an operator improves the situation — say the hygiene
pass fixes the route's absurd claimed length, which is what made the ratio gate unpassable —
and re-runs the applicable lever on just that route. The lever now PASSes. The route must
drop off the retirement-candidate list automatically (it no longer satisfies
"all levers failed"), its status flips to `generated` with real provenance, and a subsequent
founder retirement attempt against it is refused or moot. The inverse also holds: confirming
retirement for the *other* candidates is unaffected by this route's rescue. The kill list is
a live query over evidence, not a frozen snapshot that can retire a route the system just
saved.
