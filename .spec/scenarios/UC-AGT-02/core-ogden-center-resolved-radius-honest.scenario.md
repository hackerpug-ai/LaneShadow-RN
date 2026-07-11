---
service: convex
feature: UC-AGT-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-AGT-02 core: "near Ogden" resolves a real center and respects the radius

The canonical fix for the founder's failure. With three rider-ready routes seeded at ~10 mi,
~40 mi, and ~170 mi from Ogden (the 170-mi row standing in for Capitol Reef), the utterance
"I want something that twists alongside the mountain up in Ogden" — sent with NO session
location — must geocode Ogden through the shared geocoding provider, call
`searchCuratedRoutes` with that center, and return only the 10- and 40-mi routes,
nearest first. A second run with a session location present (SLC) and no place named must
use the session location as the center. The structural guarantee is also proven directly:
calling `searchCuratedRoutes` without a `center` throws a validation error before any query
runs.

**Verify (real dev deployment, real geocoding, captured tool args):**
- Seeded fixture: rider-ready rows at ~10/40/170 mi from Ogden (41.223, -111.9738).
- Turn 1 (no session location, "up in Ogden"): captured `searchCuratedRoutes` args contain
  `center` within ~15 mi of Ogden's coordinates and a `radiusMi ≤ 50`; the result set
  contains the 10-mi and 40-mi routes in that order and NOT the 170-mi route.
- Turn 2 (session location = SLC, "something scenic around here"): captured args carry the
  SLC coordinates as center; no geocoding call for a place name was made.
- Negative control: a direct tool invocation without `center` throws; no query executed.
- The reply text for turn 1 names distances that match the captured `distanceMi` values.
