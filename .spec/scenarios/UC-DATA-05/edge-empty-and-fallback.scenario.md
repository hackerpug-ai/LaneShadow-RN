---
service: convex
feature: UC-DATA-05
priority: P1
type: edge_case
tier: visible
scope: task-local
---

# UC-DATA-05 edge: empty bbox, missing center, unlocated fallback

`listCuratedRoutes` handles empty/empty-result queries gracefully: an empty bbox returns
`[]` (not an error); a query with no center when the rider is unlocated falls back to
best-first sort; a state with zero curated routes returns `[]` (not an error).

**Verify (integration, live Convex dev):**
- A tiny bbox in the ocean returns `[]` without throwing.
- A center+radius query with `center: undefined` falls back to best-first (not an error).
- A state with no curated routes returns `[]`.
