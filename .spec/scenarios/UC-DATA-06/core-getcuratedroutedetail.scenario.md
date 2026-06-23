---
service: convex
feature: UC-DATA-06
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DATA-06 core: getCuratedRouteDetail returns lean fields + scores + polyline-or-null + weather

`getCuratedRouteDetail(routeId)` returns the route's name, summary, primaryArchetype,
lengthMiles, the five dimension scores + composite on the 0–1 scale, `routePolyline` as an
encoded string or null, centroid lat/lng, and basic current weather. Clerk-gated. Reads no
enrichment (table is empty).

**Verify (integration, live Convex dev):**
- Calling with a known routeId returns all lean fields populated (or null where appropriate).
- `routePolyline` is present for the ~55% of routes with geometry and null for the ~45% without.
- Weather is present or a "conditions unavailable" sentinel (no throw on weather-fetch fail).
- Calling without a Clerk identity 401s.
