---
service: mobile-app
feature: UC-DTL-03
priority: P1
type: boundary
tier: visible
scope: task-local
---

# UC-DTL-03 edge: "Approximate location" badge is mutually exclusive with polyline render

The "Approximate location" badge is mutually exclusive with the polyline render — it appears
ONLY when `routePolyline` is absent, never alongside a rendered polyline. The map never
renders blank or crashes for any of the 5,654 routes.

**Verify (e2e, real device + live Convex):**
- A route WITH polyline: no "Approximate location" badge appears.
- A route WITHOUT polyline: badge appears, map renders the centroid (no blank).
- Stress: open 10 no-polyline routes — none crashes, all show the centroid + badge.
