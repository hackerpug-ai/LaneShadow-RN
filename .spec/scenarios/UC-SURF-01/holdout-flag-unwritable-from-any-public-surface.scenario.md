---
service: convex
feature: UC-SURF-01
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-SURF-01 holdout: nothing a rider can reach writes riderReady

Enumerate the public, Clerk-gated surface of the deployment (queries, mutations, actions
visible to the mobile client) and demonstrate that none of them accepts, patches, or
indirectly toggles `riderReady`, `geometryStatus`, `geometryProvenance`, `rideWorthiness`,
`retiredAt`, `duplicateOf`, or `quarantine`. Saving/bookmarking a route, submitting route
feedback, running discovery, opening detail — each executed with a real rider session — must
leave every one of those fields byte-identical on the touched rows. Then attempt the direct
abuse: craft a client call to the internal recompute/persist mutations by name; the
deployment rejects them as non-public. The only writers are the operator path
(deployment-credentialed `npx convex run`) and the pipeline's own internal calls. This is the
teeth behind "the gate can't be socially engineered from the app": rider actions influence
what the founder sees in feedback, never what the catalog asserts as rider-ready.
