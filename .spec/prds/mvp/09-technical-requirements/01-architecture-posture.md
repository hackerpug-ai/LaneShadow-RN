---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 2.0.0
---

# Backend Architecture Posture

## Posture: read path over an existing healthy catalog, no destructive migration

The Discovery MVP backend is a **READ PATH** over tables that already exist and are already populated. The `curated_routes` table holds **5,654 verified rows** spanning all 50 states with 100% centroid + bounds + compositeScore + 5 dimension scores. The backend job is NOT to model new data — it is to (a) make the existing catalog **spatially queryable** and **publicly browsable**, and (b) let a route be **bookmarked**. Everything else is deferred.

### Locked stance 1 — No destructive migration
We do **not** rewrite, re-key, or bulk-mutate `curated_routes`. Three classes of data problem are solved in the **read path**, not by migration:
- **Archetype mismatch** (UI enum vs DB enum) -> a pure mapping layer in the query (UC-DATA-02), DB enum untouched.
- **Dirty state strings** (9 double-spelled states) -> a pure normalize transform query-side and return-side (UC-DATA-04), no write-back.
- **Junk lengthMiles** (outliers up to 710,430; 64 zeros) -> a pure clamp transform on the way out (UC-DATA-04), no write-back.

Write-back normalization (cleaning the catalog at rest) is an explicit **fast-follow**, not MVP. This keeps the MVP additive and reversible.

### Locked stance 2 — Spatial via the already-installed component
`@convex-dev/geospatial` (v0.2.1) is already installed, registered in `convex.config.ts`, and wired in `geospatialIndex.ts` with the right shape (key = route doc id, coordinates = centroid, filterKeys = `{state, primaryArchetype}`, sortKey = `compositeScore`). Its **points table is empty**. The MVP **seeds** it from `curated_routes` centroids (UC-DATA-01) and uses it for bbox/nearest browse. We do NOT build a custom spatial index; we do NOT use `.filter()` for geography.

### Locked stance 3 — Curated saves are bookmarks, not synthesized plans
`saved_routes` requires `planInput + routeSnapshot + routeIndex` (a fully planned route with legs). Curated routes have none of these. We add an **optional** `curatedRouteRef: v.id('curated_routes')` (UC-DATA-03) so a curated save is a first-class bookmark with **no fabricated PlanInput/legs**. Additive, optional, non-destructive — existing planned saves are untouched.

### The two new public functions are the only new surface
No public browse query exists today: `leanSync`/`fetchEnrichments`/`checkMissingEnrichments` are all `internalQuery` functions invoked from HTTP admin routes guarded by `CURATION_DEPLOY_KEY` (not Clerk-gated client-callable queries). The MVP adds exactly two NET-NEW public queries — `listCuratedRoutes` (UC-DATA-05) and `getCuratedRouteDetail` (UC-DATA-06) — plus the additive `curatedRouteRef` save path that reuses the existing save mutation pattern and the existing public `recordRouteFeedback` mutation. No existing function is modified.

### Hard data truths every backend decision honors
- **Scores are 0-1** (median composite 0.60, max 0.90). The API returns 0-1; the UI renders %/bars. The orphan mock screen's `score: 92` is wrong for real data.
- **Enrichment is EMPTY** (`curated_route_enrichments` = 0 docs). Detail is LEAN-only: no photos/history/elevation/recommendedStarts.
- **Geometry is partial** (`routePolyline` present for 55% / 3,097 of 5,654). Detail returns `routePolyline: string | null`; client falls back to a centroid marker.
- **oneLiner/badges/designation are 0% populated.** Detail headline is derived from `summary`/`name`; no badges in MVP.
- **Reads are auth-gated.** The existing pattern uses Clerk `requireIdentity`; the two new client-callable queries (`listCuratedRoutes`, `getCuratedRouteDetail`) follow the **same `requireIdentity` posture** (decision locked 2026-06-13, resolving R-DATA-9 / open item #74). Discovery browse is identity-gated for MVP — "public" refers only to the Convex function being client-callable (vs `internalQuery`), not anonymous access.
