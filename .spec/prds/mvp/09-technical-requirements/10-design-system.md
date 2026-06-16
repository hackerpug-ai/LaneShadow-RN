---
stability: CONSTITUTION
last_validated: 2026-06-15
prd_version: 3.0.0
---

# Design System & Visual Specifications

> **✅ v3.0.0 (2026-06-15): the separate discovery view is removed.** Discovery rides the route plan view (`index.tsx`); there is no dedicated Discovery screen, archetype **filter-bar**, best/nearest **sort-toggle**, or by-state **browse picker**. The **archetype UI↔DB mapping** (§4) and **state-string normalization** (§5) below are still required — they now serve the curated-route **suggestion cards** and **chat-driven** discovery (archetype/region intent expressed conversationally and via the `useCuratedDiscovery` params), not a filter bar or state sheet. The map-divergence fix (§3) is **moot** (discovery uses the plan view's existing Mapbox); the note is retained only for the detail-screen polyline.

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

Glassmorphic overlays on the plan view (the curated-route **suggestion cards** over the chat input) use `surface.glass` (rgba at 72% alpha per colors.tokens.json) — not a raw hex + inline opacity pattern. The inline `CC` hex-alpha approach in existing components is acceptable for MVP (do not refactor as part of MVP); new components use the token.

## 2. ScoreDimensionBar — new reusable component

**File:** `components/ui/score-dimension-bar.tsx` (in `components/ui/`, not the retired `components/discovery/` dir — this primitive serves the curated-route detail view)

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

## 3. Map component divergence — moot under v3.0.0

> **Retired.** This fix targeted the dedicated `route-discovery-screen.tsx` (which rendered via `react-native-maps`/`MapViewWrapper`). With the separate discovery view removed, discovery rides the route plan view (`app/(app)/(tabs)/index.tsx`), which **already uses `MapboxMapView`** — there is no second map engine to converge. Curated routes plot through the plan view's existing route-polyline machinery.

The only remaining map concern is the **curated route detail** screen (`app/(app)/curated-route/[id].tsx`), which renders its own `MapboxMapView` instance for the polyline (or a centroid-marker fallback for the ~45% of routes lacking geometry). It mirrors the saved-route detail (`app/(app)/saved-route/[id].tsx`) map pattern. No `react-native-maps` on any discovery/detail path.

## 4. Archetype UI enum — mapping layer spec

The archetype **UI enum** — `twisties | scenic | technical | cruising | sport | adventure` — is the vocabulary the suggestion cards and chat-driven discovery map against the Convex `primaryArchetype` field (`twisties | mountain | coastal | adventure | scenic_byway | desert`). There is no filter bar in the MVP; archetype intent is expressed conversationally or via a `useCuratedDiscovery` param.

Only `twisties` and `adventure` overlap. The mapping layer lives in the `listCuratedRoutes` query (server-side) or in `useCuratedDiscovery` hook (client-side). Frontend designer recommendation: put it in the hook so the UI enum stays stable and the mapping is a single client-side transform rather than a server concern.

**UI → DB mapping table.** The **authoritative copy lives in [04-api-design.md](./04-api-design.md) "Archetype map (UC-DATA-02)"**; reproduced here for the UI side. These MUST stay identical (and match the locked mapping in [04-uc-data.md](../04-uc-data.md) UC-DATA-02).

| UI archetype | DB primaryArchetype set (filter) | DB → UI (return) |
|---|---|---|
| twisties | {twisties} | twisties → twisties |
| scenic | {scenic_byway, coastal} | scenic_byway → scenic; coastal → scenic |
| technical | {mountain} | mountain → technical |
| cruising | {scenic_byway} (fallback) | — (no native DB source) |
| sport | {twisties} (fallback) | — (no native DB source) |
| adventure | {adventure, desert} | adventure → adventure; desert → adventure |
| all | (no filter) | — |

**MVP decision:** The mapping is applied in the read path (the `listCuratedRoutes` query / `useCuratedDiscovery`, per 04-api-design); the DB enum is never mutated and a raw DB-only value is never returned to the client. `cruising` and `sport` have no native DB archetype — they map via a fallback set until the curation pipeline adds them post-MVP. (Earlier drafts of this table diverged from 04-api-design; v3.0.0 reconciles them to the locked table.)

> Backend note: the canonical archetype-map implementation and its placement decision are also recorded in [04-api-design.md](./04-api-design.md) (`Archetype map`). These must stay consistent.

## 5. State-string normalization (UI impact)

The DB has dirty state strings (e.g. 'North-Carolina' vs 'North Carolina'). With no by-state browse picker in the MVP, state surfaces in two places: (1) the route region shown on a suggestion card or detail header, and (2) **chat-driven state discovery** ('scenic roads in North Carolina'), where the request must match routes stored under either spelling variant. The normalization MUST happen in the query/hook (DATA-NORM gate), not in a UI component — both the displayed string and the chat-match comparison rely on the cleaned value. A dirty state name rendering on a card or in the detail header would look broken to the rider.

**Display rule:** Normalize by replacing hyphens with spaces and title-casing: `'North-Carolina'.replace(/-/g, ' ')`. State values must be deduplicated after normalization so a route stored under either spelling variant is matched once by chat-driven state discovery and displayed consistently.

> The authoritative normalization happens in the data layer ([03-data-schema.md](./03-data-schema.md) / DATA-NORM gate); this section governs only how the cleaned string is displayed.

## 6. Route detail screen layout — scroll architecture

The route detail screen follows the same split layout as `app/(app)/saved-route/[id].tsx`:

1. **Map section** (fixed height: `Dimensions.get('window').height * 0.40`, ~336pt on iPhone 14) — MapboxMapView with MapHeaderOverlay floating over it
2. **Scrollable content section** (flex: 1 below map) — ScrollView containing: header block, summary block, score bars block, conditions row, action row

This split is established pattern in the codebase (saved-route detail uses the same architecture). Do not invent a full-screen ScrollView with map inside — the Mapbox SDK conflicts with nested scroll on Android.

**Action row** (Save + Ride It) pins to the bottom of the ScrollView content on short routes, but scrolls with content on long detail pages. Use `contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}` to clear the home indicator on iPhone.

**SubpageLayout is NOT used** for the route detail — the map must be full-bleed. Use the same root `SafeAreaView edges={['top']}` + manual `MapHeaderOverlay` pattern as saved-route/[id].tsx.
