---
stability: FEATURE_SPEC
last_validated: 2026-04-10
prd_version: 1.0.0
appetite_weeks: 6
---

# Scope

## Appetite

**6 weeks (full feature with polish)**

This appetite supports building the complete curation and discovery system including web scraping pipeline, LLM extraction, geometric enrichment, local SQLite discovery database, and user-facing discovery UI.

## In Scope

### Phase 1: Seed Data Pipeline
- FHWA National Scenic Byways CSV ingestion from data.gov
- BDR (Backcountry Discovery Routes) GPX parsing (10 routes)
- Rider Magazine Top 50 editorial extraction
- Composite scoring formula implementation
- Archetype classification (decision tree)
- Convex `curated_routes` schema and upsert mutations
- Local op-sqlite `discovery.db` initialization and sync

### Phase 2: Web Scraping Infrastructure
- Python scraping pipeline (local script)
- motorcycleroads.com state-paginated route extraction
- bestbikingroads.com route extraction (17,976 routes)
- Rate limiting and polite scraping (2-4s delays, rotating UA)
- Resumable writes to JSONL for crash recovery
- ToS compliance verification before scraping

### Phase 3: LLM Extraction & Enrichment
- Claude Haiku + Instructor integration
- Pydantic schema for route attributes (curviness, scenery, traffic, etc.)
- Parallel extraction with ThreadPoolExecutor (max_workers=5)
- OSM curvature analysis via adamfranco/curvature
- Elevation profile generation (SRTM or Mapbox API)
- FHWA scenic designation lookup and join

### Phase 4: Discovery UI
- Route discovery screen with map view
- Filter by archetype (twisties, mountain, coastal, adventure, scenic_byway, desert)
- Filter by state/region
- Sort by composite score or proximity
- Route detail cards with key highlights
- "Show on map" integration with existing MapboxMapView
- Local SQLite query optimization (bounding box indexes)

### Phase 5: Data Flywheel Foundation
- User interaction tracking (save, hide, ride completion, rating)
- Feedback storage in Convex
- Auto-annotation schema for user preferences
- Dashboard for viewing curation pipeline results
- Error handling and retry logic for scraping failures
- Monitoring for scrape success rates

### Cross-Phase Infrastructure
- Error handling and logging throughout pipeline
- Validation at each pipeline stage
- Schema versioning for route data
- Documentation of scoring formula and calibration
- ToS compliance for all scraped sources

## Out of Scope

### Deferred to Future Cycles
- **NLP forum mining** — ADVRider, Reddit scraping (high complexity, lower ROI for MVP)
- **Fine-tuning pipeline** — no training data yet, no GPU budget
- **Vector embeddings for local semantic search** — pushes memory toward 1.5GB ceiling
- **Seasonal access data** — mountain pass closure information
- **Real-time user contribution workflow** — users submitting their own routes
- **Social features** — sharing routes, commenting, leaderboards
- **GPX trace import/export** — user-generated route management
- **Advanced filtering** — by traffic levels, road condition, difficulty
- **Multilingual support** — non-English route descriptions
- **International expansion** — non-US routes and data sources

### Never in Scope (Separate Products)
- **Turn-by-turn navigation** — covered by complete-local-routing PRD
- **AI route generation** — covered by separate PRD
- **Community social features** — separate product initiative
- **Route planning tools** — separate product initiative
- **Ride tracking and logging** — separate product initiative

### Rationale for Exclusions

**NLP forum mining deferred:** Forum text extraction is complex (login walls, dynamic content) and the signal-to-noise ratio is lower than structured sources. Better to start with high-quality structured data (FHWA, motorcycleroads.com) and add forum mining later when we have calibration data.

**Fine-tuning deferred:** Requires training data we don't have yet. The data flywheel will generate this over time. Current approach uses deterministic scoring + LLM extraction without model training.

**Vector embeddings deferred:** Qwen3.5 0.8B (1.15GB) + embedding model (~300MB runtime) would push total memory toward the 1.5GB ceiling. SQL-based discovery is sufficient for MVP.

**Real-time user contributions deferred:** Editorial curation first establishes quality baseline. User submissions can be added later with moderation workflow.

**International routes deferred:** US-focused sources (FHWA, US-based sites) provide sufficient coverage for MVP. International expansion requires localized data sources and multilingual support.
