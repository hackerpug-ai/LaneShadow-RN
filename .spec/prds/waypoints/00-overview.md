---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-14
prd_version: 1.0.0
---

# Waypoints — Overview

## Product Description

Waypoints is LaneShadow's **second content type**, parallel to the existing route catalog. Where routes are the ribbon of asphalt a rider travels, waypoints are the *moments of delight* along the way — scenic overlooks, historic sites, iconic independent diners, and rider hangouts.

The waypoint catalog is sourced, scored, and served using the **same architectural patterns as the route catalog** (single Convex table, lean projection for op-sqlite bulk sync, Haiku-for-extraction-only, deterministic SQL for ranking), with different sources, different quality gates, and its own user-facing discovery surface.

**Core discovery surface — Moments Near Me**: a map + list view that shows curated waypoints within the rider's current area, filterable by rider-intent category (Pause / Wander / Taste) and effort level. Waypoints also surface passively on the existing route detail view when a route passes near one.

**Phase 0.5 goal**: prove that riders engage with waypoints as a discovery content type, collect usage data, and validate the rural-aware pipeline against real-world sparsity. All other UX surfaces (Surprise Me, Moments Feed card stack, along-route bloom) are deferred until engagement is measured.

**Aggregation & data shape**: each waypoint is one canonical row in a new Convex table `curated_waypoints`, with the same lean/full projection pattern as `curated_routes`. A lean projection (~500 bytes/row: id, name, category, lat/lng, composite score, one-liner, effort, trigger_score) syncs to an on-device `waypoints.db` via op-sqlite. Full records (~4 KB/row including description, source refs, photos, history) fetch on-demand when the rider taps a detail card and cache in an LRU table. One `contentVersion` per row, delta-synced on app launch.

## Problem Statement

**Current state**:
- The curation pipeline (`../curation/`) treats routes as the atomic product unit. The intent-search schema has no axis for "what's on the ride."
- Community signals from rider forums are extracted only to re-weight route scores, never to surface standalone waypoints.
- The word "waypoint" doesn't appear in any existing PRD, despite the v3 brand promise centering on "Ride the Moment."
- Three of four primary personas (Mike, Rachel, Sam) have success scenarios where a waypoint is the *reason* for the ride, not a stop along the way. Only Terry (touring planner) rides for the road's own sake.

**Impact**:
- Riders can't answer "what's cool nearby this Saturday morning?" through LaneShadow — they still rely on Google Maps, forum posts, and word of mouth.
- The "Ride the Moment" brand differentiator is half-delivered; "find the road" works, "find the moment" doesn't.
- Only ~25% of the primary-persona audience is fully served by the current catalog.

**Research validation** (see [`../../research/waypoint-demand/03-findings.md`](../../research/waypoint-demand/03-findings.md)): 78–100% of rider-forum posts meaningfully mention waypoints across 5 source tiers; ~90% of waypoint mentions fit cleanly into the Pause/Wander/Taste/Gather taxonomy; rider-native language for waypoint discovery is well-established; chain contamination is ~0%. Research validates the parallel-content-type decision and the 4-category taxonomy with HIGH confidence.

## Solution Summary

A **thin additive layer** on top of the existing curation pipeline:

1. **One new Convex table** `curated_waypoints` following the lean/full projection pattern from the route catalog. One `contentVersion`, one sync mechanism, one delta path. See `09-technical-requirements.md` for the full schema.

2. **Free sourcing stack** (see `04-uc-wsrc.md`):
   - **Overture Maps Foundation** Places — 64M POIs, CDLA-Permissive-2.0 / Apache-2.0 / CC0-1.0 — primary spine for all 3 categories
   - **HMDB.org** — 191K historical markers — primary for Wander
   - **USGS GNIS** — 1M+ US named geographic features — primary for Pause natural features
   - **National Register of Historic Places** — 95K listed properties — enrichment for Wander
   - **NPS + USDA + FHWA** overlook / scenic byway feeds — enrichment for Pause
   - **OpenStreetMap** `tourism=*|historic=*|amenity=*` — already in stack
   - **Rider-forum NLP** (extension of `../curation-hardening/07-uc-rider.md` UC-RIDER-03) — **primary for rural Taste**, secondary corroboration elsewhere
   - **Founder-curated regional seed** — 30–50 Taste waypoints per region in 3 regions (TBD with founder)
   - **AllThePlaces** inventory (bundled in Overture) — source for deterministic chain blocklist
   - **US Census Bureau TIGER/Line + ACS** — population-density classifier

   **Total sourcing cost: ~$0 one-time + ~$0/month recurring.**

3. **7-layer quality-gate architecture + 6 rural refinements** (see `05-uc-wqual.md` and full spec at [`../../research/waypoint-demand/07-quality-gates-architecture.md`](../../research/waypoint-demand/07-quality-gates-architecture.md)):
   - L1 category pre-filter → L2 chain blocklist → L3 density-aware confidence → L4 Haiku motorcycle-relevance (Taste only) → L5 multi-source corroboration boost → L6 Sonnet Vision pullover verification (ambiguous Pause only) → L7 user downvote loop → L8 freshness SLA
   - R1 census density classifier → R2 tiered confidence thresholds → R3 local-density normalization → R4 route-proximity score boost → R5 forum-primary rural Taste → R6 founder regional seeding

4. **Haiku-based text→structure extraction** with prompt caching (see `09-technical-requirements.md` §AI):
   - O1: motorcycle-relevance binary gate (Taste only)
   - O2: category + effort + trigger_score attribute extraction
   - O3: rider-voice one-liner generation
   - O4: seasonal closure extraction
   - O5: Voyage embedding deduplication (not LLM selection)
   - O6: Sonnet Vision pullover verification (ambiguous Pause only, scoped ~$28 one-time)

5. **One new discovery surface** (see `06-uc-wdisc.md`): **Moments Near Me** — map view + filter chips + list view + detail sheet + downvote button + rural radius auto-expansion. Everything else (Surprise Me, Moments Feed, along-route bloom) is deferred to Phase 1 or Phase 3.

6. **Intent schema extension** — the existing `params_to_sql()` from UC-DISC-07 gains 3 new nullable keys (`waypoint_category`, `max_drive_minutes`, `include_waypoints`) for text→params extraction on waypoint queries. Haiku, cache, retry pattern all reused.

**Timeline**: 6+ weeks, gated on `curation-hardening` UC-RIDER-03 completion for Taste sourcing.
**Team**: 1 full-stack developer + founder (for regional seeding, ~6–12 hours).
**LLM cost**: ~$30–50 one-time Phase 0.5 batch with prompt caching; ongoing ~$5–15/month for freshness re-verification and incremental extraction.

## Pipeline Principles

Waypoints inherit all six pipeline principles from [`../curation/00-overview.md`](../curation/00-overview.md) (P0–P6) verbatim. No exceptions.

- **P0 — No on-device LLM.** All LLM inference is server-side Haiku + Sonnet Vision.
- **P1 — LLMs do text → structure, never structure → selection.** Haiku extracts attributes; deterministic SQL ranks.
- **P2 — Source-grounded only.** Never ask models to recall waypoints.
- **P3 — Calibrate scoring against editorial ground truth.** Rider Magazine "best stops" lists + founder seed as calibration set.
- **P4 — Determinism at temp=0.** Reproducible pipeline runs.
- **P5 — Deterministic parser boundary** between probabilistic and guaranteed stages.
- **P6 — Committed crawl plan before extraction at scale.** Overture is bulk-download (not crawl); HMDB scraping (if used) needs a crawl plan per `CRAWL-PLAN-PROTOCOL.md`.

## Epic 3 Foundation Coordination

This Waypoints PRD builds directly on the semantic matching infrastructure from **Epic 3** ([`../curation-hardening/tasks/epic-03-foundation-models-schema/`](../curation-hardening/tasks/epic-03-foundation-models-schema/)).

**Shared schema patterns**:
- `candidate_route_ids: v.optional(v.array(v.string()))` — Array of route IDs that pass near this waypoint, populated via the same geospatial proximity logic used in route deduplication (Epic 6)
- `searchEmbedding: v.optional(v.array(v.number()))` — 1536-dim vector for semantic search, using the same embedding model (`text-embedding-3-small`) and vector index pattern as `curated_routes`

**Epic 3 completion status** (as of 2026-04-14):
- ✅ INF-001 through INF-007 implemented — semantic search infrastructure is production-ready
- ✅ Convex `vectorIndex("by_embedding", {dimensions: 1536})` deployed
- ✅ `semanticSearch.ts` query wrappers available for waypoint reuse
- ⚠️ Waypoints PRD coordination task (B5) required to document these cross-references

See the red-hat review at [`.spec/reviews/red-hat-epic-03-20260414T2210Z.md`](../../../.spec/reviews/red-hat-epic-03-20260414T2210Z.md) for full Epic 3 status and technical details.

## What this initiative is NOT

- **Not a community submission feature.** Riders can downvote existing waypoints; submitting new ones is Phase 1.
- **Not a group/social feature.** Gather is Phase 1.
- **Not a real-time ambient ride experience.** Along-route bloom is Phase 3 with Ride Companion voice.
- **Not a retention mechanic.** Moments Feed is Phase 1 when engagement data justifies it.
- **Not a replacement for routes.** Routes and waypoints are parallel content types; both remain fully discoverable.

## References

- [`../../PRODUCT-STRATEGY.md`](../../PRODUCT-STRATEGY.md) Pillar 1 and Phase 0.5
- [`../../research/waypoint-demand/03-findings.md`](../../research/waypoint-demand/03-findings.md)
- [`../../research/waypoint-demand/05-rider-lexicon.md`](../../research/waypoint-demand/05-rider-lexicon.md)
- [`../../research/waypoint-demand/06-sourcing-alternatives-deep-research.md`](../../research/waypoint-demand/06-sourcing-alternatives-deep-research.md)
- [`../../research/waypoint-demand/07-quality-gates-architecture.md`](../../research/waypoint-demand/07-quality-gates-architecture.md)
- [`../curation/00-overview.md`](../curation/00-overview.md) — parent pipeline
- [`../curation-hardening/07-uc-rider.md`](../curation-hardening/07-uc-rider.md) — UC-RIDER-03 community NLP (hard dependency)
- [`../curation-hardening/tasks/epic-03-foundation-models-schema/`](../curation-hardening/tasks/epic-03-foundation-models-schema/) — Epic 3 semantic matching foundation (this PRD builds on these patterns)
