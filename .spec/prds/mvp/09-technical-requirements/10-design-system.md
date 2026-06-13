---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 1.1.0
---

# Design System & Visual Specifications

The visual/token side of the MVP UI that the client-wiring section ([07-ui-infrastructure.md](./07-ui-infrastructure.md)) does not own: token rules for new screens, the new `ScoreDimensionBar` component, the archetype mapping layer's UI enum, state-string display normalization, and the route-detail scroll architecture. Scope guardrail: **ship the current RN look** — no design-system rebuild; Copper Navigator is the post-MVP north star.

## 1. Design token rules for MVP screens

All new components (`ScoreDimensionBar`, route detail screen, curated route detail header) MUST use `useSemanticTheme()` for every color, spacing, radius, and typography value. Hardcoding is prohibited. Key token mappings for the detail screen:

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

## 2. ScoreDimensionBar — new reusable component

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

## 3. Map component divergence fix

**Problem:** `components/discovery/route-discovery-screen.tsx` imports `MapViewWrapper` from `components/map/map-view.tsx` which uses `react-native-maps` (MapView from @PROVIDER_GOOGLE). The live home screen (`app/(app)/(tabs)/index.tsx`) and the saved-route detail (`app/(app)/saved-route/[id].tsx`) both use `MapboxMapView` from `components/map/mapbox-map-view.tsx`.

**Required fix for D5 (wire + mount Discovery):** Replace `MapViewWrapper` with `MapboxMapView` in route-discovery-screen.tsx. This is a prerequisite for pin rendering on the correct base map (Copper Navigator Mapbox style) and for polyline rendering in the detail screen.

**Impact:** `MapViewWrapper` supports a `markers` prop array; `MapboxMapView` renders markers differently (see route-polyline-component.tsx for the polyline pattern). The D5 implementer must adapt the pin rendering to Mapbox's annotation API. `RoutePin` (components/discovery/route-pin.tsx) currently wraps `Marker` from `react-native-maps` — this must be replaced with a Mapbox-compatible annotation or PointAnnotation.

**Out of scope for this fix:** Deleting `map-view.tsx`. It may be used elsewhere; flag for the RN planner to audit before removal.

> This is the visual/UX framing of the divergence; the implementation contract (coordinate-format trap, marker render paths, camera handle parity) is in [07-ui-infrastructure.md §2](./07-ui-infrastructure.md).

## 4. Archetype UI enum — mapping layer spec

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

> Backend note: the canonical archetype-map implementation and its placement decision are also recorded in [04-api-design.md](./04-api-design.md) (`Archetype map`). These must stay consistent.

## 5. State-string normalization (UI impact)

The DB has dirty state strings (e.g. 'North-Carolina' vs 'North Carolina'). The state filter sheet (`components/discovery/state-filter-sheet.tsx`) displays state names from the DB. The normalization MUST happen in the query/hook before display, not in the UI component. The UI component receives a clean string and renders it. This is a data-layer concern but is called out here because a dirty state name rendering in the filter sheet would look broken to the rider.

**Display rule:** Normalize by replacing hyphens with spaces and title-casing: `'North-Carolina'.replace(/-/g, ' ')`. All 50 states + multi-state variants must appear exactly once in the state list, deduplicated after normalization.

> The authoritative normalization happens in the data layer ([03-data-schema.md](./03-data-schema.md) / DATA-NORM gate); this section governs only how the cleaned string is displayed.

## 6. Route detail screen layout — scroll architecture

The route detail screen follows the same split layout as `app/(app)/saved-route/[id].tsx`:

1. **Map section** (fixed height: `Dimensions.get('window').height * 0.40`, ~336pt on iPhone 14) — MapboxMapView with MapHeaderOverlay floating over it
2. **Scrollable content section** (flex: 1 below map) — ScrollView containing: header block, summary block, score bars block, conditions row, action row

This split is established pattern in the codebase (saved-route detail uses the same architecture). Do not invent a full-screen ScrollView with map inside — the Mapbox SDK conflicts with nested scroll on Android.

**Action row** (Save + Ride It) pins to the bottom of the ScrollView content on short routes, but scrolls with content on long detail pages. Use `contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}` to clear the home indicator on iPhone.

**SubpageLayout is NOT used** for the route detail — the map must be full-bleed. Use the same root `SafeAreaView edges={['top']}` + manual `MapHeaderOverlay` pattern as saved-route/[id].tsx.
