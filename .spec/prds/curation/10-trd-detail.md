---
stability: CONSTITUTION
last_validated: 2026-04-10
prd_version: 1.4.0
---

# Curation TRD — Route Discovery Pipeline (Detailed)

**Version**: 1.4
**Status**: Draft
**Related PRD**: `.spec/prds/curation/README.md`
**Related Research**: `.spec/research/local-models/` (local-model validation + rollback rationale)

This document provides the complete technical architecture design for the Curation pipeline.

**v1.1 changes**: Adds AD-7 (ride segment aggregation), AD-8 (lean/enrichment tier split), AD-9 (shared-ID linking).
**v1.2 changes**: Replaces candidate-ranking with intent→SQL slot-filling.
**v1.3 changes**: Removes on-device Qwen; establishes Haiku-online + intent-cache as shipping path. Adds AD-10 (Pipeline Principles), AD-11 (Haiku+cache), AD-12 (calibration gate).
**v1.4 changes**: **Removes all client-side persistence.** AD-8 and AD-9 retired. AD-2 revised. No op-sqlite, no lean-sync, no enrichment-cache, no params_to_sql(). Single `curated_routes` Convex table with server-side projection. `intent_param_cache` moved to Convex as a shared cross-user table. Offline catalog browse removed from scope. Adds AD-13 (single-table), AD-14 (no client DB). §6 (Local SQLite Architecture) retired. §7 (Convex Integration) updated to single table. §11 (intent→Convex) updated.

---

## 0. Key Architecture Decisions

Before diving into layers, these decisions shape everything downstream:

**AD-1: Python pipeline is offline, not in-app.**
Why: The pipeline runs once (or monthly). It has zero runtime footprint on the mobile app. Python is the right tool for scraping + LLM extraction + pandas manipulation. The app only consumes the output via Convex sync.

**AD-2: Convex is the only database. No client-side cache for curation.**
Why (v1.4 revision): The mobile app queries Convex directly via typed `useQuery` calls. There is no op-sqlite mirror, no sync layer, no delta-version tracking. Convex's in-memory reactive client cache handles the session-duration locality. Offline catalog browse is out of scope (see AD-14).

**AD-3: Curvature comes from existing osm_ways geometry, not adamfranco/curvature.**
Why: The research docs explored adamfranco/curvature (OSM PBF pipeline), but the codebase already has `osm_ways.geometry: number[][]` in Convex. A TypeScript curvature proxy computed from bearing changes between geometry points is sufficient for MVP ranking. The full adamfranco pipeline is a Phase 2 enhancement when higher-fidelity scores are needed.

**AD-4: All LLM inference is server-side Haiku. No on-device LLM.**
Why: 2026-04-10 environment-bias finding showed all Qwen latency benchmarks were Mac-MLX only. Estimated iPhone latency: 6–15s. Dropped entirely in v1.3. The runtime for discovery is Convex queries — no model involved.

**AD-5: No vector DB, no embedding model, no fine-tuning in MVP.**
Why: Convex query filtering on pre-computed composite scores is sufficient for MVP. Semantic search would require its own research cycle and its own PRD.

**AD-6: Scoring is deterministic code, never LLM output.**
Why: LLM outputs are categorical (curviness: "twisty" | "moderate"). Code maps categories to numeric scores via lookup tables. This ensures reproducible, auditable scores.

**AD-7: Aggregation level is the ride segment, not the road or the route.**
Why: Raw OSM ways are semantically meaningless (1-5mi fragments). Named roads ("US-129") span hundreds of miles with wildly varying character. A **ride segment** (5–50 miles, one name, one coherent experience, one primary archetype) is the atom riders think in and editorial lists enumerate.

**~~AD-8: Lean/enrichment tier split.~~** (RETIRED in v1.4)
Rationale: The split was justified by (a) Qwen's 0.8B context window — dead in v1.3 — and (b) mobile sync payload size — addressed by Convex server-side projection, not a second table. With no client-side DB, there is no reason to maintain two tables with cross-tier version tracking. All fields are on one `curated_routes` document; the catalog-browse query projects only the narrow display fields. See AD-13.

**~~AD-9: Shared-ID version contract.~~** (RETIRED in v1.4)
Rationale: `enrichmentVersion` tracking, the `/routes/missing-enrichments` staleness check, and the cross-table join all exist to serve the lean/enrichment split. With a single table (AD-13) and no client-side DB (AD-14), there is nothing to track staleness against. Document version (`contentVersion`) remains for pipeline re-run detection — not for client sync.

**AD-13: Single `curated_routes` Convex table. Server-side projection at query boundary.**
Why: One document, all fields. Catalog queries return a narrow projection; detail queries return the full document. Convex handles projection server-side via typed query return types. For Haiku call sites: the server assembles whatever context slice the prompt needs at call time — context trimming is per-call, not per-storage-layer.

**AD-14: No client-side database for curation. Discovery requires connectivity.**
Why: Maintaining a local mirror of `curated_routes` would require op-sqlite (a native module), a sync layer, delta-version tracking, cache eviction logic, and a separate "is the local data stale?" check. The v1.4 architecture trades offline catalog browse for this simplification. Mapbox offline route *geometry* (downloaded tile regions) and turn-by-turn navigation remain offline-capable — those are Mapbox SDK's own storage, not op-sqlite. Discovery of new curated routes requires a Convex connection.

**AD-15: `intent_param_cache` is a shared Convex table, not a client-side store.**
Why: Moving the intent cache from device op-sqlite to a Convex table turns per-device cache warming into cross-user cache warming. The first user to type "twisty mountain roads" triggers one Haiku call; every subsequent user gets an instant query hit from the shared table. This compounds: by the time the app has 100 active users, the long tail of common intents is already warm from earlier sessions, with zero per-device cold-start cost.

---

## 1. Python Aggregation Pipeline

### 1.1 Platform

**Run locally.** This is a batch job, not a service.

- Rate limiting means the pipeline is I/O-bound (mostly waiting between requests)
- Full 17k-route crawl takes several hours — leave running overnight
- Results written incrementally to JSONL for crash recovery
- Final output pushed to Convex via HTTP action

**Fallback**: GitHub Actions manual trigger if laptop uptime is a concern (free tier covers 6-hour runs).

### 1.2 Directory Structure

```
scripts/curation/
  pipeline/
    __init__.py
    main.py              — orchestrator: source → extract → enrich → score → push
    config.py            — API keys, rate limits, Convex URL
    sources/
      __init__.py
      motorcycleroads.py  — state-paginated scraper
      bestbikingroads.py  — 17,976 route scraper
      twtex.py            — Top 100 scraper
      fhwa.py             — data.gov CSV download (no scraping)
      rider_magazine.py   — editorial ground truth extraction
    extraction/
      __init__.py
      schema.py           — Pydantic RouteAttributes model
      extract.py          — Instructor + Haiku extraction
      calibration.py      — run against known ground truth first
    enrichment/
      __init__.py
      elevation.py        — Mapbox/SRTM elevation profiles
      fhwa_join.py        — scenic designation lookup
    scoring/
      __init__.py
      score.py            — deterministic composite score
      classify.py         — archetype decision tree
    push/
      __init__.py
      convex_push.py      — HTTP action batch upsert
  data/
    raw/                  — JSONL output per source
    enriched/             — enriched + scored JSONL
    calibrated/           — calibration outputs
  requirements.txt
```

### 1.3 Scraping Layer

**Static pages (httpx + BeautifulSoup):**
- 2-4 second random delay between requests
- Rotating User-Agent strings
- Exponential backoff on 429/503 (2x delay, max 60s)
- Persistent httpx session (cookies, connection reuse)

**JS-rendered pages (Playwright fallback only):**
- Detect when httpx returns empty content
- Only use for sources that need it (most motorcycle sites are static)
- `playwright-stealth` for Cloudflare/bot detection

**Resumable writes:**
- Write each route to JSONL immediately after extraction
- Check `source_url` against existing JSONL before re-scraping
- Crash recovery = re-run the same command

### 1.4 Rate Limiting Rules

```
- 2-4s between requests to same domain (randomized jitter)
- Max 20 req/min to any single domain
- Exponential backoff on 429/503: 2x delay up to 60s max
- Reuse httpx session
- Check robots.txt before scraping
- Verify ToS for each source before first run
```

---

## 2. LLM Extraction Layer

### 2.1 Model Selection

**Claude Haiku 4.5** via Anthropic API + Instructor library.

| Factor | Decision |
|--------|----------|
| Cost | ~$34 for full 17k-route batch |
| Speed | 5 concurrent workers finishes in under 1 hour |
| Structured output | Excellent via Instructor (tool calling mode) |
| Temperature | 0 for all extraction (no creativity) |

### 2.2 Pydantic Schema

```python
class RouteAttributes(BaseModel):
    # Chain-of-thought FIRST — improves accuracy ~60%
    reasoning: str = Field(description="Brief reasoning about route character")

    road_name: str
    state: str
    region: Literal["northeast","southeast","midwest","southwest","west","pacific","mountain"]

    # Categorical ONLY — code computes numeric scores from these
    curviness: Literal["straight","mild","moderate","twisty","very_twisty"]
    scenery_type: list[Literal["mountain","coastal","forest","desert","canyon","valley","plains","urban"]]
    scenery_quality: Literal["unremarkable","pleasant","beautiful","spectacular"]
    traffic_level: Literal["low","moderate","high"]
    road_condition: Literal["poor","fair","good","excellent"]
    challenge_level: Literal["beginner","intermediate","advanced","expert"]
    surface: Literal["paved","gravel","dirt","mixed"]

    approx_length_miles: float | None = None
    key_highlights: list[str] = Field(max_length=3)
```

Design rules from Instructor benchmarks:
- Field names are semantic (use natural English labels)
- `reasoning` field first forces chain-of-thought
- `Literal` types constrain output, reduce hallucination
- Flat or one-level nesting only
- Tool calling mode over JSON mode (50% less variance)

### 2.3 Calibration

Before full batch:
1. Extract Rider Magazine Top 50 (known ground truth)
2. Review outputs — do categories match expectations?
3. Adjust prompt definitions if needed
4. Full batch only after calibration passes

### 2.4 Cross-Source Validation

For routes appearing on multiple sources (e.g., Tail of the Dragon):
- Run extraction independently per source
- Compare outputs — disagreement flags ambiguous text
- Merge by majority vote per field

---

## 3. Geometric Enrichment

### 3.1 Curvature (from existing osm_ways)

The codebase already has `osm_ways.geometry: number[][]` in Convex. Curvature is computed as a proxy from bearing changes:

```typescript
function curvatureScore(geometry: number[][]): number {
  // geometry = [[lon, lat], ...] — simplified (3+ points per way)
  let totalDelta = 0
  for (let i = 1; i < geometry.length - 1; i++) {
    const b1 = bearing(geometry[i - 1], geometry[i])
    const b2 = bearing(geometry[i], geometry[i + 1])
    let delta = Math.abs(b2 - b1)
    if (delta > 180) delta = 360 - delta
    totalDelta += delta
  }
  const lengthKm = pathLengthKm(geometry)
  return Math.min(totalDelta / (lengthKm * 10), 1.0)
}
```

This runs in the seed script, not the Python pipeline. The seed script queries `osm_ways` from Convex, computes curvature, and adds it to curated route records.

Note: Geometry is simplified (3 representative points per way), so this is a coarse proxy. Sufficient for MVP ranking.

### 3.2 Elevation (Mapbox/SRTM)

Mapbox Elevation API or SRTM data for elevation profiles:
- Total ascent in meters over route length
- Max elevation change over any 10-mile window (elevation_drama)

For FHWA seed data, elevation can be approximated from centroid lat/lng + known terrain. Full elevation profiles are a Phase 2 enhancement.

### 3.3 FHWA Scenic Designation

Direct download from data.gov — no scraping needed:
- 184 designated roads
- Classification: All-American Road (2+ intrinsic qualities) or State Scenic Byway
- 6 intrinsic qualities: scenic, natural, historic, cultural, recreational, archaeological
- Join by road name + state

---

## 4. Deterministic Scoring Engine

### 4.1 Lookup Tables

```python
CURVINESS_SCORE  = {"straight": 0, "mild": 2, "moderate": 5, "twisty": 8, "very_twisty": 10}
SCENERY_SCORE    = {"unremarkable": 0, "pleasant": 3, "beautiful": 7, "spectacular": 10}
CONDITION_SCORE  = {"poor": 0, "fair": 4, "good": 7, "excellent": 10}
TRAFFIC_SCORE    = {"low": 10, "moderate": 5, "high": 1}   # inverted
CHALLENGE_SCORE  = {"beginner": 2, "intermediate": 5, "advanced": 8, "expert": 10}
```

### 4.2 Composite Score Formula

```
composite_score = (
  0.25 * curviness_normalized
+ 0.15 * scenery_quality_normalized
+ 0.15 * traffic_score_normalized
+ 0.10 * road_condition_normalized
+ 0.15 * osm_curvature_normalized
+ 0.10 * elevation_drama_normalized
+ 0.05 * fhwa_designation_score     # 0, 0.5, or 1.0
+ 0.05 * community_rating_normalized
)
```

Output: 0.0 to 1.0

### 4.3 Calibration

Calibrate against Rider Magazine Top 50 as ground truth. Known iconic routes (Tail of the Dragon, Blue Ridge Parkway, Pacific Coast Highway) should score in the top tier. Adjust weights if calibration fails.

---

## 5. Archetype Classifier

Decision tree (not ML — interpretable, adjustable):

```python
def classify(attrs, geo) -> str:
    if surface in ("gravel","dirt","mixed") or bdr_tagged:
        return "adventure"
    if coastal_miles < 15 and fhwa_designation:
        return "coastal"
    if elevation_gain_m > 1200:
        return "mountain"
    if curviness in ("twisty","very_twisty"):
        return "twisties"
    if fhwa_designation:
        return "scenic_byway"
    return "desert"  # default: low curvature, remote, arid
```

MVP: most FHWA routes default to `scenic_byway`. Richer archetypes emerge after OSM curvature scoring.

---

## 6. Client Discovery Architecture (v1.4 — Pure Convex)

> **v1.4 note:** The Local SQLite discovery.db architecture from v1.1–v1.3 is **retired**. There is no op-sqlite, no sync layer, no offline mirror, and no local SQL for curation. This section describes the replacement: typed Convex queries and actions called directly from the client.

### 6.1 Client Access Pattern

The client uses Convex's React client (`useQuery`, `useMutation`, `useAction`) exclusively. No intermediate persistence layer.

```typescript
// Catalog browse — reactive, paginated
const routes = useQuery(api.routes.listByBbox, {
  lat: userLocation.lat,
  lng: userLocation.lng,
  radiusDeg: 0.5,
  archetype: activeArchetypeFilter,   // optional
  sortBy: "compositeScore",           // or "proximity"
  cursor: paginationCursor,           // optional
})

// Route detail — reactive, fetched on tap
const route = useQuery(api.routes.getById, { routeId })

// Intent search — action (async, calls Haiku on cache miss)
const { results, status } = useAction(api.routes.searchByIntent, {
  intent: userTypedText,
  userLat: userLocation.lat,
  userLng: userLocation.lng,
})

// Feedback — mutation
const recordFeedback = useMutation(api.routes.recordFeedback)
await recordFeedback({ routeId, action: "save" })
```

### 6.2 Convex Query Contract

Catalog queries return a **narrow projection** — display fields only. Detail queries return the full document. The distinction is enforced by the query's return type validator in Convex, not by a separate table.

```typescript
// Narrow projection (catalog browse)
type RouteCard = Pick<CuratedRoute,
  "routeId" | "name" | "state" | "primaryArchetype" | "secondaryTags" |
  "centroidLat" | "centroidLng" | "boundsNeLat" | "boundsNeLng" |
  "boundsSwLat" | "boundsSwLng" | "lengthMiles" |
  "compositeScore" | "curvatureScore" | "scenicScore" |
  "trafficScore" | "remotenessScore" |
  "oneLiner" | "summary" | "badges" | "season"
>

// Full document (detail view)
type RouteDetail = CuratedRoute  // everything on the document
```

### 6.3 File Map (in-app)

```
hooks/
  use-route-discovery.ts   — wraps useQuery(api.routes.listByBbox | listByState)
  use-route-detail.ts      — wraps useQuery(api.routes.getById), handles loading state
  use-intent-search.ts     — wraps useAction(api.routes.searchByIntent) + optimistic UI
  use-route-feedback.ts    — wraps useMutation(api.routes.recordFeedback)

convex/
  routes.ts                — query/mutation/action implementations (convex-planner output)
  schema.ts                — curated_routes + intent_param_cache + route_feedback table defs
```

**Deleted from the codebase (v1.4 rollback):**
- `lib/discovery/db.ts` — op-sqlite init
- `lib/discovery/sync-lean.ts` — bulk/delta sync
- `lib/discovery/fetch-enrichment.ts` — enrichment cache
- `lib/discovery/query.ts` — local SQL queries
- `lib/discovery/intent/` — all of: normalize.ts, cache.ts, params-to-sql.ts, validate.ts, schema.ts, search.ts, haiku-client.ts
- Any op-sqlite import in the curation domain

---

## 7. Convex Integration

> **v1.4 note:** The two-table schema (`curated_routes` lean + `curated_route_enrichments` rich) from v1.1–v1.3 is retired (AD-8 and AD-9 retired). This section now describes the single-table architecture.

One `curated_routes` table. All fields. Server-side projection at the query boundary. No client-side DB.

### 7.1 Schema Additions

```typescript
// See 09-technical-requirements.md § Data Schema for the full Convex validator.
// Single table with all fields. Server-side projection at query boundary.

curated_routes: defineTable(curatedRouteValidator)
  .index("by_state", ["state"])
  .index("by_archetype", ["primaryArchetype"])
  .index("by_score", ["compositeScore"])
  .index("by_centroid", ["centroidLat", "centroidLng"])
  .searchIndex("search_name", {
    searchField: "name",
    filterFields: ["state", "primaryArchetype"],
  }),

intent_param_cache: defineTable({ ... })
  .index("by_schema", ["schemaVersion"])
  .index("by_hit_count", ["hitCount"]),

route_feedback: defineTable({ ... })
  .index("by_route", ["routeId"])
  .index("by_user", ["userId"]),

// REMOVED: curated_route_enrichments (AD-8 retired)
```

### 7.2 Convex Functions

> Full typed function signatures are being produced by the convex-planner agent and will replace this section. The conceptual surface:

**Ingestion (internal — Python pipeline via HTTP action):**
- `internalMutation: upsertRoute({ route: CuratedRouteInput })` — upsert one document by `routeId`, bump `contentVersion` on change
- `internalMutation: batchUpsertRoutes({ routes: CuratedRouteInput[] })` — batch ingestion (up to 100 per call)

**Catalog queries (public — mobile client):**
- `query: listByBbox({ lat, lng, radiusDeg, archetype?, sortBy?, cursor? })` → narrow RouteCard projection, paginated
- `query: listByState({ state, archetype?, sortBy?, cursor? })` → narrow RouteCard projection, paginated
- `query: getById({ routeId })` → full CuratedRoute document

**Intent search (action — mobile client):**
- `action: searchByIntent({ intent, userLat, userLng })` → normalizes intent → checks `intent_param_cache` → calls Haiku on miss → writes cache → runs `listByBbox`-equivalent filter → returns RouteCard[]

**Feedback (mutation — mobile client):**
- `mutation: recordFeedback({ routeId, action, rating? })` → writes to `route_feedback`

**Metrics (query — admin dashboard):**
- `query: pipelineMetrics()` → totalRoutes, bySource, lastIngestAt, feedbackSummary

### 7.3 Access Patterns

No sync layer, no delta, no cache eviction. The client calls a query when it needs data; Convex's reactive client invalidates when the server data changes.

**Catalog browse:**
```
User opens discovery screen
  → useQuery(api.routes.listByBbox, { lat, lng, ... })
  → Convex returns narrow RouteCard projection (display fields only)
  → Paginated: load more as user scrolls
  → Requires connectivity — shows connection state if offline
```

**Route detail:**
```
User taps card
  → useQuery(api.routes.getById, { routeId })
  → Convex returns full document
  → Cached in Convex reactive client for session duration
  → Re-open same route in same session: instant from in-memory cache
```

**Intent search:**
```
User types "twisty mountain roads"
  → useAction(api.routes.searchByIntent, { intent, userLat, userLng })
  → Action: normalizeIntent → check intent_param_cache
  → Cache hit → run filter query → return results (instant if cached)
  → Cache miss → Haiku at temp=0 → write to intent_param_cache → run filter query
  → Results: RouteCard[] matching extracted params, ordered by compositeScore
```

---

## 8. Phase Sequencing for Implementation

### Phase 1: Seed Data (Weeks 1-2) — Zero external dependencies
- FHWA CSV ingestion script
- Composite scoring formula (pure functions)
- Archetype classifier (decision tree)
- Convex `curated_routes` schema + upsert mutations
- Local `discovery.db` init + sync
- ~184 FHWA routes + 10 BDR routes + 50 editorial routes = ~244 seed routes

### Phase 2: Web Scraping (Weeks 2-3)
- Python scraping infrastructure
- motorcycleroads.com + bestbikingroads.com extraction
- Resumable JSONL writes
- ToS compliance verification

### Phase 3: LLM Enrichment (Weeks 3-4)
- Haiku + Instructor integration
- Calibration against ground truth
- Full batch extraction (17k routes)
- Geometric enrichment from osm_ways

### Phase 4: Discovery UI (Weeks 4-5)
- Route discovery screen
- Map integration
- Filter/sort controls
- Route detail cards

### Phase 5: Data Flywheel (Weeks 5-6)
- User interaction tracking
- Feedback storage
- Auto-annotation schema
- Monitoring dashboard

---

## 9. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ToS violation on scraping | Medium | High | Verify each source before first run; prioritize FHWA (free) and editorial (citable) |
| LLM hallucination in attributes | Medium | Medium | Calibration against ground truth; cross-source validation; deterministic scoring |
| osm_ways geometry too simplified | Medium | Low | Coarse proxy is sufficient for MVP; Phase 2 adds adamfranco/curvature |
| Convex sync too slow for 17k routes | Low | Medium | Batch upsert in groups of 50; paginated initial sync; delta sync after first pull |
| Pipeline crash mid-batch | Medium | Low | JSONL incremental writes; resumable by checking already-scraped URLs |
| Memory ceiling on mobile | Low | High | No embedding model; SQL-only queries; discovery.db is separate file |

---

## 10. Files to Create/Modify

**New files:**
```
scripts/curation/                         — entire Python pipeline directory
  pipeline/extraction/extract.py          — Haiku extraction (attributes + lean text + rich content)
  pipeline/extraction/schema.py           — Pydantic RouteAttributes + LeanText + RichEnrichment
  pipeline/push/convex_push.py            — two endpoints: ingest-routes + ingest-enrichments

models/curated-routes.ts                  — lean tier Convex validator
models/curated-route-enrichments.ts       — rich tier Convex validator
convex/curated-routes.ts                  — lean + rich queries and mutations (both tiers)

lib/discovery/db.ts                       — op-sqlite discovery.db init + DDL (both tables)
lib/discovery/sync-lean.ts                — bulk/delta lean tier pull from Convex
lib/discovery/fetch-enrichment.ts         — per-route enrichment fetch + cache
lib/discovery/query.ts                    — queryNearby(), queryByState(), queryByArchetype()
lib/discovery/rank.ts                     — rankForIntent() orchestrator (SQL → Qwen3.5 → top N)
lib/discovery/prompts.ts                  — ranking prompt template (selection-only, no generation)

hooks/use-route-discovery.ts              — location + archetype + intent → ranked lean rows
hooks/use-route-enrichment.ts             — routeId → full enrichment, cache-first, online-aware
```

**Modified files:**
```
convex/schema.ts                          — add curated_routes + curated_route_enrichments tables
convex/http.ts                            — add POST /ingest-routes and POST /ingest-enrichments endpoints
```

---

## 11. Discovery Architecture (v1.4 — Convex Queries + Shared Intent Cache)

> **v1.4 rewrite.** This section previously described the "Local LLM Data Shape Strategy" — how data was structured to serve Qwen3.5 0.8B's context-window constraints. That strategy is fully retired. v1.4 has no on-device model, no client-side DB, and no local SQL. Discovery is pure Convex: typed queries and actions from the client.

### 11.1 The Principle That Replaces the Old Constraint

The old constraint: shape data to fit a small model's context window, because the model runs on device and context is expensive.

The new reality: Convex queries run on the server. There is no context window. The client says what it wants (typed query args); Convex returns what it asked for (typed projection). The only "context shaping" is for Haiku at Instructor call sites, and that's a server-side projection of the relevant fields — not a storage-layer constraint.

**The organizing principle is now: the right query interface, not the right data shape for a local model.**

### 11.2 Why Ride Segments Are Still the Right Atom

Unchanged from prior versions. The aggregation level is a product decision, not a model-context decision:

| Level | Verdict | Reason |
|-------|---------|--------|
| OSM way (1-5mi) | ❌ | No semantic identity |
| Named road ("US-129") | ❌ | Spans 500mi with wildly varying character |
| **Ride segment (5-50mi)** | ✅ | One coherent experience, one archetype, one set of scores. How editorial lists and riders think. |
| Full A→B planned route | ❌ | Mixed archetype composition |

### 11.3 The Pre-Digestion Asymmetry

All hard reasoning happens once, offline, during the Python pipeline. Runtime gets only the distilled result.

**Done offline (Haiku + deterministic code, one time per route):**
- Extract attributes from source text (Instructor + Haiku)
- Map categorical attributes → 0.0-1.0 scores (deterministic lookup tables)
- Compute geometric features from osm_ways geometry (curvature, elevation)
- Assign one `primaryArchetype` via decision tree
- Generate a 10-word `oneLiner` and 15-word `summary` (Haiku)
- Extract 3-5 discrete `badges` (Haiku, constrained to short phrases)
- Generate full `fullDescription`, `history`, trip planning context for the rich tier (Haiku)

**Done at query time (Convex server — no client-side compute):**
- `listByBbox(lat, lng, radiusDeg, archetype?, sortBy?)` → Convex query applies index scan on centroid + archetype, orders by `compositeScore`, returns narrow RouteCard projection
- `getById(routeId)` → Convex returns full document on demand
- `searchByIntent(intent, userLat, userLng)` → Convex action: normalize → check `intent_param_cache` → Haiku on miss → Convex filter query → RouteCard[]

No model on device. No SQL on device. No selection logic on device.

### 11.4 Intent Search Data Flow

```
User: "twisty mountain roads near me"
    │
    ▼
Convex action: searchByIntent
    │
    ├─ normalizeIntent("twisty mountain roads near me")
    │    → "twisty mountain roads"
    │
    ├─ db.query("intent_param_cache").withIndex("by_schema", ...).filter(normalizedIntent)
    │    → HIT: paramsJson cached → skip Haiku call
    │    → MISS: call Haiku at temp=0, write cache, return params
    │
    ├─ params: { archetype: "twisties", sort_by: "curvature" }
    │
    └─ db.query("curated_routes")
         .withIndex("by_centroid", ...)
         .filter(q => q.and(
           q.eq(q.field("primaryArchetype"), "twisties"),
           ... bounding box conditions ...
         ))
         .order("desc")    // by compositeScore (default) or curvatureScore
         .take(10)
         → RouteCard[]
```

No SQL string interpolation. No `params_to_sql()`. Convex validators enforce the schema at both the action args and the query return type.

### 11.5 Shared Intent Cache — Why It's Better Server-Side

| | Old: client op-sqlite | New: Convex shared table |
|---|---|---|
| Cache scope | Per-device | Across all users globally |
| First-user experience | Always cold start on new device | Warm after any user searches the same intent |
| Warming strategy | Usage-per-user | Usage-per-intent across entire userbase |
| Persistence | Lost on app uninstall | Permanent (server-side) |
| Implementation | op-sqlite DDL + sync layer | One Convex table + index |
| Cache invalidation | Schema version bump + DELETE sweep | Schema version bump + Convex filter |

### 11.6 What No LLM or Code Must Ever Do

- **Rank or select from a list of route candidates.** Ranking is `ORDER BY compositeScore DESC` in a Convex query.
- **Ask models to recall routes from training.** Sources-only (FHWA, scrape, OSM, BDR).
- **Run any inference on device.** All LLM calls are Convex actions (server-side).
- **Touch op-sqlite for curation data.** No local DB for the curation domain.
- **Write SQL strings.** Convex queries are typed function calls with validated args.

### 11.7 Latency Profile

| Operation | Path | Latency |
|---|---|---|
| Catalog browse (nearby) | `useQuery(listByBbox)` | ~100–300ms (Convex reactive) |
| Route detail (first open) | `useQuery(getById)` | ~100–300ms |
| Route detail (re-open in session) | Convex in-memory cache | <10ms |
| Intent search (cache hit) | `useAction(searchByIntent)` + cache lookup | ~200ms |
| Intent search (cache miss, Haiku) | `useAction(searchByIntent)` + Haiku | ~1.5–3s |
| All operations offline | N/A | Connection required — empty state shown |

---

The Python pipeline and the mobile app are fully decoupled. The pipeline writes to the single `curated_routes` Convex table; the app queries it. Phase 1 (FHWA + BDR + editorial = ~244 routes) can ship the discovery UI immediately while the full scraping pipeline is built in parallel.
