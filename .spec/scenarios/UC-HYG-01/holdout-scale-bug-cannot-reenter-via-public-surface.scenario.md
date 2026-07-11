---
service: convex
feature: UC-HYG-01
priority: P2
type: security
tier: holdout
scope: task-local
---

# UC-HYG-01 holdout: no client-reachable surface can write a score, and the ranking actually unpins

Two differently-framed checks that the fix is real and stays real. First, authorization: the
normalization pass is an internal function — an authenticated Clerk client session (the
rider's surface) has no public mutation that writes `compositeScore` or
`scoreScaleNormalizedAt`; attempting to call the internal function through the public client
API fails, so the 0–100 bug cannot be re-introduced from the app. Second, the observable
consequence the AC never states directly: after normalization, the national "best" ordering
is no longer pinned by the editorial block — querying the top-10 by composite score returns a
mix in which no row's score exceeds 1.0, and the four Cherohala Skyway duplicates no longer
occupy the top slot purely by scale artifact (their normalized 0.9 competes honestly with the
0.86 BBR leaders).
