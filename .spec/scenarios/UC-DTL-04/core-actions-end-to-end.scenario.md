---
service: mobile-app
feature: UC-DTL-04
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DTL-04 core: Save + Ride It actions operate end-to-end

From the detail screen, both Save and Ride It are reachable without scrolling on a standard
iPhone 14 viewport. Save enters a loading state (ActivityIndicator) then resolves to a
"Saved" confirmed state in place without navigating away. Ride It opens Apple Maps (iOS) or
Google Maps (Android) via deep link with the route centroid + name.

**Verify (e2e, real iOS + real Android + live Convex):**
- Save and Ride It are both visible without scrolling on iPhone 14 (390×844 portrait).
- Tap Save → loading state → "Saved" in place (no navigation away).
- Tap Ride It on iOS → Apple Maps opens at the centroid with the route name.
- Tap Ride It on Android → Google Maps opens at the centroid with the route name.
