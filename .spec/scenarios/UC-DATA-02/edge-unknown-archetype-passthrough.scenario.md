---
service: convex
feature: UC-DATA-02
priority: P2
type: edge_case
tier: visible
scope: task-local
---

# UC-DATA-02 edge: unknown archetype string passes through without crashing

A route row with an archetype the UI label table does not recognize (e.g. a future DB
value) is not silently dropped. The map either surfaces it under a "Other"/passthrough
label or returns it with the raw DB value so the suggestion/chat card can still render.

**Verify (integration, live Convex dev):**
- A route whose `primaryArchetype` is an unknown string still appears in `listCuratedRoutes`
  results and the response does not throw.
