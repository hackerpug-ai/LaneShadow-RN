---
service: convex
feature: UC-DATA-06
priority: P1
type: error_handling
tier: visible
scope: task-local
---

# UC-DATA-06 edge: missing polyline, missing summary, weather-fetch failure

The detail query handles absent optional fields without error: a route with no polyline
returns `routePolyline: null` (not an empty string, not an error); a route with no summary
returns `summary: null`; a weather-fetch failure returns a "conditions unavailable"
sentinel rather than throwing.

**Verify (integration, live Convex dev):**
- A route with `routePolyline: null` returns successfully with all other fields populated.
- A route with `summary: null` returns successfully.
- When the weather provider fails/times out, the query still returns the route with a
  weather-unavailable marker.
