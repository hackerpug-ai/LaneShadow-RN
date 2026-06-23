---
service: mobile-app
feature: UC-DISC-04
priority: P1
type: edge_case
tier: visible
scope: task-local
---

# UC-DISC-04 edge: loading≠empty + unlocated→best-first fallback

The hook distinguishes Convex's `undefined`=loading from `[]`=empty so the caller renders
the right state. When the rider's location is unavailable (`useCurrentLocation` returns
null), the hook falls back to `sort: 'best'` rather than failing or producing a zero-center
query.

**Verify (integration, live Convex dev via the hook):**
- While the query is in flight, `isLoading === true` and `isEmpty === false`.
- When the query returns `[]`, `isLoading === false` and `isEmpty === true`.
- With location permission denied/unavailable, the hook returns best-first sorted rows
  (no error, no zero-center query).
