---
stability: FEATURE_SPEC
last_validated: 2026-04-10
prd_version: 1.0.0
functional_group: QUALITY
---

# Use Cases: Quality Scoring (QUALITY)

| UC ID | Title | Description |
|-------|-------|-------------|
| UC-QUALITY-01 | Compute OSM Curvature Scores | System analyzes OSM road geometry to compute curvature scores for each route |
| UC-QUALITY-02 | Calculate Composite Quality Score | System combines extracted attributes and geometric features into composite score (0-10 scale) |
| UC-QUALITY-03 | Classify Route Archetype | System assigns archetype based on feature thresholds or clustering |

---

## UC-QUALITY-01: Compute OSM Curvature Scores

**Description:** Scoring pipeline uses adamfranco/curvature algorithm to analyze OSM road geometry and compute curvature scores. Curvature measures "meters spent in turns" weighted by turn tightness, providing objective measure of road twistiness.

**Acceptance Criteria:**
- ☐ System downloads or references OSM data extract for target region
- ☐ System runs adamfranco/curvature algorithm on OSM named roads
- ☐ System computes curvature score: weighted sum of segment lengths (straight=0, broad=1, tight=2)
- ☐ System outputs CSV with road_name, state, and curvature_score
- ☐ System matches curvature scores to routes by road name + state
- ☐ System handles road name variations (e.g., "US-129" vs "Highway 129")
- ☐ System stores curvature score as normalized value (0-1 scale)
- ☐ System logs roads with no curvature match for manual review
- ☐ System completes curvature analysis for US roads in under 4 hours
- ☐ System caches curvature results for reuse across scoring runs

---

## UC-QUALITY-02: Calculate Composite Quality Score

**Description:** Scoring engine combines LLM-extracted categorical attributes and geometric features into a deterministic composite score (0-10 scale). Formula is calibrated against editorial ground truth (Rider Magazine Top 50).

**Acceptance Criteria:**
- ☐ System defines scoring formula with weighted components:
  - Curvature: 25% (from OSM or LLM curviness mapping)
  - Scenery quality: 15% (LLM scenic_quality)
  - Traffic level: 15% (inverse of LLM traffic_level)
  - Road condition: 10% (LLM road_condition)
  - Elevation drama: 10% (max elevation change in 10-mile window)
  - Scenic designation: 10% (FHWA designation score)
  - Community rating: 10% (from source site ratings)
  - Remoteness: 5% (distance from cities >50k population)
- ☐ System normalizes all components to 0-1 scale before weighting
- ☐ System maps categorical LLM outputs to numeric scores (e.g., very_twisty=10, straight=0)
- ☐ System computes final score: weighted_sum * 10 (rounded to 2 decimals)
- ☐ System validates score is within 0-10 range
- ☐ System stores compositeScore in Convex curated_routes table
- ☐ System logs score breakdown for calibration analysis
- ☐ System completes scoring for 17k routes in under 5 minutes
- ☐ System recalibrates weights based on ground truth comparison

---

## UC-QUALITY-03: Classify Route Archetype

**Description:** Scoring engine assigns each route to an archetype (twisties, mountain_epic, coastal, adventure, scenic_byway, desert) based on feature thresholds. Classification helps riders quickly identify routes matching their preferences.

**Acceptance Criteria:**
- ☐ System defines archetype decision tree with threshold rules:
  - adventure: surface in (gravel, dirt, mixed) OR bdr_tagged=true
  - coastal: coastal_miles < 15 AND fhwa_designation=true
  - mountain_epic: elevation_gain_m > 1200
  - twisties: curviness in (twisty, very_twisty)
  - scenic_byway: fhwa_designation=true
  - desert: default (low curvature, high remoteness, arid)
- ☐ System evaluates rules in priority order (adventure first, desert last)
- ☐ System assigns single archetype per route (primary classification)
- ☐ System stores archetype in Convex curated_routes table
- ☐ System validates archetype is one of allowed values
- ☐ System logs routes with ambiguous classification for review
- ☐ System completes classification for 17k routes in under 1 minute
- ☐ System supports future k-means clustering alternative (data-driven approach)
