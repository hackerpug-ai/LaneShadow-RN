---
service: mobile-app
feature: UC-DTL-04
priority: P1
type: boundary
tier: visible
scope: task-local
---

# UC-DTL-04 edge: actions reachable without scroll on long detail + deep-link fallback

On a route whose summary + conditions push content below the fold, Save/Ride It scroll
with the body to the bottom (they are not pinned off-screen). When Google Maps is
uninstalled on Android, tapping Ride It falls back to opening maps.google.com in the
browser (no crash, no dead tap).

**Verify (e2e, real device + live Convex):**
- A long detail page (long summary + weather pills) renders both Save and Ride It
  reachable by scrolling to the bottom (not cut off).
- With Google Maps uninstalled on Android, Ride It opens the browser to maps.google.com
  with the centroid + name as the destination.
