---
service: convex
feature: UC-VER-04
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-VER-04 core: every post-budget failure queues with a reason; founder dispositions are recorded

On the real dev deployment, produce two REVIEW entries through the real pipeline: one route
whose reconstruction failed the ratio gate after both attempts (Old Hwy 40 pattern), and one
route where geocoding yielded fewer than 2 usable anchors so no candidate line exists at all.
Both must appear in the queue — the second proving the queue lives on the route doc
(`geometryStatus='review'`), not on the side table. While queued, neither route is
rider-ready nor appears in any `listCuratedRoutes` or discovery result. The founder then
works the queue with all three dispositions: approve the first route (it becomes `generated`,
its flag recomputes), send a third seeded item back for retry (it returns to the eligible
pool with a fresh attempt budget), and retire a fourth (it becomes `retired`, reversible).
Each disposition is persisted with enough to audit later — who-path (operator-only mutation),
what, and when.

**Verify (real dev deployment):**
- `npx convex run curatedGeometry:listGeometryReviewQueue '{}'` → both failure shapes
  present; each row shows its failure reason (ratio-out-of-band vs insufficient-anchors);
  the no-candidate row has no side-table line.
- `listCuratedRoutes` + the discovery tool exclude both while queued.
- `npx convex run curatedGeometryReview:approveReviewItem '{"routeId":"<r1>"}'` →
  `geometryStatus='generated'`, `riderReady` recomputed true when other conditions hold.
- `rejectReviewItem '{"routeId":"<r3>","reason":"...","disposition":"retry"}'` → route back
  to `unresolved`/eligible; `rejectReviewItem` with `disposition:'retire'` on `<r4>` →
  `geometryStatus='retired'` + `retirementReason` set.
- Each disposition retrievable afterward by routeId (auditable record).
