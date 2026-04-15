---
stability: FEATURE_SPEC
last_validated: 2026-04-14
prd_version: 1.0.0
---

# Technical Requirements

## Architecture (at a glance)

```
┌──────────────────── Sourcing layer ────────────────────┐
│  Overture bulk download, HMDB, NRHP, GNIS, NPS/USDA/   │
│  FHWA, OSM Overpass, UC-RIDER-03 forum NLP,            │
│  founder-seed CSVs, AllThePlaces (via Overture)        │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────── Candidate normalization ─────────────────┐
│  Per-source adapters normalize to shared schema;       │
│  density_class pre-computed from US Census (R1)        │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────── Quality-gate pipeline ───────────────────┐
│  L1 category → L2 chain blocklist → L3+R2 confidence   │
│  → L4 Haiku rider-relevance (Taste) → L6 Sonnet Vision │
│  (ambiguous Pause) → dedup (Voyage embeddings)         │
│  → L5 corroboration boost → R3 local uniqueness        │
│  → R4 route-proximity boost                            │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────── Canonical storage (Convex) ──────────────┐
│  curated_waypoints table (one row per waypoint);       │
│  waypoint_downvotes, community_waypoint_mentions,      │
│  chain_brands, density_tract_index, event_log          │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────── Projection + sync to device ─────────────┐
│  Lean projection → waypoints.db on op-sqlite,          │
│  full record fetched on-demand → LRU cache             │
│  contentVersion-gated delta sync on app launch         │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
┌────────────── Mobile UI (Moments Near Me) ─────────────┐
│  Map + list + filter chips + detail sheet + downvote   │
│  React Native + Mapbox + op-sqlite                     │
└────────────────────────────────────────────────────────┘
```

## Convex schema

### `curated_waypoints` (single canonical table)

```ts
defineTable({
  waypointId: v.string(),                // stable across re-runs, namespaced by source
  name: v.string(),
  category: v.union(v.literal("pause"), v.literal("wander"), v.literal("taste")),
  lat: v.number(),
  lng: v.number(),
  effort: v.union(v.literal("pullover"), v.literal("park"), v.literal("side_trip")),
  trigger_score: v.number(),             // 0.0 – 1.0
  composite_score: v.number(),           // post-R3, R4, L5 adjustments
  confidence_score: v.number(),          // from source, used for L3
  density_class: v.union(                // from R1
    v.literal("urban"), v.literal("suburban"), v.literal("rural"), v.literal("remote")
  ),
  one_liner: v.string(),                 // from O3 Haiku generation
  description: v.optional(v.string()),   // full-length source description
  photo_url: v.optional(v.string()),
  tags: v.array(v.string()),             // free-form: "biker_friendly", "immersive", "moto_specific"
  source_refs: v.array(v.object({        // multi-source corroboration
    source: v.string(),
    source_tier: v.number(),             // 1 = authoritative, 2 = editorial, 3 = community
    source_url: v.optional(v.string()),
    external_id: v.optional(v.string()),
    license: v.optional(v.string()),
  })),
  seasonal_closure: v.optional(v.object({ // from O4 extraction
    start_month: v.number(),
    end_month: v.number(),
  })),
  is_pullover_safe: v.optional(v.boolean()),  // from L6 Vision (Pause only)
  nearest_route_id: v.optional(v.string()),   // for R4
  distance_to_nearest_route_mi: v.optional(v.number()),
  candidate_route_ids: v.optional(v.array(v.string())),  // Routes that pass near this waypoint (Epic 3 foundation)
  searchEmbedding: v.optional(v.array(v.number())),       // 1536-dim vector for semantic search (Epic 3 foundation)
  last_verified: v.number(),              // epoch ms
  content_version: v.number(),
  status: v.union(
    v.literal("live"), v.literal("under_review"), v.literal("suspended"), v.literal("stale")
  ),
  extraction_schema_version: v.number(),
})
  .index("by_location", ["lat", "lng"])
  .index("by_category", ["category"])
  .index("by_density_class", ["density_class"])
  .index("by_content_version", ["content_version"])
  .index("by_status", ["status"]);
```

### Supporting tables

```ts
waypoint_downvotes: {
  waypointId: string,
  userId: string,
  reason: string,
  timestamp: number,
}

community_waypoint_mentions: {     // emitted by UC-RIDER-03 extension
  postId: string,
  postUrl: string,
  name: string,
  lat: number | null,
  lng: number | null,
  region: string,
  proposedCategory: "pause" | "wander" | "taste" | "gather" | "other",
  riderQuote: string,
  confidenceScore: number,
  extractedAt: number,
}

chain_brands: {                    // from AllThePlaces (UC-WSRC-09)
  brandName: string,
  brandNameNormalized: string,
  brandWikidata: string | null,
  chainCategory: string,
}

density_tract_index: {             // from Census (UC-WSRC-10)
  tractGeoid: string,
  populationDensityPerSqMi: number,
  densityClass: "urban" | "suburban" | "rural" | "remote",
  geometryWkt: string,
}

event_log: {                       // for UC-WFLY-03 future recalibration
  eventType: "save" | "view" | "downvote" | "directions" | "detail_open",
  waypointId: string,
  userId: string | null,
  timestamp: number,
}
```

## Projection API (Convex)

Two projections, per the pattern established in `../curation/00-overview.md`:

```ts
// Bulk sync for offline catalog
export const getWaypointsLean = query({
  handler: async (ctx, { sinceVersion }) => {
    return await ctx.db.query("curated_waypoints")
      .withIndex("by_content_version", q => q.gt("content_version", sinceVersion))
      .filter(q => q.eq("status", "live"))
      .collect()
      .then(rows => rows.map(lean_projection));
  }
});

function lean_projection(row) {
  return {
    waypointId: row.waypointId,
    name: row.name,
    category: row.category,
    lat: row.lat, lng: row.lng,
    effort: row.effort,
    trigger_score: row.trigger_score,
    composite_score: row.composite_score,
    density_class: row.density_class,
    one_liner: row.one_liner,
    content_version: row.content_version,
  };  // ~500 bytes per row
}

// Full record on tap
export const getWaypointById = query({
  handler: async (ctx, { waypointId }) => {
    return await ctx.db.query("curated_waypoints")
      .filter(q => q.eq("waypointId", waypointId))
      .first();
  }
});
```

At 150K waypoints × ~500 bytes = ~75 MB bulk sync on first launch. Tight on cellular but acceptable as a one-time WiFi-default operation; delta sync after that is small.

## op-sqlite schema (`waypoints.db`)

```sql
CREATE TABLE waypoints (
  waypoint_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pause','wander','taste')),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  effort TEXT NOT NULL CHECK (effort IN ('pullover','park','side_trip')),
  trigger_score REAL NOT NULL,
  composite_score REAL NOT NULL,
  density_class TEXT NOT NULL CHECK (density_class IN ('urban','suburban','rural','remote')),
  one_liner TEXT NOT NULL,
  content_version INTEGER NOT NULL
);

CREATE INDEX idx_waypoints_lat_lng ON waypoints(lat, lng);
CREATE INDEX idx_waypoints_category ON waypoints(category);
CREATE INDEX idx_waypoints_density ON waypoints(density_class);
CREATE INDEX idx_waypoints_composite ON waypoints(composite_score DESC);

CREATE TABLE waypoint_full_cache (
  waypoint_id TEXT PRIMARY KEY,
  full_record_json TEXT NOT NULL,
  cached_at INTEGER NOT NULL
);

CREATE TABLE user_downvotes (
  waypoint_id TEXT PRIMARY KEY,
  downvoted_at INTEGER NOT NULL
);

CREATE TABLE saved_waypoints (
  waypoint_id TEXT PRIMARY KEY,
  saved_at INTEGER NOT NULL
);
```

Bulk sync uses SpatiaLite bounding-box query for the "within 20 miles" primary path; falls back to plain lat/lng range for environments without SpatiaLite.

## Intent schema extension (for UC-DISC-07 waypoint queries)

The existing `params_to_sql()` intent pipeline gains 3 new nullable keys:

```ts
type WaypointIntentParams = {
  // existing keys for routes
  archetype?: string;
  state?: string;
  // ... (unchanged)

  // new keys for waypoints
  waypoint_category?: "pause" | "wander" | "taste";
  max_drive_minutes?: number;       // radius cap
  include_waypoints?: boolean;      // mixed results toggle
};
```

Haiku prompt for slot-filling is extended with 4-6 few-shot examples covering the new keys. Existing normalized-intent cache is re-used; new prompts bump the cache schema version.

## AI / LLM usage

Full operation spec: Thread 4 Option C summary. All operations use Claude API via the parent project's existing client. Prompt caching enabled for all Haiku calls (static prompt prefix = schema + few-shot examples = ~1500 tokens cached per batch).

| Operation | Model | When | Estimated cost |
|---|---|---|---|
| O1 — motorcycle-relevance gate (Taste only) | Haiku | Ingestion | ~$0.0003/call × ~10K Taste candidates = **$3** |
| O2 — category + effort + trigger extraction | Haiku | Ingestion | ~$0.0005/call × ~50K candidates = **$25** |
| O3 — rider-voice one-liner generation | Haiku | Ingestion | ~$0.0004/call × ~50K candidates = **$20** |
| O4 — seasonal closure extraction | Haiku | Ingestion (Taste + outdoor Pause) | ~$0.0002/call × ~15K candidates = **$3** |
| O5 — embedding dedup | Voyage `voyage-3-lite` | Ingestion | ~$0.00002/token × ~50K candidates ≈ **$2** |
| O6 — Sonnet Vision pullover verify (ambiguous Pause only) | Sonnet 3.5 Vision | Ingestion | ~$0.004/call × ~7K ambiguous = **$28** |

**Totals**:
- With prompt caching (~90% reduction on Haiku calls): **~$10–15 one-time Phase 0.5 batch**
- Without prompt caching: ~$80 one-time
- Ongoing monthly cost (freshness re-verification): ~$5–15/month

Cost cap enforced via pipeline telemetry: if a run exceeds $30, it halts and logs an alert.

## Sync / delta protocol

1. App launches → queries Convex for `contentVersion` of its local `waypoints.db`
2. Convex returns rows where `content_version > client_last_version AND status = 'live'`
3. Client applies the delta and updates its local `content_version` marker
4. Suspended/stale rows are also returned in the delta (so the client deletes them locally)

## Performance targets

| Path | Target |
|---|---|
| Moments Near Me initial render (op-sqlite, 20-mile radius) | < 200 ms |
| Waypoint detail sheet open (full record from cache) | < 100 ms |
| Waypoint detail sheet open (fetch from Convex on cache miss) | < 1500 ms |
| Delta sync on app launch (incremental) | < 5 seconds on WiFi, < 30 seconds on cellular |
| Initial bulk sync on first launch (~75 MB) | < 60 seconds on WiFi |

## Telemetry

Required for Phase 0.5 success criteria:
- Moments Near Me open rate per session
- Filter chip use rate
- Waypoint detail open rate
- Save rate (per waypoint, per user)
- Downvote rate (per waypoint, per user, per reason)
- Directions-tapped rate (the "intent to ride there" signal)
- Rural radius auto-expansion trigger rate
- Per-category distribution of surfaced waypoints
- Per-density-class fairness ratio

All telemetry lands in the `event_log` Convex table for WFLY-03 future recalibration.
