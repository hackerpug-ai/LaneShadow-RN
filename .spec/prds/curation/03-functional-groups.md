---
stability: FEATURE_SPEC
last_validated: 2026-04-10
prd_version: 1.2.0
---

# Functional Groups

## Functional Groups Overview

| Group | Prefix | Description |
|-------|--------|-------------|
| **Route Discovery** | DISC | User-facing discovery screens for browsing and filtering curated routes |
| **Route Ingestion** | INGEST | Backend pipeline for scraping, extracting, and storing route data |
| **Quality Scoring** | QUALITY | Geometric enrichment, composite scoring, and archetype classification |
| **Data Flywheel** | FLY | User feedback collection and auto-annotation for continuous improvement |

## Use Case Summary

| Group | Use Cases | Total |
|-------|-----------|-------|
| Route Discovery (DISC) | 7 | UC-DISC-01 through UC-DISC-07 |
| Route Ingestion (INGEST) | 4 | UC-INGEST-01 through UC-INGEST-04 |
| Quality Scoring (QUALITY) | 3 | UC-QUALITY-01 through UC-QUALITY-03 |
| Data Flywheel (FLY) | 2 | UC-FLY-01 through UC-FLY-02 |
| **Total** | | **16** |

## Group Details

### DISC — Route Discovery
**User Value:** Answers "Where should I ride today?" by showing great routes nearby or matching specific ride preferences.

**Key Capabilities:**
- Browse routes on map with proximity-based discovery
- Filter by archetype (twisties, mountain, coastal, adventure, scenic_byway, desert)
- Filter by state/region
- Sort by composite score or proximity
- **Intent-based search**: natural language → normalized-intent cache (op-sqlite) or Claude Haiku online → structured query params → deterministic SQL → pre-selected results. No on-device LLM.
- View route details including highlights and key attributes
- Offline access after initial sync for catalog browse; intent search works offline only for previously-seen (cached) intents

**Technical Context:**
- Queries local op-sqlite `discovery.db` with SQL; ranking is pure SQL `ORDER BY` on pre-computed composite scores
- Uses bounding box queries for proximity
- Integrates with existing MapboxMapView from complete-local-routing
- Free-text intent search uses **Claude Haiku (server-side) for slot-filling only** (intent → query params), backed by a normalized-intent cache on device. No LLM ever sees route candidates; ranking is fully deterministic. Haiku validated 2026-04-10: 100% valid JSON, ~1.0s extraction via Instructor. **No on-device LLM** — see P0 in `00-overview.md`.

### INGEST — Route Ingestion
**User Value:** Builds comprehensive route database from multiple sources without manual data entry.

**Key Capabilities:**
- Scrape FHWA National Scenic Byways (CSV from data.gov)
- Scrape motorcycleroads.com and bestbikingroads.com
- Extract structured attributes using Claude Haiku + Instructor
- Store routes in Convex as canonical source
- Sync to local op-sqlite for offline discovery

**Technical Context:**
- Python script with httpx + BeautifulSoup for static pages
- Rate limiting (2-4s delays, rotating UA)
- Resumable writes to JSONL
- LLM extraction with parallel ThreadPoolExecutor (max_workers=5)
- Cost: ~$34 for 17k routes via Haiku

### QUALITY — Quality Scoring
**User Value:** Ensures riders see the best routes first through objective, multi-dimensional scoring.

**Key Capabilities:**
- Compute OSM curvature scores via adamfranco/curvature
- Generate elevation profiles (SRTM or Mapbox API)
- Calculate composite score across 8 dimensions
- Classify routes into archetypes (decision tree or k-means)
- Calibrate scoring against editorial ground truth

**Technical Context:**
- Deterministic scoring formula (no LLM involvement)
- OSM curvature: weighted meters in turns
- Composite weights: curvature 25%, scenery 15%, traffic 15%, etc.
- Archetypes: twisties, mountain_epic, coastal, adventure, scenic_byway, desert

### FLY — Data Flywheel
**User Value:** Route recommendations improve over time as the system learns from real rider behavior.

**Key Capabilities:**
- Collect user interactions (save, hide, ride completion, rating)
- Auto-annotate routes with user preference segments
- Feed annotations back into scoring for personalization
- Monitor pipeline health and scrape success rates

**Technical Context:**
- Convex backend stores interaction feedback
- Future: periodic re-scraping to capture new routes
- Future: re-scoring based on aggregated user signals
- Phase 1 focuses on collection infrastructure only
