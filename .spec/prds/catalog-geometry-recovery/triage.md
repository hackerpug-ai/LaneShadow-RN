---
stability: FEATURE_SPEC
last_validated: 2026-07-09
prd_version: 0.2.0
---

# Geometry Triage List (post-recovery)

Generated 2026-07-09 from a fresh `convex export` (`quirky-panther-164`). Full data in
`.tmp/triage-list.json` + `.tmp/triage-list.md` (regenerable via `.tmp/build-triage.mjs`
from a fresh export).

## Headline numbers

- **Generated (plot):** 2,893 / 5,757 (50.3%)
- **Queue A — unresolved (centroid-only, needs research):** **2,864**
  - colloquial 1,555 · clean_descriptive 630 · origin_destination 566 · highway_ref 113
  - 562 have parseable `A - B` endpoints (quick research win — geocode the endpoints)
- **Queue B — generated but suspect (quality review):** **1,340**
  - suspect_far 647 · suspect_length 693

## ⚠️ Findings that need action now (not just "research later")

1. **Test/seed data in the catalog.** Top of Queue A by score is `Test Route CO-04/NC-07/CA-13/...`
   (score 75, archetype twisties, 50mi, "colloquial"). These are seed/test rows, not real
   roads → **drop outright** as part of cleanup. (Also `wasatch-ridge-traverse` score 85 — verify real.)
2. **Broken geometries on famous roads (Queue B, high-value).** `generated` status hid that
   these are garbage, not approximate:
   - `motorcycleroads:north-cascade` [WA] — **9,074 mi off centroid** (garbage polyline)
   - `motorcycleroads:beartooth-pass` [MT] — **1,216 mi off**
   - `cherohala-skyway`, `coronado-trail`, `haines-highway` — geometry **0.01–0.04× catalog
     length** (truncated to near-empty fragments)
   - These are headliner roads → **re-geocode (delete geometry row + re-run generateForRoute)
     or drop**, not leave as-is.

## Research approach (by Queue A pattern)

- **origin_destination (566) + highway_ref (113):** parse endpoints / ref → geocode → route.
  Highest yield (the Tier-2 validated 75% stratum). Quick wins.
- **clean_descriptive (630):** named byways/skyways/parkways → OSM relation lookup by name
  (Nominatim missed many, but Overpass `way[name~"..."]` within the route bounds may catch them).
- **colloquial (1,555):** hardest — "Croom Ritual Ride", "Stevenson Ride". Need forum source
  URL → trace, or alternate-name research. Many will drop.

## Queue B approach

- **suspect_far with huge distances (>100mi off):** almost certainly garbage (wrong-place
  geocode or bad multipolyline segment) → re-geocode or drop. Distances like 1216mi / 9074mi
  are impossible for a real road.
- **suspect_length (truncated, <0.25×):** real fragment of the road, incomplete → re-geocode
  (the endpoint-parsing may have picked a too-short segment) or accept if "close enough."
- **suspect_length (too long, >4×):** town-to-town routing took the long way (highways) →
  review; likely acceptable as a real rideable route, just not the canonical scenic segment.

## Drop gate (DESTRUCTIVE — needs explicit human confirm)

Per directive: a route with no (trustworthy) geometry is dropped; final catalog must be 100%
plottable. Candidates after research:
- Queue A residual (unresolved after research).
- Queue B garbage (broken geometries not fixed by re-geocode).
- Test/seed rows.

Projected final catalog: ~1,800-2,900 real roads that all map. **No deletion executes without
explicit confirmation, and only after the research + re-geocode pass.**
