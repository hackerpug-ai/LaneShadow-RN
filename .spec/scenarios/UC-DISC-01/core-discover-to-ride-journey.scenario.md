---
service: mobile-app
feature: UC-DISC-01
priority: P0
type: happy_path
tier: visible
scope: journey
---

# UC-DISC-01 core (JOURNEY): full discover-to-ride arc on real iOS + real Android

The MVP's one job, end-to-end. On a real device against live Convex: open the app to the
route plan view → discover a road (suggestion card tap OR chat "twisties near Asheville"
including a state-scoped request) → tap a route to detail → understand scores/geometry/
conditions → save → reopen from Saved → hand off to Apple/Google Maps.

This is a **journey flow** (scope: journey). It spans Sprint 01 (discovery on plan view) →
Sprint 02 (detail + save + handoff) → Sprint 03 (capstone verification). The gate replays
this flow **after all three sprints merge**, on a real device, from a cold boot.

**Verify (e2e, real iOS + real Android + live Convex):**
- The full arc completes without error on a real iPhone and a real Android phone.
- At least one state-scoped chat request ("scenic roads in North Carolina") returns routes.
- The save persists and reopens from Saved without a legs/PlanInput crash.
- The maps handoff opens the native maps app (Apple Maps on iOS, Google Maps on Android).
- Per-platform recorded evidence exists (video/screenshots).
