---
service: convex
feature: UC-SURF-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-SURF-01 core: riderReady composes seven conditions; any single flip kills it

Seed one fully-qualifying route on the real dev deployment: gate-passed `generated` geometry,
a real ride name, composite score 0.71 on the 0–1 scale, length 41 miles, classifier verdict
`ride`, not retired, not a duplicate shadow. After `recomputeRiderReady` the stored flag is
true and the route is served by the gated queries through the
`by_riderReady_and_composite_score` index. Then flip each condition one at a time (restoring
between flips): move geometry to `review`; quarantine the length; set the score to 90 (a
seeded scale regression); set verdict `not_a_ride`; retire it; mark it `duplicateOf` another
row. After each single flip plus recompute, the stored flag reads false and the route
disappears from `listCuratedRoutes`; after each restore it returns. Recompute also fires
automatically on the pipeline mutations that change these inputs (persist, retire, classify),
so no manual sweep is needed in the steady state.

**Verify (real dev deployment):**
- Baseline seed → `curated_routes.riderReady === true` (a stored field, not computed at
  read); route present in `listCuratedRoutes` best-mode via the composite index.
- Each of the six flips + recompute → flag false + absent from the gated query; restore →
  true + present again.
- Mutating through the real pipeline paths (`persistGeometryVerified`, `retireRoute`,
  `classifyForRoute`) updates the flag without calling recompute separately.
- `npx convex run curatedGeometry:coverageReport '{}'` → riderReady count matches a direct
  indexed count and sits near the audited 1,171 baseline before any batch.
