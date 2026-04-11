---
stability: CONSTITUTION
created: 2026-04-10
author: convex-planner agent
status: ready-for-implementation
---

# Convex API Design: LaneShadow Curation Feature

Implementation target: hand this to `convex-implementer` to produce the actual code.

## 1. File Structure

```
models/
  curated-routes.ts              # curatedRouteValidator, IntentParams types, INTENT_SCHEMA_VERSION
  intent-param-cache.ts          # intentParamCacheValidator
  route-feedback.ts              # routeFeedbackValidator

convex/
  schema.ts                      # add 3 new tables
  http.ts                        # add 2 routes (/api/curation/ingest, /api/curation/metrics)
  db/
    curatedRoutes.ts             # upsert + queries + feedback + metrics
    intentParamCache.ts          # cache read/write internal mutations + queries
  actions/
    curation/
      searchByIntent.ts          # public action (Clerk auth) — 'use node' directive
      intentExtraction.ts        # Haiku call helper (non-exported utility)
```

**Node runtime note**: `actions/curation/searchByIntent.ts` MUST start with `'use node'` directive because it imports `@anthropic-ai/sdk`. Without it, the bundle fails to build.

---

## 2. Model Files (validators)

### `models/curated-routes.ts`

```typescript
import { v } from 'convex/values'

export const ROUTE_SOURCES = ['fhwa','motorcycleroads','bestbikingroads','bdr','editorial'] as const
export const ROUTE_ARCHETYPES = ['twisties','mountain','coastal','adventure','scenic_byway','desert'] as const
export const ROUTE_SEASONS = ['year_round','apr_nov','may_sep','spring_fall'] as const

export const routeSourceValidator = v.union(
  v.literal('fhwa'), v.literal('motorcycleroads'), v.literal('bestbikingroads'),
  v.literal('bdr'), v.literal('editorial'),
)
export const routeArchetypeValidator = v.union(
  v.literal('twisties'), v.literal('mountain'), v.literal('coastal'),
  v.literal('adventure'), v.literal('scenic_byway'), v.literal('desert'),
)
export const routeSeasonValidator = v.union(
  v.literal('year_round'), v.literal('apr_nov'),
  v.literal('may_sep'), v.literal('spring_fall'),
)

export const curatedRouteValidator = v.object({
  routeId: v.string(),
  name: v.string(),
  state: v.string(),
  source: routeSourceValidator,
  primaryArchetype: routeArchetypeValidator,
  secondaryTags: v.array(v.string()),

  centroidLat: v.number(),
  centroidLng: v.number(),
  boundsNeLat: v.number(),
  boundsNeLng: v.number(),
  boundsSwLat: v.number(),
  boundsSwLng: v.number(),
  lengthMiles: v.optional(v.number()),

  compositeScore: v.number(),
  curvatureScore: v.optional(v.number()),
  scenicScore: v.optional(v.number()),
  technicalScore: v.optional(v.number()),
  trafficScore: v.optional(v.number()),
  remotenessScore: v.optional(v.number()),

  oneLiner: v.optional(v.string()),
  summary: v.optional(v.string()),
  badges: v.optional(v.array(v.string())),
  season: v.optional(routeSeasonValidator),

  // Full content — returned only by getById
  fullDescription: v.optional(v.string()),
  history: v.optional(v.string()),
  photos: v.optional(v.array(v.object({
    url: v.string(), caption: v.string(), attribution: v.string(),
  }))),
  roadClassification: v.optional(v.array(v.string())),
  surfaceMaterial: v.optional(v.string()),
  totalElevationGainM: v.optional(v.number()),
  elevationProfile: v.optional(v.array(v.number())),
  nearestCities: v.optional(v.array(v.string())),
  recommendedStarts: v.optional(v.array(v.object({
    lat: v.number(), lng: v.number(), name: v.string(),
  }))),
  fuelStops: v.optional(v.array(v.object({
    lat: v.number(), lng: v.number(), name: v.string(), milesFromStart: v.number(),
  }))),
  ridershipLevel: v.optional(v.union(
    v.literal('low'), v.literal('moderate'), v.literal('high'),
  )),
  seasonalNotes: v.optional(v.string()),
  safetyWarnings: v.optional(v.array(v.string())),
  gpxUrl: v.optional(v.string()),

  // Provenance
  sources: v.array(v.object({
    site: v.string(),
    url: v.string(),
    lastFetched: v.number(),
    extractionConfidence: v.number(),
  })),
  extractedBy: v.union(v.literal('haiku'), v.literal('manual')),
  extractedAt: v.number(),
  extractionSchemaVersion: v.number(),

  contentVersion: v.number(),
  seededAt: v.number(),
})

// Narrow projection for list queries (catalog browse)
export const routeCardValidator = v.object({
  _id: v.id('curated_routes'),
  routeId: v.string(),
  name: v.string(),
  state: v.string(),
  primaryArchetype: routeArchetypeValidator,
  secondaryTags: v.array(v.string()),
  centroidLat: v.number(),
  centroidLng: v.number(),
  boundsNeLat: v.number(),
  boundsNeLng: v.number(),
  boundsSwLat: v.number(),
  boundsSwLng: v.number(),
  lengthMiles: v.optional(v.number()),
  compositeScore: v.number(),
  curvatureScore: v.optional(v.number()),
  scenicScore: v.optional(v.number()),
  technicalScore: v.optional(v.number()),
  trafficScore: v.optional(v.number()),
  remotenessScore: v.optional(v.number()),
  oneLiner: v.optional(v.string()),
  summary: v.optional(v.string()),
  badges: v.optional(v.array(v.string())),
  season: v.optional(routeSeasonValidator),
})

export type CuratedRoute = typeof curatedRouteValidator.type
export type RouteCard = typeof routeCardValidator.type

// IntentParams — 10 nullable fields extracted from intent strings
export const INTENT_SCHEMA_VERSION = 1

export const intentParamsValidator = v.object({
  archetype: v.union(routeArchetypeValidator, v.null()),
  state: v.union(v.string(), v.null()),
  minLengthMi: v.union(v.number(), v.null()),
  maxLengthMi: v.union(v.number(), v.null()),
  maxTechnical: v.union(v.number(), v.null()),
  minTrafficScore: v.union(v.number(), v.null()),
  minRemoteness: v.union(v.number(), v.null()),
  maxDistanceMi: v.union(v.number(), v.null()),
  season: v.union(routeSeasonValidator, v.null()),
  sortBy: v.union(
    v.literal('compositeScore'),
    v.literal('proximity'),
    v.null(),
  ),
})
export type IntentParams = typeof intentParamsValidator.type
```

### `models/intent-param-cache.ts`

```typescript
import { v } from 'convex/values'

export const intentParamCacheValidator = v.object({
  normalizedIntent: v.string(),
  paramsJson: v.string(),
  schemaVersion: v.number(),
  hitCount: v.number(),
  createdAt: v.number(),
  lastHitAt: v.optional(v.number()),
})
```

### `models/route-feedback.ts`

```typescript
import { v } from 'convex/values'

export const routeFeedbackActionValidator = v.union(
  v.literal('save'), v.literal('hide'),
  v.literal('complete'), v.literal('rate'),
)

export const routeFeedbackValidator = v.object({
  routeId: v.string(),
  userId: v.string(),    // clerkUserId
  action: routeFeedbackActionValidator,
  rating: v.optional(v.number()),
  locationLat: v.optional(v.number()),
  locationLng: v.optional(v.number()),
  archetypeFilter: v.optional(v.string()),
  timestamp: v.number(),
})
```

---

## 3. Schema Additions (`convex/schema.ts`)

Add imports:
```typescript
import { curatedRouteValidator } from '../models/curated-routes'
import { intentParamCacheValidator } from '../models/intent-param-cache'
import { routeFeedbackValidator } from '../models/route-feedback'
```

Add to `defineSchema({ ... })`:

```typescript
curated_routes: defineTable(curatedRouteValidator)
  .index('by_routeId', ['routeId'])
  .index('by_state', ['state'])
  .index('by_state_and_archetype', ['state', 'primaryArchetype'])
  .index('by_archetype', ['primaryArchetype'])
  .index('by_archetype_and_score', ['primaryArchetype', 'compositeScore'])
  .index('by_score', ['compositeScore'])
  .index('by_centroid', ['centroidLat', 'centroidLng'])
  .index('by_source', ['source'])
  .index('by_extractedAt', ['extractedAt'])
  .searchIndex('search_name', {
    searchField: 'name',
    filterFields: ['state', 'primaryArchetype'],
  }),

intent_param_cache: defineTable(intentParamCacheValidator)
  .index('by_normalizedIntent_and_schemaVersion', ['normalizedIntent', 'schemaVersion'])
  .index('by_schemaVersion', ['schemaVersion'])
  .index('by_hitCount', ['hitCount']),

route_feedback: defineTable(routeFeedbackValidator)
  .index('by_route', ['routeId'])
  .index('by_user', ['userId'])
  .index('by_user_and_route', ['userId', 'routeId'])
  .index('by_timestamp', ['timestamp']),
```

**Index rationale:**
- `by_routeId` — upsert lookup (pipeline's primary key; Convex has no unique constraint — enforced in mutation)
- `by_state_and_archetype` — `listByState` with optional archetype filter
- `by_archetype_and_score` — archetype filter + compositeScore sort (hot discovery path)
- `by_centroid` — bbox lat range scan for `listByBbox`
- `by_extractedAt` — metrics `lastIngestAt`
- `by_user_and_route` — de-dupes feedback per user (future)

---

## 4. Ingestion Layer (`convex/db/curatedRoutes.ts`)

### `internalMutation: upsertCuratedRoute`

```typescript
args: { route: curatedRouteValidator }
returns: v.object({
  routeId: v.string(),
  contentVersion: v.number(),
  action: v.union(v.literal('created'), v.literal('updated'), v.literal('unchanged')),
})
```

Handler logic:
1. `existing = db.query('curated_routes').withIndex('by_routeId', q => q.eq('routeId', route.routeId)).unique()`
2. If no existing: insert with `contentVersion: 1, seededAt: now`, return `action: 'created'`
3. Compute stable content hash (JSON.stringify with keys sorted, excluding `contentVersion`, `seededAt`, `_id`, `_creationTime`)
4. If hash unchanged: return `action: 'unchanged'`
5. Else: patch with new fields, `contentVersion: existing.contentVersion + 1`, return `action: 'updated'`

**Gotcha**: Content hash must exclude Convex-managed fields (`_id`, `_creationTime`) and self-referential fields (`contentVersion`, `seededAt`).

### `internalMutation: batchUpsertCuratedRoutes`

```typescript
args: { routes: v.array(curatedRouteValidator) }  // max 100
returns: v.object({
  created: v.number(),
  updated: v.number(),
  unchanged: v.number(),
  errors: v.array(v.object({ routeId: v.string(), message: v.string() })),
})
```

Handler: validate `routes.length <= 100` (throw `ConvexError('BATCH_TOO_LARGE')`), call `upsertCuratedRouteHandler(ctx, { route })` for each, wrap each in try/catch to accumulate errors.

**Gotcha**: Call the handler function directly (same transaction), not via `ctx.runMutation`. This keeps all 100 in a single atomic transaction unless individual rows throw (which we catch per-item into the `errors` array).

---

## 5. HTTP Routes (additions to `convex/http.ts`)

### `POST /api/curation/ingest`

- Auth: `x-curation-ingest-key` header must match env var `CURATION_INGEST_KEY`
- Body: `{ routes: CuratedRoute[] }` (max 100 per batch)
- Calls: `ctx.runMutation(internal.db.curatedRoutes.batchUpsertCuratedRoutes, { routes })`
- Returns: `{ created, updated, unchanged, errors[] }` with status 200

### `POST /api/curation/metrics`

- Auth: same `x-curation-ingest-key` header
- Calls: `ctx.runQuery(internal.db.curatedRoutes.curationMetricsInternal, {})`
- Returns metrics JSON with status 200

**Env var**: `npx convex env set CURATION_INGEST_KEY <random-secret>`. Python pipeline stores the same value in its `.env` as `CONVEX_CURATION_KEY`.

---

## 6. Client-Facing Queries (`convex/db/curatedRoutes.ts`)

### `query: listByBbox`

```typescript
args: {
  lat: v.number(),
  lng: v.number(),
  radiusDeg: v.number(),
  archetype: v.optional(routeArchetypeValidator),
  sortBy: v.optional(v.union(v.literal('compositeScore'), v.literal('proximity'))),
  paginationOpts: paginationOptsValidator,
}
returns: v.object({
  page: v.array(routeCardValidator),
  isDone: v.boolean(),
  continueCursor: v.string(),
})
```

Handler:
```
swLat = lat - radiusDeg; neLat = lat + radiusDeg
swLng = lng - radiusDeg; neLng = lng + radiusDeg

result = await db.query('curated_routes')
  .withIndex('by_centroid', q => q.gte('centroidLat', swLat).lte('centroidLat', neLat))
  .paginate(paginationOpts)

filtered = result.page.filter(r =>
  r.centroidLng >= swLng && r.centroidLng <= neLng &&
  (!archetype || r.primaryArchetype === archetype)
)

if (sortBy === 'proximity') sort by haversine(lat, lng, r.centroidLat, r.centroidLng) asc
else sort by compositeScore desc

return { page: filtered.map(toRouteCard), isDone: result.isDone, continueCursor: result.continueCursor }
```

**Gotcha**: `.paginate()` page size may be smaller than requested due to post-filter. Acceptable for v1. At scale, switch to S2 cell indexing (matching existing `osm_nodes.s2Token` pattern in the codebase).

### `query: listByState`

```typescript
args: {
  state: v.string(),
  archetype: v.optional(routeArchetypeValidator),
  sortBy: v.optional(v.literal('compositeScore')),
  paginationOpts: paginationOptsValidator,
}
returns: v.object({
  page: v.array(routeCardValidator),
  isDone: v.boolean(),
  continueCursor: v.string(),
})
```

Handler: use `by_state_and_archetype` if archetype provided, else `by_state`. Post-sort page by `compositeScore` desc in handler.

**Note**: `order('desc')` in Convex orders by `_creationTime`, not `compositeScore`. In-handler sort is required.

### `query: getById`

```typescript
args: { routeId: v.string() }
returns: v.union(v.null(), v.object({
  _id: v.id('curated_routes'),
  _creationTime: v.number(),
  ...  // all fields — full CuratedRoute doc
}))
```

Handler: `.withIndex('by_routeId', q => q.eq('routeId', routeId)).unique()`

Returns the **full document** — all fields including `fullDescription`, `photos`, `history`.

---

## 7. Intent Search Action (`convex/actions/curation/searchByIntent.ts`)

```
'use node'    ← required at top of file
```

### Intent Normalization

```typescript
const STOPWORDS = new Set([
  'a','an','the','i','me','my','want','find','show','give','please',
  'some','any','with','for','of','to','on','in','and','or','that','this',
  'roads','road','ride','rides','route','routes',
])

export const normalizeIntent = (raw: string): string =>
  raw
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')  // strip accents
    .replace(/[^\w\s]/g, ' ')                             // strip punctuation
    .split(/\s+/)
    .filter(tok => tok.length > 0 && !STOPWORDS.has(tok))
    .sort()                                               // order-insensitive cache key
    .join(' ')
    .trim()
```

**Design choice**: `.sort()` makes "twisty mountain" and "mountain twisty" share a cache entry. Remove if order-sensitivity ever matters.

### `action: searchByIntent`

```typescript
args: {
  intent: v.string(),
  userLat: v.number(),
  userLng: v.number(),
}
returns: v.object({
  params: intentParamsValidator,
  cacheHit: v.boolean(),
  results: v.array(routeCardValidator),
})
```

Flow:
1. `await requireIdentity(ctx)` — throw if unauthenticated (prevent anonymous Haiku cost burn)
2. `normalized = normalizeIntent(args.intent)` — throw `ConvexError('EMPTY_INTENT')` if empty
3. `cached = await ctx.runQuery(internal.db.intentParamCache.getByNormalizedIntent, { normalizedIntent: normalized, schemaVersion: INTENT_SCHEMA_VERSION })`
4. If cached: parse `paramsJson` → `params`, bump hit count (fire-and-forget via `ctx.runMutation`)
5. If miss: `params = await extractIntentParams(intent)` — if degenerate (all null), retry once — then `ctx.runMutation(internal.db.intentParamCache.upsert, { normalizedIntent, paramsJson: JSON.stringify(params), schemaVersion })`
6. `results = await ctx.runQuery(internal.db.curatedRoutes.searchByParams, { params, userLat, userLng, limit: 10 })`
7. Return `{ params, cacheHit, results }`

If `extractIntentParams` throws: `throw new ConvexError('INTENT_EXTRACTION_FAILED')` — client shows a fallback (top-score list).

### Haiku helper (`extractIntentParams`)

Non-exported, same file. Uses `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })`.

System prompt extracts 10 nullable keys at `temperature: 0`. Parse the JSON response, validate each enum field, return `IntentParams` with nulls for unrecognized values.

### `internalQuery: searchByParams` (`convex/db/curatedRoutes.ts`)

```typescript
args: {
  params: intentParamsValidator,
  userLat: v.number(),
  userLng: v.number(),
  limit: v.number(),
}
returns: v.array(routeCardValidator)
```

Handler: pick index based on params (state+archetype → `by_state_and_archetype`, archetype only → `by_archetype_and_score`, state only → `by_state`, neither → `by_score`). Take 200 candidates, in-memory filter on all numeric params, sort, return `.slice(0, limit).map(toRouteCard)`.

---

## 8. Intent Param Cache (`convex/db/intentParamCache.ts`)

### `internalQuery: getByNormalizedIntent`
```typescript
args: { normalizedIntent: v.string(), schemaVersion: v.number() }
returns: v.union(v.null(), v.object({ _id: v.id('intent_param_cache'), paramsJson: v.string(), hitCount: v.number() }))
```
Handler: `.withIndex('by_normalizedIntent_and_schemaVersion', q => q.eq('normalizedIntent', ...).eq('schemaVersion', ...)).unique()`. Schema version mismatch → null (cache miss).

### `internalMutation: upsert`
```typescript
args: { normalizedIntent: v.string(), paramsJson: v.string(), schemaVersion: v.number() }
```
Handler: upsert by `(normalizedIntent, schemaVersion)`, set `hitCount: 1, createdAt: now, lastHitAt: now`.

### `internalMutation: bumpHit`
```typescript
args: { cacheId: v.id('intent_param_cache') }
```
Handler: patch `{ hitCount: existing.hitCount + 1, lastHitAt: Date.now() }`.

---

## 9. Feedback Mutation (`convex/db/curatedRoutes.ts`)

### `mutation: recordRouteFeedback`

```typescript
args: {
  routeId: v.string(),
  action: routeFeedbackActionValidator,
  rating: v.optional(v.number()),
  locationLat: v.optional(v.number()),
  locationLng: v.optional(v.number()),
  archetypeFilter: v.optional(v.string()),
}
returns: v.object({ feedbackId: v.id('route_feedback') })
```

Handler:
- `const { clerkUserId } = await requireIdentity(ctx)` — throws if unauthenticated
- Validate: `action === 'rate'` requires `rating` ∈ [1,5]; other actions must NOT have rating
- `db.insert('route_feedback', { routeId, userId: clerkUserId, action, rating, ..., timestamp: Date.now() })`

---

## 10. Metrics Queries (`convex/db/curatedRoutes.ts`)

### `query: curationMetrics` (public, logged-in)
### `internalQuery: curationMetricsInternal` (for HTTP action)

```typescript
returns: v.object({
  totalRoutes: v.number(),
  bySource: v.record(v.string(), v.number()),
  lastIngestAt: v.union(v.number(), v.null()),
  totalFeedback: v.number(),
})
```

Handler: full-table scan — acceptable at launch volume. Add rollup table at 5k+ rows. `lastIngestAt = max(extractedAt)` across all docs.

---

## 11. Endpoint Summary

| Function | Runtime | Kind | File | Caller |
|----------|---------|------|------|--------|
| `upsertCuratedRoute` | Convex | internalMutation | `db/curatedRoutes.ts` | Pipeline (via HTTP) |
| `batchUpsertCuratedRoutes` | Convex | internalMutation | `db/curatedRoutes.ts` | Pipeline (via HTTP) |
| `listByBbox` | Convex | query | `db/curatedRoutes.ts` | Mobile client |
| `listByState` | Convex | query | `db/curatedRoutes.ts` | Mobile client |
| `getById` | Convex | query | `db/curatedRoutes.ts` | Mobile client |
| `searchByParams` | Convex | internalQuery | `db/curatedRoutes.ts` | `searchByIntent` action |
| `recordRouteFeedback` | Convex | mutation | `db/curatedRoutes.ts` | Mobile client (authed) |
| `curationMetrics` | Convex | query | `db/curatedRoutes.ts` | Admin dashboard |
| `curationMetricsInternal` | Convex | internalQuery | `db/curatedRoutes.ts` | HTTP metrics route |
| `intentParamCache.getByNormalizedIntent` | Convex | internalQuery | `db/intentParamCache.ts` | `searchByIntent` action |
| `intentParamCache.upsert` | Convex | internalMutation | `db/intentParamCache.ts` | `searchByIntent` action |
| `intentParamCache.bumpHit` | Convex | internalMutation | `db/intentParamCache.ts` | `searchByIntent` action |
| `searchByIntent` | Node | action | `actions/curation/searchByIntent.ts` | Mobile client (authed) |
| `POST /api/curation/ingest` | Node | httpAction | `http.ts` | Python pipeline |
| `POST /api/curation/metrics` | Node | httpAction | `http.ts` | Python pipeline / admin |

---

## 12. Convex Patterns & Gotchas

1. **`'use node'` required** on `actions/curation/searchByIntent.ts` — Anthropic SDK needs Node runtime.
2. **Actions call queries/mutations via `ctx.runQuery` / `ctx.runMutation`** — use `internal.db.*` references, never import handlers directly across the action/query boundary.
3. **No unique constraints in Convex** — enforce `routeId` uniqueness in `upsertCuratedRoute` via read-then-insert in the same mutation.
4. **`paginationOptsValidator` from `'convex/server'`**, not `'convex/values'`.
5. **`order('desc')` sorts by `_creationTime`** in Convex, not by a custom field. Post-sort in handler for `compositeScore` ordering.
6. **No `filter()` in index scans** — `listByBbox` does lat scan on index + in-memory lng filter. Acceptable for v1; documented S2 upgrade path exists.
7. **`ConvexError` with stable codes** — client pattern-matches on `error.data`. Use: `'BATCH_TOO_LARGE'`, `'EMPTY_INTENT'`, `'INTENT_EXTRACTION_FAILED'`, `'INVALID_RATING'`, `'RATING_ONLY_ALLOWED_ON_RATE'`.
8. **`toRouteCard` is a local helper** — not exported as a Convex function. Put in `db/curatedRoutes.ts` as `const toRouteCard = (doc: Doc<'curated_routes'>): RouteCard => ({ ... })`.
9. **`INTENT_SCHEMA_VERSION = 1`** — bump when the Haiku prompt schema changes. Old cache rows coexist harmlessly (different schemaVersion → cache miss).
10. **Content-hash for upsert**: serialize doc with keys sorted, excluding `contentVersion`, `seededAt`, `_id`, `_creationTime`. Use `JSON.stringify` on a sorted-keys object.
11. **Batch handler in same transaction**: call `upsertCuratedRouteHandler(ctx, { route })` directly (not via `ctx.runMutation`) to keep all 100 rows in one transaction, with per-item catch.
12. **`requireIdentity`**: existing helper in `convex/guards.ts` — check its signature before using.
13. **Return-type validators required**: every registered Convex function needs an explicit `returns:` validator for production deploys.

---

## 13. Test Planning

| File | Coverage |
|------|----------|
| `tests/convex/curatedRoutes.upsert.test.ts` | create, update (bumps contentVersion), unchanged (stable hash), batch success, batch partial failure, batch-too-large |
| `tests/convex/curatedRoutes.queries.test.ts` | listByBbox filters/sort/pagination, listByState with/without archetype, getById found/not-found, toRouteCard projection |
| `tests/convex/curatedRoutes.feedback.test.ts` | authed, unauthed throws, rate requires rating, rating bounds, non-rate rejects rating |
| `tests/convex/curatedRoutes.metrics.test.ts` | empty DB, mixed sources, lastIngestAt, feedback count |
| `tests/convex/intentParamCache.test.ts` | cache hit, miss, schemaVersion mismatch → miss, bumpHit increments, upsert overwrites |
| `tests/convex/searchByIntent.test.ts` | normalize determinism, stopword strip, sort idempotence, cache-hit path (no Haiku), cache-miss (Haiku mocked), degeneration retry, auth required, empty intent rejected |
| `tests/convex/http.curation.test.ts` | ingest auth required, batch-size limit, ingest success, metrics auth required |

Use `convex-test` + vitest. Mock `@anthropic-ai/sdk` via `vi.mock`.

---

## 14. Migration Strategy

Schema-only feature — no existing data to migrate. Steps:
1. Create model files
2. Update `convex/schema.ts` (three new tables + indexes)
3. Create `convex/db/curatedRoutes.ts` and `convex/db/intentParamCache.ts`
4. Create `convex/actions/curation/searchByIntent.ts`
5. Add HTTP routes to `convex/http.ts`
6. Set env vars: `npx convex env set CURATION_INGEST_KEY <secret>`
7. `npx convex dev` to push schema and generate types
8. Python pipeline points at `https://<deployment>.convex.site/api/curation/ingest`

---

## 15. Data Integrity Rules

- `routeId` unique enforced in `upsertCuratedRoute` (read-then-insert per mutation)
- `contentVersion` monotonically increases — only `upsertCuratedRoute` modifies it
- `route_feedback.userId` is always the authenticated Clerk user (never client-supplied)
- `intent_param_cache.paramsJson` is validated before write; downstream readers trust the shape
- `INTENT_SCHEMA_VERSION` bumps invalidate cache without deletion — old rows coexist harmlessly
- Haiku failures throw `ConvexError('INTENT_EXTRACTION_FAILED')` — client shows graceful fallback (top-compositeScore list)

---

## 16. Performance Notes

- `by_archetype_and_score` is the hot-path for `searchByIntent` when only `archetype` is known
- `listByBbox` in-memory filter is O(lat-band-size) — fine at 0.5° radius / 2k routes; migrate to S2 cells at 50k+ routes (matching existing `osm_nodes.s2Token` pattern)
- `curationMetrics` full-scan acceptable at launch; add rollup table at 5k+ rows
- `intent_param_cache` upsert: read-then-write inside same mutation transaction — Convex atomicity prevents duplicate cache entries
- Anthropic SDK cold start ~200ms per container — expected; cache hits are <10ms
