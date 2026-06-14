---
stability: CONSTITUTION
last_validated: 2026-06-14
prd_version: 2.0.0
---

> **⚠️ DELTA-001 (v2.0.0, folded into Sprint 01):** The wiring below is the **as-built Sprint 01 plan** for the dedicated `RouteDiscoveryScreen`. Under the delta, [DELTA-001](../DELTA-001-unified-map-chat-discovery.md) re-homes discovery onto `index.tsx`; see "§7. DELTA-001 — re-home discovery onto the map/chat machinery" at the bottom of this file for what changes.

# UI Infrastructure: Discovery Client Wiring

This section is the constitution for the CLIENT side of the LaneShadow Discovery MVP. It is grounded in the live code in `/Users/justinrich/Projects/LaneShadow-RN` (read 2026-06-13), not on the design spec's idealized flow. Where the spec and the code disagree, the code wins and the divergence is flagged.

> The visual/token side of the client (design tokens, the new `ScoreDimensionBar` primitive, the detail-screen scroll architecture) lives in its own section: [10-design-system.md](./10-design-system.md).

## 1. Component reuse: ready vs. needs rework

The Discovery UI in `components/discovery/` is substantially built but ORPHAN (not imported anywhere in `app/`). Reuse triage:

| Component | File | Status | Rework needed |
|---|---|---|---|
| RouteDiscoveryScreen | `components/discovery/route-discovery-screen.tsx` | NEEDS REWORK | Renders 8 hardcoded `MOCK_ROUTES`; uses `MapViewWrapper` (react-native-maps). Repoint to `useCuratedDiscovery`; swap to `MapboxMapView`; render loading/empty overlay components instead of inline `<View>`; remove the mock absolute-positioned `rankBadge` hack (~lines 250-272); render scores as bars/% not 0-100. |
| DiscoveryFilterBar | `components/discovery/discovery-filter-bar.tsx` | READY | UI enum `all\|twisties\|scenic\|technical\|cruising\|sport\|adventure`. Reuse as-is; counts now sourced from live result instead of MOCK_ROUTES. |
| DiscoverySortToggle | `components/discovery/discovery-sort-toggle.tsx` | READY | `best\|nearest` segmented control. Reuse as-is; value drives hook params. |
| DiscoveryEmptyOverlay | `components/discovery/discovery-empty-overlay.tsx` | READY (currently unused) | Wire to `isEmpty` from the hook. |
| DiscoveryLoadingOverlay | `components/discovery/discovery-loading-overlay.tsx` | READY (currently unused) | Wire to `isLoading` from the hook. |
| RoutePin | `components/discovery/route-pin.tsx` | NEEDS REWORK (deep) | Imports `Marker` from `react-native-maps` AND uses the DB archetype enum (`twisties\|mountain\|coastal\|adventure\|scenic_byway\|desert`) — NOT the UI enum the filter bar uses. Must be re-homed onto Mapbox (`MarkerView` child or `MapboxMarker[]`) and reconciled with the archetype mapping. Visual body (copper circle, icon, rank badge, distance label) is reusable; the `<Marker>` wrapper is not. |
| StateFilterSheet / StateListItem | `components/discovery/state-filter-sheet.tsx`, `state-list-item.tsx` | READY (by-state browse) | Reuse for state-string selection; the query layer normalizes dirty state spellings (DATA-NORM gate). |
| IntentSearchSheet / IntentSummaryPill | `components/discovery/intent-search-sheet.tsx`, `intent-summary-pill.tsx` | DEFER | NL/intent search is OUT OF SCOPE for MVP. Leave mounted-off; do not wire. |

## 2. The map-component divergence (the #1 client risk)

Two map engines coexist in the repo:

- **Live home** `app/(app)/(tabs)/index.tsx` uses `MapboxMapView` (`@rnmapbox/maps` ^10.3.1) — confirmed rendering on-device.
- **Orphan Discovery** `route-discovery-screen.tsx` uses `MapViewWrapper` (`react-native-maps` 1.14.0, PROVIDER_GOOGLE) which `components/map/index.ts` labels "kept for rollback". `route-pin.tsx` imports `Marker` from `react-native-maps` directly.

**Decision: standardize Discovery on `MapboxMapView`.** Running two native map SDKs in one mounted app is a footgun (double native init, divergent theming, the rollback wrapper is not the supported path). The home already proves Mapbox on-device.

Mapbox interface facts the wiring must respect (from `components/map/mapbox-map-view.tsx`):
- `MapboxMarker.coordinates` is `{latitude,longitude}` (Google-format), but `MapboxCamera.center` is `[lng,lat]` (Mapbox-format). **Do not transpose.**
- Markers render either via `markers={MapboxMarker[]}` or via `MarkerView` children. RoutePin's custom visuals require the `MarkerView`-child route (or a custom marker render path); a plain `markers[]` array gives default copper dots only.
- `MapboxMapViewHandle` exposes `fitToCoordinates({latitude,longitude}[], padding)`, `setCameraPosition`, `recenterToUser` — Google-parity methods already exist, so camera control wiring mirrors the home screen.

## 3. Hook architecture

- **NEW** `hooks/use-curated-discovery.ts` — wraps `useQuery(api.curatedRoutes.listCuratedRoutes, params)`. Input `{center?, state?, archetypes: UIEnum[], sort, bbox?}`; output `{routes, isLoading, isEmpty}`. Derives center from `useCurrentLocation` (existing, `expo-location`). Returns rows in the `{id,name,lat,lng,archetype(UI enum),score(0-1),distanceMi}` shape the screen already maps over. This is the Convex-backed replacement for the deferred local-DB `hooks/use-route-discovery.ts`, which is LEFT UNTOUCHED for the offline fast-follow.
- **NEW** `hooks/use-curated-route-detail.ts` (or co-located) — wraps `getCuratedRouteDetail(routeId)`; returns lean detail (summary/name-derived headline, 5 dimension scores + composite on 0-1, polyline-or-centroid, basic weather). Must gracefully fall back to a centroid marker when `routePolyline` is absent (~45% of catalog).
- **NEW** `hooks/use-save-curated-route.ts` (or extend `hooks/use-saved-routes.ts`) — `{curatedRouteId, name}` → persists via `curatedRouteRef` + fires `recordRouteFeedback('save')`. Must NOT route through the legacy `useSaveRoute` (which demands PlanInput+RouteSnapshot+routeIndex per `SaveRouteArgs`). A `useIsCuratedRouteSaved(curatedRouteId)` mirrors the existing `useIsRouteSaved` for Save/Unsave state.
- Score formatting (0-1 → %/bar), archetype mapping (UI↔DB enum), and length clamping are PURE transforms — candidates for unit tests (UNIT_TEST_JUSTIFIED: zero I/O).

## 4. Navigation & default-landing change

Tabs are defined in `app/(app)/(tabs)/_layout.tsx` via expo-router `Tabs` with `tabBarStyle.display: 'none'` — the tab bar is invisible; navigation happens through the `MenuLayout` drawer (`components/layouts/menu-layout.tsx`) and `router.push()`. Current screens: `index` (chat, default), `settings`, `saved-routes`.

Changes:
1. Add `app/(app)/(tabs)/discover.tsx` rendering the wired `RouteDiscoveryScreen`, registered as a `Tabs.Screen`.
2. Make `discover` the DEFAULT LANDING. Because the tab bar is hidden, "default" is enforced by route ordering / an `index` redirect to `discover` (or by reordering Tabs so discover is first and the app's post-auth landing targets it) — NOT by a visible tab selection. The chat screen (`index.tsx`) is **not modified or deleted**.
3. Update the drawer Navigate section: primary item 'Discover' → `/(app)/(tabs)/discover`; new 'Plan a ride' item → `/(app)/(tabs)` (chat). Resolve the existing 'Home' item so two entries do not land on the same screen (repurpose 'Home' as 'Discover').
4. Detail and saved-route stay as stack-style routes pushed via `router.push` (consistent with the existing `app/(app)/saved-route/[id].tsx` pattern).

## 5. Dependencies

- **No new runtime dependency required.** `expo-linking` (~8.0.11) and `expo-location` (~19.0.8) are already in `package.json`. The 'Ride it' deep-link util uses `expo-linking` + `Platform`.
- `react-native-maps` (1.14.0) remains installed (home rollback wrapper) but is REMOVED from the Discovery render path. RoutePin must drop its direct `react-native-maps` import.
- Mapbox token wiring is already proven on-device (recent commits fixed the token plugin + prebuild).

## 6. Mobile patterns (apply to every Discovery/Detail screen)

- **Safe areas:** map is full-bleed (no SafeAreaView wrapper); overlays apply their own `useSafeAreaInsets().top` padding (DiscoveryFilterBar already does this). Detail/saved screens use `SubpageLayout` (handles top+bottom insets) per `components/CLAUDE.md`.
- **Touch targets:** RoutePin body is 44x44 (spec-compliant); preserve through the Mapbox rework. All chips/toggles ≥ 44pt.
- **Theming:** all colors via `useSemanticTheme()`; no hardcoded hex. (RoutePin currently hardcodes `#000` shadow + `#B87333` in MapboxMapView's default marker — flag for theme tokens where touched.)
- **Platform differences:** maps deep-link scheme differs by `Platform.OS` (Apple vs Google Maps); Android keyboard/adjustResize already handled by existing sheet infra; test pin tap hit-area on both platforms.
- **testIDs (E2E):** `route-discovery-screen`, `discovery-filter-bar` (+ `-chip-{archetype}`), `discovery-sort-toggle`, `discovery-loading-overlay`, `discovery-empty-overlay`, `route-pin-{routeId}`, `curated-detail-screen`, `curated-detail-save`, `curated-detail-ride-it`, `drawer-discover`, `drawer-plan-a-ride`, `saved-routes-list`.

## 7. DELTA-001 — re-home discovery onto the map/chat machinery (folded into Sprint 01)

Authoritative spec: [DELTA-001](../DELTA-001-unified-map-chat-discovery.md). Applied **after** Sprint 01. The key change vs §1–§6: discovery is **not a screen** — it rides machinery that already exists in `app/(app)/(tabs)/index.tsx`. Verified in code 2026-06-14:

- **Route cards already exist** — the agent emits `routing_card` messages rendered as `RouteAttachmentCard` in the transcript (`components/chat/routing-card.tsx` → `route-attachment-card.tsx`).
- **Map already shows the latest route** — `hooks/use-active-session-route.ts` defaults to the newest plan unless one is pinned.
- **Tap-an-earlier-card already works** — `route-attachment-card.tsx:119` `handlePress` → `onSelect()` (`routing-card.tsx:251`: `setSelectedRouteId` + `setDisplayedRoutePlanId` + camera fit) + `onViewOnMap()` (`index.tsx:1209`: `setChatMode(false)`).
- **The pill slot already exists** — `components/chat/chat-input.tsx:186` (`SuggestionChips`), fed `IDLE_SUGGESTIONS` (`index.tsx:68`), keyed to "empty session."

Delta wiring work (small, low-risk):

| # | Change | Where |
|---|---|---|
| 1 | **Suggestion pills → whole curated routes**, sourced from the live catalog (reuse `useCuratedDiscovery` / `listCuratedRoutes`) | `chat-input.tsx` pill content + `index.tsx` props |
| 2 | **Re-key pill visibility** from "empty session" (`!hasMessages`) to **"no active route on the map"** (no displayed route via `useActiveSessionRoute`) | `chat-input.tsx:186` condition + `index.tsx` |
| 3 | **Agent surfaces curated routes as `routing_card`s** so they ride the existing card→map→pin-back loop | chat-planning / agent response path |
| 4 | **Footer "open full chat" button** to the right of the chat input (re-uses `chatMode` toggle / `cycleTranscript`) | `index.tsx` footer + `chat-input.tsx` |
| 5 | **Delete the dedicated discovery path** (`discover.tsx`, and `RouteDiscoveryScreen`); **drop** `DiscoveryFilterBar` + `DiscoverySortToggle` (redundant with conversational refinement) | remove from `app/`; components deleted or left unmounted |

`IntentSearchSheet` / `IntentSummaryPill` (previously DEFER/NL-out-of-scope in §1) are now **in scope** as a possible NL-entry affordance, or NL is handled directly through the chat input — decide at implementation. The deferred local-DB `hooks/use-route-discovery.ts` stays untouched.
