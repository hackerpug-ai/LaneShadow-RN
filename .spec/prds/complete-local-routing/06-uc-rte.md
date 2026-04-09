---
stability: FEATURE_SPEC
last_validated: 2026-04-09
prd_version: 1.0.0
functional_group: RTE
---

# Use Cases: Route Calculation (RTE)

## Use Case Summary

| ID | Title | Description |
|----|-------|-------------|
| UC-RTE-01 | Calculate Route Offline | System calculates route without internet using downloaded regions |
| UC-RTE-02 | Route with Waypoints | User can plan routes with multiple stops |
| UC-RTE-03 | Cache Route for Replay | System stores calculated routes for offline replay |
| UC-RTE-04 | Store Routes Agnostically | System persists routes in provider-agnostic format |

---

## UC-RTE-01: Calculate Route Offline

**Description:** System calculates driving route between origin and destination without requiring internet connection, using downloaded offline map regions.

**Acceptance Criteria:**
- ☐ System can calculate route when device is offline
- ☐ System uses Mapbox offline routing API with cached data
- ☐ System returns route geometry as encoded polyline
- ☐ System returns route distance and duration
- ☐ System returns route leg information
- ☐ System handles offline data missing gracefully
- ☐ System displays helpful error when region not downloaded
- ☐ Route calculation completes in under 2 seconds

---

## UC-RTE-02: Route with Waypoints

**Description:** User can plan routes with multiple intermediate stops (waypoints) in addition to origin and destination.

**Acceptance Criteria:**
- ☐ User can add waypoints to route planning interface
- ☐ User can reorder waypoints by dragging
- ☐ User can remove waypoints from route
- ☐ System calculates route visiting all waypoints in order
- ☐ System displays total distance and duration with waypoints
- ☐ System renders route polyline showing all segments
- ☐ System supports up to 10 waypoints per route

---

## UC-RTE-03: Cache Route for Replay

**Description:** System stores calculated routes in Convex so they can be retrieved and displayed later without recalculating.

**Acceptance Criteria:**
- ☐ System can save calculated route to Convex
- ☐ System can retrieve saved route by ID
- ☐ System can replay saved route without internet
- ☐ System displays cached route with original geometry
- ☐ System caches route metadata (distance, duration, legs)
- ☐ System validates cache freshness before using
- ☐ System can invalidate cache when needed

---

## UC-RTE-04: Store Routes Agnostically

**Description:** System persists route data in Convex using provider-agnostic format that works with both Google Maps and Mapbox.

**Acceptance Criteria:**
- ☐ System stores route geometry as encoded polyline string
- ☐ System stores route bounds as lat/lng objects
- ☐ System stores weather overlay metadata separately
- ☐ System does not store provider-specific data
- ☐ System can load stored routes with Mapbox renderer
- ☐ System can load stored routes with Google renderer (fallback)
- ☐ Storage schema supports future provider changes
