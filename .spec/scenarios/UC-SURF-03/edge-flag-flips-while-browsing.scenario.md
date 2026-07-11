---
service: mobile
feature: UC-SURF-03
priority: P1
type: edge_case
tier: holdout
scope: task-local
---

# UC-SURF-03 edge: a route loses rider-ready while its card is on screen

Rachel is paging the carousel when, backend-side, the operator's gate re-evaluation sweeps
her currently-visible route into review (its legacy geometry measured wrong). Convex is
reactive, so the query result updates under the UI. The card must leave or refuse gracefully
on the next data tick — what must NOT happen is a tap on the still-rendered card plotting the
now-disavowed line as if nothing changed, or the app crashing because an index it was paging
shrank. Then the reverse: mid-session, a batch lands and forty new rider-ready routes appear
in her region; the carousel may grow, but her current page position doesn't teleport and no
duplicate cards appear. Finally the empty-to-populated transition: she opens the app during
the brief window when her region has zero rider-ready routes, sees the honest empty pill, and
a minute later the batch flips three routes ready — the surface updates from absence to
results without requiring an app restart, and the empty-state message does not linger over
real results.
