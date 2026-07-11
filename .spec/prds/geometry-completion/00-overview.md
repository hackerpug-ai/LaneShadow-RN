---
stability: PRODUCT_CONTEXT
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Geometry Completion — Every Suggested Road Is a Real Road

## Product description

A rescue-first data pipeline plus a hard read-path gate that together make one promise: **any
route LaneShadow suggests plots a real, correct road line.** Three recovery levers run over
the entire 5,757-route curated catalog in a resumable waterfall — (1) promote the rider-drawn
polylines already sitting ignored in a legacy row field, (2) AI-reconstruct geometry from the
turn-by-turn ride descriptions nobody ever parsed (LLM anchor extraction → geocoding →
routing → deterministic length gate → bounded repair round), (3) re-route A-to-B and
road-name routes from their endpoints. Every produced line passes one deterministic gate
(length ratio 0.6–1.6, region check, degenerate check) or is held fail-closed in a REVIEW
queue. An LLM ride-worthiness classifier judges "is this actually a motorcycle ride?" across
the catalog, a stored `riderReady` flag composes the evidence, and every suggestion surface —
discovery agent tool, browse queries, carousel — serves **only** rider-ready routes. Thin
regions say so honestly. Nothing is retired until every lever has failed on it and the
founder confirms.

## Problem statement

The catalog's map-ability is broken and the ranking amplifies it. The 2026-07-10 full-export
audit (`.spec/proposals/geometry-completion/STRATEGY.md`) measured every stored polyline
against its claimed length: of 5,757 routes only **1,707 (29.7%) have GOOD geometry**; 1,058
(18.4%) decode to the wrong length (unvalidated whole-road Overpass fetches shipped as
"generated"), 122 are degenerate straight lines, and 2,870 (49.9%) have no line at all. Only
**1,171 routes (20.3%) are rider-ready** end to end. Meanwhile 103 editorial rows scored
72–90 on the 0–1 scale pin the ranking, so **7 of the top-10 national suggestions are junk**
— including "Route 680--Alameda County," a commuter-freeway inventory row with an empty
description served straight to the founder. The root cause: the prior backfill geocoded only
route *names* and validated nothing, while the fix material sat in the rows the whole time —
1,752 broken routes carry a real scraped polyline in a field the read path ignores, and 948
carry full turn-by-turn descriptions. A rider who taps a recommended road and gets a dot or a
wrong squiggle stops trusting the product; per FOUNDER-BAR, the founder will not dogfood on
top of that catalog.

## Solution summary

1. **Clean** (HYG): normalize the 103 out-of-scale editorial scores at rest (÷100), merge the
   50 duplicate groups (Cherohala Skyway ×4), quarantine the 64 zero-length and 41
   >1,000-mile rows, normalize dirty state strings. Deterministic, idempotent.
2. **Rescue** (REC): the resumable lever waterfall over all 4,050 broken-geometry routes —
   promote (1,752, $0, no LLM), AI-reconstruct (948, PoC-proven 2026-07-10: Twist of
   Tepusquet Loop and Von Hoak Loop both PASS at ratio 1.00, ~$0.07/route), re-route (1,076,
   no LLM). Provenance (`scraped_promoted | ai_reconstructed | name_routed`) recorded on
   every line. Retirement is gated behind all-lever failure plus explicit founder confirm
   (~274 expected residual, reversible).
3. **Verify** (VER): one deterministic gate owns admission (ratio 0.6–1.6, anchors ≤150 mi
   from centroid, >4 pts ∧ ≥1 pt/mi); a bounded LLM repair round (≤2 attempts) feeds failure
   evidence back; still-failing routes land in a REVIEW queue, never the read path. A
   cross-provider ride-worthiness classifier records a verdict per route. The founder
   couch-tests a ~25-route sample before the full batch may run (R2 pattern).
4. **Gate** (SURF): a stored, deterministic `riderReady` flag (gate-passed geometry ∧ real
   ride ∧ sane score/length ∧ ride-worthy ∧ not retired/duplicate) gates every suggestion
   surface; the centroid fallback in `discoverCuratedRoutes` is removed; thin regions serve
   honest absence; recovered lines carry an honest provenance caption on the detail view;
   a rider's saved routes are never retroactively hidden.

**FOUNDER-BAR anchoring:** this PRD is the Trust wave's T1 ("100% plottable catalog" —
achieved as *100% of suggested routes plottable*, with honest absence for the rest) and T2
("flawless top-50" — the score-scale fix unpins the ranking; the gate makes the top-50
rider-ready by construction). It ships **before** the enrichment R-leg
(`.spec/prds/enrichment/`), whose generation covers only plottable routes — this PRD roughly
quadruples that base (projection: 1,171 → ~4,300–4,700 rider-ready at observed PoC pass
rates).

> **Grounding:** authored by a planner team (product-manager lead, convex-planner,
> frontend-designer) against the live repo, the full prod-export audit, and a real-service
> PoC run 2026-07-10 (real Anthropic + Google Geocoding + Google Routes; evidence in
> `.spec/proposals/geometry-completion/poc/`). Supersedes/extends
> `.spec/prds/catalog-geometry-recovery/` — its validated ~40–55% name-geocoding ceiling is
> bust by the description-reconstruction lever, and its "drop" step is now gated behind
> rescue attempts per the ratified rescue-first decision.
