---
service: convex
feature: UC-DATA-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-DATA-02 core: archetype mapping is pure and applied in the read path

A pure UI↔DB archetype map (e.g. UI `scenic` ↔ DB `scenic`, UI `cruising` ↔ DB `cruising`)
is applied in the read path so `listCuratedRoutes` returns archetype labels the suggestion
cards and chat cards iterate over. The map is a pure function (no I/O, no side effects).

**Verify (integration, live Convex dev):**
- Querying each UI archetype value returns at least one route from the live catalog.
- The DB archetype value is carried through unmodified (no rescaling, no string mutation).
