---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-12
prd_version: 1.0.0
---

# Curation Pipeline Hardening — Overview

## Product Description

The Curation Pipeline Hardening initiative strengthens LaneShadow's route discovery catalog by diversifying data sources, adding quality infrastructure, realigning scoring weights with research, and introducing rider-generated community signals. This initiative addresses critical risks identified in a re-evaluation of the existing curation pipeline: single-source concentration (98.8% of routes from BestBikingRoads), absent deduplication, no quality floor, scoring weights diverged from research, and zero rider-behavior signals.

**Relationship to existing PRD:** This initiative extends `.spec/prds/curation/` (Route Discovery & Autonomous Data Flywheel). The existing PRD established the pipeline architecture — source ingestion, Haiku extraction, deterministic scoring, Convex push, op-sqlite sync. This PRD hardens the pipeline's *inputs* and *quality infrastructure* without changing the core architectural invariants (P0-P5).

**Product Context:** LaneShadow is an AI-native motorcycle ride planner. The route catalog is the foundation of the discovery experience. A catalog that is shallow, duplicated, single-source, or poorly scored undermines the core value proposition — riders need to trust that the routes they discover are genuinely great, not just listed on a website.

## Problem Statement

**Current State:**
- 98.8% of catalog routes (~17k of ~17.2k) come from a single source (BestBikingRoads). If BBR changes structure, goes offline, or has systematic biases, the entire catalog inherits them.
- No deduplication: routes appearing on both motorcycleroads.com and bestbikingroads.com are duplicated in the catalog. "Tail of the Dragon" could appear 3 times.
- No quality floor: routes with no description, no rating, and no designation enter the catalog with neutral 0.5 scores across all dimensions — indistinguishable from each other.
- Scoring weights diverged from research: community_rating is 5% (research says 15%), mention_frequency is absent (research says 10%), curviness is split into two redundant weights.
- No rider-generated signals: ADVRider (7.4M posts), Reddit r/motorcycles (2.3M subscribers), RideWithGPS popular routes — none integrated. The catalog reflects what *someone listed on a website*, not what *riders actually ride and recommend*.
- No coverage validation: unknown whether Hawaii, Alaska, or Puerto Rico have zero routes. Unknown archetype distribution gaps.
- No extraction validation: Haiku's attribute accuracy has never been measured against ground truth. The calibration gate exists as an empty scaffold.
- Government data limited to a single FHWA source when richer datasets are available. The Epic 2 baseline ingests ~645 scenic byway routes derived from the DOT ArcGIS `US_Scenic_Byways/MapServer/107` layer (BASE-000, 2026-04-13 — see `tasks/epic-02-baseline-pipeline-validation/DECISIONS.md`). Epic 4 still adds value by layering the Koordinates 799-feature GIS source with higher-quality route polyline geometry and scenic qualities metadata. Note: the legacy "184 route" reference number comes from the FHWA "America's Byways" federal program and appears in predecessor PRD docs; the DOT ArcGIS layer is a broader superset (NSB + state + USFS + NPS + BLM).

**Impact:**
- Riders in regions underrepresented by BBR see a thin catalog — poor discovery experience
- Duplicate routes waste screen space and erode trust ("why is this road listed twice?")
- Low-quality routes with empty descriptions produce meaningless detail cards
- Missing community signals mean iconic hidden gems rank no higher than unremarkable roads
- No data quality visibility means pipeline operators cannot tell good runs from bad runs
- Single-source dependency is an existential risk to catalog freshness

## Solution Summary

Build four layers of pipeline hardening:

1. **Source Diversification (SRC)** — Add 3 new data sources: US Scenic Byways GIS (799 routes), adamfranco/curvature (geometric discovery from OSM), Rider Magazine 50 Best (editorial ground truth). Reduces BBR concentration from 98.8% to an estimated 85-90%. *(Revised 2026-04-12: BDR, twtex, and USFS MVUM dropped. BDR + USFS are ADV/dual-sport focused and mismatch the V3 lifestyle ride community target. twtex is a Texas-only forum, not a curated list — PRD assumption invalidated by VAL-003. Initiative thesis shifts from volume diversification toward signal enrichment — Epics 6-10 carry the catalog-quality improvements.)*

2. **Quality Infrastructure (QUAL)** — Semantic matching via Convex native vectorIndex + LLM reranking (replaces the rapidfuzz three-stage cascade — see Epic 3 Architectural Decision). Every curated_route is embedded via OpenAI `text-embedding-3-small` (1536-dim); dedup queries cosine similarity via `ctx.vectorSearch()` and LLM-arbitrates mid-confidence matches. Quality floor filter requiring at least one of: description, rating, designation, or curvature data. Coverage validation report (routes per state, per archetype, score distributions). Comprehensive post-pipeline data quality report with CI gating.

3. **Scoring & Calibration (SCORE)** — Realign composite weights to research: community_rating 5%→15%, add mention_frequency at 10%, reduce curviness 25%→20%, reduce fhwa_designation 10%→5%. Build 50-100 route ground truth set from Rider Mag + FHWA + known routes. Enforce calibration gate (80% agreement threshold) before full-batch extraction. Measure Haiku extraction accuracy per attribute with F1 scores.

4. **Community Sources & NLP (RIDER)** — Ingest ADVRider regional forum RSS feeds (17 forums, bypasses login wall). Ingest Reddit motorcycle subreddits via public API. Extract route mentions via a single LLM call per post returning a structured `PostExtraction` (road_name_mentions, highway_refs, state_refs, landmark_refs, sentiment, aspect_scores, attributes, warnings, extraction_confidence) — replaces the previously-planned two-stage GLM pipeline. Match posts to routes via Convex vectorSearch + LLM rerank (Claude Haiku 4.5). Reconcile multi-mention routes with LLM conflict resolution and temporal decay. Schedule incremental community ingestion for ongoing freshness.

**Pipeline Principles Preserved:** All existing architectural invariants (P0-P5) remain in force:
- P0: No on-device LLM
- P1: LLMs do text→structure, never structure→selection
- P2: Source-grounded only — no model recall (reinforced by this initiative's source diversification)
- P3: Calibrate against ground truth before full extraction (elevated from aspiration to enforcement)
- P4: temperature=0, reproducible runs
- P5: Deterministic parser boundary between probabilistic and guaranteed

**New Principle Added (2026-04-13):**
- **P6: Committed crawl plan before extraction at scale.** Every task that extracts data from a remote source at scale (HTML scraper, paginated API, RSS feed, GIS layer) MUST produce a committed crawl plan artifact (site-map, URL inventory, fixtures, selectors, fixture-based parser tests, audit report) before running execution. Extraction without a committed crawl plan is prohibited. This principle is mandated by [`tasks/CRAWL-PLAN-PROTOCOL.md`](./tasks/CRAWL-PLAN-PROTOCOL.md) and enforced at every source task's acceptance criteria and at Step 1 of the Curation Review Protocol. Adopted after Epic 2's BBR/MR findings revealed a systemic failure mode where blind selectors, interleaved discovery/fetch/parse logic, and swallowed errors produced a 10% yield of the true BBR universe and sidebar-contaminated MR records — all before anyone could diff the output against a truth file. See [`tasks/epic-02-baseline-pipeline-validation/DECISIONS.md`](./tasks/epic-02-baseline-pipeline-validation/DECISIONS.md) "Crawl Plan Protocol adoption" for the full rationale.

**Timeline:** 6 weeks (full feature with polish)
**Team:** 1 full-stack developer
**Scope note (2026-04-16):** This is a backend pipeline initiative. All frontend work (Epic 11: Mobile UI — New Field Display) has been deferred to the [native-rewrite PRD](../../native-rewrite/07-native-app-backlog.md). The client is transitioning from React Native to native Kotlin (Android) + Swift (iOS). The pipeline still produces all data fields (surface, qualityTier, bestMonths, etc.) for the native apps to consume — only the React Native consumption layer is deferred.
