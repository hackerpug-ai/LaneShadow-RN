---
service: mobile
feature: UC-AGT-04
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-AGT-04 core: every suggestion wears its distance; thin coverage says so

Driven on the iOS simulator against the live dev deployment (Maestro), in the seeded
Ogden-like region: a handful of rider-ready routes at ~10 and ~40 mi, nothing else within
the default radius — the honest version of the founder's exact scenario. The rider asks the
chat for "twisty roads near Ogden." The reply and its route cards must carry each
suggestion's real distance from Ogden; nothing beyond the searched radius appears. Then the
rider asks about a genuinely thin area (seeded empty within 50 mi): the reply must name the
radius searched, name the nearest real option WITH its distance, and offer the custom-route
alternative ("want me to plan you a fresh route instead?") — never dots, never padding,
never the word "near" attached to something 170 miles out.

**Verify (Maestro on iOS sim, live dev deployment; cold boot, dev-client menu dismissed):**
- Discovery reply for the Ogden ask shows suggestions whose visible text includes distances
  matching the backend's `distanceMi` values (±1 mi rounding).
- No suggestion in the reply exceeds the `searchedRadiusMi` echoed by the tool result.
- Thin-area reply contains: the radius figure, the nearest-option name + distance, and a
  custom-route offer — asserted via testIDs/text on the chat transcript.
- Backend cross-check: `npx convex run` inspection of the persisted route_plan/attachments
  confirms every routeId in the reply is `riderReady=true`.
