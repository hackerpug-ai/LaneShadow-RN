---
service: mobile-app
feature: UC-DISC-10
priority: P1
type: error_handling
tier: visible
scope: task-local
---

# UC-DISC-10 edge: zero-score bug fixed + no-result intent

The agent tool maps `listCuratedRoutes`'s FLAT `compositeScore`/`*Score` fields (not the
nested `route.scores`/`route.score` that produced 0%/all-zero bars pre-DATA-008b). A
no-result intent (e.g. a state with zero matching routes) returns an empty result without
plotting a phantom route.

**Verify (e2e, real device + live Convex):**
- A chat discovery result renders composite scores as real non-zero values when the routes
  have non-zero scores (the all-zero-bars bug is gone).
- An intent that matches zero routes ("twisties in Rhode Island" if none exist) renders an
  empty result with no map plot.
