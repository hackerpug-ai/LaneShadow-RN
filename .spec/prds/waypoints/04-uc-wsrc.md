---
stability: FEATURE_SPEC
last_validated: 2026-04-14
prd_version: 1.0.0
functional_group: WSRC
---

# Use Cases: Waypoint Sourcing (WSRC)

Full sourcing rationale and research findings: [`../../research/waypoint-demand/06-sourcing-alternatives-deep-research.md`](../../research/waypoint-demand/06-sourcing-alternatives-deep-research.md).

| UC ID | Title | Primary category served |
|---|---|---|
| UC-WSRC-01 | Ingest Overture Maps Places (bulk monthly) | All three |
| UC-WSRC-02 | Ingest HMDB historical markers | Wander |
| UC-WSRC-03 | Ingest National Register of Historic Places | Wander |
| UC-WSRC-04 | Ingest USGS GNIS named geographic features | Pause + some Wander |
| UC-WSRC-05 | Ingest NPS + USDA + FHWA scenic / overlook feeds | Pause |
| UC-WSRC-06 | Extract OSM tourism/historic/amenity tags | All three |
| UC-WSRC-07 | Consume rider-forum NLP waypoint emissions | Taste (primary for rural) |
| UC-WSRC-08 | Ingest founder-curated regional seed list | Taste (cold start) |
| UC-WSRC-09 | Ingest AllThePlaces chain inventory | All three (blocklist source) |
| UC-WSRC-10 | Pre-compute census-tract density classifier | All three (R1 enabler) |

---

## UC-WSRC-01: Ingest Overture Maps Places (bulk monthly)

**Description**: Pipeline downloads the monthly Overture Maps Places release from AWS S3, processes the GeoParquet files, and produces a normalized set of candidate waypoints for the ingestion pipeline.

**Acceptance Criteria**:
- ☐ Administrator can run Overture ingestion via `python -m pipeline.sources.overture`
- ☐ System downloads the latest Overture release from `s3://overturemaps-us-west-2/release/{YYYY-MM-DD.N}/theme=places/type=place/*`
- ☐ System uses DuckDB or Polars to query the GeoParquet files without loading the full ~15 GB dataset into memory
- ☐ System filters to US bounding box (or configurable region)
- ☐ System normalizes each record to the shared waypoint candidate schema (see `09-technical-requirements.md`)
- ☐ System records source attribution as `source=overture`, `source_license=<the specific license per record, e.g., Apache-2.0>`, and the Overture GERS ID as `external_id`
- ☐ System tracks release version so re-runs are idempotent
- ☐ System logs total candidates extracted, category distribution, and ingestion duration

## UC-WSRC-02: Ingest HMDB historical markers

**Description**: Pipeline ingests all 191K+ historical markers from the Historical Marker Database (HMDB.org). Each marker includes lat/lng, title, description, and photo URL.

**Acceptance Criteria**:
- ☐ Administrator can run HMDB ingestion via `python -m pipeline.sources.hmdb`
- ☐ System either uses the HMDB public API (preferred) or scrapes per-marker pages following the committed crawl plan (P6) if no API is available
- ☐ System extracts marker title, description, lat/lng, photo URL, category, and HMDB marker ID
- ☐ System normalizes to the candidate schema with `category=wander`, `effort=park`, source attribution
- ☐ System respects rate limits (max 1 req/2 sec to HMDB)
- ☐ System produces a committed crawl plan before scraping if no API is used (see `../curation-hardening/tasks/CRAWL-PLAN-PROTOCOL.md`)
- ☐ System tracks last-fetched marker ID for incremental updates

## UC-WSRC-03: Ingest National Register of Historic Places

**Description**: Pipeline ingests the NRHP dataset of 95K US listed historic properties via the public GIS layer on data.gov.

**Acceptance Criteria**:
- ☐ Administrator can run NRHP ingestion via `python -m pipeline.sources.nrhp`
- ☐ System downloads the NRHP GIS layer (shapefile or GeoJSON) from data.gov / National Park Service
- ☐ System extracts property name, address, listing date, lat/lng, NRHP reference ID, and category
- ☐ System normalizes to candidate schema with `category=wander`, appropriate `effort`, source attribution
- ☐ System runs on update cadence (annual or less — NRHP is slow-moving)
- ☐ System cross-references with HMDB to avoid duplication (some HMDB markers are on NRHP properties)

## UC-WSRC-04: Ingest USGS GNIS named geographic features

**Description**: Pipeline ingests the USGS Geographic Names Information System domestic-names dataset (1M+ named features) and filters to feature classes relevant to rider waypoints.

**Acceptance Criteria**:
- ☐ Administrator can run GNIS ingestion via `python -m pipeline.sources.gnis`
- ☐ System downloads the GNIS Domestic Names TSV from the USGS Board on Geographic Names
- ☐ System filters to rider-relevant feature classes: `Summit`, `Falls`, `Gap`, `Arch`, `Basin`, `Cave`, `Cliff`, `Overlook`, `Pillar`, `Valley`, `Canyon`, and (for Wander) `Populated Place (historical)`, `Mine`, `Ghost Town`
- ☐ System extracts feature name, lat/lng, elevation, feature class, state, county, USGS topographic map reference
- ☐ System normalizes to candidate schema with `category=pause` for natural features and `category=wander` for historical/abandoned features
- ☐ System drops features more than 500ft elevation above the nearest road (unreachable by motorcycle)
- ☐ System is idempotent on re-runs

## UC-WSRC-05: Ingest NPS + USDA + FHWA scenic / overlook feeds

**Description**: Pipeline ingests three federal datasets providing high-authority overlook and scenic byway data.

**Acceptance Criteria**:
- ☐ Administrator can run each source via `python -m pipeline.sources.{nps|usda|fhwa}`
- ☐ NPS: downloads NPS visitor facility data from data.gov (includes overlooks, waysides, scenic pullouts)
- ☐ USDA Forest Service: downloads USFS Recreation Opportunity Information via the USFS public data portal
- ☐ FHWA: uses the existing scenic byways data from `../curation-hardening/` (shared source)
- ☐ All three normalize to candidate schema with `category=pause`, `source_tier=1` (highest authority)
- ☐ System deduplicates against Overture + OSM using spatial proximity + name similarity

## UC-WSRC-06: Extract OSM tourism/historic/amenity tags

**Description**: Pipeline extends the existing Overpass API integration in `../curation/` to emit waypoint candidates for tags that map to Pause/Wander/Taste.

**Acceptance Criteria**:
- ☐ System reuses the existing `pipeline.osm.overpass_client` module
- ☐ System adds three new extraction queries: `tourism=viewpoint|picnic_site|attraction` (Pause/Wander), `historic=*` (Wander), `amenity=restaurant|cafe|pub|bar|diner|ice_cream` (Taste)
- ☐ Each query filters to US bounding box + respects Overpass rate limits
- ☐ System extracts name, lat/lng, tags, OSM ID, and element type (`node`, `way`, or `relation`)
- ☐ System normalizes to candidate schema
- ☐ System runs on the same schedule as the existing route-curvature extraction pass

## UC-WSRC-07: Consume rider-forum NLP waypoint emissions

**Description**: The community NLP pipeline in `../curation-hardening/07-uc-rider.md` UC-RIDER-03 is extended to emit waypoint candidates alongside route mentions. Pipeline consumes those emissions as a new source feed.

**Acceptance Criteria**:
- ☐ UC-RIDER-03 Haiku prompt is extended to also extract waypoint mentions per post: `{name, rider_language_snippet, proposed_category, effort_signal, trigger_strength, region}`
- ☐ Extracted waypoint mentions are written to a new `community_waypoint_mentions` staging table in Convex
- ☐ The waypoints pipeline ingests from this staging table as `source=rider_forum`, `source_tier=3`, with the originating post URL stored as provenance
- ☐ **Rural priority rule** (R5): for waypoints whose coordinate falls in a census tract with density_class = rural or remote, rider-forum mentions are the **primary** Taste source — other sources are corroboration only. For urban/suburban, Overture is primary.
- ☐ System handles ambiguous geolocation (rider post says "the lighthouse past Point Arena" — use nearest match in existing data + regional LLM disambiguation)
- ☐ System is gated on UC-RIDER-03 being complete in `curation-hardening`

## UC-WSRC-08: Ingest founder-curated regional seed list (R6)

**Description**: Founder maintains CSV/JSON files of manually-curated Taste waypoints for 3 regions of personal use. Pipeline ingests these as **Tier 1 trusted entries** that bypass most quality gates.

**Acceptance Criteria**:
- ☐ Founder maintains seed files at `.spec/prds/waypoints/founder-seed/{region}.csv` with columns: `name, lat, lng, category, effort, trigger_score, description, photo_url, source_notes`
- ☐ Pipeline ingests via `python -m pipeline.sources.founder_seed --region <region>`
- ☐ Founder-seeded entries are tagged `source=founder_seed`, `source_tier=1`, `trusted=true`
- ☐ Trusted entries **bypass** L1 (category pre-filter), L2 (chain blocklist), L3 (confidence), L4 (Haiku motorcycle-relevance) — founder has already evaluated them
- ☐ Trusted entries **still participate in** L5 (corroboration boost), L7 (downvote loop), L8 (freshness re-verification)
- ☐ Initial 3 regions: **TBD per founder selection** (working default: Utah / SW Colorado + Blue Ridge / Smokies + Sierra / Eastern Sierra)
- ☐ Each region targets 30–50 entries at launch

## UC-WSRC-09: Ingest AllThePlaces chain inventory

**Description**: Pipeline extracts the AllThePlaces chain-brand inventory (already bundled in Overture under CC0-1.0) into a dedicated lookup table used by the L2 chain blocklist.

**Acceptance Criteria**:
- ☐ Pipeline extracts `source=alltheplaces` records from the Overture download
- ☐ System normalizes to a `chain_brands` table with columns: `brand_name, brand_wikidata, name_normalized, chain_category`
- ☐ Table is used by L2 (WQUAL-02) to block any candidate whose `name` or `brand:wikidata` tag matches
- ☐ Re-ingested with every Overture release (monthly)
- ☐ Administrator can manually add/override entries via a config file (`chain_blocklist_overrides.yaml`)

## UC-WSRC-10: Pre-compute census-tract density classifier (R1)

**Description**: Pipeline pre-computes `density_class` (urban / suburban / rural / remote) for every waypoint coordinate at ingestion time using US Census Bureau data. This enables R2, R3, and R5.

**Acceptance Criteria**:
- ☐ System downloads US Census Bureau TIGER/Line shapefiles for census tracts (free, public domain)
- ☐ System joins with American Community Survey 5-Year Population Estimates at tract level
- ☐ System computes `population_density_per_sq_mi` per tract and classifies: `urban` (>1,000), `suburban` (250–1,000), `rural` (25–250), `remote` (<25)
- ☐ System produces a spatial index (GeoParquet or PostGIS) for fast point-in-polygon lookup
- ☐ Every incoming waypoint candidate has `density_class` computed before L3 runs
- ☐ Thresholds are tunable via config (not hard-coded in pipeline)
- ☐ System re-runs on Census updates (every 1–3 years)
