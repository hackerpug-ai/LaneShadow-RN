---
stability: FEATURE_SPEC
last_validated: 2026-04-12
prd_version: 1.0.0
functional_group: SRC
---

# Use Cases: Source Diversification (SRC)

| UC ID | Title | Description |
|-------|-------|-------------|
| UC-SRC-01 | Ingest US Scenic Byways GIS Layer | System imports 799-feature Scenic Byways GIS dataset from Koordinates |
| UC-SRC-02 | Ingest Backcountry Discovery Routes GPX Files | System imports 10 multi-day BDR routes from ridebdr.com free GPX downloads |
| UC-SRC-03 | Ingest twtex.com Top 100 Motorcycle Roads | System scrapes crowd-sourced top 100 motorcycle roads with numeric scores |
| UC-SRC-04 | Run adamfranco/curvature Geometric Discovery | System discovers high-curvature roads from US OSM data |
| UC-SRC-05 | Ingest USFS Motor Vehicle Use Maps | System imports forest road data from USFS MVUM datasets |
| UC-SRC-06 | Ingest Rider Magazine 50 Best Roads | System extracts editorial ground truth routes from Rider Magazine list |

---

## UC-SRC-01: Ingest US Scenic Byways GIS Layer

**Description:** Administrator runs the ingestion module to import the 799-feature US Scenic Byways GIS dataset from Koordinates. This is the full FHWA dataset with route geometry — a 4x expansion beyond the 184-route data.gov CSV currently ingested in UC-INGEST-01. Provides structured route geometry, scenic qualities, and designation data with no scraping required.

**Acceptance Criteria:**
- ☐ Administrator can run Scenic Byways GIS ingestion via `python -m pipeline.sources.scenic_byways`
- ☐ System downloads 799-feature dataset from Koordinates in CSV or GeoJSON format
- ☐ System parses route geometry (polyline), name, state, designation type, and scenic qualities from GIS fields
- ☐ System computes centroid coordinates and bounding box from route geometry
- ☐ System assigns archetype based on scenic qualities and route characteristics
- ☐ System reconciles against existing FHWA routes from UC-INGEST-01 (184 overlap) by name+state match, preferring GIS geometry over CSV centroids
- ☐ System writes ingested routes to JSONL staging file before Convex upsert
- ☐ System logs ingestion count, overlap count with existing FHWA records, and validation errors
- ☐ System completes ingestion in under 60 seconds for 799 features

---

## UC-SRC-02: Ingest Backcountry Discovery Routes GPX Files

**Description:** Administrator runs the BDR ingestion module to import 10 multi-day backcountry routes from ridebdr.com free GPX downloads. BDR routes are the gold standard for adventure riding and provide high-value long-format routes that no other source covers.

**Acceptance Criteria:**
- ☐ Administrator can run BDR ingestion via `python -m pipeline.sources.bdr`
- ☐ System downloads free GPX files for all 10 published BDR routes from ridebdr.com
- ☐ System parses GPX waypoints, tracks, and route metadata (name, description, total distance)
- ☐ System segments multi-day routes into ride-segment-sized chunks (5-50 miles) where natural breakpoints exist (towns, campgrounds, junctions)
- ☐ System assigns adventure archetype and tags surface type as mixed/gravel based on BDR documentation
- ☐ System computes centroid, bounding box, and length in miles for each segment
- ☐ System stores parent BDR route reference on each segment for reassembly
- ☐ System logs segment count per BDR route and any parsing errors

---

## UC-SRC-03: Ingest twtex.com Top 100 Motorcycle Roads

**Description:** Administrator runs ingestion for twtex.com's crowd-sourced top 100 motorcycle roads. This editorial/community hybrid source provides numeric user scores and rankings that serve as independent calibration data.

**Acceptance Criteria:**
- ☐ Administrator can run twtex ingestion via `python -m pipeline.sources.twtex`
- ☐ System scrapes route name, state, rank, user score, and description from twtex.com top 100 list
- ☐ System respects rate limits (2-4 second delay between requests)
- ☐ System maps twtex user scores to community_rating field (normalized 0-1)
- ☐ System stores twtex rank as source metadata for calibration reference
- ☐ System writes results to JSONL staging file
- ☐ System logs ingestion count and any scraping errors

---

## UC-SRC-04: Run adamfranco/curvature Geometric Discovery

**Description:** Administrator runs the curvature analysis pipeline on US OSM PBF data to discover high-curvature named roads that may not appear in any editorial or community source. This is the primary mechanism for finding "hidden gem" routes — roads that are genuinely excellent but never written about.

**Acceptance Criteria:**
- ☐ Administrator can run curvature discovery via `python -m pipeline.sources.curvature_discovery`
- ☐ System downloads or references current US OSM PBF extract
- ☐ System runs adamfranco/curvature algorithm on all named roads in the PBF
- ☐ System filters results to roads with curvature score above configurable threshold (default: top 5% by curvature score)
- ☐ System excludes roads already in the catalog by name+state match
- ☐ System creates candidate route records with curvature score, name, state, computed centroid, and length
- ☐ System assigns twisties archetype to candidates with curvature above threshold
- ☐ System writes candidate routes to JSONL staging file for review before Convex upsert
- ☐ System logs total roads analyzed, candidates above threshold, and new-to-catalog count

---

## UC-SRC-05: Ingest USFS Motor Vehicle Use Maps

**Description:** Administrator runs ingestion for US Forest Service Motor Vehicle Use Maps (MVUM) data from Data.gov. These maps identify roads open to motorized travel on National Forest lands — critical for adventure riders seeking legal off-pavement routes.

**Acceptance Criteria:**
- ☐ Administrator can run USFS ingestion via `python -m pipeline.sources.usfs_mvum`
- ☐ System downloads MVUM datasets from Data.gov for target National Forests
- ☐ System parses road segments with surface type, vehicle class restrictions, and seasonal closures
- ☐ System filters to roads open to motorcycles (vehicle class includes motorcycle)
- ☐ System clusters adjacent road segments into ride-segment-sized routes (5-50 miles)
- ☐ System assigns adventure archetype and stores surface type (gravel, dirt, improved)
- ☐ System stores seasonal closure data as route metadata
- ☐ System logs ingestion count per National Forest and filtering statistics

---

## UC-SRC-06: Ingest Rider Magazine 50 Best Roads

**Description:** Administrator runs ingestion for Rider Magazine's curated "50 Best Roads" list. This editorial ground truth source provides expert-validated routes that serve as the primary calibration anchor for the scoring system.

**Acceptance Criteria:**
- ☐ Administrator can run Rider Magazine ingestion via `python -m pipeline.sources.rider_mag`
- ☐ System extracts route name, state, description, and editorial highlights from the Rider Magazine list
- ☐ System tags all routes with `ground_truth: true` and `ground_truth_source: rider_magazine_50_best`
- ☐ System maps editorial descriptions to route attributes using the existing Haiku extraction pipeline (UC-INGEST-03)
- ☐ System stores editorial rank as source metadata
- ☐ System validates that all 50 routes are successfully ingested
- ☐ System logs any routes that could not be matched to a geographic location
