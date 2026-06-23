---
service: convex
feature: UC-DATA-05
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DATA-05 core: listCuratedRoutes serves all 4 browse modes Clerk-gated

`listCuratedRoutes` returns curated routes by (1) bbox, (2) center+radius (nearest-first),
(3) state, (4) archetype[] — all Clerk-gated (`requireIdentity`). Composite and per-dimension
scores arrive on the raw 0–1 scale.

**Verify (integration, live Convex dev):**
- bbox query around a known region returns routes in that region.
- center+radius nearest-first query returns routes ordered by distance ascending.
- state query for "North Carolina" returns routes in NC.
- archetype query for `scenic` returns scenic routes.
- All responses carry `compositeScore` and per-dimension scores as 0–1 floats.
- All four modes 401/reject without a Clerk identity.
