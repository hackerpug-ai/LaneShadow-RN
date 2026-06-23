---
service: convex
feature: UC-DATA-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DATA-01 core: geospatial index is seeded from curated_routes centroids

The `@convex-dev/geospatial` index is populated from every `curated_routes` row's centroid
so `listCuratedRoutes` bbox/nearest queries return real routes. Re-running the seed is
idempotent — already-indexed rows are not duplicated and the index is not re-initialized.

**Verify (integration, live Convex dev):**
- After seeding, the geospatial index reports >0 documents (matches the 5,654-row catalog).
- A bbox query around Asheville, NC returns curated routes from that region.
- Re-running the seed produces no duplicate entries (count is stable).
