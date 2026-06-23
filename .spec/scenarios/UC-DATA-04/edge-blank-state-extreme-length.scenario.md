---
service: convex
feature: UC-DATA-04
priority: P2
type: edge_case
tier: visible
scope: task-local
---

# UC-DATA-04 edge: blank/null state and extreme length values are handled

A route with a null/empty state string still surfaces in archetype/nearest queries (state
filter is optional). A route with extremely high or negative `lengthMiles` (junk from the
catalog) is clamped/hidden rather than rendered as a nonsensical number.

**Verify (integration, live Convex dev):**
- A route with `state: null` appears in nearest-first results.
- A route with `lengthMiles: -1` or `99999` does not crash the read path and is either
  clamped to the boundary or hidden.
