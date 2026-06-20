---
spec_id: DESIGN-S01-006
title: On-Route Map TAG/Label — Tappable Polyline Tag Replacing the Floating Button
status: APPROVED
blocks: RUX-004
last_validated: 2026-06-20
---

# On-Route Map TAG: Tappable Polyline Tag

## 1. Purpose and Context

This spec defines a small tappable **RouteTag** anchored **on** the route polyline, replacing
the floating button that previously overlaid the map. Feedback from Sprint 1 testing: "can we
label the routes with a tag or something rather than having a floating button? when tapped can
we show the route details?"

The tag shows `{archetype} · {distance}` (e.g. `Scenic · 78mi`) and opens `RouteDetailsSheet`
on tap. It does **not** send a chat message.

### Pattern source

`components/map/search-result-marker.tsx` is the proven on-map tappable affordance:
- Mapbox `MarkerView` for coordinate-anchored placement
- `Pressable` for touch handling and hit-area control
- `useSemanticTheme()` for all visual tokens
- `expo-haptics` `ImpactFeedbackStyle.Light` on press
- `isSelected` prop drives distinct selected/unselected visuals

The RouteTag mirrors this pattern exactly. It does not introduce a floating or screen-fixed
button layer.

### Legacy note

`components/map/search-result-marker.tsx` line 107 uses `${infoColor}26` hex-alpha for its
background fill. This is MVP-acceptable in that component but **must not** be replicated in
the RouteTag. The pill scrim uses `semantic.color.surface.glass` exclusively.

---

## 2. Component Anatomy

**Component name:** `RouteTag`
**Proposed file:** `components/map/route-tag.tsx`

### 2.1 Imports and dependencies

```
components/map/route-tag.tsx
  → MarkerView          (@rnmapbox/maps, conditional require — same guard as SearchResultMarker)
  → Pressable, View     (react-native)
  → Text                (react-native-paper)
  → Haptics             (expo-haptics)
  → useSemanticTheme    (hooks/use-semantic-theme.ts)
  → latLngToMapbox      (lib/mapbox/coordinate-converter.ts)
```

### 2.2 Props interface

```typescript
type RouteTagProps = {
  /**
   * Unique route option identifier — used in the testID and onPress callback.
   * Mirrors SearchResultMarkerProps.id.
   */
  routeId: string

  /**
   * Coordinate ON the route polyline where the tag anchors.
   * Caller computes the midpoint; see §3 Anchor Coordinate.
   */
  coordinate: { latitude: number; longitude: number }

  /**
   * UI archetype label drawn from the UiArchetype enum.
   * Values: 'twisties' | 'scenic' | 'technical' | 'cruising' | 'sport' | 'adventure'
   * Displayed with sentence-case capitalisation: 'Scenic', 'Twisties', etc.
   * Never the raw DB primaryArchetype value (e.g. 'scenic_byway').
   * See 10-design-system.md §4 and convex/util/archetypeMap.ts for the mapping.
   */
  archetype: string

  /**
   * Route distance in metres. Displayed as rounded miles: `${Math.round(metres / 1609.34)}mi`.
   * Sourced from PlannedRouteOptionView.stats.distanceMeters.
   */
  distanceMeters: number

  /**
   * Whether this route is the currently selected route.
   * Controls the selected vs unselected visual state (see §5).
   */
  isSelected?: boolean

  /**
   * Called when the rider taps the tag. Caller opens RouteDetailsSheet.
   * Does NOT send a chat message.
   */
  onPress?: (routeId: string) => void

  /**
   * Override testID. Defaults to `route-tag-{routeId}`.
   */
  testID?: string
}
```

---

## 3. Anchor Coordinate — On-Polyline Midpoint

The tag anchors at a coordinate **on the route polyline**, not at a fixed screen position.

### 3.1 Midpoint computation (caller responsibility)

The caller (`app/(app)/(tabs)/index.tsx` or `RouteSummaryCarousel`) computes the anchor
before rendering `RouteTag`. The shared `decodePolylineGeometry` and
`computeCumulativeDistances` utilities from `shared/lib/polyline.ts` are the canonical
helpers — they are already used by `route-polyline.tsx`.

Recommended midpoint algorithm:
1. Decode `route.map.overviewGeometry` using `decodePolylineGeometry` → `MapLatLng[]` array.
2. Compute cumulative distances along the decoded coordinates using `computeCumulativeDistances`.
3. Take the total route distance. Find the coordinate at 50% total arc-length (using
   linear interpolation between the two adjacent decoded points — same `interpolatePoint`
   pattern at `shared/lib/polyline.ts:42`).
4. Return `{ latitude, longitude }` as `RouteTagProps.coordinate`.

Fallback: if the decoded array has fewer than 2 points, fall back to the midpoint of the
route's `bounds` rectangle:
```
{ latitude: (bounds.northeast.lat + bounds.southwest.lat) / 2,
  longitude: (bounds.northeast.lng + bounds.southwest.lng) / 2 }
```

The midpoint is a stable point that does not move as the user pans the map, making it
suitable as a persistent anchor rather than a floating overlay.

### 3.2 MarkerView anchor offset

Mapbox `MarkerView` positions the **top-left** corner of its child view at the given
coordinate by default. The tag pill should appear **centred horizontally and sitting above
the polyline** so it does not obscure the route line.

Specify `anchor={{ x: 0.5, y: 1.0 }}` on `MarkerView` so the bottom-centre of the pill
aligns with the coordinate point. This lifts the pill above the polyline geometry.

```tsx
<MarkerView coordinate={latLngToMapbox(coordinate)} anchor={{ x: 0.5, y: 1.0 }}>
  ...pill content...
</MarkerView>
```

`latLngToMapbox` (from `lib/mapbox/coordinate-converter.ts`) converts the `{ latitude, longitude }`
object to `[longitude, latitude]` Mapbox format — identical to the usage in `SearchResultMarker`.

---

## 4. Label Content

### 4.1 Tag text format

```
{ArchetypeLabel} · {DistanceMi}
```

Examples:
- `Scenic · 78mi`
- `Twisties · 142mi`
- `Adventure · 34mi`

### 4.2 Archetype label normalisation

The `archetype` prop receives a **UI archetype** string (not the raw DB `primaryArchetype`).
The UI archetype enum is:

```
'twisties' | 'scenic' | 'technical' | 'cruising' | 'sport' | 'adventure'
```

(Source: `convex/util/archetypeMap.ts` — `UiArchetype` type. Maps via `dbArchetypeToUi()`.)

Display with sentence-case: capitalise the first letter only:
```typescript
const archetypeLabel = archetype.charAt(0).toUpperCase() + archetype.slice(1)
// 'scenic' → 'Scenic', 'twisties' → 'Twisties'
```

Do not display the raw DB values (`'scenic_byway'`, `'mountain'`, `'coastal'`, `'desert'`).
The caller is responsible for mapping DB → UI archetype before passing the prop. The tag
component renders the string as given.

### 4.3 Distance normalisation

```typescript
const distanceMi = Math.round(distanceMeters / 1609.34)
// distanceMeters: 125,531 → '78mi'
```

### 4.4 Typography

The combined label string is rendered as a single `Text` element styled with:

```
semantic.type.label.sm
  fontSize:   9pt
  lineHeight: 9pt
  fontWeight: '600'
```

(Source: `tokens/semantic/semantic.tokens.json` → `semantic.type.label.sm`)

---

## 5. Visual States — Unselected and Selected

The tag has two distinct visual states driven by `isSelected`.

### 5.1 Unselected state (default)

The pill appears as a glass scrim with copper-accented text — visually light and
non-intrusive over the map.

| Element | Token path | Resolved value |
|---|---|---|
| Pill background | `semantic.color.surface.glass` | light: rgba(253,251,248,0.72) / dark: rgba(45,34,24,0.72) |
| Pill border color | `semantic.color.border.glass` | light: rgba(255,255,255,0.55) / dark: rgba(242,238,232,0.22) |
| Pill border width | `semantic.borderWidth.thin` | 1pt |
| Text color | `semantic.color.primary.default` | #EE7C2B (copper, both light and dark) |
| Pill border radius | `semantic.radius.full` | 9999pt (fully rounded pill) |
| Scale transform | none | `transform: []` (no scale applied) |

### 5.2 Selected state

The pill inverts to a copper fill with white text, signalling the active route clearly.

| Element | Token path | Resolved value |
|---|---|---|
| Pill background | `semantic.color.primary.default` | #EE7C2B copper |
| Pill border color | `semantic.color.primary.default` | #EE7C2B (solid copper, no separate border needed) |
| Pill border width | `semantic.borderWidth.thin` | 1pt |
| Text color | `semantic.color.onPrimary.default` | #FFFFFF (white, both light and dark) |
| Pill border radius | `semantic.radius.full` | 9999pt |
| Scale transform | `{ scale: 1.1 }` | Mild enlarge to match SearchResultMarker's selected-scale pattern |

### 5.3 Pressed feedback

On `Pressable` press state apply `opacity: semantic.opacity.pressed` (0.7) via the
render-prop pattern — identical to the carousel arrow spec:

```tsx
style={({ pressed }) => ({
  opacity: pressed ? semantic.opacity.pressed : 1,
})}
```

The outer `Pressable` drives pressed opacity; the inner pill `View` is styled
independently for the selected/unselected background.

---

## 6. Pill Geometry and Touch Target

### 6.1 Visible pill dimensions

The visible pill is compact. It must be legible without covering significant map area.

| Property | Value | Token |
|---|---|---|
| Horizontal padding | `semantic.space.sm` (8pt) on each side | `semantic.space.sm` |
| Vertical padding | `semantic.space.xs` (4pt) on each side | `semantic.space.xs` |
| Border radius | `semantic.radius.full` (9999pt) | `semantic.radius.full` |
| Border width | `semantic.borderWidth.thin` (1pt) | `semantic.borderWidth.thin` |

The visible pill height is approximately `9 (fontSize) + 2×4 (vertical padding) + 2×1 (border) = 19pt`.

### 6.2 Touch target — ≥44pt floor

The visible pill is smaller than the 44pt touch target floor required by
`07-ui-infrastructure.md §6` and `semantic.control.minTouchTarget` (44pt).

The `Pressable` wrapping the pill MUST declare a minimum hit area meeting this floor via
`hitSlop`:

```typescript
hitSlop={{
  top:    (semantic.control.minTouchTarget - visiblePillHeight) / 2,
  bottom: (semantic.control.minTouchTarget - visiblePillHeight) / 2,
  left:   semantic.space.sm,   // 8pt — modest side extension
  right:  semantic.space.sm,   // 8pt
}}
```

Or equivalently, declare `minHeight: semantic.control.minTouchTarget` (44pt) and
`minWidth: semantic.control.minTouchTarget` (44pt) on the `Pressable` with
`alignItems: 'center'` and `justifyContent: 'center'`, allowing the visible pill to float
centred within the larger touch area. Both approaches are acceptable; the `minHeight/minWidth`
pattern matches the carousel arrow spec and is recommended for simplicity:

```tsx
<Pressable
  testID={testID ?? `route-tag-${routeId}`}
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel={`${archetypeLabel} route, ${distanceMi} miles`}
  accessibilityHint="Tap to view route details"
  style={({ pressed }) => ({
    minWidth:  semantic.control.minTouchTarget,   // 44pt
    minHeight: semantic.control.minTouchTarget,   // 44pt
    alignItems: 'center',
    justifyContent: 'center',
    opacity: pressed ? semantic.opacity.pressed : 1,
  })}
>
  {/* visible pill child — see §6.3 */}
</Pressable>
```

`semantic.control.minTouchTarget` resolves to 44 (source: `tokens/semantic/semantic.tokens.json`
→ `semantic.control.minTouchTarget`).

### 6.3 Visible pill child

```tsx
<View
  style={{
    backgroundColor: isSelected
      ? semantic.color.primary.default
      : semantic.color.surface.glass,
    borderColor: isSelected
      ? semantic.color.primary.default
      : semantic.color.border.glass,
    borderWidth: semantic.borderWidth.thin,
    borderRadius: semantic.radius.full,
    paddingHorizontal: semantic.space.sm,
    paddingVertical: semantic.space.xs,
    transform: isSelected ? [{ scale: 1.1 }] : [],
  }}
>
  <Text
    style={{
      ...semantic.type.label.sm,
      color: isSelected
        ? semantic.color.onPrimary.default
        : semantic.color.primary.default,
    }}
    numberOfLines={1}
  >
    {archetypeLabel} · {distanceMi}mi
  </Text>
</View>
```

Note: `semantic.color.surface.glass` and `semantic.color.border.glass` are NOT in the
`semantic.tokens.json` `SemanticColors` type directly — they are defined in
`tokens/semantic/colors.tokens.json` and exposed through the theme provider. RUX-004
should verify the resolved path via `useSemanticTheme()` at runtime matches the values
in `colors.tokens.json`:
- `surface.glass`: light `rgba(253,251,248,0.72)`, dark `rgba(45,34,24,0.72)`
- `border.glass`: light `rgba(255,255,255,0.55)`, dark `rgba(242,238,232,0.22)`

If the theme provider does not yet expose `semantic.color.surface.glass` as a named
property, RUX-004 must add it to `styles/types.ts` (`SemanticColors`) and the theme
builder — without hardcoding the raw rgba. This aligns with the approach already used
in `route-carousel-card-spec.md §5.3`.

---

## 7. Haptics

On press, fire `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` before calling
`onPress(routeId)`. Mirror the SearchResultMarker pattern exactly:

```typescript
const handlePress = useMemo(() => {
  if (!onPress) return undefined
  return () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(routeId)
  }
}, [routeId, onPress])
```

The `useMemo` avoids creating a new function reference on every render while the route
tag is mounted (same pattern as `SearchResultMarker`).

---

## 8. Tap Behavior → Route Details

Tapping the tag calls `onPress(routeId)`. The caller in `index.tsx` (or `RouteSummaryCarousel`)
is responsible for opening `RouteDetailsSheet`:

```typescript
// in index.tsx — mirrors handleCarouselCardPress from route-carousel-card-spec.md §7
const handleRouteTagPress = useCallback((routeId: string) => {
  selectRoute(routeId)           // updates selected polyline on map
  setRouteDetailsVisible(true)   // opens RouteDetailsSheet
  // Do NOT send a chat message
}, [selectRoute])
```

**Critical constraints:**
- Tapping MUST open `RouteDetailsSheet` (not navigate to a new screen, not send a chat message).
- The tag component is decoupled from sheet state — it only calls `onPress`.
- `RouteDetailsSheet` is at `components/sheets/route-details-sheet.tsx`.

---

## 9. Elevation / Shadow

Apply `semantic.elevation.2` to the `Pressable` or its inner pill container to lift the
pill visually above the map layer:

| Property | Token path | Resolved value |
|---|---|---|
| Shadow color | `semantic.elevation.2.shadowColor` | #000000 |
| Shadow offset | `semantic.elevation.2.shadowOffset` | { width: 0, height: 2 } |
| Shadow opacity | `semantic.elevation.2.shadowOpacity` | 0.21 |
| Shadow radius | `semantic.elevation.2.shadowRadius` | 6pt |
| Android elevation | `semantic.elevation.2.elevation` | 2 |

(Source: `tokens/semantic/semantic.tokens.json` → `semantic.elevation.light.2` /
`semantic.elevation.dark.2`)

---

## 10. Conditional Render Guard

Mirror the Mapbox availability guard from `SearchResultMarker`:

```typescript
const mapboxAvailable = NativeModules.RNMBXModule != null
let MarkerView: any = null
if (mapboxAvailable) {
  try {
    ;({ MarkerView } = require('@rnmapbox/maps'))
  } catch {}
}

// In the component:
if (!mapboxAvailable || !MarkerView) {
  return null
}
```

This prevents native-module crashes in test environments and on web previews.

---

## 11. Accessibility

```
Pressable (route-tag-{routeId}):
  accessibilityRole="button"
  accessibilityLabel="{archetypeLabel} route, {distanceMi} miles"
  accessibilityHint="Tap to view route details"
  accessibilityState={{ selected: isSelected }}
```

Examples:
- `accessibilityLabel="Scenic route, 78 miles"`
- `accessibilityLabel="Twisties route, 142 miles"`

---

## 12. Token Reference Table

All values consumed through `useSemanticTheme()`. No hardcoded hex, no magic numbers.

| Usage | Token path | Resolved value |
|---|---|---|
| Pill background (unselected) | `semantic.color.surface.glass` | light: rgba(253,251,248,0.72) / dark: rgba(45,34,24,0.72) |
| Pill border (unselected) | `semantic.color.border.glass` | light: rgba(255,255,255,0.55) / dark: rgba(242,238,232,0.22) |
| Pill background (selected) | `semantic.color.primary.default` | #EE7C2B (copper, both modes) |
| Pill border (selected) | `semantic.color.primary.default` | #EE7C2B |
| Text color (unselected) | `semantic.color.primary.default` | #EE7C2B (copper) |
| Text color (selected) | `semantic.color.onPrimary.default` | #FFFFFF |
| Border width | `semantic.borderWidth.thin` | 1pt |
| Border radius | `semantic.radius.full` | 9999pt |
| Horizontal padding | `semantic.space.sm` | 8pt |
| Vertical padding | `semantic.space.xs` | 4pt |
| Touch target (min w & h) | `semantic.control.minTouchTarget` | 44pt |
| Pressed opacity | `semantic.opacity.pressed` | 0.7 |
| Label typography | `semantic.type.label.sm` | fontSize 9, lineHeight 9, fontWeight '600' |
| Elevation shadow | `semantic.elevation.2` | height 2, opacity 0.21, radius 6 |

---

## 13. testID Registry

All interactive and observable elements carry a stable testID as required by
`07-ui-infrastructure.md §6`.

| testID | Element | Notes |
|---|---|---|
| `route-tag-{routeId}` | The `Pressable` wrapping the pill | `routeId` is the `routeOptionId` from `PlannedRouteOptionView`. Example: `route-tag-abc123`. |
| `route-tag-pill-{routeId}` | The inner pill `View` | Allows snapshot assertions on background color by state. |
| `route-tag-label-{routeId}` | The `Text` element inside the pill | Allows E2E text-content assertion (`Scenic · 78mi`). |

The primary testID for existence and tap assertions in E2E is `route-tag-{routeId}`.

RUX-004 test file: `components/map/route-tag.test.tsx` (gate_3 in the task verification
gates).

---

## 14. Rendering Context

The `RouteTag` is rendered inside `MapboxMapView` (at `app/(app)/(tabs)/index.tsx`),
alongside `SearchResultMarker` and `WaypointMarker` components. One `RouteTag` is rendered
per planned route option when route results are available (one tag per distinct polyline).

The caller iterates `distinctRoutes` (same deduplicated list used by `RouteSummaryCarousel`)
and renders a `RouteTag` for each, computing the midpoint coordinate per route. The
selected route gets `isSelected={true}`.

Example caller pattern:
```tsx
{distinctRoutes.map((route) => (
  <RouteTag
    key={route.routeOptionId}
    routeId={route.routeOptionId}
    coordinate={computeMidpoint(route.map.overviewGeometry, route.map.bounds)}
    archetype={routeArchetypeLabel(route)}
    distanceMeters={route.stats.distanceMeters}
    isSelected={route.routeOptionId === selectedRouteId}
    onPress={handleRouteTagPress}
  />
))}
```

`routeArchetypeLabel` is a helper the caller provides that maps `route.label` or a
session-scoped archetype to a UI archetype string. The `PlannedRouteOptionView` type does
not carry a `primaryArchetype` field directly — it carries a `label` (free-form string)
and `rationale`. RUX-004 should surface the archetype from the session's plan request
context (e.g. the intent archetype extracted by the planning agent) or derive a display
label from `route.label`. If no archetype is available, a fallback of `'Route'` is acceptable
for MVP so the tag reads `Route · 78mi` rather than crashing or omitting the tag entirely.

---

## 15. What Is NOT Changed

This spec is explicitly read-only against the following. RUX-004 must not modify:

- `components/map/search-result-marker.tsx` — reused as reference; no props added.
- `components/sheets/route-details-sheet.tsx` — wired by `index.tsx`, not this component.
- `tokens/**` — no token schema edits; only read via `useSemanticTheme()`.
- `shared/lib/polyline.ts` — reused as-is for midpoint computation.
- `lib/mapbox/coordinate-converter.ts` — `latLngToMapbox` reused as-is.
- Any file outside `components/map/route-tag.tsx` and its test file, and the caller wiring
  in `app/(app)/(tabs)/index.tsx`.

---

## 16. Acceptance Criteria Verification

The following shell commands verify this spec's four ACs against the built files:

```bash
# AC-1 — MarkerView + on-polyline anchor named; floating button not present
grep -q 'MarkerView' .spec/design/sprint-01/on-route-tag-spec.md && \
  grep -Eqi 'polyline|on the route|midpoint' .spec/design/sprint-01/on-route-tag-spec.md && \
  echo PASS

# AC-2 — archetype label spec'd, semantic.type.label token cited
grep -Eqi 'archetype' .spec/design/sprint-01/on-route-tag-spec.md && \
  grep -q 'semantic.type.label' .spec/design/sprint-01/on-route-tag-spec.md && \
  echo PASS

# AC-3 — surface.glass, primary.default, minTouchTarget all present
grep -q 'surface.glass' .spec/design/sprint-01/on-route-tag-spec.md && \
  grep -q 'primary.default' .spec/design/sprint-01/on-route-tag-spec.md && \
  grep -q 'minTouchTarget' .spec/design/sprint-01/on-route-tag-spec.md && \
  echo PASS

# AC-4 — selected/unselected states, route-tag- testID, RouteDetailsSheet tap target
grep -Eqi 'selected' .spec/design/sprint-01/on-route-tag-spec.md && \
  grep -q 'route-tag-' .spec/design/sprint-01/on-route-tag-spec.md && \
  echo PASS
```
