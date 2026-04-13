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
- Government data limited to 184 FHWA routes when 799 Scenic Byways GIS features are freely available.

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

2. **Quality Infrastructure (QUAL)** — Three-stage deduplication (exact name+state, fuzzy Levenshtein, geospatial proximity with Convex Native Geospatial). Quality floor filter requiring at least one of: description, rating, designation, or curvature data. Coverage validation report (routes per state, per archetype, score distributions). Comprehensive post-pipeline data quality report with CI gating.

3. **Scoring & Calibration (SCORE)** — Realign composite weights to research: community_rating 5%→15%, add mention_frequency at 10%, reduce curviness 25%→20%, reduce fhwa_designation 10%→5%. Build 50-100 route ground truth set from Rider Mag + FHWA + known routes. Enforce calibration gate (80% agreement threshold) before full-batch extraction. Measure Haiku extraction accuracy per attribute with F1 scores.

4. **Community Sources & NLP (RIDER)** — Ingest ADVRider regional forum RSS feeds (17 forums, bypasses login wall). Ingest Reddit motorcycle subreddits via public API. Extract route mentions via NLP (road NER + sentiment + attribute classification). Compute mention_frequency and authority-weighted sentiment per route. Schedule incremental community ingestion for ongoing freshness.

**Pipeline Principles Preserved:** All existing architectural invariants (P0-P5) remain in force:
- P0: No on-device LLM
- P1: LLMs do text→structure, never structure→selection
- P2: Source-grounded only — no model recall (reinforced by this initiative's source diversification)
- P3: Calibrate against ground truth before full extraction (elevated from aspiration to enforcement)
- P4: temperature=0, reproducible runs
- P5: Deterministic parser boundary between probabilistic and guaranteed

**Timeline:** 6 weeks (full feature with polish)
**Team:** 1 full-stack developer
