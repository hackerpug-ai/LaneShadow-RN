---
stability: FEATURE_SPEC
last_validated: 2026-04-12
prd_version: 1.0.0
functional_group: QUAL
---

# Use Cases: Quality Infrastructure (QUAL)

| UC ID | Title | Description |
|-------|-------|-------------|
| UC-QUAL-01 | Deduplicate Routes Across Sources | Pipeline runs multi-pass dedup after all source ingestion completes |
| UC-QUAL-02 | Enforce Quality Floor Filter | Pipeline applies quality floor to exclude routes lacking sufficient data |
| UC-QUAL-03 | Generate Coverage Validation Report | Pipeline produces state/archetype distribution analysis with gap detection |
| UC-QUAL-04 | Generate Post-Pipeline Data Quality Report | Pipeline produces comprehensive quality report for go/no-go decisions |

---

## UC-QUAL-01: Deduplicate Routes Across Sources

**Description:** Pipeline runs a multi-pass deduplication algorithm after all source ingestion completes. Dedup prevents riders from seeing the same road listed 3 times from 3 sources, and ensures each route has one canonical record with the best available data merged.

**Acceptance Criteria:**
- ☐ Administrator can run dedup via `python -m pipeline.quality.dedup`
- ☐ System performs Pass 1: exact match on normalized name + state (case-insensitive, strip "Highway"/"Route"/"US-" prefixes)
- ☐ System performs Pass 2: fuzzy match where centroid distance < 5 miles AND name Levenshtein similarity > 0.85 using rapidfuzz.token_sort_ratio() for word-order-insensitive matching
- ☐ System performs Pass 3: geospatial match where centroid distance < 3 miles AND name Levenshtein similarity > 0.75
- ☐ System merges matched records using source priority order: FHWA GIS > Rider Magazine > twtex > motorcycleroads > bestbikingroads > curvature_discovery > USFS
- ☐ System tracks source provenance: source_priority (dict[str, int]), field_provenance (dict[str, str]), merged_at (ISO timestamp), merge_count (int)
- ☐ System retains all source URLs on the merged record for provenance
- ☐ System preserves the highest community_rating across merged sources
- ☐ System preserves the most complete description (longest non-null description)
- ☐ System logs merge decisions: total duplicates found, merges per source pair, merge rationale
- ☐ System produces a dedup report showing before/after route count by source
- ☐ System completes dedup for 20k routes in under 10 minutes

---

## UC-QUAL-02: Enforce Quality Floor Filter

**Description:** Pipeline applies a quality floor filter after dedup to remove routes that lack sufficient data to be useful to riders. Routes below the quality floor are excluded from the catalog rather than surfaced with empty or misleading detail cards. Quality enforcement follows a phased rollout approach with tiered marking.

**Acceptance Criteria:**
- ☐ Administrator can run quality floor filter via `python -m pipeline.quality.floor_filter`
- ☐ System requires routes to meet at least ONE of: description length > 100 characters, community_rating present, FHWA designation present, curvature score present
- ☐ System marks routes with quality_tier field based on data completeness: "premium" (all fields), "standard" (core fields), "minimal" (fails quality floor)
- ☐ **Phase 1 (Weeks 1-2)**: Soft floor - mark routes as quality_tier: "minimal" but do not reject; include in catalog
- ☐ **Phase 2 (Weeks 3-4)**: Analyze engagement metrics for minimal-tier routes (views, saves, navigation starts)
- ☐ **Phase 3 (Weeks 5-6)**: Hard floor - reject routes with zero engagement; exclude from Convex upsert (they stay in JSONL staging only)
- ☐ System implements allowlist mechanism for manual overrides to promote minimal routes to standard/premium
- ☐ System logs excluded route count, exclusion reasons breakdown, and percentage of total excluded
- ☐ System produces a quality floor report listing excluded routes with their available fields for manual review
- ☐ System tracks engagement metrics for minimal-tier routes to inform hard floor decisions

---

## UC-QUAL-03: Generate Coverage Validation Report

**Description:** Pipeline generates a coverage report after scoring, showing route distribution across states and archetypes. This reveals geographic gaps (states with < 10 routes), archetype gaps (missing adventure routes in a region), and score distribution anomalies. Coverage thresholds are tiered by archetype commonality.

**Acceptance Criteria:**
- ☐ Administrator can run coverage report via `python -m pipeline.quality.coverage_report`
- ☐ System produces state-level breakdown: routes per state, average composite score per state, archetype distribution per state
- ☐ System flags states with fewer than 10 routes as "coverage gap"
- ☐ System produces archetype-level breakdown: total routes per archetype, average score per archetype
- ☐ System flags archetypes using tiered thresholds: Common archetypes (twisties, mountain, coastal, scenic_byway) with < 50 routes nationally as "archetype gap"; Niche archetypes (adventure, desert) with < 20 routes as "archetype gap"
- ☐ System produces composite score histogram (0-2, 2-4, 4-6, 6-8, 8-10 buckets)
- ☐ System flags if more than 30% of routes fall in a single score bucket (distribution anomaly)
- ☐ System outputs report as structured JSON and human-readable markdown
- ☐ System logs coverage gaps and anomalies to console for CI integration

---

## UC-QUAL-04: Generate Post-Pipeline Data Quality Report

**Description:** Pipeline generates a comprehensive data quality report after a full pipeline run. This report is the single artifact an administrator uses to decide whether the pipeline output is ready to push to Convex production.

**Acceptance Criteria:**
- ☐ Administrator can run data quality report via `python -m pipeline.quality.data_quality_report`
- ☐ System reports completeness percentage: routes with all scored fields populated vs. total routes
- ☐ System reports source overlap percentage: routes appearing in 2+ sources vs. total routes
- ☐ System reports extraction success rate: routes where Haiku extraction succeeded vs. attempted
- ☐ System reports dedup merge rate: duplicate pairs found vs. total pre-dedup routes
- ☐ System reports quality floor exclusion rate: below-floor routes vs. total routes
- ☐ System compares current run metrics against previous run (delta reporting)
- ☐ System flags any metric that deviates more than 10% from previous run as "anomaly"
- ☐ System outputs report as structured JSON and human-readable markdown
- ☐ System returns exit code 0 (clean) or exit code 1 (anomalies detected) for CI gating
