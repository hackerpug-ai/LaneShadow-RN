---
service: convex
feature: UC-VER-01
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-VER-01 core: the deterministic gate admits and rejects at the exact ratio boundaries

Against the real dev deployment, the operator seeds four candidate lines for four test-scoped
routes whose claimed length is exactly 100 miles, with decoded path lengths of 59 mi, 61 mi,
159 mi, and 161 mi (ratios 0.59 / 0.61 / 1.59 / 1.61), each with >4 points and ≥1 point per
mile so only the ratio varies. Persisting each through the real lever path (lever-1 promote on
seeded in-row polylines) exercises the single pure gate module `curatedGeometryGate.gate()`.
The 0.61 and 1.59 lines are admitted as `generated` with `verification.verdict='pass'` and
their exact ratio recorded; the 0.59 and 1.61 lines end `geometryStatus='review'` with
`verification.verdict='review'`. A fifth seeded route with a 2-point line and a sixth with a
10-point/50-mile line (0.2 pts/mi) are both rejected as degenerate regardless of ratio, with
`verification.degenerate=true`. A seventh route whose claimed length was quarantined to null
admits on degenerate+region checks alone and stores the routed length as truth.

**Verify (real dev deployment, no mocks of the gate):**
- `npx convex run curatedGeometryPromote:promoteForRoute '{"routeId":"<seed-061>"}'` →
  route doc `geometryStatus='generated'`; side-table `verification.ratio` ≈ 0.61,
  `verdict='pass'`.
- Same call for `<seed-059>` and `<seed-161>` → `geometryStatus='review'`; ratio recorded;
  no rider-ready flip.
- 2-pt and 0.2-pts/mi seeds → `verification.degenerate=true`, `verdict='review'`, never
  `generated`.
- Null-claimed-length seed → `generated` with `verification.claimedMiles=null`,
  `ratio=null`, routed length stored on the route.
- `npx convex run curatedGeometry:listGeometryReviewQueue '{}'` names the failed condition
  (ratio / degenerate) for every rejected seed.
