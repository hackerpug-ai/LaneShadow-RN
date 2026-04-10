---
stability: FEATURE_SPEC
last_validated: 2026-04-10
prd_version: 1.0.0
functional_group: INGEST
---

# Use Cases: Route Ingestion (INGEST)

| UC ID | Title | Description |
|-------|-------|-------------|
| UC-INGEST-01 | Ingest FHWA Scenic Byways | System imports FHWA National Scenic Byways data from data.gov CSV |
| UC-INGEST-02 | Scrape Community Route Sites | System scrapes motorcycleroads.com and bestbikingroads.com for route data |
| UC-INGEST-03 | Extract Route Attributes via LLM | System uses Claude Haiku + Instructor to extract structured attributes from route descriptions |
| UC-INGEST-04 | Store Routes in Convex | System upserts extracted routes to Convex curated_routes table as canonical source |

---

## UC-INGEST-01: Ingest FHWA Scenic Byways

**Description:** Administrator runs the ingestion pipeline to import FHWA National Scenic Byways data from data.gov. This provides 184 high-quality designated routes as the initial seed corpus.

**Acceptance Criteria:**
- ☐ Administrator can run FHWA ingestion script via npm script or direct command
- ☐ System downloads FHWA byways CSV from data.gov URL
- ☐ System parses CSV fields: route name, state, designation type, intrinsic qualities
- ☐ System validates required fields (name, state, designation)
- ☐ System computes centroid coordinates from route geometry or state center
- ☐ System assigns archetype based on FHWA qualities (scenic_byway, coastal, mountain)
- ☐ System assigns scenic designation score (all_american_road=1.0, scenic_byway=0.6)
- ☐ System upserts routes to Convex curated_routes table
- ☐ System logs ingestion count and any validation errors
- ☐ System handles duplicate routes (same name + state) by updating existing record
- ☐ System stores source_url pointing to FHWA listing
- ☐ System completes ingestion in under 30 seconds for 184 routes

---

## UC-INGEST-02: Scrape Community Route Sites

**Description:** Administrator runs the web scraping pipeline to extract route data from motorcycleroads.com and bestbikingroads.com. Pipeline respects rate limits and site terms of service.

**Acceptance Criteria:**
- ☐ Administrator can run scraping script via npm script or direct command
- ☐ System scrapes motorcycleroads.com by state pagination
- ☐ System scrapes bestbikingroads.com full route catalog (17,976 routes)
- ☐ System uses httpx with rotating User-Agent strings
- ☐ System enforces 2-4 second delays between requests to same domain
- ☐ System implements exponential backoff on 429/503 responses
- ☐ System verifies robots.txt compliance before scraping
- ☐ System writes results incrementally to JSONL file (resumable on crash)
- ☐ System skips already-scraped URLs on restart
- ☐ System logs scrape success rate and error count
- ☐ System handles JavaScript-rendered pages via Playwright fallback (if needed)
- ☐ System completes scraping in under 2 hours for full catalog

---

## UC-INGEST-03: Extract Route Attributes via LLM

**Description:** Ingestion pipeline uses Claude Haiku with Instructor to extract structured route attributes from unstructured route descriptions. LLM classifies routes categorically; code computes numeric scores.

**Acceptance Criteria:**
- ☐ System integrates Instructor with Anthropic SDK for Haiku
- ☐ System defines Pydantic schema for RouteAttributes (curviness, scenery, traffic, etc.)
- ☐ System includes reasoning field as first output (chain-of-thought)
- ☐ System uses Literal types for categorical fields (not free-form strings)
- ☐ System sets temperature=0 for deterministic extraction
- ☐ System runs extractions in parallel with ThreadPoolExecutor (max_workers=5)
- ☐ System extracts attributes: curviness, scenery_type, scenery_quality, traffic_level, road_condition, challenge_level, surface, key_highlights
- ☐ System validates extracted attributes against allowed values
- ☐ System logs extraction confidence and failures
- ☐ System handles rate limits from Anthropic API (50 req/min)
- ☐ System completes extraction for 17k routes in under 1 hour (~$34 cost)
- ☐ System retries failed extractions up to 3 times with exponential backoff

---

## UC-INGEST-04: Store Routes in Convex

**Description:** Ingestion pipeline upserts extracted and enriched routes to Convex curated_routes table, which serves as the canonical source for route data. Client apps sync from Convex to local op-sqlite.

**Acceptance Criteria:**
- ☐ System defines Convex schema for curated_routes table
- ☐ System includes fields: name, state, source, archetype, compositeScore, lengthMiles, centroidLat, centroidLng, boundsNeLat, boundsNeLng, boundsSwLat, boundsSwLng, description, highlights, fhwaDesignation, fhwaQualities, sourceUrl, seededAt
- ☐ System creates indexes on state, archetype, and compositeScore
- ☐ System implements internal upsert mutation (admin-only)
- ☐ System implements public by_state query for client sync
- ☐ System validates all required fields before insertion
- ☐ System handles duplicate routes by updating existing records
- ☐ System stores source metadata (website URL, scrape date)
- ☐ System returns created/updated route IDs for verification
- ☐ System logs upsert count and any validation errors
- ☐ System completes batch upsert of 100 routes in under 10 seconds
