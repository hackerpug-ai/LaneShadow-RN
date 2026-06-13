---
stability: FEATURE_SPEC
last_validated: 2026-06-13
prd_version: 1.0.0
scope_posture: full
---

## In Scope

The MVP delivers the one job — **discover → understand → save → ride** — and nothing that does not directly serve it. Scope is organized as five foundational backend gates (in-scope, not optional) plus the rider-facing surface.

### Foundational backend gates (MUST precede the rider-facing features)

These fix verified data-truth defects at the query/schema layer. The rider-facing surface is unbuildable or broken without them — they are in-scope work, not fast-follow.

- **Seed the spatial index** — `@convex-dev/geospatial` is installed and wired but its points table is empty; seed it from the 5,654 `curated_routes` centroids so proximity browse works.
- **Archetype mapping layer** — UI chips (`twisties|scenic|technical|cruising|sport|adventure`) and DB `primaryArchetype` (`twisties|mountain|coastal|adventure|scenic_byway|desert`) only overlap on two values; reconcile them in the query layer (a non-destructive mapping, NOT a DB migration).
- **Save reference schema** — add optional `curatedRouteRef: v.id('curated_routes')` to `saved_routes` so a curated route can be saved as a first-class bookmark without a synthesized `PlanInput`/`RouteSnapshot`/legs.
- **State + length normalization** — normalize the 9 dirty state strings (e.g. "North-Carolina" vs "North Carolina") and clamp the junk `lengthMiles` outliers (41 routes >1000mi, max 710,430; 64 at 0) so filters and display are correct.
- **Public browse + detail queries** — `listCuratedRoutes` (bbox/state/archetype/sort over `by_centroid`/`by_archetype`/`by_composite_score`) and `getCuratedRouteDetail` (lean fields + geometry + weather); both net-new public queries (existing `leanSync`/`fetchEnrichments` are internal-only).

### Rider-facing surface

- **Discovery as the default home** — mount the existing `components/discovery/*` UI, replace `MOCK_ROUTES` with live data via a new `useCuratedDiscovery` Convex hook, and resolve the Mapbox vs `MapViewWrapper` map-component divergence. Map pins, archetype filter chips, best/nearest sort, by-proximity and by-state browse, plus the existing empty/loading overlays.
- **Chat agent demotion** — move the conversational planning agent from home to a secondary "Plan a ride" drawer entry. Kept and unmodified; just no longer the centerpiece.
- **Lean route detail** — tap a route → geometry as a polyline (with graceful **centroid-marker fallback** for the ~45% lacking polyline) + a summary/name-derived headline + the five dimension scores rendered as **bars/%** (0–1 scale, never "92") + **basic weather conditions** + Save + Ride-it.
- **Save via `curatedRouteRef`** — saving from detail persists a curated bookmark, fires `recordRouteFeedback('save')`, appears in the existing Saved screen, and reopens.
- **"Ride it" maps deep-link handoff** — open the route in Google/Apple Maps on both platforms. This is what makes the MVP actually rideable.
- **On-device E2E gate (D9)** — the full arc verified on a real iOS device and a real Android device against live Convex. This is what "done" means.
- **Repo cleanup** — remove the stale `react-native/` shadow directory and fix the workspace config so the build stays green on both platforms.

## Out of Scope

Each deferred item is named so nothing is silently dropped. Rationale is one line; most map to a later strategy phase.

- **Chat planning agent as hero** — strategy calls it "not core value… may complete in Phase 4"; kept only as a secondary drawer path.
- **On-device LLM / offline-first discovery** — highest technical risk (2s latency ceiling, device tiers); discovery happens at home on wifi for MVP. The already-built local-DB hook is preserved for the offline fast-follow.
- **Natural-language search inside Discovery** — structured filters + proximity + score ranking satisfy the job with zero LLM; NL is the first post-MVP enhancement.
- **Rich enrichment (photos / history / elevation / recommendedStarts)** — the `curated_route_enrichments` table is verified EMPTY (0 docs); detail uses lean data only. Enrichment is a post-MVP content effort.
- **Waypoints / "Moments Near Me"** — strategy Phase 0.5; routes alone satisfy the core job.
- **Weather intelligence ("best day to ride this week")** — strategy Phase 2; MVP shows only basic current conditions.
- **Voice Ride Companion** — strategy Phase 3; the differentiator, but far out.
- **Community submit / rate / share** — strategy Phase 1; matters for growth, not for "founder finds rides."
- **Scoring calibration / quality-floor / flywheel rescoring** — "wire first, tune later"; MVP surfaces current scores honestly and tunes later.
- **Pro tier / monetization / affiliate** — strategy Phase 4; no paywall in the discovery loop.
- **Turn-by-turn navigation** — permanently out; strategy exports to Google Maps instead (that IS the "ride it" handoff).
- **Copper Navigator visual redesign** — post-MVP north star; ship the current RN look, no design-system rebuild.
