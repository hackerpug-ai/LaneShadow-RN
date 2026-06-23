---
service: convex
feature: UC-DATA-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DATA-03 core: curatedRouteRef bookmark field is additive

`saved_routes` gains an optional `curatedRouteRef: v.id('curated_routes')` field. Existing
saved planned-payload rows continue to save/open unchanged. A new curated-route bookmark
writes only the `curatedRouteRef` + name, leaving the plan-payload fields null.

**Verify (integration, live Convex dev):**
- The schema accepts a saved row with `curatedRouteRef` set and all plan-payload fields null.
- The schema accepts a saved row with plan-payload fields set and `curatedRouteRef` null
  (legacy path still works).
