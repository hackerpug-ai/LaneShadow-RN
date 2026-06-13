---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 1.1.0
---

# API Design — Public Query Contracts

## Two NET-NEW public queries. Both have full `returns` validators. Scores are 0-1. `primaryArchetype` is returned as the UI enum.

### Auth-gate precondition (decision locked 2026-06-13, resolves R-DATA-9 / open item #74)

Both queries are **Clerk-gated** via the established `requireIdentity` posture — Discovery browse requires an authenticated session for MVP (founder confirmation: *"the app should already be gated via clerk"*). "Public query" here means the Convex function is client-callable (an exported `query`, not an `internalQuery`), **not** anonymous/no-auth access. This matches the posture of every existing **client-callable public read** in the backend (`savedRoutes.list` / `planningSessions.list` / `favoriteRoads.list` all call `requireIdentity`). Note: the curation pipeline's `leanSync` / `fetchEnrichments` are a *different* pattern — `internalQuery` functions invoked from HTTP admin routes guarded by `CURATION_DEPLOY_KEY`, not Clerk — so they are **not** the precedent here.

**Verified codebase state (2026-06-13):** Clerk is wired at the root (`app/_layout.tsx` → `ClerkProvider` + `ConvexProviderWithClerk`) and identity-routing infrastructure EXISTS — the `(auth)` group gates via Convex `<Authenticated>`/`<Unauthenticated>` (`app/(auth)/_layout.tsx`: unauthenticated → sign-in stack; authenticated → `<Redirect to /(app)>`), and `signOut` → `/(auth)/sign-in`. `app/README.md` documents the intent (`(app)/` = "Authenticated screens"). **But the enforcement guard on the `(app)` group itself is missing:** `app/index.tsx` redirects unconditionally to `/(app)/(tabs)` with no `isSignedIn` check, and neither `(app)/_layout.tsx` nor `(tabs)/_layout.tsx` redirects an unauthenticated session to `/(auth)/sign-in`. So a **logged-out cold launch lands on the app home, not the login page** — queries are client-skipped (`(tabs)/index.tsx` gates queries on `clerkLoaded && isSignedIn`); the backend `requireIdentity` is the independent **server-side** enforcement that rejects an unauthenticated call regardless. The new Discovery queries inherit both layers. The founder (always signed in via cached Clerk token) never observes the gap.

**Impact on the MVP:** the founder (user #1, always signed in) is unaffected — the cold-launch → Discovery arc works for him. Unsigned users would see Discovery render with no data (queries skip) — a pre-existing app-level concern, **not** introduced or required by this MVP. If the team wants a hard sign-in wall before broad release (redirect unsigned → `/(auth)/sign-in`), that is tracked separately and is out of scope for the Discovery-MVP PRD.

### api.curatedRoutes.listCuratedRoutes (UC-DATA-05)
**Type:** query. **Auth:** **Clerk-gated** via the established `requireIdentity` posture — decision locked 2026-06-13 (resolves R-DATA-9 / open item #74); see [Auth-gate precondition](#auth-gate-precondition) below. Discovery browse requires an authenticated session, consistent with every existing read in the backend.

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
