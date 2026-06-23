---
service: mobile-app
feature: UC-DISC-01
priority: P1
type: edge_case
tier: visible
scope: journey
---

# UC-DISC-01 edge (JOURNEY): cold-boot first run + handoff fallback

The journey survives first-run cold boot (no cached state, fresh install or freshly-launched
dev client) AND the maps-handoff fallback path: when Google Maps is uninstalled on Android,
tapping "Ride It" opens maps.google.com in the browser instead of crashing.

**Verify (e2e, real Android + live Convex):**
- After a fresh install/cold launch, the full arc still completes.
- With Google Maps uninstalled on Android, "Ride It" opens the browser to maps.google.com
  with the route's centroid + name as the destination (no crash, no dead tap).
