---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-10
prd_version: 1.4.0
---

# Curation — Route Discovery & Autonomous Data Flywheel

## Product Description

Curation enables LaneShadow's motorcycle riders to discover great routes without relying on community contributions. By combining autonomous web scraping, LLM-based attribute extraction, geometric enrichment (OSM curvature, elevation), and deterministic scoring, the system builds a comprehensive database of curated routes. Routes and all metadata live in Convex — the client queries Convex directly for catalog browse, intent search, and route details. There is no client-side database for curation data.

**Aggregation & Data Shape:** The system aggregates data at the **ride segment** level — coherent 5-50 mile experiences that riders name and talk about (e.g., "Deals Gap stretch of US-129"), not raw road segments or full routes. Every route is a **single Convex document** in the `curated_routes` table with all fields — scores, display text, full descriptions, history, photos, sources, and provenance — on one row. Catalog browse queries project only the narrow display fields; detail views fetch the full document by ID. No tier split, no shared-ID version tracking, no client-side sync.

**Connectivity requirement:** Route discovery requires an active connection to Convex. This is an intentional design decision — maintaining a local offline mirror of the catalog would require op-sqlite, a sync layer, delta tracking, and cache eviction logic that the architecture has explicitly dropped in favor of Convex's real-time reactive query model. Map-based navigation (Mapbox offline regions) and turn-by-turn routing are unaffected — those work offline via downloaded tile data. Discovery of new routes requires connectivity.

**Product Context:** LaneShadow is an AI-native motorcycle ride planner — map-first, conversation-driven. Tagline: "Ride the Moment" — turn a feeling into a road. Platforms: iOS and Android (React Native + Expo). Aesthetic: Rugged, industrial-warm, copper-accented, dark-first. This PRD extends the Mapbox routing infrastructure from complete-local-routing with route discovery capabilities.

## Problem Statement

**Current State:**
- LaneShadow has 0 users and 0 community routes — cold start problem
- Riders ask "Where should I ride today?" and have no answer
- Existing route databases (motorcycleroads.com, bestbikingroads.com) are walled gardens
- Great rides are hidden across forums, blogs, and government data sources
- No unified scoring system for route quality across curvature, scenery, and challenge
- Manual curation doesn't scale to covering the US

**Impact:**
- New users have nothing to discover — poor onboarding experience
- Adventure riders in unfamiliar regions have no local route knowledge
- Riders waste time searching scattered sources instead of riding
- Competing apps lock users into their closed ecosystems
- LaneShadow can't deliver on its core value proposition without great routes

## Solution Summary

Build an autonomous curation pipeline that:

1. **Discovers routes from multiple sources:**
   - FHWA National Scenic Byways (184 designated roads, free open data)
   - Community sites (motorcycleroads.com, bestbikingroads.com) via web scraping
   - Editorial sources (Rider Magazine Top 50, RevZilla Common Tread)
   - OSM data via curvature analysis (adamfranco/curvature algorithm)

2. **Extracts structured attributes using LLM (Haiku-only, server-side):**
   - Claude Haiku + Instructor for reliable extraction
   - Categorical classification (curviness, scenery, traffic, surface, challenge)
   - Cost-effective: ~$34 for full 17k-route batch
   - All extraction runs at `temperature=0` for reproducibility

3. **Enriches with geometric data:**
   - OSM curvature scores (meters spent in turns, weighted by tightness)
   - Elevation profiles (SRTM or Mapbox Elevation API)
   - FHWA scenic designation lookup
   - Road classification from OSM tags

4. **Computes deterministic composite scores:**
   - Curvature (25%), scenery (15%), traffic (15%), road condition (10%)
   - Elevation drama (10%), scenic designation (10%), community rating (10%), remoteness (5%)
   - Calibrated against editorial ground truth (Rider Magazine Top 50) before full-batch extraction runs

5. **Classifies into ride archetypes:**
   - Twisties, Mountain Epic, Coastal, Adventure, Scenic Byway, Desert
   - Decision tree on normalized features — deterministic, no LLM

6. **Aggregates at the ride segment level** (the rider's mental atom):
   - 5–50 mile coherent experiences, not raw OSM ways and not full planned routes
   - One primary archetype, one set of pre-computed scores, one stable `routeId`
   - Matches how editorial lists name things and how communities vote

7. **Stores as a single canonical Convex document:**
   - One `curated_routes` table — all fields on one row (scores, display text, full description, history, photos, sources, provenance, extraction metadata)
   - **No two-table tier split.** The previous lean/enrichment split existed to serve a small local model's context-window constraints. With no on-device model, there is no reason to maintain two tables with cross-tier version tracking.
   - Catalog browse queries project only the narrow display fields (`routeId`, name, state, archetype, scores, bounds, oneLiner, summary, badges). Convex handles projection server-side.
   - Detail view queries fetch the full document by `routeId`. Convex caches the result in the reactive client for the duration of the session.
   - For Haiku call sites: the server projects whatever subset of fields the prompt needs at call time — context trimming happens per-call, not per-storage-layer.

8. **Powers discovery via Convex queries + optional intent extraction:**
   - **Catalog browse (UC-DISC-01 through UC-DISC-06):** `useQuery(api.routes.listByBbox, { lat, lng, radiusDeg, archetype?, sortBy? })` — typed Convex query, reactive, paginated. Haiku is not involved. Ranking is pure server-side `ORDER BY compositeScore DESC`.
   - **Intent search (UC-DISC-07):** User types natural language intent → Convex action calls Claude Haiku to extract 10 nullable query params (archetype, state, sort_by, min_length_mi, etc.) → Convex query applies those params server-side → returns top 10 routes. Intent→params pairs are cached in a shared `intent_param_cache` Convex table keyed by normalized intent string — first user to ask "twisty mountain roads" triggers Haiku, every subsequent user (across the whole app) gets an instant cache hit from the shared table.
   - **No client-side SQL, no `params_to_sql()`.** Filtering and ranking are Convex query arguments with typed validators, not string-interpolated SQL.

9. **Route detail on demand:**
   - `useQuery(api.routes.getById, { routeId })` — fetches the full document from Convex on tap
   - Convex's reactive cache holds the result in memory for the session; re-tapping the same route is instant
   - No op-sqlite, no LRU cache table, no explicit cache eviction — Convex manages this

10. **Builds data flywheel for continuous improvement:**
    - User interaction feedback (save, hide, ride, rate) written to `route_feedback` via Convex mutation
    - Auto-annotation of routes with user preferences
    - Filter and re-score based on real rider behavior
    - Future: periodic re-scraping to capture new community routes

**Technical Approach:**
- Python aggregation pipeline (local script or GitHub Actions)
- httpx + BeautifulSoup for static page scraping (most sources)
- Instructor + Claude Haiku for LLM extraction (always temp=0, reproducible)
- adamfranco/curvature and/or osm_ways geometry for curvature analysis
- **Convex as the only database** — no op-sqlite, no local cache, no sync layer for curation data
- `useQuery` / `useMutation` / Convex actions for all client access
- Shared `intent_param_cache` Convex table for cross-user intent caching

**No on-device LLM.** All LLM inference is server-side Haiku. See Pipeline Principles P0 below.

**No client-side database for curation.** Discovery requires a connection to Convex. See AD-14.

**Timeline:** 6 weeks (full feature with polish)
**Team:** 1 full-stack developer

---

## Pipeline Principles

These principles govern every LLM stage in the curation pipeline and every data-shape decision. Derived from the 2026-04-10 local-model research cycle (`.spec/research/local-models/`).

### P0 — No on-device LLM

All LLM inference is server-side (Claude Haiku). LaneShadow ships zero on-device language models. This is the consequence of the 2026-04-10 environment-bias finding: Qwen3.5 0.8B latency was only measured on Mac-MLX; estimated mobile latency is 6–15s — unusable. No model download, no Core ML bundle, no ONNX bundle, no mlx-local dependency.

### P1 — LLMs do text → structure, never structure → selection

Every LLM call extracts structured attributes from unstructured text. No LLM call selects, ranks, or filters a list of candidates. Ranking is always Convex `ORDER BY compositeScore` — deterministic, not model-driven.

Applied:
- Intent → query params: text → flat JSON ✅
- Source blog/listicle → route attributes: text → structured fields ✅
- Haiku ranking route candidates: ❌ never

### P2 — Source-grounded only: never ask models to recall routes

No LLM is ever asked to enumerate, list, or recall motorcycle roads from training knowledge. Routes enter the system only through verifiable sources: FHWA open data, scraped community listicles with source URLs, OSM geometric discovery, BDR GPX files. Model recall is stale, hallucinates geography, and converges on the same 20 famous roads every app already has.

### P3 — Calibrate scoring before running the long tail

Composite-score weights are fit against a labeled ground-truth set (Rider Magazine Top 50, FHWA Scenic Byways) before running extraction over the 17k-route scrape. Calibration is a Phase 3 completion gate — full-batch extraction does not run until calibration passes.

### P4 — Determinism at temp=0

Every LLM extraction stage runs at `temperature=0` with retry-on-degeneration. Same source text produces the same extracted attributes across pipeline re-runs.

### P5 — Deterministic parser between LLM and downstream code

Instructor + Pydantic (extraction) and enum validators (intent params) validate every LLM output before any downstream step runs. The parser retries on failure before the system falls back.

---

## Research & Prior Initiatives

### Foundation: Complete Local Routing (`complete-local-routing`)

This PRD builds on the infrastructure delivered by the **complete-local-routing** initiative (`.spec/prds/complete-local-routing/`), which established Mapbox SDK + @rnmapbox/maps as the map rendering and offline tile engine. The `MapboxMapView` component is the direct dependency for UC-DISC-06 (show route on map).

Note: v1.4 of the complete-local-routing PRD also removed @trestleinc/replicate and op-sqlite from that initiative. The app bundle contains no SQLite dependency for either curation or route persistence.

### Research History: Why No On-Device LLM and No Client DB

**Local model research (2026-04-10):** Three Qwen3.5 0.8B roles were tested:

| Role | Result |
|---|---|
| Candidate ranking (pick top N from route pool) | ❌ Positional bias, score blindness, hallucinated IDs |
| Route modification / leg swap | ❌ Echoes original, can't apply constraints |
| Intent → SQL param extraction (slot-filling) | ✅ 93% pass on Mac-MLX |

The slot-filling result looked viable — until the **environment-bias finding** showed all benchmarks were Mac-MLX only. Estimated iPhone latency: 6–15s. Shipped as "v1.3 deferred," then dropped entirely in v1.4.

**Client DB rationale collapse:** The two-table lean/enrichment split was originally justified by (a) Qwen's 0.8B context window and (b) mobile sync payload size. Rationale (a) is dead — no on-device model. Rationale (b) is addressed by Convex's server-side projection at the query boundary, not by a second table and a local DB. With no local DB, the architecture shrinks from: scrape → extract → ingest-lean → ingest-enrichment → sync-lean → op-sqlite → SQL query → enrich-cache → UI ... to: scrape → extract → ingest → Convex query → UI. The offline-browse capability is traded for this simplification. Mapbox offline tile downloads (for navigation) are not affected.
