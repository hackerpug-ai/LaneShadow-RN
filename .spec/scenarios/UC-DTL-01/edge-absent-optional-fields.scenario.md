---
service: mobile-app
feature: UC-DTL-01
priority: P0
type: edge_case
tier: visible
scope: task-local
---

# UC-DTL-01 edge: no summary / no polyline / no weather across the 5,654-row catalog

The detail screen renders without a JS error or blank section for every curated_route row
regardless of which optional fields are absent. The ~32% with no summary show "No
description yet" in italics; the ~45% with no polyline show the centroid + "Approximate
location" badge; any route with a weather-fetch failure shows "conditions unavailable".

**Verify (e2e, real device + live Convex):**
- Open detail for a route with no `summary` → "No description yet" placeholder renders.
- Open detail for a route with no `routePolyline` → centroid marker + "Approximate
  location" badge render (no blank map, no crash).
- Open detail for a route whose weather fetch fails → "conditions unavailable" renders.
- Stress: open detail for 20 random routeIds across the catalog — none crashes.
