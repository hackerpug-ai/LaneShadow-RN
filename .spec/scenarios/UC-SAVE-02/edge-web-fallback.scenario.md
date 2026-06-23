---
service: mobile-app
feature: UC-SAVE-02
priority: P0
type: error_handling
tier: visible
scope: task-local
---

# UC-SAVE-02 edge: web fallback when native maps scheme cannot open

When `Linking.canOpenURL` is false for the native maps scheme (e.g. Google Maps uninstalled
on Android, or a platform quirk), the util falls back to opening maps.google.com in the
system browser with the centroid + name as the destination. No crash, no dead tap.

**Verify (e2e, real Android with Google Maps uninstalled):**
- Tap Ride It with Google Maps uninstalled → browser opens maps.google.com with the
  route's centroid as the destination and the name as the query.
- No crash, no uncaught exception in the JS console.
