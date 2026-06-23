---
service: mobile-app
feature: UC-SAVE-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-SAVE-02 core: Ride It deep-link hands off to Apple/Google Maps

`lib/maps-deeplink.ts` builds a platform-correct maps URL via `expo-linking` (no new
dependency): Apple Maps URL on iOS, Google Maps geo/navigation URL on Android, selected by
`Platform.OS`. The detail surface's "Ride It" button calls the util with the route's
centroid + name. Because ~45% of routes have no polyline, the handoff intentionally
targets the centroid (a single destination point — turn-by-turn is permanently out).

**Verify (e2e, real iOS + real Android):**
- Tap Ride It on iOS → Apple Maps opens at the centroid with the route name as the label.
- Tap Ride It on Android → Google Maps opens at the centroid with the route name.
- The util selects the correct URL scheme per `Platform.OS` with no new dependency.
