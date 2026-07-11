---
service: mobile
feature: UC-SURF-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-SURF-03 core: every browse mode and the carousel serve rider-ready only

Seed the dev deployment with adjacent rows: two rider-ready routes, one length-quarantined,
one duplicate shadow (`duplicateOf` set), one retired, one centroid-only. On the backend,
each `listCuratedRoutes` browse mode (best, nearest, state, archetype) returns only the two
rider-ready rows — the best-mode query walks `by_riderReady_and_composite_score` rather than
scanning and filtering (the 16 MB-read constraint). On the device (Maestro, iOS sim, cold
boot, dev-client launcher dismissed), the discovery carousel above the chat input renders
cards only for those rider-ready routes; paging through every card and tapping each plots a
real multi-point line on the map. The visible catalog count agrees with
`coverageReport`'s rider-ready count — no surface invents rows the flag doesn't vouch for.

**Verify (real dev deployment + Maestro on iOS sim):**
- Integration: all four `listCuratedRoutes` modes on the seeded region → exactly the 2
  rider-ready rows; quarantined/shadow/retired/centroid absent in every mode.
- Query-plan check: best-mode uses the composite index (no full-scan filter path).
- Maestro `discovery-full-gate.yaml` extension: carousel shows 2 cards
  (`discovery-suggestion-pill-{routeId}` testIDs); paging + tap on each → a rendered
  polyline (map line layer present), never a lone centroid marker.
- `npx convex run curatedGeometry:coverageReport '{}'` riderReady count === the number of
  distinct routes the surfaces can show for the seeded scope.
