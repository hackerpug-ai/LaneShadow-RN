---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 1.0.0
---

# API Design — Public Query Contracts

## Two NET-NEW public queries. Both have full `returns` validators. Scores are 0-1. `primaryArchetype` is returned as the UI enum.

### api.curatedRoutes.listCuratedRoutes (UC-DATA-05)
**Type:** query. **Auth:** follows existing Clerk `requireIdentity` posture (confirm public-vs-gated at implementation; existing curation reads are gated).

**Args**
```typescript
{
  bbox: v.optional(v.object({ north: v.number(), south: v.number(), east: v.number(), west: v.number() })),
  center: v.optional(v.object({ lat: v.number(), lng: v.number() })),  // required when sort='nearest'
  state: v.optional(v.string()),            // UI-supplied; normalized to match both dirty spellings
  archetypes: v.optional(v.array(v.string())), // UI enums; [] or omitted = all
  sort: v.optional(v.union(v.literal('best'), v.literal('nearest'))), // default 'best'
  limit: v.optional(v.number()),            // capped server-side, default ~50, hard max ~200
}
```
**Returns**
```typescript
v.array(v.object({
  routeId: v.string(),
  name: v.string(),
  state: v.string(),                 // canonical spelling
  primaryArchetype: v.string(),      // UI enum (mapped from DB enum)
  centroidLat: v.number(),
  centroidLng: v.number(),
  compositeScore: v.number(),        // 0-1
  curvatureScore: v.optional(v.number()),  // 0-1
  scenicScore: v.optional(v.number()),     // 0-1
  technicalScore: v.optional(v.number()),  // 0-1
  trafficScore: v.optional(v.number()),    // 0-1
  remotenessScore: v.optional(v.number()), // 0-1
  lengthMiles: v.optional(v.number()),     // clamped; undefined if junk/zero
  distanceMi: v.optional(v.number()),      // populated when sort='nearest'
  summary: v.optional(v.string()),
}))
```
**Resolution**
- `bbox`/`center` present -> `geospatial.query({rectangle})` / `geospatial.nearest({point, limit})` over seeded points, applying `filterKeys` for state/archetype and `sortKey` for best -> load lean fields from `curated_routes` by key.
- only `state` present -> `by_state` index, probing BOTH normalized spelling variants (UC-DATA-04). **Never `.filter()` for geography or state.**
- `archetypes` (UI) expanded to DB-archetype set via the archetype map (UC-DATA-02); applied as geospatial `filterKeys` or post-load filter; returned `primaryArchetype` mapped back to UI enum.
- `limit` capped; results truncated server-side to protect against the 5,654-row scale.

### api.curatedRoutes.getCuratedRouteDetail (UC-DATA-06)
**Type:** query. **Auth:** same posture.

**Args**
```typescript
{ routeId: v.string() }   // curated_routes routeId (resolve via by_routeId)
```
**Returns**
```typescript
v.union(
  v.object({
    routeId: v.string(),
    name: v.string(),
    state: v.string(),                 // canonical
    primaryArchetype: v.string(),      // UI enum
    centroidLat: v.number(),
    centroidLng: v.number(),
    boundsNeLat: v.number(), boundsNeLng: v.number(),
    boundsSwLat: v.number(), boundsSwLng: v.number(),
    compositeScore: v.number(),        // 0-1
    curvatureScore: v.optional(v.number()),
    scenicScore: v.optional(v.number()),
    technicalScore: v.optional(v.number()),
    trafficScore: v.optional(v.number()),
    remotenessScore: v.optional(v.number()),
    lengthMiles: v.optional(v.number()),     // clamped
    summary: v.optional(v.string()),         // headline source
    description: v.optional(v.string()),
    source: v.string(),
    sourceLabel: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    routePolyline: v.union(v.string(), v.null()),  // null for ~45% -> client centroid fallback
    geometrySource: v.optional(v.string()),
  }),
  v.null()  // route not found
)
```
**Notes**
- Returns LEAN fields only — `curated_route_enrichments` is EMPTY, so NO photos/history/elevation/recommendedStarts.
- `oneLiner`/`badges`/`designation` are 0% populated -> NOT returned; client derives headline from `summary`/`name`.
- Weather is a SEPARATE client call: `api.weather.getCurrentWeather({lat: centroidLat, lng: centroidLng})` -> `{tempF, condition, severity, dayOfWeek}`. Detail must render even if weather errors (degrade to 'conditions unavailable').

### Archetype map (UC-DATA-02) — pure, applied in both queries
| UI enum | DB archetype set (filter) | DB -> UI (return mapping) |
|---|---|---|
| twisties | {twisties} | twisties -> twisties |
| scenic | {scenic_byway, coastal} | scenic_byway -> scenic; coastal -> scenic |
| technical | {mountain} | mountain -> technical |
| cruising | {scenic_byway} (fallback) | (no native DB source) |
| sport | {twisties} (fallback) | (no native DB source) |
| adventure | {adventure, desert} | adventure -> adventure; desert -> adventure |
| all | (no filter) | — |
Final table is the implementer's to ratify; the **stance is locked**: map in the read path, never mutate the DB enum, and never return a raw DB-only value to the client.

### Save path (UC-DATA-03) — reuse + extend
Curated save -> existing save mutation pattern with `curatedRouteRef` set (no fabricated `planInput`/snapshot) + public `recordRouteFeedback({routeId, action: 'save'})` as flywheel input.
