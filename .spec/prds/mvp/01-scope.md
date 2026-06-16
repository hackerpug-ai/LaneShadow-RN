---
stability: FEATURE_SPEC
last_validated: 2026-06-15
prd_version: 3.0.0
scope_posture: full
---

> **✅ v3.0.0 (2026-06-15): the separate discovery view is removed.** Discovery is no longer a dedicated screen or a standalone surface — it is the behavior of the **route plan view** (the map + chat home, `app/(app)/(tabs)/index.tsx`): **curated-route suggestion cards over the chat input** (tap → the route plots on the map) plus **chat-driven natural-language curated discovery** (the agent returns curated routes as the existing route cards that render on the map). The dedicated `discover.tsx` / `RouteDiscoveryScreen`, the archetype filter-bar, the best/nearest sort-toggle, and the by-state browse picker are all **out of the MVP**. This folds [DELTA-001](./DELTA-001-unified-map-chat-discovery.md) into the canonical scope below.

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

- **Discovery on the route plan view (no separate screen)** — discovery lives on the existing map + chat home (`index.tsx`), which is the route plan view. When no route is on the map, **curated-route suggestion cards** sit over the chat input; tapping one plots that curated route on the map and hides the cards (cards return when no route is on the map). A new `useCuratedDiscovery` Convex hook feeds the cards from the live 5,654-route catalog (no `MOCK_ROUTES`). There is **no dedicated Discover screen, no archetype filter-bar, no best/nearest sort-toggle, and no by-state browse picker** — region/archetype intent is expressed conversationally (see chat-driven discovery below).
- **Chat-driven curated discovery on the plan view** — the conversational agent is integral to the route plan view, not demoted to a drawer. Typing a natural-language request ("twisties near Asheville") returns curated route(s) as the existing chat route-cards; the latest plots on the map, and tapping an earlier card re-renders it and returns to map view. The full chat view opens from a **footer button to the right of the chat input** (reusing the existing `chatMode` toggle), distinct from send.
- **Lean route detail** — tap a route → geometry as a polyline (with graceful **centroid-marker fallback** for the ~45% lacking polyline) + a summary/name-derived headline + the five dimension scores rendered as **bars/%** (0–1 scale, never "92") + **basic weather conditions** + Save + Ride-it.
- **Save via `curatedRouteRef`** — saving from detail persists a curated bookmark, fires `recordRouteFeedback('save')`, appears in the existing Saved screen, and reopens.
- **"Ride it" maps deep-link handoff** — open the route in Google/Apple Maps on both platforms. This is what makes the MVP actually rideable.
- **On-device E2E gate (D9)** — the full arc verified on a real iOS device and a real Android device against live Convex. This is what "done" means.
- **Repo cleanup** — remove the stale `react-native/` shadow directory and fix the workspace config so the build stays green on both platforms.

## Out of Scope

Each deferred item is named so nothing is silently dropped. Rationale is one line; most map to a later strategy phase.

- **Chat planning agent as hero** — strategy calls it "not core value… may complete in Phase 4"; kept only as a secondary drawer path.
- **On-device LLM / offline-first discovery** — highest technical risk (2s latency ceiling, device tiers); discovery happens at home on wifi for MVP. The already-built local-DB hook is preserved for the offline fast-follow.
- **Dedicated Discovery screen + structured browse UI** — the standalone `discover.tsx` / `RouteDiscoveryScreen`, the archetype **filter-bar**, the best/nearest **sort-toggle**, the **by-state browse** picker, and map-pin browse are removed from the MVP. Discovery is the suggestion cards + chat on the route plan view; structured filter/sort/browse UI is a possible post-MVP enhancement. *(Natural-language curated discovery, formerly deferred here, is now IN scope on the plan view — see the rider-facing surface above.)*
- **Rich enrichment (photos / history / elevation / recommendedStarts)** — the `curated_route_enrichments` table is verified EMPTY (0 docs); detail uses lean data only. Enrichment is a post-MVP content effort.
- **Waypoints / "Moments Near Me"** — strategy Phase 0.5; routes alone satisfy the core job.
- **Weather intelligence ("best day to ride this week")** — strategy Phase 2; MVP shows only basic current conditions.
- **Voice Ride Companion** — strategy Phase 3; the differentiator, but far out.
- **Community submit / rate / share** — strategy Phase 1; matters for growth, not for "founder finds rides."
- **Scoring calibration / quality-floor / flywheel rescoring** — "wire first, tune later"; MVP surfaces current scores honestly and tunes later.
- **Pro tier / monetization / affiliate** — strategy Phase 4; no paywall in the discovery loop.
- **Turn-by-turn navigation** — permanently out; strategy exports to Google Maps instead (that IS the "ride it" handoff).
- **Copper Navigator visual redesign** — post-MVP north star; ship the current RN look, no design-system rebuild.
