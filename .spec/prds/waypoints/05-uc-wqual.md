---
stability: FEATURE_SPEC
last_validated: 2026-04-14
prd_version: 1.0.0
functional_group: WQUAL
---

# Use Cases: Waypoint Quality Gates (WQUAL)

Full architecture + rationale: [`../../research/waypoint-demand/07-quality-gates-architecture.md`](../../research/waypoint-demand/07-quality-gates-architecture.md).

The 7 gate layers + 6 rural refinements compose into a single pipeline pass per candidate. Order of operations (ingestion → score → runtime):

```
L1 category filter → L2 chain blocklist → R1 compute density_class →
L3+R2 confidence threshold → L4 Haiku motorcycle-relevance (Taste) →
L6 Sonnet Vision (ambiguous Pause) → write to curated_waypoints with base score →
R3 local-density normalize → R4 route-proximity boost → L5 corroboration boost →
(runtime) L7 downvote loop → (scheduled) L8 freshness SLA
```

| UC ID | Title | Layer | Phase 0.5 | Cost |
|---|---|---|---|---|
| UC-WQUAL-01 | Category pre-filter | L1 | ✅ | Zero |
| UC-WQUAL-02 | Deterministic chain blocklist | L2 | ✅ | Zero |
| UC-WQUAL-03 | Density-aware confidence threshold | L3 + R2 | ✅ | Zero |
| UC-WQUAL-04 | Haiku motorcycle-relevance gate (Taste only) | L4 | ✅ | ~$0.0003/call |
| UC-WQUAL-05 | Multi-source corroboration boost | L5 | ✅ | Zero |
| UC-WQUAL-06 | Sonnet Vision pullover verification (ambiguous Pause only) | L6 | ✅ scoped | ~$28 one-time batch |
| UC-WQUAL-07 | Freshness SLA re-verification | L8 | ✅ | Zero |
| UC-WQUAL-08 | Local-density normalization | R3 | ✅ | Zero |
| UC-WQUAL-09 | Route-proximity score boost | R4 | ✅ | Zero |
| UC-WQUAL-10 | Rural-primary source priority | R5 | ✅ | Zero |

---

## UC-WQUAL-01: Category pre-filter (L1)

**Description**: Drops any candidate whose source category doesn't map to Pause / Wander / Taste. The simplest, cheapest filter — runs first to eliminate ~70–90% of raw source volume.

**Acceptance Criteria**:
- ☐ System maintains a deterministic mapping from each source's native category taxonomy to the LaneShadow waypoint category model (`pause`, `wander`, `taste`)
- ☐ Mappings exist for: Overture Places (~280 basic categories), OSM tags (`amenity=*`, `tourism=*`, `historic=*`), GNIS feature classes, HMDB marker types, NRHP property types
- ☐ Candidates whose source category has no mapping are dropped, not stored as `category=other`
- ☐ Mapping tables live in `pipeline/quality/category_map.yaml` for transparency and easy updates
- ☐ System logs drop rate per source for pipeline-run monitoring

## UC-WQUAL-02: Deterministic chain blocklist (L2)

**Description**: Blocks any candidate whose name or `brand:wikidata` tag matches an entry in the chain-brand inventory (sourced from AllThePlaces per UC-WSRC-09).

**Acceptance Criteria**:
- ☐ System queries the `chain_brands` lookup table (from UC-WSRC-09) by normalized name and `brand:wikidata` ID
- ☐ Name normalization: lowercase, strip punctuation, collapse whitespace, remove common suffixes ("LLC", "Inc", "Restaurant")
- ☐ Candidates matching any entry are rejected with reason `chain_blocklist:<matched_brand>`
- ☐ System supports manual override via `chain_blocklist_overrides.yaml` for edge cases (e.g., "Waffle House" is a chain we block, but "Ma's Waffle Shack" in a small town is independent — reject false positives via overrides)
- ☐ System logs blocked-candidate count per pipeline run for transparency
- ☐ Founder-seeded entries (UC-WSRC-08) bypass this gate (trusted source)

## UC-WQUAL-03: Density-aware confidence threshold (L3 + R2)

**Description**: Uses Overture Maps' built-in `confidence_score` field (0–1) as a pre-filter, with the threshold tiered by `density_class` from R1.

**Acceptance Criteria**:
- ☐ System reads `confidence_score` from Overture records (fall back to source-specific defaults for non-Overture sources: HMDB=0.9, NRHP=0.9, GNIS=0.85, OSM=0.7, forum NLP=0.4)
- ☐ System applies the density-tiered threshold from `density_class` (R1):
  - Urban: `confidence_score >= 0.60`
  - Suburban: `confidence_score >= 0.50`
  - **Rural: `confidence_score >= 0.30`**
  - **Remote: `confidence_score >= 0.20`**
- ☐ Candidates below threshold are rejected with reason `low_confidence:<density_class>:<score>`
- ☐ Thresholds are tunable via `pipeline/quality/confidence_thresholds.yaml`
- ☐ System logs drop rate per density class for rural-fairness monitoring
- ☐ Founder-seeded entries bypass this gate

## UC-WQUAL-04: Haiku motorcycle-relevance gate (L4, Taste only)

**Description**: For Taste candidates only (Pause and Wander skip this gate), Claude Haiku reads the waypoint's name, description, source tags, and any corroborating rider-forum mentions, then returns `{is_rider_stop: bool, reason}`. Candidates that fail are rejected.

**Acceptance Criteria**:
- ☐ System builds a prompt for each Taste candidate including: name, description, source tags, any known forum mention quotes, geographic context
- ☐ System calls Haiku with `temperature=0`, prompt caching enabled, and retry-on-invalid-JSON
- ☐ System uses Instructor or equivalent structured output validation to enforce the response schema: `{"is_rider_stop": bool, "reason": string}`
- ☐ Candidates returning `is_rider_stop=false` are rejected with reason `haiku_rider_relevance:<reason>`
- ☐ System tracks Haiku cost per pipeline run and logs total spent
- ☐ Haiku prompt is stored in `pipeline/quality/prompts/rider_relevance.txt` for versioning
- ☐ Prompt version is recorded on each rejection for reproducibility
- ☐ Pause and Wander candidates skip this gate entirely (bypass for non-Taste)
- ☐ Founder-seeded Taste entries bypass this gate (trusted source)

## UC-WQUAL-05: Multi-source corroboration boost (L5)

**Description**: Score boost (not filter) for waypoints that appear in two or more independent sources. Corroborated waypoints rank higher than single-source candidates.

**Acceptance Criteria**:
- ☐ System computes corroboration count for each waypoint via spatial proximity (≤50 meters) + name-similarity (Levenshtein ratio >0.85)
- ☐ Overture GERS ID is used as the primary cross-source entity link where available
- ☐ For each corroborating source, the boost adds a bonus to the composite score: `score += 0.05 * corroboration_count`
- ☐ Single-source waypoints are not rejected — they just rank lower
- ☐ System logs corroboration distribution per pipeline run (helps detect source-coverage gaps)
- ☐ Cross-source deduplication runs after L5 to merge the matched entries into a single canonical row with `source_refs[]` listing all sources

## UC-WQUAL-06: Sonnet Vision pullover verification (L6, ambiguous Pause only)

**Description**: For Pause candidates whose source signal is ambiguous about pullover safety, Claude 3.5 Sonnet vision reads the Street View tile at the coordinate and returns `{is_pullover_safe: bool, reason}`. See the full scoping rule at [`../../research/waypoint-demand/07-quality-gates-architecture.md`](../../research/waypoint-demand/07-quality-gates-architecture.md) §L6.

**Acceptance Criteria**:
- ☐ System classifies each Pause candidate as `auto_pass` / `auto_fail` / `ambiguous` based on source signal:
  - Auto-pass (skip Vision): OSM viewpoint with `parking=yes` OR `highway=pull_out`; HMDB markers (roadside by definition); NPS overlooks; FHWA scenic byway waysides; founder-seeded entries
  - Auto-fail (skip Vision, drop): GNIS peaks/summits at elevation >1000ft above nearest road; `access=private`; `access=no`
  - **Ambiguous → run Vision**: Overture `category=scenic_viewpoint` with no pullover signal; OSM viewpoints without `parking=*`; GNIS features within 500ft of a road but no explicit pullout data
- ☐ System fetches a Google Street View tile at the coordinate via the Street View Static API (existing key)
- ☐ System calls Claude 3.5 Sonnet Vision with the tile, temperature=0, and a structured prompt asking: "Is this location safe and feasible for a motorcycle rider to pull over and see the surrounding view?"
- ☐ Response schema: `{"is_pullover_safe": bool, "reason": string}`
- ☐ Candidates returning false are rejected with reason `vision_pullover:<reason>`
- ☐ System tracks Vision call cost per run and enforces a monthly cap (default: $50/month)
- ☐ Non-Pause candidates skip this gate entirely
- ☐ L6 only runs after L1–L3 have filtered the candidate pool (avoid paying for Vision on candidates that would have been dropped anyway)

## UC-WQUAL-07: Freshness SLA re-verification (L8)

**Description**: Every waypoint row has a `last_verified` timestamp. Records older than the category SLA are re-verified on the next scheduled pipeline run.

**Acceptance Criteria**:
- ☐ `curated_waypoints` schema includes `last_verified` timestamp column
- ☐ Freshness SLAs per category:
  - Taste: 12 months
  - Pause: 36 months
  - Wander: 36 months
- ☐ Scheduled GitHub Actions cron re-runs the pipeline monthly for stale records
- ☐ Re-verification re-fetches the source data for that waypoint and re-runs L1–L6
- ☐ If a waypoint fails verification, it's marked `status=suspended` (not deleted — soft-delete)
- ☐ If the source is gone (HTTP 404, record deleted from Overture, etc.), the waypoint is marked `status=stale`
- ☐ Suspended/stale waypoints are excluded from rider queries but retained for audit trail

## UC-WQUAL-08: Local-density score normalization (R3)

**Description**: Scoring refinement that rewards waypoints whose category is sparse in their immediate area. A diner that's the only restaurant within 20 miles gets a meaningful boost over one that's one of 50 in a 5-mile radius.

**Acceptance Criteria**:
- ☐ For each waypoint, system computes `nearby_same_category_count` within a 10-mile radius using a spatial index
- ☐ System computes `local_uniqueness = 1 / log(1 + nearby_same_category_count)`
- ☐ System applies the boost to the composite score: `composite_score *= (1 + 0.3 * local_uniqueness)`
- ☐ Computation is stored on the row and re-computed on freshness re-verification (L8)
- ☐ System logs the distribution of uniqueness boost to verify rural waypoints are benefiting as intended

## UC-WQUAL-09: Route-proximity score boost (R4)

**Description**: Waypoints within 5 miles of a curated route from the existing `curated_routes` table get a score boost proportional to the route's composite score.

**Acceptance Criteria**:
- ☐ For each waypoint, system computes the distance to the nearest curated route polyline using PostGIS or SpatiaLite spatial queries
- ☐ If `distance_to_nearest_route < 5 miles`, the waypoint receives a boost: `composite_score += route_composite_score * distance_decay_factor * 0.15` where `distance_decay_factor = max(0, 1 - distance/5)`
- ☐ Re-computed during freshness re-verification
- ☐ System logs the count of waypoints that gained a route-proximity boost vs those that didn't
- ☐ Boost coefficient (`0.15`) is tunable via config

## UC-WQUAL-10: Rural-primary source priority (R5)

**Description**: For the Taste category, invert the default sourcing priority based on `density_class`. For rural/remote waypoints, rider-forum NLP is the primary source; for urban/suburban waypoints, Overture is primary and forum NLP is corroboration.

**Acceptance Criteria**:
- ☐ System reads each Taste candidate's `density_class` (from R1)
- ☐ For `density_class = rural | remote`: waypoints whose primary source is `source=rider_forum` are treated as Tier 1 (weight 1.0); Overture entries in the same area are treated as corroboration only (L5 corroboration boost, not as standalone additions)
- ☐ For `density_class = urban | suburban`: the normal priority applies — Overture is Tier 1, forum NLP is corroboration
- ☐ System logs the ratio of rural Taste waypoints sourced from forum vs Overture (expected: forum >> Overture in rural)
- ☐ This rule is gated on UC-RIDER-03 being live; if forum NLP is empty, rural Taste falls back to Overture + founder seed
