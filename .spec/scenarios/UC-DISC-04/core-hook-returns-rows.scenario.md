---
service: mobile-app
feature: UC-DISC-04
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DISC-04 core: useCuratedDiscovery returns rows in the suggestion-card/chat shape

The hook wraps `useQuery(api.curatedRoutes.listCuratedRoutes, params)` and returns
`{ routes, isLoading, isEmpty }` where each row carries `{ id, name, lat, lng, archetype,
compositeScore, distanceMi }` — the exact shape the suggestion cards (UC-DISC-09) and chat
discovery (UC-DISC-10) iterate over. Composite arrives on the raw 0–1 scale (formatting to
% is a render concern).

**Verify (integration, live Convex dev via the hook):**
- Calling the hook with a center returns rows in the documented shape.
- `isLoading` is true while the query is in flight; `isEmpty` is true when routes === [].
- `compositeScore` is a 0–1 float (not a percentage, not a 0–100 integer).
