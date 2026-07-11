---
service: convex
feature: UC-SURF-03
priority: P2
type: security
tier: holdout
scope: task-local
---

# UC-SURF-03 holdout: merged shadows and retired rows are unreachable through every browse parameterization

The gate is only as strong as its least-filtered query mode. Take one duplicate shadow (a
second "Cherohala Skyway" row) and one retired route, then probe `listCuratedRoutes` through
every parameter combination a client can express — each browse mode, each sort, state filters
matching the shadow's state, archetype filters matching its archetype, center coordinates on
its centroid, limits from 1 to the maximum. Neither row may appear in any combination; the
canonical Cherohala appears exactly once wherever it qualifies. Also probe pagination seams:
if a mode paginates, the shadow must not leak on page boundaries where a filter is applied
post-index. This scenario exists because exclusion implemented in one query branch but
forgotten in another is precisely the class of bug the audit found (the centroid fallback
lived in one tool while the browse path was clean) — the holdout sweeps all branches with
data the visible tests don't use.
