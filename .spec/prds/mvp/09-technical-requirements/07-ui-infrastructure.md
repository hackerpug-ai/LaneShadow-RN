---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 1.0.0
---

# UI Infrastructure: Discovery Client Wiring

# UI Infrastructure: Discovery Client Wiring

This section is the constitution for the CLIENT side of the LaneShadow Discovery MVP. It is grounded in the live code in `/Users/justinrich/Projects/LaneShadow-RN` (read 2026-06-13), not on the design spec's idealized flow. Where the spec and the code disagree, the code wins and the divergence is flagged.

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

---

## (Design/UX contribution)

## 07 — UI Infrastructure (Frontend Designer section)

This section covers the visual/token side of the MVP UI that the RN planner's implementation sections do not own: the new ScoreDimensionBar component, the map component divergence fix, the archetype mapping layer's UI enum, and the token rules for all new MVP screens.

---

### 07.1 Design Token Rules for MVP Screens

All new components (ScoreDimensionBar, route detail screen, curated route detail header) MUST use `useSemanticTheme()` for every color, spacing, radius, and typography value. Hardcoding is prohibited. Key token mappings for the detail screen:

| Element | Token path |
|---|---|
| Route name headline | `semantic.type.title.lg` (Geist 17/600) |
| Summary body text | `semantic.type.body.md` (Geist 14/400) |
| 'No description yet' text | `semantic.type.body.md` + italic + `semantic.color.onSurface.muted` |
| Score bar fill | `semantic.color.primary.default` (#EE7C2B copper-500) |
| Score bar track | `semantic.color.surface.inset` |
| Score bar height | `semantic.space.xs` × 2 = 8dp (spacing.3 per dimensions token) |
| Score label text | `semantic.type.label.sm` (Geist 12/600, content.secondary) |
| Score value text | JetBrains Mono via `semantic.type.instrument.sm` (numeric readout) |
| Composite score | `semantic.type.title.lg` |
| Approximate location badge | Badge variant='outline', `semantic.color.border.default` border |
| Action buttons | Existing `Button` component (components/ui/button.tsx) |
| Weather conditions row | Existing `WeatherPillsRow` (components/map/weather-pills-row.tsx) |
| Archetype chip | Existing `Badge` component (components/ui/badge.tsx), variant='secondary' |

All glassmorphic overlays on the discovery map use `surface.glass` (rgba at 72% alpha per colors.tokens.json) — not the raw hex + inline opacity pattern currently in route-discovery-screen.tsx. The inline `CC` hex-alpha approach in the existing components is acceptable for MVP (do not refactor as part of MVP); new components use the token.

---

### 07.2 ScoreDimensionBar — New Reusable Component

**File:** `components/discovery/score-dimension-bar.tsx`

This is the only net-new UI primitive required by the MVP. It renders one dimension score as a labeled horizontal progress bar.

**Props interface:**
```typescript
type ScoreDimensionBarProps = {
  label: string          // 'Curvature' | 'Scenic' | 'Technical' | 'Traffic' | 'Remoteness'
  score: number          // 0–1 float from Convex
  testID?: string
}
```

**Visual spec:**
- Label: `semantic.type.label.sm` left-aligned, `minWidth: 80`, `semantic.color.onSurface.muted`
- Track: full-width `View`, height 8dp, `borderRadius: semantic.radius.full`, `backgroundColor: semantic.color.surface.inset`
- Fill: absolute `View`, `width: ${Math.round(score * 100)}%`, same height/radius, `backgroundColor: semantic.color.primary.default`
- Value: `Math.round(score * 100)` + `'%'`, `semantic.type.label.sm` with JetBrains Mono (instrument font), right-aligned, `semantic.color.onSurface.default`
- Outer layout: `flexDirection: 'row'`, `alignItems: 'center'`, `gap: semantic.space.sm`
- Track is a relative-positioned container; fill is absolute inside it

**Reuse boundary:** This component is used in the route detail screen only. If a future screen (e.g. a route comparison card) also needs score bars, it reuses this component — it must not be re-implemented inline.

**No Slider component reuse:** The existing `Slider` (components/ui/slider.tsx) uses PanResponder for interactive dragging. ScoreDimensionBar is display-only and must not inherit the interaction overhead of Slider. Build it independently.

---

### 07.3 Map Component Divergence Fix

**Problem:** `components/discovery/route-discovery-screen.tsx` imports `MapViewWrapper` from `components/map/map-view.tsx` which uses `react-native-maps` (MapView from @PROVIDER_GOOGLE). The live home screen (`app/(app)/(tabs)/index.tsx`) and the saved-route detail (`app/(app)/saved-route/[id].tsx`) both use `MapboxMapView` from `components/map/mapbox-map-view.tsx`.

**Required fix for D5 (wire + mount Discovery):** Replace `MapViewWrapper` with `MapboxMapView` in route-discovery-screen.tsx. This is a prerequisite for pin rendering on the correct base map (Copper Navigator Mapbox style) and for polyline rendering in the detail screen.

**Impact:** `MapViewWrapper` supports a `markers` prop array; `MapboxMapView` renders markers differently (see route-polyline-component.tsx for the polyline pattern). The D5 implementer must adapt the pin rendering to Mapbox's annotation API. `RoutePin` (components/discovery/route-pin.tsx) currently wraps `Marker` from `react-native-maps` — this must be replaced with a Mapbox-compatible annotation or PointAnnotation.

**Out of scope for this fix:** Deleting `map-view.tsx`. It may be used elsewhere; flag for the RN planner to audit before removal.

---

### 07.4 Archetype UI Enum — Mapping Layer Spec

The filter bar (`discovery-filter-bar.tsx`) exposes UI archetypes: `twisties | scenic | technical | cruising | sport | adventure`. The Convex `primaryArchetype` field contains: `twisties | mountain | coastal | adventure | scenic_byway | desert`.

Only `twisties` and `adventure` overlap. The mapping layer lives in the `listCuratedRoutes` query (server-side) or in `useCuratedDiscovery` hook (client-side). Frontend designer recommendation: put it in the hook so the UI enum stays stable and the mapping is a single client-side transform rather than a server concern.

**UI → DB mapping table (to implement in the hook):**

| UI chip | DB primaryArchetype values to include |
|---|---|
| twisties | twisties |
| scenic | mountain, coastal, scenic_byway |
| technical | (empty — no direct DB match; omit from filter or map to closest) |
| cruising | desert |
| sport | (no DB match; omit from filter for MVP) |
| adventure | adventure |

**MVP decision:** The `technical` and `sport` chips have no DB archetype match. For MVP, display them in the filter bar (they exist in the component) but inform the rider with a count of 0 when selected, which triggers the archetype-specific empty state. Do NOT silently remove chips — the filter bar is a scrollable horizontal list and removing chips mid-stream causes layout shift. Post-MVP: add `technical` and `sport` as valid DB archetypes when the curation pipeline is extended.

---

### 07.5 State String Normalization (UI Impact)

The DB has dirty state strings (e.g. 'North-Carolina' vs 'North Carolina'). The state filter sheet (`components/discovery/state-filter-sheet.tsx`) displays state names from the DB. The normalization MUST happen in the query/hook before display, not in the UI component. The UI component receives a clean string and renders it. This is a data-layer concern but is called out here because a dirty state name rendering in the filter sheet would look broken to the rider.

**Display rule:** Normalize by replacing hyphens with spaces and title-casing: `'North-Carolina'.replace(/-/g, ' ')`. All 50 states + multi-state variants must appear exactly once in the state list, deduplicated after normalization.

---

### 07.6 Route Detail Screen Layout — Scroll Architecture

The route detail screen follows the same split layout as `app/(app)/saved-route/[id].tsx`:

1. **Map section** (fixed height: `Dimensions.get('window').height * 0.40`, ~336pt on iPhone 14) — MapboxMapView with MapHeaderOverlay floating over it
2. **Scrollable content section** (flex: 1 below map) — ScrollView containing: header block, summary block, score bars block, conditions row, action row

This split is established pattern in the codebase (saved-route detail uses the same architecture). Do not invent a full-screen ScrollView with map inside — the Mapbox SDK conflicts with nested scroll on Android.

**Action row** (Save + Ride It) pins to the bottom of the ScrollView content on short routes, but scrolls with content on long detail pages. Use `contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}` to clear the home indicator on iPhone.

**SubpageLayout is NOT used** for the route detail — the map must be full-bleed. Use the same root `SafeAreaView edges={['top']}` + manual `MapHeaderOverlay` pattern as saved-route/[id].tsx.
