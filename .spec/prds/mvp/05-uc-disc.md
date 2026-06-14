---
stability: FEATURE_SPEC
last_validated: 2026-06-14
prd_version: 2.0.0
functional_group: DISC
---

> **⚠️ DELTA-001 (v2.0.0, folded into Sprint 01):** The use cases below are the **as-built Sprint 01 record** (a dedicated `discover.tsx` / `RouteDiscoveryScreen`). A post-start delta — [DELTA-001](./DELTA-001-unified-map-chat-discovery.md) — moves discovery onto the existing **map + chat home** (`index.tsx`): curated-route **suggestion pills** when no route is on the map, plus curated routes surfaced as the existing **chat route-cards** that render on the map (tap an earlier card → it re-renders + returns to map). New **UC-DISC-09 / 10 / 11** and the superseded set (**UC-DISC-02 / 05 / 06 / 07 / 08**) are specified in DELTA-001 and authored in full when Sprint 01 is re-expanded. **Now part of Sprint 01.**

# Use Cases: Discovery Surface (DISC)

The hero home experience: mount the orphaned components/discovery/* UI as the DEFAULT HOME, demote the chat planning agent to a secondary 'Plan a ride' drawer entry (unmodified), feed the screen with live data via a new useCurateddiscovery Convex hook, replace MOCK_ROUTES, render real Mapbox pins (converging the orphan screen off react-native-maps onto MapboxMapView), archetype filter chips, best/nearest sort, by-proximity and by-state browse, and legible loading/empty overlays. Includes the cross-cutting full discover-to-ride journey UC that the D9 on-device gate verifies.

| ID | Title | Tier |
|---|---|---|
| UC-DISC-01 | Rider completes the full discover-to-ride journey on a real device | e2e |
| UC-DISC-02 | Discovery is the default home and the chat planning agent is demoted to a Plan-a-ride drawer entry | e2e |
| UC-DISC-03 | Rider discovers roads in a state they are curious about | e2e |
| UC-DISC-04 | useCuratedDiscovery hook returns live rows in the shape RouteDiscoveryScreen consumes | integration |
| UC-DISC-05 | Wire RouteDiscoveryScreen from MOCK_ROUTES to the live hook with archetype chips, best/nearest sort, and empty/loading overlays | e2e |
| UC-DISC-06 | Resolve the map-component divergence: standardize Discovery pins on MapboxMapView | e2e |
| UC-DISC-07 | Discovery surface legibility on a phone: pin density, filter bar, sort affordance | e2e |
| UC-DISC-08 | Discovery empty and loading states are legible and non-misleading | e2e |

---

## UC-DISC-01: Rider completes the full discover-to-ride journey on a real device

The single end-to-end MVP arc and the journey that the D9 on-device gate verifies. A rider opens the app to Discovery as the default home, finds a great road (by proximity or by state), opens it, understands why it's good and whether today is rideable, saves it, and hands off to a maps app to ride it. This is the cross-cutting journey that stitches together DATA, DISC, DTL, and SAVE; it is the one job the MVP must do well. Verified on real iOS AND real Android against live Convex — no mocks.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device against live Convex dev deployment

**Acceptance Criteria**

- ☐ Rider can open the app and land directly on the Discovery home screen without first encountering the chat planning agent
- ☐ Rider can see real curated route pins near their location and for a chosen state on the discovery map drawn from the live 5,654-route catalog
- ☐ Rider can filter discovery results by archetype and sort by best or nearest and see the pin set update against live data
- ☐ Rider can tap a route to open a detail view showing its headline, score bars, geometry-or-centroid, and basic conditions
- ☐ Rider can save the route from the detail view and find it persisted in the Saved screen on reopen
- ☐ Rider can hand off the saved route to Google or Apple Maps to navigate to it on both iOS and Android
- ☐ Founder can complete the entire discover-to-ride arc on a real iOS device and a real Android device against live Convex with recorded evidence

---

## UC-DISC-02: Discovery is the default home and the chat planning agent is demoted to a Plan-a-ride drawer entry

The hero entry point per Pillar 1 — 'What's great near me?' as the primary entry point. When the rider opens the app, Discovery is the default home and immediately surfaces real, ranked curated routes near their location, so the gap between 'I want to ride' and 'I'm on an amazing road' is as small as possible. This UC owns the 'Discovery is the home and shows real nearby routes' contract; the deep query mechanics belong to DATA and the detail render to DTL.

Make Discovery the default landing screen of the app and relocate the existing chat planning agent to a secondary drawer entry. Concretely: create a new route `app/(app)/(tabs)/discover.tsx` that renders the wired RouteDiscoveryScreen; register it as a `Tabs.Screen` in `app/(app)/(tabs)/_layout.tsx`; make `discover` the default landing so opening the app lands on Discovery rather than the chat map (`index.tsx`). The existing chat screen (`index.tsx`) is NOT modified or deleted; it is reachable only via a new 'Plan a ride' drawer item. Update the `MenuLayout` Navigate section (`components/layouts/menu-layout.tsx`) so the first/primary item is 'Discover' (-> /(app)/(tabs)/discover) and a 'Plan a ride' item points to /(app)/(tabs) (chat). The drawer's existing 'Home' item is repurposed/renamed to avoid two entries landing on the same screen. THIS IS THE DEFAULT-LANDING CHANGE and the highest-churn UC: tabs are nav'd via drawer + router.push with the tab bar hidden, so 'default landing' is enforced by route ordering/redirect, not a visible tab.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device (app launch + drawer navigation)

**Acceptance Criteria**

- ☐ Rider can launch the app and see Discovery as the default home screen with a full-bleed map of real curated route pins
- ☐ Rider can see routes ranked by composite score so the best roads surface first when sort is set to best
- ☐ Rider can browse routes by proximity to their current location when location is available
- ☐ System displays the loading overlay while curated routes are being fetched and the empty overlay when no routes match the current view
- ☐ Rider can open the secondary 'Plan a ride' chat agent from the drawer without it being the default home
- ☐ Rider can launch the app on a real device and land on the Discovery screen (not the chat map) as the default home.
- ☐ Rider can open the drawer and tap 'Plan a ride' to reach the unmodified chat planning agent screen.
- ☐ Rider can open the drawer and see 'Discover' as the primary Navigate entry that returns to the Discovery home.
- ☐ System can render the chat planning screen unchanged (no code edits to index.tsx beyond what default-landing requires) when reached via 'Plan a ride'.
- ☐ Rider can navigate Discover → Plan a ride → Discover without the drawer pointing two entries at the same screen.

---

## UC-DISC-03: Rider discovers roads in a state they are curious about

The second half of the entry point — find a great road 'in a state I'm curious about', serving Terry's 'planning a trip through the Blue Ridge' scenario and any rider exploring a region they don't live in. Browse-by-state must work correctly despite the dirty state strings in the catalog (the normalization that makes this correct is a DATA gate). This UC owns the rider-facing state-browse journey; the normalization itself is a DATA concern.

**Test tier:** e2e  
**Verification service:** real iOS/Android device against live Convex dev deployment

**Acceptance Criteria**

- ☐ Rider can select a state and see curated route pins for that state on the discovery map
- ☐ Rider can see a consistent set of routes for a state regardless of which spelling variant the catalog stored
- ☐ Rider can combine a state selection with an archetype filter and a best/nearest sort and see results narrow accordingly
- ☐ System displays the empty overlay when a chosen state and filter combination returns no routes

---

## UC-DISC-04: useCuratedDiscovery hook returns live rows in the shape RouteDiscoveryScreen consumes

Author a new Convex-backed hook `hooks/use-curated-discovery.ts` that wraps `useQuery(api.curatedRoutes.listCuratedRoutes, params)` and returns discovery rows in exactly the shape `RouteDiscoveryScreen` already maps over (id, name, lat, lng, archetype as UI enum, score 0-1, distanceMi). The hook accepts `{ center?: {lat,lng}, state?: string, archetypes: RouteArchetype[] (UI enum), sort: 'best'|'nearest', bbox? }`, derives `center` from `useCurrentLocation` when not supplied, passes the UI->DB archetype mapping params through to the query, and exposes `{ routes, isLoading, isEmpty }` honoring Convex's `undefined`=loading and `[]`=empty conventions. Scores arrive on a 0-1 scale and MUST be carried through unmodified (formatting to % is a render concern, not a hook concern). This replaces the deferred local-DB `hooks/use-route-discovery.ts` (which is left untouched for the offline fast-follow).

**Test tier:** integration  
**Verification service:** live Convex dev (api.curatedRoutes.listCuratedRoutes)

**Acceptance Criteria**

- ☐ System can return curated discovery rows from useCuratedDiscovery against live Convex in the {id,name,lat,lng,archetype,score,distanceMi} shape RouteDiscoveryScreen iterates over.
- ☐ System can surface a loading state (routes undefined) and a distinct empty state (routes === []) from useCuratedDiscovery so the screen renders the correct overlay.
- ☐ System can derive the query center from useCurrentLocation when no explicit center is passed to useCuratedDiscovery.
- ☐ Rider can pass UI-enum archetypes and a best|nearest sort into useCuratedDiscovery and receive rows filtered and ordered by the live query accordingly.
- ☐ System can carry compositeScore through useCuratedDiscovery on the raw 0-1 scale without rescaling to 0-100.

---

## UC-DISC-05: Wire RouteDiscoveryScreen from MOCK_ROUTES to the live hook with archetype chips, best/nearest sort, and empty/loading overlays

Replace the 8 hardcoded `MOCK_ROUTES` in `components/discovery/route-discovery-screen.tsx` with `useCuratedDiscovery`. The screen keeps its existing local UI state (selectedArchetypes via DiscoveryFilterBar UI enum, sortMode via DiscoverySortToggle) but now feeds those into the hook params instead of filtering a mock array in-memory. Archetype chip counts (currently computed from MOCK_ROUTES) come from the live result set. The screen MUST render `discovery-loading-overlay.tsx` while `isLoading` and `discovery-empty-overlay.tsx` when `isEmpty` (replacing the inline ad-hoc empty `<View>` currently in the file). Composite scores render as bars/percent (NOT 0-100; the mock 'score: 92' is wrong for real 0-1 data) wherever a score is shown. Length/distance display must clamp junk outliers per the DATA-NORM gate (defensive formatting on the client even though the query sanitizes). Remove the mock `rankBadge` absolute-positioned overlay hack (lines ~250-272) in favor of real pin rank rendering.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device against live Convex

**Acceptance Criteria**

- ☐ Rider can open Discovery on a real device and see real curated route pins from live Convex instead of the 8 mock routes.
- ☐ Rider can tap an archetype chip (UI enum) and see the pin set and chip counts update from the live result.
- ☐ Rider can toggle Best/Nearest and see the live pin ordering and rank/distance labels update accordingly.
- ☐ Rider can see the discovery-loading-overlay while results are loading and the discovery-empty-overlay when no routes match.
- ☐ Rider can see composite scores rendered as bars or percent (0–100% of a 0–1 value), never as a raw 0–100 number.

---

## UC-DISC-06: Resolve the map-component divergence: standardize Discovery pins on MapboxMapView

Eliminate the divergence where the orphan Discovery screen renders via `MapViewWrapper` (react-native-maps / Google Maps, 'kept for rollback') and `route-pin.tsx` imports `Marker` directly from 'react-native-maps', while the live home (`index.tsx`) uses `MapboxMapView`. Standardize Discovery on `MapboxMapView` so the whole app runs one map engine on-device. This requires: (a) swap `MapViewWrapper` for `MapboxMapView` in route-discovery-screen.tsx, supplying `theme`, `initialCamera` ([lng,lat] Mapbox format), and either `markers={MapboxMarker[]}` or `MarkerView` children; (b) rework `RoutePin` so it no longer depends on react-native-maps `Marker` — either render pins as `MapboxMarker[]` passed to the map, or wrap RoutePin's visual body inside a Mapbox `MarkerView` child (the copper-circle/rank-badge/distance-label visuals are reusable; the `<Marker>` wrapper is not); (c) reconcile RoutePin's DB-enum archetype prop with the screen's UI-enum filter state via the archetype mapping. Note coordinate-format trap: MapboxMarker.coordinates is {latitude,longitude} but MapboxCamera.center is [lng,lat] — wiring must not transpose them.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device (Mapbox native rendering)

**Acceptance Criteria**

- ☐ Rider can see Discovery route pins rendered by MapboxMapView (the same engine as the home map) on a real device, with no react-native-maps map mounted on the Discovery screen.
- ☐ System can render RoutePin visuals (copper circle, archetype icon, rank badge, distance label) without importing Marker from react-native-maps.
- ☐ Rider can tap a Mapbox-rendered pin and trigger the route-detail open handler with the correct routeId.
- ☐ System can pass camera center as [lng,lat] and marker coordinates as {latitude,longitude} without transposing the two formats.

---

## UC-DISC-07: Discovery surface legibility on a phone: pin density, filter bar, sort affordance

The discovery map must be legible and operable at typical phone zoom levels (zoom 8–11) where many route pins may cluster. The glassmorphic filter bar and sort toggle must not obscure more than 25% of the map viewport. Pin tap targets must meet the 44dp minimum for gloved-hand riders. The archetype filter and sort toggle must visually indicate their active state without requiring the rider to read fine text.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device against live Convex dev — visual inspection at zoom levels 8, 10, 12

**Acceptance Criteria**

- ☐ Rider can tap any visible route pin with a 44×44dp minimum touch target on a real device at any zoom level.
- ☐ Rider can see the filter chip bar occupying the top of the map with glassmorphic background (surface.glass token: rgba at 72% alpha) and rendering within safe area insets on both notched iPhone and Android devices.
- ☐ Rider can see the sort toggle (Best / Nearest ToggleGroup) positioned in the top-right corner below the filter bar with its active state indicated by semantic.color.primary.default fill on the selected segment.
- ☐ Rider can see each archetype chip displaying a count badge (formatCount: ≤99 as digit, >99 as '99+', ≥1000 as '1.2k') drawn from live Convex data, not hardcoded mock values.
- ☐ Rider can see the combined height of filter bar + sort toggle leaving at least 60% of the screen height as unobstructed map on an iPhone 14 (390×844pt) in portrait orientation.
- ☐ Rider can see pin icons at 44×44dp with archetype-specific MaterialCommunityIcons on semantic.color.primary.default (copper) background, readable against both light and dark Mapbox base map styles.
- ☐ Rider can see rank badges (1–10, circular, 18×18dp) on pin bodies when sort mode is 'best', positioned at top-right of pin body without clipping.
- ☐ Rider can see distance labels below pin bodies when sort mode is 'nearest', truncated to one decimal (e.g. '3.2 mi') in a glassmorphic pill.

---

## UC-DISC-08: Discovery empty and loading states are legible and non-misleading

The DiscoveryLoadingOverlay and DiscoveryEmptyOverlay components (already built) must be wired to real Convex loading/empty state signals and must display context-appropriate messages. The skeleton must not flash on fast loads (300ms debounce already implemented). The empty state must distinguish between 'no routes in bounding box' and 'no routes match filters' so the rider knows whether to move the map or change filters.

**Test tier:** e2e  
**Verification service:** real iOS device against live Convex dev — test by navigating to an ocean bounding box (no routes) and by selecting a filter combination with zero results

**Acceptance Criteria**

- ☐ Rider can see skeleton chip placeholders and skeleton pin circles after 300ms of Convex query loading, with the map visible behind the semi-transparent overlay.
- ☐ Rider cannot see the loading skeleton when Convex data resolves in under 300ms (debounce prevents flash).
- ☐ Rider can see 'No routes in this area' and 'Try zooming out or moving the map' when listCuratedRoutes returns an empty array for the current bbox with no active archetype filter.
- ☐ Rider can see 'No [archetype] routes in this area' (e.g. 'No Twisties routes in this area') and 'Try clearing your filter or zooming out' when archetype filter is active and returns zero results.
- ☐ Rider can see a 'Clear filter' CTA button on the filter-specific empty state that resets selectedArchetypes to [] and re-queries.
- ☐ System renders the DiscoveryEmptyOverlay with map fully visible behind it (semi-transparent surface.glass background), not a solid blocking screen.

---
