---
service: mobile-app
feature: UC-SAVE-01
priority: P1
type: edge_case
tier: visible
scope: task-local
---

# UC-SAVE-01 edge: SavedRouteCard tolerance + saved-state reflection

The existing `SavedRouteCard` (built for planned-payload rows) tolerates a curatedRouteRef
row that has no synthesized legs — it renders a lean preview (name, centroid, score,
archetype) without crashing. The Save control reflects saved state for an already-bookmarked
curated route (toggle Save ↔ Unsave).

**Verify (e2e, real device + live Convex):**
- A Saved screen containing both legacy planned rows and curated rows renders without error.
- Re-opening a curated detail for an already-saved route shows the "Saved"/Unsave state.
