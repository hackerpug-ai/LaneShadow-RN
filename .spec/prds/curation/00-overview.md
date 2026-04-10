---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-10
prd_version: 1.2.0
---

# Curation — Route Discovery & Autonomous Data Flywheel

## Product Description

Curation enables LaneShadow's motorcycle riders to discover great routes without relying on community contributions. By combining autonomous web scraping, LLM-based attribute extraction, geometric enrichment (OSM curvature, elevation), and deterministic scoring, the system builds a comprehensive database of curated routes. A local-first architecture using op-sqlite ensures fast discovery queries work offline, while a data flywheel architecture continuously improves route quality as users provide feedback.

**Aggregation & Data Shape:** The system aggregates data at the **ride segment** level — coherent 5-50 mile experiences that riders name and talk about (e.g., "Deals Gap stretch of US-129"), not raw road segments or full routes. Data is split across two tiers linked by **stable shared IDs**: a **lean local tier** (~50 tokens per route) optimized for SQL filtering and on-device Qwen3.5 ranking, and a **rich server enrichment tier** with full descriptions, photos, GPX, and community data that is lazy-loaded when the device has connectivity. This split keeps the mobile app fast and offline-capable while still delivering full richness of curated content when the network allows.

**Product Context:** LaneShadow is an AI-native motorcycle ride planner — map-first, conversation-driven. Tagline: "Ride the Moment" — turn a feeling into a road. Platforms: iOS and Android (React Native + Expo). Aesthetic: Rugged, industrial-warm, copper-accented, dark-first. This PRD extends the local-first routing infrastructure from complete-local-routing with route discovery capabilities.

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

2. **Extracts structured attributes using LLM (offline, Haiku-only):**
   - Claude Haiku + Instructor for reliable extraction
   - Categorical classification (curviness, scenery, traffic, surface, challenge)
   - Cost-effective: ~$34 for full 17k-route batch
   - All reasoning happens offline so the local 0.8B model never has to reason

3. **Enriches with geometric data:**
   - OSM curvature scores (meters spent in turns, weighted by tightness)
   - Elevation profiles (SRTM or Mapbox Elevation API)
   - FHWA scenic designation lookup
   - Road classification from OSM tags

4. **Computes deterministic composite scores:**
   - Curvature (25%), scenery (15%), traffic (15%), road condition (10%)
   - Elevation drama (10%), scenic designation (10%), community rating (10%), remoteness (5%)
   - Calibrated against editorial ground truth (Rider Magazine Top 50)

5. **Classifies into ride archetypes:**
   - Twisties, Mountain Epic, Coastal, Adventure, Scenic Byway, Desert
   - Decision tree or k-means clustering on normalized features

6. **Aggregates at the ride segment level** (the rider's mental atom):
   - 5–50 mile coherent experiences, not raw OSM ways and not full planned routes
   - One primary archetype, one set of pre-computed scores, one stable ID
   - Matches how editorial lists name things and how communities vote
   - Small enough that 40+ fit in a single Qwen3.5 0.8B context window

7. **Splits data into lean local + rich server enrichment (shared-ID linking):**
   - **Lean Local tier** (op-sqlite `discovery.db`, ~50 tokens per route): pre-computed scores, 10-word one-liner, 15-word summary, discrete badges, location bounds. Optimized for SQL filtering and on-device LLM ranking. Fully offline capable.
   - **Rich Server tier** (Convex `curated_route_enrichments`): full descriptions, photos, history, GPX, community reviews, elevation profiles, provenance. Stays server-side, lazy-loaded by shared `routeId` when connectivity is available.
   - **Shared stable ID**: every route uses the same `id` in both tiers. When the device comes online, the app identifies which enrichments are missing or stale via `enrichmentVersion` tracking and prefetches only what's needed. A single call returns full enrichment for any route card.

8. **Powers discovery via intent → query translation + pre-selected local results:**
   - User expresses natural language intent ("twisty mountain roads", "something remote and challenging")
   - Qwen3.5 0.8B (on-device, ~1.5s, no network): extracts structured query params via slot-filling — `archetype`, `state`, `sort_by`, `min_length_mi`, `max_technical`, `min_remoteness`, `season`, etc. (10 keys, all nullable). Validated: 93% pass rate, 0.84 F1 against Haiku on 15-scenario test suite (2026-04-10)
   - Deterministic `params_to_sql()` converts extracted params into a parameterized SQL query — no SQL is ever written by the model, zero injection risk
   - op-sqlite executes the query against `discovery.db` (<10ms) → returns top 10 routes ordered by pre-computed scores
   - Qwen **never sees route candidates** — ranking is fully deterministic via SQL `ORDER BY`. The local model's only job is text → structured params (slot-filling), which is where 0.8B models excel
   - Zero-results + connectivity: escalate to Haiku online for intent clarification → same `params_to_sql()` pipeline → re-query locally. Also used when Qwen produces a state + archetype combination that returns no matches (e.g., "coastal" + "CO" word-similarity edge case)
   - End-to-end latency <2s fully offline (Qwen ~1.5s + SQL <10ms)

9. **Serves via local-first discovery:**
   - op-sqlite `discovery.db` stores lean curated routes locally
   - SQL queries by bounding box, archetype, state, composite score
   - Convex as canonical source with sync on first launch
   - Works fully offline after initial sync; enrichment is additive when connected

10. **Builds data flywheel for continuous improvement:**
    - User interaction feedback (save, hide, ride, rate) collected
    - Auto-annotation of routes with user preferences
    - Filter and re-score based on real rider behavior
    - Future: periodic re-scraping to capture new community routes

**Technical Approach:**
- Python aggregation pipeline (local script or GitHub Actions)
- httpx + BeautifulSoup for static page scraping (most sources)
- Instructor + Claude Haiku for LLM extraction (offline pre-digestion)
- adamfranco/curvature and/or osm_ways geometry for curvature analysis
- op-sqlite for local lean discovery database
- Convex for canonical storage (lean + enrichment tiers) and sync
- Qwen3.5 0.8B on-device (existing): intent → SQL query param extraction (slot-filling only — not ranking)

**Timeline:** 6 weeks (full feature with polish)
**Team:** 1 full-stack developer

---

## Research & Prior Initiatives

### Foundation: Complete Local Routing (`complete-local-routing`)

This PRD builds directly on the infrastructure delivered by the **complete-local-routing** initiative (`.spec/prds/complete-local-routing/`). That initiative established:
- **Mapbox SDK + @rnmapbox/maps** as the map rendering and offline routing engine
- **op-sqlite** as the on-device database layer (used here for `discovery.db`)
- Offline-first architecture pattern (download → sync → query locally)
- Provider-agnostic route storage in Convex

Curation reuses op-sqlite and the offline-first sync pattern to build `discovery.db` as a sibling database alongside the routing data. The `complete-local-routing` MapboxMapView component is the direct dependency for UC-DISC-06 (show route on map).

### Qwen3.5 0.8B: Validated Role

**Research file:** `.spec/research/local-models/INTENT_TO_QUERY_RESULTS_2026-04-10.md`

**Why intent/filter instead of ranking:**

We tested three roles for Qwen3.5 0.8B in this cycle:

| Role | Result | Why |
|------|--------|-----|
| Candidate ranking (select top N from 20 route cards) | ❌ NOT VIABLE | Positional bias, score blindness, hallucinates IDs |
| Route modification / leg swap | ❌ NOT VIABLE | Echoes original legs, can't apply constraints |
| Intent → SQL query param extraction (slot-filling) | ✅ **VIABLE** — 93% pass rate, 0.84 F1 | Text → structure is the direction 0.8B models do well |

The core insight: **Qwen3.5 is good at structured extraction from unstructured text, bad at selection from structured candidates.** Every viable use case is "text → structure." Every failed use case is "structure → selection."

**Consequence for the discovery architecture:**

The previous v1.1 design (SQL pre-filters to 20 candidates → Qwen ranks them → returns top 5 IDs) inverts this. Qwen must reason over structured route objects, compare scores, and return IDs — exactly the "structure → selection" pattern it cannot reliably do.

The v1.2 design corrects this:
- Qwen receives **only the user's intent string** (~10–20 tokens) and extracts 10 nullable query params
- Deterministic `params_to_sql()` constructs the query; SQL handles ranking via `ORDER BY` on pre-computed scores
- Routes returned are **pre-selected by the database**, not the model

This is also better for offline reliability: a 10-key JSON extraction has much tighter failure modes than a multi-candidate ID selection task. Defensive layers (enum validation, retry-on-degeneration) handle the remaining edge cases.

**Haiku fallback pattern:**

Haiku is the online fallback for two cases: (1) intents Qwen fails on (zero results + mismatched params), (2) vague/subjective intents ("something that feels like freedom") where slot-filling doesn't apply. In both cases Haiku returns the same structured params schema, feeding the same `params_to_sql()` pipeline. The discovery flow is identical regardless of which model produced the params.
