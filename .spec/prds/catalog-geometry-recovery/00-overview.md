---
stability: PRODUCT_CONTEXT
last_validated: 2026-07-08
prd_version: 0.1.0
status: SUPERSEDED — see ../route-agent-quality/ (was: investigation-complete / pre-implementation)
superseded_by: ../route-agent-quality/
superseded_on: 2026-07-11
deployment_verified: quirky-panther-164 (dev)
---

# Catalog Geometry Recovery — Overview [SUPERSEDED]

> **SUPERSEDED 2026-07-11 — do not plan from this doc.** The live spec is
> [`.spec/prds/route-agent-quality/`](../route-agent-quality/README.md); the delta list
> (drop→reversible-retire, Nominatim→Google+deterministic gate, AI reconstruction lever,
> `riderReady` read gate, pi-ai removal) is in this folder's [README](./README.md).
> Everything below is retained verbatim as **historical evidence**: the verified 2026-07-08
> audit, root causes, and the completed July recovery run. All numbers were from a live
> `npx convex export` (2026-07-08), not estimates — accurate then, stale now (the
> 2026-07-10 re-audit in `.spec/proposals/geometry-completion/` is the current baseline).

## TL;DR — where we are

- **Problem confirmed:** only **497 of 5,757 (8.6%)** curated routes have plottable
  geometry. **91% of "recommended" roads render as a centroid dot**, not a road.
  The catalog *metadata* is real and populated; the *map-ability* is ~91% missing.
- **Root cause (verified, NOT a stalled job):** the 06-22 Overpass burst generated
  461 rows, then the Google-Routes backfill trickle added 36. The remaining 5,207 are
  marked `unresolved` and the backfill **never retries `unresolved` rows**. Live
  Nominatim re-testing proves most are **transient failures (429s treated as null)**,
  not un-geocodable — Blue Ridge Parkway, PCH, Million Dollar Highway all resolve now.
- **Tier-1 yield VALIDATED (2026-07-08, read-only Nominatim, stratified 32-route sample
  with retry): only 16% of the unresolved long tail resolves on a retried backfill** →
  Tier 1 alone projects coverage 8.6% → **~23%** (still 77% dots). The famous roads
  recover (headliners resolve), but the long tail doesn't. **Tier 2 (endpoint-parsing +
  Overpass ref-lookup) is the real lever** — OD + highway_ref strata fail on full-string
  geocoding (0% / 25%) but their *pieces* resolve. Realistic Tier-1+2 ceiling: **~40-55%**,
  hard-capped by scraped colloquial names ("Croom Ritual Ride", "Western Raite Ln") being
  un-geocodable. **Strategic fork now open** (see bottom).

## Verified findings (dev deployment `quirky-panther-164`, 2026-07-08)

Source: `.tmp/convex-export/` (snapshot), analyzed by `.tmp/analyze.js` + `.tmp/analyze2.js`.

| Metric | Value |
|---|---|
| `curated_routes` | **5,757** docs |
| `curated_route_geometry` | **497** (8.6%) — 461 Overpass `multipolyline` + 36 Google `polyline` |
| `curated_route_enrichments` | **0** (the "why" table is empty) |
| `geometryStatus` | `unresolved` **5,207 (90.4%)** · `generated` 497 (8.6%) · `null` 53 (0.9%) · `failed` **0** |
| Geometry timeline | 461 on **2026-06-22** (Overpass burst) · 25+7+2+2 on 06-23→07-08 (Google trickle) |
| Geometry sanity (497) | 409 ok · 33 suspect-far (>25mi off centroid) · 53 suspect-length (truncated) · 6 two-point · 2 unparseable |
| Source mix | bestbikingroads 53.8% · motorcycleroads 32.5% · fhwa 11.2% · editorial 1.8% · rider_mag 0.8% |
| `highwayNumber` populated | **0%** (Overpass ref-lookup fallback never fires) |
| Scores | avg `compositeScore` **1.915**, max **90** → ~1-2% of routes on raw 0-100 scale (breaks the 0-1 bar rendering) |
| `lengthMiles` | 41 routes >1000mi, **max 710,430mi**, 64 at 0/null |
| States | **129 "states"** (dirty: `New-York`, `North-Carolina`, `Alabama / Mississippi / Tennessee`) |
| Duplicates | Cherohala Skyway ×2, Beartoth ×2, Going-to-the-Sun ×2, Million Dollar Loop/Highway ×2 |

**Famous-road spot check (the headliners the app recommends first):** Tail of the
Dragon, Blue Ridge Parkway, Pacific Coast Highway, Million Dollar Highway, Going-to-the-Sun,
Beartooth (one of two) — **all `unresolved`, no geometry row.** Only Cherohala (one of
two duplicates) plots. So the *recommendation surface* is broken for the most famous roads,
not just the long tail.

## Root cause (three compounding causes)

1. **Transient Nominatim 429s swallowed as `unresolved`.** The backfill action
   (`actions/curatedGeometry:backfill`) treats a null/empty Nominatim response as a
   permanent `unresolved`; there is no retry/backoff. During the rate-limited runs,
   429-empty responses froze thousands of resolvable roads. **Proof:** live Nominatim
   (2026-07-08) resolves Blue Ridge Parkway ✅, PCH ✅, Million Dollar ✅, Cherohala ✅.
2. **Geocoder can't parse endpoint names.** `A - B` / `from X to Y` / `US 385 : Marathon - Terlingua`
   (~24% + ~8% of unresolved) can't be geocoded as `"{name}, {state}"`. But the endpoints
   themselves resolve fine (Branson Airport ✅, Heppner ✅) → an endpoint-parsing geocoder works.
3. **`highwayNumber` 0% populated** → Overpass ref-lookup never fires. Code comment at
   `curatedGeometryQa.ts:313`: *"Overpass won't help name-only byways."*

Plus a **fidelity** gap: the 36 Google-Routes rows are routes between bbox corners, not the
true road trace (hence suspect-far/length). The 461 Overpass multipolylines are higher-fidelity.

## The fix (tiered)

| Tier | Action | Est. yield |
|---|---|---|
| **1** | Reset 5,207 `unresolved`→`null`; re-run backfill with **Nominatim 429 retry/backoff**; prefer Overpass generator | 8.6% → **~35-50%** (the named roads, incl. headliners) |
| **2** | Endpoint-parsing geocoder for `A - B` / highway-ref names; populate `highwayNumber` during ingest | → **~65-75%** |
| **3** | Honest centroid-only UX for the residual colloquial tail (MVP "Approximate location" already handles this) | — |
| **data-debt** | Dedup famous roads; clamp 0-100 scores → 0-1; clamp length outliers; confirm state-normalize fires in read path | trust |

## Post-MVP re-sequencing (agreed 2026-07-08)

Three product decisions locked in the preceding brainstorm (see memory
`post-mvp-direction-rn-enrichment-handoff-nav`):

1. **Stay on React Native** (defer the native/Copper-Navigator rewrite until an
   on-device-LLM or voice capability forces it).
2. **Enrichment ("why this road is good") was the first bet** — *but* the geometry
   finding preempts it: **geometry recovery is now Phase 0.5′, ahead of enrichment.**
   You can't explain a road that doesn't plot.
3. **Navigation always hands off to Google/Apple Maps** (resolve the doc contradiction:
   mark in-app turn-by-turn OUT in `native-rewrite`/`complete-local-routing`).

**Revised sequence:** Phase 0.5′ (geometry recovery + data-debt cleanup) → enrichment ("why")
→ weather-window (O2) → waypoints (Phase 0.5) → community/library/revenue → offline/on-device-LLM (trigger-gated).

## Implementation status (2026-07-08)

**Geocoder rewritten — code ready, typechecks clean.** `convex/actions/curatedGeometry.ts`:
- `searchNominatim` now retries 429/503 with backoff (1.1s → 4s → 8s, 3 attempts) — the
  Tier-1 fix. A rate-limited response no longer permanently stamps a route `unresolved`.
- New `parseRouteEndpoints` + `geocodePlace` + an endpoint-parsing-first branch in
  `geocodeRouteGeometry` — the Tier-2 fix (validated 75% on OD/highway-ref names). Clean
  single names ("Cherohala Skyway") fall through to the existing name→bbox path.
- tsc clean for this file (the `@mariozechner/pi-ai` module-resolution errors are
  pre-existing across `agent/*.ts`, unrelated).

**Validation approach:** `generateForRoute({routeId})` re-attempts `unresolved`/`failed`
routes in place (it only short-circuits on `generated`), so no batch reset is needed to
prove the new code — call it directly on a handful of known-unresolved routeIds spanning
the strata (endpoint-parseable, retry-recoverable, colloquial-should-stay-null) and watch
the real end-to-end result (Nominatim + Google Routes + persist). Then the full run =
reset all `unresolved`→`null` + `backfill --all`.

**Run gates:** deploy [code, safe] → `generateForRoute` validation on ~5 routeIds [mutates
those rows only] → full reset+backfill [MUTATING, ~2-4h @ ≤1 req/s + Google Routes cost —
gated] → triage list → drop [DESTRUCTIVE — gated].

**Build-fix (unblocked deploy — 2026-07-08):** the Convex deploy was BROKEN (pre-existing,
independent of this work) — `@mariozechner/pi-ai` (imported by 19 files, a real published
runtime dep) was never installed, and its transitive `@mistralai/mistralai`→`@opentelemetry/api`
peer couldn't bundle. So the dev deployment had been stale. Fixed: `pnpm add -w @mariozechner/pi-ai`
+ added it to `convex.json` `externalPackages` (matches the langchain/jose pattern). Deploy now
green (`Convex functions ready!`). **These are uncommitted repo changes (package.json,
pnpm-lock.yaml, convex.json) — commit before they're lost.**

**Validation RESULT (2026-07-08, live end-to-end via `generateForRoute`): 7/8 previously-dead
routes now plot.** CA 78 : Escondido-Anza Borrego ✅, US 9W : Fort Montgomery-Rockleigh ✅,
Naples to Key West ✅, SR10 : Wyandotte-Tahlequah ✅, CA 89 : Topaz-Mount Shasta ✅ (all
endpoint-parsing), Blue Ridge Parkway ✅, Million Dollar Highway ✅ (Tier-1 retry). Only
Croom Ritual Ride correctly stayed `unresolved` (colloquial — no fake line). **Decoded
geometry is real + correctly placed, not the truncated/garbage geometry of the old 497:**
Naples→Key West = 1,351 coords / ~274 mi / south FL; Blue Ridge Parkway = 3,583 coords /
~438 mi (catalog 469 → 94%) / NC→VA. **Next: the gated full run** (reset 5,200 `unresolved`→
`null` + `backfill --all`).

**FULL RUN COMPLETE (2026-07-09, ~6.2h):** 5,207 unresolved processed → **2,395 recovered**
(+ 497 original = **2,893 generated → 50.2% coverage**, up from 8.6%). 2,809 remain
`unresolved` (can't auto-geocode). Mechanism: per-route `generateForRoute` loop (no reset
needed; resumable; Nominatim ≤1 req/s). Cost: ~2,500 Google Routes calls ≈ $12 (under the
$200/mo Maps credit → ~$0 net).

**Final QA over all 2,893 generated:** clean 1,784 (61.7%) · suspect-location 654 (22.6%) ·
suspect-length 455 (15.7%) · two-point 83. So **1,784 definitively correct + 1,109
real-but-questionable = 2,893 plotting**; 2,864 unresolved.

**Remaining (the recover→triage→drop tail):**
- **Triage list** = the ~2,864 `unresolved` (centroid-only) + the ~1,109 suspect geometries
  → deep-research pass (alternate names, OSM relations, source URLs) to recover what's
  recoverable; the suspect-location ones are the likely-wrong-same-name-road candidates.
- **Drop** (GATED/DESTRUCTIVE, needs explicit confirm) = routes still without trustworthy
  geometry after research. Per the directive: a route with no geometry is dropped; the final
  catalog must be 100% plottable. Projected final catalog: ~1,800-2,900 roads that all map.
- **Data-debt still open** (independent): duplicate famous roads, ~1-2% scores on 0-100,
  length outliers, dirty multi-state strings — the `curation-hardening` cleanup.

## Artifacts & pointers

- **Export + scripts (gitignored):** `.tmp/convex-export/snapshot.zip` + `tables/`,
  `.tmp/analyze.js` (integrity + geometry sanity), `.tmp/analyze2.js` (geocoder root-cause).
- **Code:**
  - `convex/curatedGeometry.ts:155-208` — `listForGeometryBackfill` (filters to unprocessed only → `unresolved` never retried)
  - `convex/actions/curatedGeometry.ts:255-301` — `geocodeRouteGeometry` (Nominatim→Google Routes, no-fake-line at 265-269)
  - `convex/actions/curatedGeometry.ts:416-533` — `backfill` action (null→`unresolved`, no retry)
  - `convex/curatedGeometryQa.ts:96-171` — `qa` action (ok/suspect_far/suspect_length); `:313` Overpass comment
  - `scripts/backfill-curated-geometry.ts` — driver (`--top`/`--sample`/`--all`/`--cursor`)
- **Memory:** `curated-catalog-geometry-8pct-incomplete`, `post-mvp-direction-rn-enrichment-handoff-nav`.
- **Spec context:** `prds/mvp/01-scope.md` (MVP assumed "55% geometry" — now 8.6%),
  `prds/mvp/11-post-mvp-opportunities.md`, `PRODUCT-STRATEGY.md`, `WHY.md`.

## Exact next action [SUPERSEDED]

~~Run Tier-1 yield validation~~ — **DONE (2026-07-08).** Result: 16% of unresolved resolves
on a retried backfill; Tier 1 alone → ~23% coverage. Tier 2 (endpoint-parsing + ref-lookup)
is required for meaningful coverage; realistic Tier-1+2 ceiling ~40-55%, capped by scraped
colloquial names. ~~Awaiting decision on the strategic fork below.~~ **The fork was decided
2026-07-10 in `.spec/prds/route-agent-quality/` — the next actions live there, not here.**

## Ratified plan (directive 2026-07-08): recover → triage → drop [SUPERSEDED 2026-07-11]

> **This plan was re-ratified with material changes** in `route-agent-quality`: **no
> deletion** — un-recoverable routes get a reversible `retired` status behind founder
> confirmation, and the "every suggestion plots" guarantee moved to a hard `riderReady`
> read gate; recovery levers changed (Google-based + AI description-reconstruction, behind
> a deterministic verification gate; Nominatim retired). Kept for the record:

**Governing principle: a route with no geometry is a broken promise. The final catalog must
be 100% plottable — every "recommended" road actually maps, by definition.** Centroid-only
dots are not acceptable. Pipeline:

1. **Recover** — get geometry for every route that *can* be geocoded.
   - Tier 1: reset `unresolved`→`null`, re-run backfill with Nominatim **429 retry/backoff**
     (validated ~16% of the tail, but recovers the headliners).
   - Tier 2: **endpoint-parsing geocoder** — parse `A - B` / `from X to Y` / `ref : A - B`
     names, geocode the two endpoints separately (they resolve even when the full string
     doesn't), route between them. Plus Overpass ref-lookup + populate `highwayNumber`.
   - This is the bulk of the engineering: the current geocoder has no retry and no endpoint
     parsing — it must be rewritten in `convex/actions/curatedGeometry.ts` first.
2. **Triage** — every route still centroid-only after recovery goes on a **deep-research list**
   (routeId, name, state, source, source URL, centroid, why-auto-failed, candidate alternate
   names / OSM relation / forum refs). Individually researched: colloquial names → real name
   (e.g. "Tail of the Dragon" → US-129 / Deals Gap), forum URLs → trace, OSM relation lookup.
3. **Drop** — anything still without geometry after recovery + research is **deleted** from
   `curated_routes` (+ its geometry/enrichment rows). **Gated: deletion is the last step,
   only after recovery + triage, and requires explicit confirmation before execution.**

End state: a smaller, 100%-plottable catalog (estimated ~3,000-3,400 roads that all plot) —
a better product than 5,757 where 91% are dots. **Tier-2 yield VALIDATED 2026-07-08
(read-only, 20-route OD/ref sample): endpoint-parsing resolves 75%, zero routes where both
endpoints failed → projects ~2,080 additional geometries, ~59% coverage pre-triage.**

**Sequence & gates:** (a) rewrite geocoder [code, safe] → (b) validate Tier-2 yield on a
sample [read-only] → (c) reset `unresolved`→`null` + run backfill [MUTATING, ~90+ min @
Nominatim ≤1 req/s + Google Routes cost — gate before launch] → (d) generate triage list from
the residual → (e) deep-research pass → (f) drop the un-recoverable [DESTRUCTIVE — gate].
