---
service: convex
feature: UC-HYG-02
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-HYG-02 core: the 50 duplicate groups collapse to one canonical row each

The catalog holds ~50 duplicate name groups (~106 rows): Cherohala Skyway ×4, Skyline Drive
×4, Blue Ridge Parkway ×3. The operator first runs the dedup in dry-run mode against the real
dev deployment and reviews the plan: each group lists its detected members (matched by
normalized name + centroid proximity), the chosen canonical (the member with gate-passing
geometry, ties broken by highest composite score), and the members to be marked as shadows.
After founder review, the commit run sets `duplicateOf = <canonical routeId>` on every
shadow. Shadows survive as rows (reversible) but vanish from every suggestion surface.

**Verify (real dev deployment, no mocks):**
- `npx convex run curatedGeometryHygiene:dedupeGroups '{"dryRun": true}'` → plan with
  ~50 groups / ~106 rows; the Cherohala group shows 4 members and exactly 1 canonical.
- Commit run returns `{groups ≈ 50, shadows ≈ 56}` (members minus canonicals).
- `npx convex run curatedRoutes:listCuratedRoutes` name-search "Cherohala Skyway" → exactly
  1 result; the shadow rows still exist in the table with `duplicateOf` set.
- No shadow appears in any browse mode result after `recomputeRiderReady` sweeps.
