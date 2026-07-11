---
service: convex
feature: UC-SURF-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-SURF-02 core: discovery returns rider-ready only; the centroid fallback is gone

Seed a test region on the real dev deployment with two rider-ready routes and five
centroid-only routes (no side-table geometry) whose composite scores are higher than the
ready pair's. Call the discovery agent tool with that region's intent. The result contains
exactly the two rider-ready routes — the higher-scored centroid rows are not substituted, not
appended, and not plotted as dots. The removed code path is structural, not situational: the
old fallback (`plottableRoutes.length > 0 ? … : candidateRoutes.slice(…)`) no longer exists,
so even a region with zero rider-ready matches yields the honest chat message rather than
centroid junk. Nationally, with the score scale fixed and the gate on, a "best routes in the
US" ask returns ten routes that each decode to a real multi-point line — the audited
7-of-10-junk top-10 is structurally impossible because junk can no longer rank (0–100 rows
normalized) nor serve (not rider-ready).

**Verify (real dev deployment):**
- Seeded region call → exactly the 2 rider-ready routes in `route_plans.result.options`;
  none of the 5 centroid rows present under any `limit`.
- Zero-ready region → `type:'chat'` honest message ("…none have a rider-ready map yet…");
  no options array with substitutes.
- Grep gate: the fallback branch and the centroid map-geometry branch are deleted from
  `discoverCuratedRoutes.ts` (build-gate style assertion).
- National best-10 on post-hygiene data → every option's routeId has side-table geometry
  decoding to ≥2 points and `riderReady=true`.
