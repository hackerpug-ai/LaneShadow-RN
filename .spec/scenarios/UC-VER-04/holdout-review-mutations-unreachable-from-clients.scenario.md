---
service: convex
feature: UC-VER-04
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-VER-04 holdout: a rider's client can never work the review queue

Using a real authenticated rider session (valid Clerk JWT, the same credentials the mobile
app uses), attempt each review-queue operation directly against the deployment's public API
surface: list the queue, approve an item, reject an item, and record a couch verdict. Every
attempt must fail — these functions are `internal*` and simply do not exist on the public
surface, so the calls are rejected as unknown/unauthorized functions rather than
permission-denied-with-a-hint. Then confirm the inverse: the operator path
(`npx convex run` with deployment credentials) executes the same operations successfully.
Finally, probe the one public read that touches adjacent data — `getCuratedRouteDetail` — and
confirm it leaks no queue internals for a review-held route: no failure reason, no candidate
geometry, no verification numbers beyond what the detail contract already exposes for any
route. The review workflow is invisible to riders except as honest absence.
