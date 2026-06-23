---
service: mobile-app
feature: UC-DISC-11
priority: P1
type: boundary
tier: visible
scope: task-local
---

# UC-DISC-11 edge: dropped discovery components are quarantined (unreachable)

DISC-021 quarantines the dedicated-discovery components (`discover.tsx`,
`RouteDiscoveryScreen`, archetype filter-bar, sort-toggle, state-picker, DiscoveryFilterBar
chips, etc.) so none are imported by an active screen or hook. They remain on disk (the
offline `use-route-discovery.ts` is untouched) but no reachable path renders them.

**Verify (e2e, real device):**
- Grep the active screen + hook graph: no live import of any dedicated-discovery component.
- Manually explore every drawer entry, every footer button, every tap target on the plan
  view: no path opens a dedicated discovery surface or filter UI.
