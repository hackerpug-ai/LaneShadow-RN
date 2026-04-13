---
stability: FEATURE_SPEC
last_validated: 2026-04-12
prd_version: 1.1.0
functional_group: SRC
---

# Use Cases: Source Diversification (SRC)

| UC ID | Title | Description |
|-------|-------|-------------|
| UC-SRC-01 | Ingest US Scenic Byways GIS Layer | System imports 799-feature Scenic Byways GIS dataset from Koordinates |
| UC-SRC-04 | Run adamfranco/curvature Geometric Discovery | System discovers high-curvature roads from US OSM data |
| UC-SRC-06 | Ingest Rider Magazine 50 Best Roads | System extracts editorial ground truth routes from Rider Magazine list |

**Dropped 2026-04-12:**
- ~~UC-SRC-02 (BDR GPX)~~ — V3 lifestyle mismatch (ADV/dual-sport persona) + VAL-002 found published URLs return 403
- ~~UC-SRC-03 (twtex.com Top 100)~~ — PRD assumption invalidated by VAL-003; site is a Texas motorcycle forum, not a curated Top 100 list
- ~~UC-SRC-05 (USFS MVUM)~~ — V3 lifestyle mismatch (forest service gravel/dirt roads for dual-sport)

---

## UC-SRC-01: Ingest US Scenic Byways GIS Layer

**Description:** Administrator runs the ingestion module to import the 799-feature US Scenic Byways GIS dataset from Koordinates. This is the full FHWA dataset with route geometry — an enrichment layer over the ~645-route Epic 2 baseline FHWA CSV (produced by BASE-000 from DOT ArcGIS `US_Scenic_Byways/MapServer/107`; see `tasks/epic-02-baseline-pipeline-validation/DECISIONS.md`). The Koordinates dataset provides structured route polyline geometry, scenic qualities, and designation data with no scraping required, and is higher-fidelity geometry than the DOT layer. **Note (2026-04-13):** the earlier PRD wording ("4x expansion beyond the 184-route data.gov CSV") was based on the assumption that the FHWA source was the 184-route federal "America's Byways" program ingested via data.gov CSV. Preflight investigation established that no data.gov CSV exists and the canonical DOT source is a 645-route superset — so the Koordinates source is a geometry/quality upgrade rather than a raw volume expansion.

**Acceptance Criteria:**
- ☐ Administrator can run Scenic Byways GIS ingestion via `python -m pipeline.sources.scenic_byways`
- ☐ System downloads 799-feature dataset from Koordinates in CSV or GeoJSON format
- ☐ System parses route geometry (polyline), name, state, designation type, and scenic qualities from GIS fields
- ☐ System computes centroid coordinates and bounding box from route geometry
- ☐ System assigns archetype based on scenic qualities and route characteristics
- ☐ System reconciles against Epic 2 baseline FHWA routes (~645 from BASE-000 DOT ArcGIS extract) by name+state match, preferring GIS geometry over DOT layer centroids
- ☐ System writes ingested routes to JSONL staging file before Convex upsert
- ☐ System logs ingestion count, overlap count with existing FHWA records, and validation errors
- ☐ System completes ingestion in under 60 seconds for 799 features

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
