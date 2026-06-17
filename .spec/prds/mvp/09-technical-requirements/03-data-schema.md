---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 2.0.0
---

# Data Schema (Discovery Read Path)

## curated_routes — lean fields actually present (read-only in MVP)

The table is defined by `curatedRouteValidator` (`server/models/curated-routes.ts`) and indexed in `convex/schema.ts`. MVP reads only the lean subset below. **All scores are 0-1.** Fields marked (sparse) are not 100% populated per the D0 data truth.

```typescript
curated_routes: {
  routeId: v.string(),                 // 100% — upsert key, index by_routeId
  name: v.string(),                    // 100%
  state: v.string(),                   // 100% but DIRTY (9 double-spelled) — normalize in read path
  source: v.union(...7 literals),      // fhwa|scenic_byways|motorcycleroads|bestbikingroads|rider_mag|bdr|editorial
  primaryArchetype: v.union(...6),     // twisties|mountain|coastal|adventure|scenic_byway|desert (DB enum)
  centroidLat: v.number(),             // 100%
  centroidLng: v.number(),             // 100%
  boundsNeLat/NeLng/SwLat/SwLng: v.number(), // 100% — bbox browse + framing
  lengthMiles: v.number(),             // present but JUNKY (outliers up to 710430; 64 zeros) — clamp on output
  compositeScore: v.number(),          // 100%, 0-1 (median 0.60, max 0.90)
  curvatureScore: v.number(),          // 100%, 0-1
  scenicScore: v.number(),             // 100%, 0-1
  technicalScore: v.number(),          // 100%, 0-1
  trafficScore: v.number(),            // 100%, 0-1
  remotenessScore: v.number(),         // 100%, 0-1
  summary: v.optional(v.string()),     // ~68% — detail headline derives from this or name
  description: v.optional(v.string()), // ~68% (sparse)
  oneLiner: v.optional(v.string()),    // 0% populated — DO NOT rely on; derive headline instead
  badges: v.optional(v.array(v.string())), // 0% populated — no badges in MVP
  designation: v.optional(v.string()), // 0% populated
  routePolyline: v.optional(v.string()),   // ~55% (3097/5654) — return as string|null; centroid fallback
  geometrySource: v.optional(v.string()),  // scraped_bbr|scraped|fhwa_existing|rider_mag_existing|scenic_byways_existing
  sourceLabel: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  contentVersion: v.number(),
  enrichmentVersion: v.optional(v.number()), // null = not enriched (true for ~all in MVP)
}
```

### Existing indexes (no new index required for MVP browse)
`by_source`, `by_archetype` (primaryArchetype), `by_state`, `by_composite_score`, `by_routeId`, `by_name_lower`, `by_highway_number`, vector `by_embedding` (unused in MVP). Bbox/nearest is served by the **geospatial component**, not a `curated_routes` index.

## curated_route_enrichments — EMPTY in MVP
```typescript
curated_route_enrichments: { routeId, fullDescription?, history?, photos[]?, elevationProfile[]?, recommendedStarts[]?, ... }  // 0 docs — NOT read in MVP
```

## Geospatial component points (seeded, NET-NEW data)
One point per curated_route, seeded from centroid (UC-DATA-01). Managed by the component, not a user-defined table.
```
point: {
  key: <curated_routes doc id (string)>,
  coordinates: { latitude: centroidLat, longitude: centroidLng },
  filterKeys: { state, primaryArchetype },   // matches geospatialIndex.ts typing
  sortKey: compositeScore,                    // 0-1, for best-sort
}
```

## saved_routes — ADD optional curatedRouteRef (additive, non-destructive)
Defined by `savedRouteValidator` (`server/models/saved-routes.ts`). MVP adds ONE optional field:
```typescript
saved_routes: {
  ownerType, ownerId, createdByUserId, visibility, name,
  planInput: planInputValidator,        // required today — relevant only for PLANNED saves
  routeSnapshot: routeSnapshotValidator, // required today — relevant only for PLANNED saves
  routeIndex: routeIndexValidator,       // required today — relevant only for PLANNED saves
  routeFingerprint?, snapshotMeta, routeProvenance?, createdAt, updatedAt, deletedAt?,
  // === NET-NEW (MVP) ===
  curatedRouteRef: v.optional(v.id('curated_routes')),  // present => curated BOOKMARK (no synthesized plan)
}
```
Existing indexes unchanged: `by_ownerType_and_ownerId`, `by_createdByUserId`, `by_ownerType_ownerId_routeFingerprint`. A curated bookmark is dereferenced back through `getCuratedRouteDetail(curatedRouteRef)` when reopened.

**Open schema decision (flag for implementer):** the existing required `planInput/routeSnapshot/routeIndex` make a pure bookmark awkward. Two options: (A) make them `v.optional()` and enforce 'curatedRouteRef XOR planned-payload' in the mutation (cleaner, slightly larger schema change); (B) keep them required and have the curated-bookmark mutation write a minimal sentinel snapshot (uglier, avoids schema churn). Recommended: **A** — optional + mutation-level XOR validation, which stays additive and non-destructive.
