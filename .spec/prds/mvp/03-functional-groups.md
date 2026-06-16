---
stability: FEATURE_SPEC
last_validated: 2026-06-15
prd_version: 3.0.0
---

# Functional Groups

> **✅ v3.0.0 (2026-06-15): the separate discovery view is removed.** The **DISC** group is no longer a dedicated screen or a standalone discovery surface — it is discovery **on the route plan view** (`index.tsx`): curated-route **suggestion cards** over the chat input (tap → plot) plus **chat-driven natural-language curated discovery** surfaced as the existing route-cards that render on the map. The dedicated `discover.tsx`, the archetype filter-bar, the best/nearest sort-toggle, and the by-state browse picker are dropped. This folds [DELTA-001](./DELTA-001-unified-map-chat-discovery.md) into the canonical group below.

| Group | Prefix | Description |
|---|---|---|
| Backend Data & Queries | DATA | The foundational backend gates plus the read path that turn the existing 5,654-row curated_routes catalog into a discoverable surface. Owns the five enabling gates (seed @convex-dev/geospatial from centroids, UI<->DB archetype mapping in the query layer, the additive optional curatedRouteRef bookmark field on saved_routes, dirty-state-string normalization, junk-lengthMiles clamping) and the two net-new public queries (listCuratedRoutes for bbox/state/archetype/sort browse, getCuratedRouteDetail for lean detail + dimension scores + polyline-or-null + centroid for weather). Read path over existing tables: no destructive migration. Honors the verified D0 truths: scores are 0-1 (NOT 0-100), enrichment is EMPTY, routePolyline is ~55% present, oneLiner/badges/designation are 0% present. |
| Discovery (on the route plan view) | DISC | Discovery is the behavior of the route plan view (`index.tsx`), NOT a separate screen. When no route is on the map, curated-route **suggestion cards** sit over the chat input; tapping one plots that curated route on the map and the cards hide (they return when no route is shown). **Chat-driven natural-language curated discovery** ('twisties near Asheville') returns curated routes as the existing route-cards that render on the map, with the tap-an-earlier-card → re-render → return-to-map loop. A new useCuratedDiscovery Convex hook feeds the cards from the live 5,654-route catalog (no MOCK_ROUTES). No dedicated Discover screen, no archetype filter-bar, no best/nearest sort-toggle, no by-state browse picker (region/archetype intent is conversational). Includes the cross-cutting full discover-to-ride journey UC that the D9 on-device gate verifies on the plan view. |
| Route Detail | DTL | The lean detail surface for a single curated route, rendered from LEAN-ONLY data: a name/summary-derived headline (no badges, 0% present), the five dimension scores plus composite rendered as bars/percent on the 0-1 scale (never '92'), polyline geometry with a centroid-marker 'Approximate location' fallback for the ~45% lacking geometry, basic weather conditions for the centroid, and the Save + Ride-it action affordances. No photos/history/elevation (enrichment table EMPTY). |
| Library & Handoff | SAVE | Closing the loop: persist a curated route as a first-class bookmark via curatedRouteRef (recordRouteFeedback('save') + saved_routes write with no synthesized PlanInput/RouteSnapshot/legs), have it appear in and reopen from the existing Saved screen without crashing legacy SavedRouteCard, and the 'Ride it' open-in-Google/Apple-Maps deep-link handoff from the route centroid + name on both platforms (turn-by-turn permanently out). |

## Use Case Summary

| Group | Prefix | Use Cases |
|---|---|---|
| Backend Data & Queries | DATA | 6 |
| Discovery (on the route plan view) | DISC | 5 |
| Route Detail | DTL | 4 |
| Library & Handoff | SAVE | 2 |
| **Total** | | **17** |
