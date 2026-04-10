---
date: 2026-04-10
topic: Route Discovery — Local-First Architecture
status: findings
---

# Route Discovery Architecture Findings

## Context

LaneShadow needs route *suggestions* (discovery) separate from A→B routing. 0 users, bootstrapping. The question: how to build this given the local-first stack (Qwen3.5 0.8B, op-sqlite, Convex).

---

## Key Architectural Decisions

### 1. Retrieval is SQL, not LLM

Qwen3.5 0.8B is validated only for leg labels. It must NOT do retrieval or ranking.
Discovery queries = SQL against local op-sqlite. Orchestrator decides what to fetch; model optionally formats output.

```
User intent → Orchestrator (TypeScript) → SQL query → results → optional Qwen3.5 format
                                        ↘ semantic intent → Haiku (online only)
```

### 2. Not the Replicate/CRDT cache

`@trestleinc/replicate` with Yjs CRDTs is for user-owned editable documents. Curated routes are:
- Read-only from the client
- Shared across all users
- Need SQL bounding box queries, not CRDT merges

Use a **separate op-sqlite database file** (`discovery.db`) with a plain `curated_routes` table.

### 3. Convex as canonical source, op-sqlite as local cache

```
Convex curated_routes (admin-writable, read-only for users)
    ↓ sync on first launch / state change
op-sqlite discovery.db curated_routes table
    ↓ SQL: bounding box + archetype + score ORDER BY composite_score DESC
Discovery results
```

### 4. osm_ways geometry is already in Convex

The existing `osm_ways` table has `geometry: number[][]` (simplified road geometry) and `surface`, `highwayClass` fields. Curvature can be approximated from bearing changes between geometry points — no need for a separate OSM tool or pipeline. The seed script can query `osm_ways` from Convex and compute curvature scores locally.

**Curvature proxy from simplified geometry:**
```typescript
function curvatureScore(geometry: number[][]): number {
  // geometry = [[lon, lat], ...] — simplified (3+ points)
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

Note: geometry is simplified (3 representative points per way), so this is a coarse proxy. Sufficient for MVP ranking; improves when full geometry is imported.

### 5. Seed corpus: FHWA first, osm_ways second

**Phase 1 seed (free, zero ToS risk):**
- FHWA National Scenic Byways — 184 named routes, CSV from data.gov, includes designation type and intrinsic qualities
- BDR routes — 10 GPX files (manual extract), adventure archetype
- Rider Magazine 50 Best — editorial ground truth (manual extract)

**Phase 2 (uses existing Convex data):**
- Query `osm_ways` for `secondary`/`tertiary` highway class roads
- Compute curvature score from geometry
- Cross-ref `osm_nodes` (peaks, viewpoints) for scenic bonus
- Threshold by composite score, store top candidates as `curated_routes`

### 6. Composite score for MVP (FHWA-only inputs)

```
composite_score =
  0.40 × scenic_designation   # all_american_road=1.0, scenic_byway=0.6, none=0.0
+ 0.30 × qualities_coverage   # count(intrinsic_qualities) / 6
+ 0.20 × length_score         # normalized, sweet spot 30–150 miles = 1.0
+ 0.10 × source_authority     # editorial=1.0, fhwa=0.7, community=0.4
```

Calibrate against Rider Magazine 50 Best as ground truth.

### 7. Archetype from FHWA intrinsic qualities

| FHWA Qualities Present | Archetype |
|---|---|
| scenic + recreational | twisties (if curvature high) or scenic_byway |
| natural + scenic | mountain (if elevation) or scenic_byway |
| Within 15mi coast | coastal |
| BDR source | adventure |
| historic + cultural only | scenic_byway |
| Default | scenic_byway |

MVP: most FHWA routes default to `scenic_byway`. Richer archetypes emerge after OSM curvature scoring in Phase 2.

### 8. Haiku for semantic intent (online only)

When user expresses vague intent ("something adventurous near me"), route to Haiku via the existing enrichment pipeline. Haiku returns structured filters (archetype, state, score threshold) that the orchestrator then executes as SQL. No new AI infrastructure needed.

### 9. Qwen3.5 processing impact (if used for formatting)

- Memory: no increase — model already loaded at 1.15GB for leg labels
- Inference: ~0.8–1.5s for a larger prompt vs 0.35s for leg labels
- Battery: ~0.3% per query (acceptable)
- Risk: only if semantic search or tool calling is pushed onto the model — avoid this

---

## What NOT to build yet

- Scraping (motorcycleroads.com etc.) — ToS risk, maintenance
- Fine-tuning pipeline — no data, no GPU budget
- Data flywheel — needs users first
- NLP forum mining — high complexity, low ROI at 0 users
- Vector DB / embeddings for local semantic search — pushes total memory toward 1.5GB ceiling (Qwen3.5 1.15GB + embedding model ~300MB runtime)
- Tool calling from Qwen3.5 — unreliable at 0.8B for anything beyond leg labels

---

## File Map (when implementing)

```
scripts/seed-routes/
  fhwa.ts          — fetch + parse FHWA byways CSV from data.gov
  score.ts         — curvatureScore(), compositeScore(), assignArchetype() — pure functions
  seed.ts          — entry point: load FHWA → query osm_ways → score → upsert Convex

models/
  curated-routes.ts  — validator (follows existing project pattern)

convex/
  schema.ts          — add curated_routes table (modify)
  curated-routes.ts  — internal upsert mutation + public by_state query

lib/discovery/
  db.ts              — op-sqlite discovery.db init + DDL
  sync.ts            — Convex → SQLite pull (by state, on launch)
  query.ts           — queryNearby(), queryByState(), queryByArchetype()

hooks/
  use-route-discovery.ts  — location + archetype → nearby routes from local cache
```

---

## Convex schema sketch

```typescript
// models/curated-routes.ts
export const curatedRouteValidator = v.object({
  name: v.string(),
  state: v.string(),
  source: v.union(v.literal('fhwa'), v.literal('bdr'), v.literal('editorial')),
  archetype: v.union(
    v.literal('twisties'), v.literal('mountain'), v.literal('coastal'),
    v.literal('adventure'), v.literal('scenic_byway'), v.literal('desert'),
  ),
  compositeScore: v.number(),           // 0.0–1.0
  lengthMiles: v.optional(v.number()),
  centroidLat: v.number(),
  centroidLng: v.number(),
  boundsNeLat: v.optional(v.number()),
  boundsNeLng: v.optional(v.number()),
  boundsSwLat: v.optional(v.number()),
  boundsSwLng: v.optional(v.number()),
  description: v.optional(v.string()),  // Haiku-generated, added later
  highlights: v.optional(v.array(v.string())),
  fhwaDesignation: v.optional(v.union(
    v.literal('all_american_road'), v.literal('scenic_byway'),
  )),
  fhwaQualities: v.optional(v.array(v.string())),
  sourceUrl: v.optional(v.string()),
  seededAt: v.number(),
})

// convex/schema.ts addition:
curated_routes: defineTable(curatedRouteValidator)
  .index('by_state', ['state'])
  .index('by_archetype', ['archetype'])
  .index('by_compositeScore', ['compositeScore']),
```

## Local SQLite schema

```sql
CREATE TABLE IF NOT EXISTS curated_routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  source TEXT NOT NULL,
  archetype TEXT NOT NULL,
  composite_score REAL NOT NULL,
  length_miles REAL,
  centroid_lat REAL NOT NULL,
  centroid_lng REAL NOT NULL,
  bounds_ne_lat REAL, bounds_ne_lng REAL,
  bounds_sw_lat REAL, bounds_sw_lng REAL,
  description TEXT,
  highlights TEXT,   -- JSON array
  synced_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cr_state    ON curated_routes(state);
CREATE INDEX IF NOT EXISTS idx_cr_type     ON curated_routes(archetype);
CREATE INDEX IF NOT EXISTS idx_cr_score    ON curated_routes(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_cr_centroid ON curated_routes(centroid_lat, centroid_lng);
```

## Discovery query pattern

```typescript
// lib/discovery/query.ts
export const queryNearby = (
  db: OPSQLiteDB,
  lat: number,
  lng: number,
  radiusDeg = 0.5,   // ~35 miles
  opts: { archetype?: string; limit?: number } = {},
) => {
  const { archetype, limit = 10 } = opts
  return db.execute(
    `SELECT * FROM curated_routes
     WHERE centroid_lat BETWEEN ? AND ?
       AND centroid_lng BETWEEN ? AND ?
       ${archetype ? 'AND archetype = ?' : ''}
     ORDER BY composite_score DESC LIMIT ?`,
    [lat - radiusDeg, lat + radiusDeg,
     lng - radiusDeg, lng + radiusDeg,
     ...(archetype ? [archetype] : []),
     limit],
  ).rows._array
}
```
