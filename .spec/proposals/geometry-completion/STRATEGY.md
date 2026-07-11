# Geometry Completion — Ratified Strategy (Brainstorm 2026-07-10)

**Status:** Direction ratified by founder 2026-07-10. Next step: `/kb-prd-plan` for a
sprint-sized geometry-completion PRD, sequenced BEFORE the enrichment R-leg
(`.spec/prds/enrichment/` — enrichment only covers plottable routes, so this raises its base).

**Visual audit + PoC evidence:** https://claude.ai/code/artifact/f96bd663-1835-4ffb-acd9-dfd65c6aedf6

**Prior art:** supersedes/extends `.spec/prds/catalog-geometry-recovery/` (2026-07-08,
"recover → triage → drop"). That investigation validated Tier-1 retry at only 16% yield
and projected a ~40–55% ceiling for Tier-2 endpoint-parsing. The description-reconstruction
lever (proven below) busts that ceiling, and per ratified decision 2 the "drop" step is now
gated behind rescue attempts across all levers.

## Why (audit of prod export, 2026-07-10)

Full `npx convex export` of quirky-panther-164; every polyline decoded and measured
(`poc/audit.cjs`, `poc/audit2.cjs`).

| Fact | Number |
|---|---|
| Catalog size | 5,757 curated routes |
| GOOD geometry (decoded path within 0.5–2.5× claimed length, >4 pts) | **1,707 (29.7%)** |
| WRONG-LENGTH geometry (real line, wrong roads — mostly Overpass whole-road fetches) | 1,058 (18.4%) |
| DEGENERATE geometry (≤4 pts, straight lines served as routes) | 122 (2.1%) |
| No geometry at all (centroid dot) | 2,870 (49.9%) |
| Rider-ready (good geom + desc + sane score/length + real ride name) | **1,171 (20.3%)** |
| Top-10 national suggestions that are junk (simulated `discoverCuratedRoutes`) | 7 of 10 |
| Editorial rows scored 72–90 on the 0–1 scale (pin the ranking) | 103 |
| Empty descriptions (all 642 FHWA + 1,164 BBR) | 1,806 (31.4%) |
| Duplicate name groups (Cherohala ×4, Skyline Drive ×4…) | 50 groups / 106 rows |
| Length ≤ 0 mi / > 1,000 mi (max 710,430 mi) | 64 / 41 |

**Root cause:** the DATA-011 backfill geocoded only the route *name*
(Nominatim/Overpass). It never read the *description* — which for motorcycleroads
rows is routinely full turn-by-turn directions — and had no output validation, so
whole-road Overpass fetches shipped as "generated" geometry at any length.
Meanwhile 1,017 BBR rows marked `unresolved` carry a real rider-drawn polyline in
the legacy in-row `routePolyline` field that the side-table read path ignores.

## PoC — proven 2026-07-10 with real services

Pipeline (`poc/poc-reconstruct.mjs`): **LLM (claude-sonnet-5) extracts ordered
intersection anchors from the description → Google Geocoding (region-biased +
150mi centroid sanity check) → Google Routes computeRoutes with via-waypoints →
deterministic length gate (ratio 0.6–1.6) → on fail, geocode log + lengths feed
back to the LLM for one repair round.**

| Route (real prod rows) | Result |
|---|---|
| Twist of Tepusquet Loop (CA, 41 mi) | **PASS ratio 1.00** (41.1 mi, 7 anchors, 12.2s, 1st attempt) |
| Von Hoak Loop (FL, 23 mi) | **PASS ratio 1.00** (23.1 mi, 10 anchors, 16.5s, 1st attempt) |
| Old Hwy 40 Cisco Grove→Donner (CA, 16 mi) | REVIEW — repair improved 91.7→25.9 mi; gate held it (fail-closed) |

Cost ≈ $0.07/route (LLM + geocode + routes). Full recoverable backfill ≈ $150, one
overnight batch. Result JSONs preserved in `poc/`.

## Ratified decisions

1. **Hard quality gate on every suggestion surface** (discovery tool, browse, carousel):
   only rider-ready routes are served — GOOD geometry + real ride name + sane
   score/length. The centroid fallback in `discoverCuratedRoutes` is removed; thin
   regions say so honestly. Catalog shrinks to ~1.2k visible until backfill lands. 
2. **Rescue attempt before any retirement** (founder overrode the retire-now rec):
   run the levers over the ENTIRE catalog — including FHWA freeway segments,
   zero-length rows, and empty-desc inventory — and retire only what fails every
   lever. Add an LLM ride-worthiness classifier so "is this actually a motorcycle
   ride?" is itself evidence-based (a freeway segment can get geometry and still
   never pass the rider-ready gate). Duplicates still merge (no rescue applies).
3. **Auto-accept PASS** (ratio 0.6–1.6 + region check + repair round), stored with
   `provenance='ai_reconstructed'`; failures → review queue + honest absence.
   Founder couch-tests a ~25-route sample before the full batch (R2 pattern).
4. **Standalone sprint-sized geometry PRD, before enrichment.** Enrichment R-leg
   then generates over a ~4× larger plottable base.

## The levers (waterfall over 4,050 broken-geometry routes)

| # | Lever | Routes | Mechanism |
|---|---|---|---|
| 0 | Hygiene | ~300 | Normalize editorial scores ÷100; merge 50 dup groups; fix length outliers. Deterministic. |
| 1 | Promote | 1,752 | Length-validate legacy in-row `routePolyline` → side table. Deterministic, $0. |
| 2 | Reconstruct | 948 | PoC pipeline over turn-by-turn descriptions. |
| 3 | Re-route | 1,076 | A-to-B / road-name routes via endpoint geocode + routed line, same gate. |
| — | Classify | all | LLM ride-worthiness verdict feeds the rider-ready flag (per decision 2). |
| — | Residual | 274 | No source in-row; retire only after levers fail (decision 2). |

Projection at observed pass rates: rider-ready 1,171 → **~4,300–4,700**.

## Gate spec (deterministic, reused from PoC)

- ratio = routed / claimed ∈ [0.6, 1.6]
- every anchor ≤ 150 mi from centroid; ≥ 2 anchors geocoded
- ≤ 2 LLM attempts; then REVIEW queue
- provenance recorded per route: `scraped_promoted | ai_reconstructed | name_routed`
- degenerate check on ALL geometry going forward: >4 pts and ≥1 pt/mile
