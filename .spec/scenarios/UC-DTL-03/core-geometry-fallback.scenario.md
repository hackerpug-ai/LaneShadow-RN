---
service: mobile-app
feature: UC-DTL-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DTL-03 core: geometry graceful degradation with centroid fallback

For the ~55% of routes WITH `routePolyline`, the detail map renders the polyline and fits
the camera to its bounds. For the ~45% WITHOUT, the map renders a single centroid marker
at zoom 11 with an "Approximate location" badge below the map.

**Verify (e2e, real device + live Convex):**
- A route with `routePolyline` renders the polyline on the map, camera fits bounds.
- A route without `routePolyline` renders a centroid marker at zoom 11 + the badge.
