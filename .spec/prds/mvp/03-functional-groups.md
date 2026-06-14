---
stability: FEATURE_SPEC
last_validated: 2026-06-14
prd_version: 2.0.0
---

# Functional Groups

> **⚠️ DELTA-001 (v2.0.0, folded into Sprint 01):** Under the delta, the **DISC** group is re-homed off the dedicated Discover screen onto the **map + chat home** — discovery becomes curated-route **suggestion pills** (shown when no route is on the map) plus curated routes surfaced as **chat route-cards** that render on the map. The archetype filter-bar + sort-toggle are dropped (replaced by conversational refinement). See [DELTA-001](./DELTA-001-unified-map-chat-discovery.md). Now part of Sprint 01.

| Group | Prefix | Description |
|---|---|---|
| Backend Data & Queries | DATA | The foundational backend gates plus the read path that turn the existing 5,654-row curated_routes catalog into a discoverable surface. Owns the five enabling gates (seed @convex-dev/geospatial from centroids, UI<->DB archetype mapping in the query layer, the additive optional curatedRouteRef bookmark field on saved_routes, dirty-state-string normalization, junk-lengthMiles clamping) and the two net-new public queries (listCuratedRoutes for bbox/state/archetype/sort browse, getCuratedRouteDetail for lean detail + dimension scores + polyline-or-null + centroid for weather). Read path over existing tables: no destructive migration. Honors the verified D0 truths: scores are 0-1 (NOT 0-100), enrichment is EMPTY, routePolyline is ~55% present, oneLiner/badges/designation are 0% present. |
| Discovery Surface | DISC | The hero home experience: mount the orphaned components/discovery/* UI as the DEFAULT HOME, demote the chat planning agent to a secondary 'Plan a ride' drawer entry (unmodified), feed the screen with live data via a new useCurateddiscovery Convex hook, replace MOCK_ROUTES, render real Mapbox pins (converging the orphan screen off react-native-maps onto MapboxMapView), archetype filter chips, best/nearest sort, by-proximity and by-state browse, and legible loading/empty overlays. Includes the cross-cutting full discover-to-ride journey UC that the D9 on-device gate verifies. |
| Route Detail | DTL | The lean detail surface for a single curated route, rendered from LEAN-ONLY data: a name/summary-derived headline (no badges, 0% present), the five dimension scores plus composite rendered as bars/percent on the 0-1 scale (never '92'), polyline geometry with a centroid-marker 'Approximate location' fallback for the ~45% lacking geometry, basic weather conditions for the centroid, and the Save + Ride-it action affordances. No photos/history/elevation (enrichment table EMPTY). |
| Library & Handoff | SAVE | Closing the loop: persist a curated route as a first-class bookmark via curatedRouteRef (recordRouteFeedback('save') + saved_routes write with no synthesized PlanInput/RouteSnapshot/legs), have it appear in and reopen from the existing Saved screen without crashing legacy SavedRouteCard, and the 'Ride it' open-in-Google/Apple-Maps deep-link handoff from the route centroid + name on both platforms (turn-by-turn permanently out). |

## Use Case Summary

| Group | Prefix | Use Cases |
|---|---|---|
| Backend Data & Queries | DATA | 6 |
| Discovery Surface | DISC | 8 |
| Route Detail | DTL | 4 |
| Library & Handoff | SAVE | 4 |
| **Total** | | **22** |
