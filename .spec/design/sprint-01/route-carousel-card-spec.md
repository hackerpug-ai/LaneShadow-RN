---
spec_id: DESIGN-S01-005
title: Route Carousel — Single Card Above Chat Input
status: APPROVED
blocks: RUX-001, RUX-002
last_validated: 2026-06-20
---

# Route Carousel: Single Route-Summary Card Above Input

## 1. Purpose and Context

This spec defines a single-item carousel that replaces the current bottom stack of
`RouteAttachmentCard` entries in `app/(app)/(tabs)/index.tsx` (lines 1376-1412). The
existing pattern renders one `RouteAttachmentCard` per route option in a `ScrollView`,
creating a wall of compact cards that is uninformative to the rider.

The carousel collapses that stack into **one visible card at a time**, centered above the
chat input, flanked by left (`‹`) and right (`›`) navigation arrows. Only the currently
indexed **distinct route** is shown; tapping the arrows pages to the adjacent route without
sending a chat message. The full layout from the rider's perspective is:

```
‹   [ ROUTE SUMMARY CARD ]   ›
        | INPUT FIELD |
```

No net-new card component is invented. The carousel reuses the body of the existing
`RouteAttachmentCard` (compact variant) found at `components/chat/route-attachment-card.tsx`,
mounted on a `surface.glass` scrim.

---

## 2. Component Anatomy

The new component is named **`RouteSummaryCarousel`** and lives at:

```
components/map/route-summary-carousel.tsx
```

It is a pure presentational + local-state component. It receives a deduplicated list of
route options and manages the current carousel index locally. No store mutation is required
for paging.

### 2.1 File and imports

```
components/map/route-summary-carousel.tsx
  → useSemanticTheme   (hooks/use-semantic-theme.ts)
  → RouteAttachmentCard  (components/chat/route-attachment-card.tsx)  variant="compact"
  → IconSymbol           (components/ui/icon-symbol.ios.tsx)  names: 'chevron-left', 'chevron-right'
  → Pressable, View, Animated (react-native)
  → PlannedRouteOptionView  (shared/types/routes.ts)
```

### 2.2 Props interface

```typescript
type RouteSummaryCarouselProps = {
  /**
   * De-duplicated list of distinct route options to page through.
   * The caller is responsible for deduplication (see §3 Deduplication rule).
   * When this array is empty or undefined the carousel renders nothing.
   */
  distinctRoutes: PlannedRouteOptionView[]

  /**
   * The currently selected route ID used to highlight the active card.
   * Passed through to RouteAttachmentCard isSelected prop.
   */
  selectedRouteId: string | null

  /**
   * Called when the rider selects a route card (taps the card body).
   * Opens RouteDetailsSheet for that route — does NOT send a chat message.
   */
  onCardPress: (routeId: string) => void

  /**
   * Callback for when the selected route changes via arrow paging.
   * Parent should update its own selectedRouteId accordingly so the
   * map polyline reflects the paged route.
   */
  onRouteChange?: (routeId: string) => void

  /**
   * Whether any active route exists in the session.
   * When false the carousel renders nothing (whole widget is hidden).
   */
  hasActiveRoute: boolean

  /** Bottom offset to clear the chat input bar (pass insets.bottom + chatInputHeight). */
  bottomOffset: number
}
```

---

## 3. Distinct-Route Deduplication Rule

The `distinctRoutes` prop accepts an **already-deduplicated** list. The calling component
(`app/(app)/(tabs)/index.tsx`) is responsible for deduplication before passing the prop:

```typescript
// caller-side deduplication (in index.tsx, before rendering RouteSummaryCarousel)
const distinctRoutes = useMemo(
  () =>
    (flowState as { routeOptions?: PlannedRouteOptionsView }).routeOptions?.options?.filter(
      (option, idx, arr) =>
        // Keep only the first occurrence of each routeOptionId.
        // This removes efficiency variants of the same geometric route.
        arr.findIndex((o) => o.routeOptionId === option.routeOptionId) === idx,
    ) ?? [],
  [flowState],
)
```

The carousel **never** performs deduplication internally. Passing already-distinct routes
keeps the component pure and testable.

---

## 4. Visibility Rules

Apply these rules in strict priority order. All are evaluated with the named boolean
conditions shown; these condition names appear in the component's render logic.

| Condition | Effect |
|---|---|
| `!hasActiveRoute` | Entire carousel is not rendered (returns `null`). |
| `distinctRoutes.length === 0` | Entire carousel is not rendered (returns `null`). |
| `distinctRoutes.length <= 1` | Card is rendered; **both arrows are hidden** (`display: 'none'`). |
| `currentIndex === 0` (first route) | Left arrow (`route-carousel-arrow-prev`) is **disabled and visually muted**; right arrow is enabled. |
| `currentIndex === distinctRoutes.length - 1` (last route) | Right arrow (`route-carousel-arrow-next`) is **disabled and visually muted**; left arrow is enabled. |
| otherwise | Both arrows are enabled and fully visible. |

"Disabled" means `accessibilityState={{ disabled: true }}` and the Pressable's
`onPress` is a no-op. The icon color changes to the muted token (see §6.3).

---

## 5. Layout Specification

### 5.1 Position in `index.tsx`

The carousel sits **between the route-card layer and the chat input** at the bottom of
the map view. It replaces the existing `Animated.View` block at lines 1384-1412.

Absolute positioning mirrors the existing `styles.routeCards` rule:

```
position: 'absolute'
left: 0
right: 0
bottom: bottomOffset   // = insets.bottom + chatInputHeight (≈ 80pt)
zIndex: 15             // same tier as the existing routeCards layer
```

The carousel itself uses `paddingHorizontal: semantic.space.lg` (16pt) on its outer
container to inset from screen edges.

### 5.2 Row layout

```
┌─────────────────────────────────────────┐
│  [Arrow ‹]  [    Card body    ]  [Arrow ›]
└─────────────────────────────────────────┘
```

- Outer container: `flexDirection: 'row'`, `alignItems: 'center'`
- Card: `flex: 1` — fills the space between the two arrows
- Each arrow: fixed `width: semantic.control.minTouchTarget` (44pt),
  `height: semantic.control.minTouchTarget` (44pt)
- Gap between arrow and card: `semantic.space.xs` (4pt) on each side

### 5.3 Card body

The card body is `RouteAttachmentCard` with `variant="compact"`. The card's own background
token (`semantic.color.surface.default` at opacity E6) is **overridden** on the carousel
by wrapping it in a `View` with:

```
backgroundColor: semantic.color.surface.glass
  light: rgba(253,251,248,0.72)
  dark:  rgba(45,34,24,0.72)
borderColor:     semantic.color.border.glass
  light: rgba(255,255,255,0.55)
  dark:  rgba(242,238,232,0.22)
borderWidth:     semantic.borderWidth.thin   (1pt)
borderRadius:    semantic.radius.md          (10pt)
```

Do **not** replicate the legacy `${color}15` / `${color}20` hex-alpha approach used
inside the existing compact card body. The glass scrim is the outer wrapper only;
the inner `RouteAttachmentCard` compact body renders as-is.

### 5.4 Elevation

Apply `semantic.elevation.2` shadow values from `tokens/semantic/semantic.tokens.json`:

```
shadowColor:    #000000
shadowOffset:   { width: 0, height: 2 }
shadowOpacity:  0.21
shadowRadius:   6
elevation:      2      (Android)
```

---

## 6. Arrow Buttons

### 6.1 Component

Each arrow is a `Pressable` (not `Button`, not `TouchableOpacity`) with an `IconSymbol`
child. This matches the Pressable + haptics affordance convention used in
`components/map/search-result-marker.tsx`.

### 6.2 Touch target

Both arrows **must** meet `semantic.control.minTouchTarget` (44pt) on both width and
height dimensions as required by `07-ui-infrastructure.md §6`.

```
width:  semantic.control.minTouchTarget   // 44pt
height: semantic.control.minTouchTarget   // 44pt
alignItems: 'center'
justifyContent: 'center'
```

If the visual icon size makes the `Pressable` appear too large, supplement with
`hitSlop: semantic.hitSlop.medium` (8pt on all edges) instead of reducing
the declared `width` / `height`.

### 6.3 Icon

```
Left  arrow: IconSymbol name="chevron-left"
Right arrow: IconSymbol name="chevron-right"
size: semantic.iconSize.medium   // 20pt
```

Color by state:

| State | Token path | Resolved value (light / dark) |
|---|---|---|
| Enabled | `semantic.color.onSurface.default` | #1E1A16 / #F2EEE8 |
| Disabled / end-of-list | `semantic.color.onSurface.muted` | maps to `content.tertiary` → #6B6460 / #9CA3AF |

The `semantic.color.onSurface.muted` path resolves via `useSemanticTheme()`. Do not
hardcode the hex values; the hook resolves the correct light/dark variant at runtime.

### 6.4 Arrow background

No background fill on the arrow `Pressable`. The arrow floats over the glass scrim
without its own container fill, keeping the visual weight on the card body.

### 6.5 Pressed feedback

Apply `opacity: semantic.opacity.pressed` (0.7) on the `pressed` state of the Pressable
using the render-prop pattern:

```tsx
<Pressable
  testID="route-carousel-arrow-prev"
  onPress={handlePrev}
  disabled={isFirstRoute}
  accessibilityRole="button"
  accessibilityLabel="Previous route"
  accessibilityState={{ disabled: isFirstRoute }}
  style={({ pressed }) => ({
    opacity: pressed && !isFirstRoute ? semantic.opacity.pressed : 1,
    width: semantic.control.minTouchTarget,
    height: semantic.control.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  })}
>
  <IconSymbol
    name="chevron-left"
    size={semantic.iconSize.medium}
    color={isFirstRoute
      ? semantic.color.onSurface.muted
      : semantic.color.onSurface.default}
  />
</Pressable>
```

The right-arrow button follows the same pattern, substituting `chevron-right`,
`handleNext`, `isLastRoute`, and `testID="route-carousel-arrow-next"`.

---

## 7. Card Tap → Route Details Behavior

Tapping the card body calls `onCardPress(route.routeOptionId)`. The caller in `index.tsx`
is responsible for wiring this to open `RouteDetailsSheet`:

```typescript
// in index.tsx
const handleCarouselCardPress = useCallback((routeId: string) => {
  // 1. Select the route so the map polyline updates
  selectRoute(routeId)
  // 2. Open RouteDetailsSheet (components/sheets/route-details-sheet.tsx)
  setRouteDetailsVisible(true)
  // 3. Do NOT send a chat message
}, [selectRoute])
```

The carousel component is **not** responsible for opening the sheet. It only calls
`onCardPress`. This keeps the component decoupled from sheet state.

**Critical constraint:** tapping the card must **never** trigger a chat message send or
navigate to a new screen. It opens the sheet in-place over the current map view.

### 7.1 RouteDetailsSheet props

```typescript
// RouteDetailsSheet (components/sheets/route-details-sheet.tsx)
<RouteDetailsSheet
  isVisible={routeDetailsVisible}
  onClose={() => setRouteDetailsVisible(false)}
  route={selectedRouteOption}   // PlannedRouteOptionView | null
  onSave={handleSaveRoutePress}
  isSaving={isSavingRoute}
  testID="route-details-sheet"
/>
```

---

## 8. Token Reference Table

All spacing, color, radius, and control values are consumed through
`useSemanticTheme()`. No hardcoded hex, no magic pixel numbers.

| Usage | Token path | Resolved value |
|---|---|---|
| Carousel glass background | `semantic.color.surface.glass` | light: rgba(253,251,248,0.72) / dark: rgba(45,34,24,0.72) |
| Glass border | `semantic.color.border.glass` | light: rgba(255,255,255,0.55) / dark: rgba(242,238,232,0.22) |
| Glass border width | `semantic.borderWidth.thin` | 1pt |
| Card border radius | `semantic.radius.md` | 10pt |
| Horizontal screen inset | `semantic.space.lg` | 16pt |
| Arrow-to-card gap | `semantic.space.xs` | 4pt |
| Arrow touch target (w & h) | `semantic.control.minTouchTarget` | 44pt |
| Arrow icon size | `semantic.iconSize.medium` | 20pt |
| Arrow icon color (enabled) | `semantic.color.onSurface.default` | #1E1A16 (light) / #F2EEE8 (dark) |
| Arrow icon color (disabled) | `semantic.color.onSurface.muted` | resolves to content.tertiary |
| Pressed arrow opacity | `semantic.opacity.pressed` | 0.7 |
| Elevation shadow | `semantic.elevation.2` (light/dark) | height 2, opacity 0.21, radius 6 |
| Route label type | `semantic.type.title.md` | Geist 14/600 |
| Route stats type | `semantic.type.body.sm` | Geist 11/400 |

---

## 9. Animation

Card content swaps **without cross-fade** on the first implementation (static swap).
The Animated.View entering/exiting animation from the existing route-card layer
(`FadeInDown.duration(300).springify()`) applies to the entire carousel container,
not to individual card content swaps. RUX-001 may add a cross-fade on card content
in a follow-up if the UX calls for it; this spec does not require it.

Arrow paging is instantaneous (no swipe animation). There is no swipe gesture on the
card itself; only the arrow buttons trigger paging.

---

## 10. testID Registry

All interactive elements carry a stable, flat testID as required by `07-ui-infrastructure.md §6`.

| testID | Element | Notes |
|---|---|---|
| `route-carousel-card` | The card body `Pressable` / `TouchableOpacity` | Applied to the `RouteAttachmentCard` wrapper. Corresponds to the `testID` prop of `RouteAttachmentCard`. |
| `route-carousel-arrow-prev` | Left chevron `Pressable` (‹) | Always rendered when `distinctRoutes.length > 1`; disabled at index 0. |
| `route-carousel-arrow-next` | Right chevron `Pressable` (›) | Always rendered when `distinctRoutes.length > 1`; disabled at last index. |
| `route-carousel-container` | Outer `View` of the carousel assembly | Useful for existence assertions in E2E. Not an interactive element. |

These testIDs are **stable** — they do not embed dynamic values such as routeOptionId.
The `route-carousel-card` testID is passed via the `testID` prop to `RouteAttachmentCard`
(which forwards it to its root `TouchableOpacity`).

---

## 11. Accessibility

```
route-carousel-arrow-prev:
  accessibilityRole="button"
  accessibilityLabel="Previous route"
  accessibilityHint="Pages to the previous route option"
  accessibilityState={{ disabled: isFirstRoute }}

route-carousel-arrow-next:
  accessibilityRole="button"
  accessibilityLabel="Next route"
  accessibilityHint="Pages to the next route option"
  accessibilityState={{ disabled: isLastRoute }}

route-carousel-card:
  accessibilityRole="button"
  accessibilityLabel={`Route: ${route.label}, ${formatDistance(route.stats.distanceMeters)}, ${formatDuration(route.stats.durationSeconds)}`}
  accessibilityHint="Tap to view route details"
  accessibilityState={{ selected: isSelected }}
```

The outer `route-carousel-container` View carries
`accessibilityLabel={`Route ${currentIndex + 1} of ${distinctRoutes.length}`}` when
`distinctRoutes.length > 1`.

---

## 12. What Is NOT Changed

This spec is explicitly read-only against the following. RUX-001/RUX-002 must not modify:

- `components/chat/route-attachment-card.tsx` — reused as-is; no props added for carousel.
- `components/sheets/route-details-sheet.tsx` — wired by `index.tsx`, not carousel.
- `tokens/**` — no token schema edits.
- Any file outside `app/(app)/(tabs)/index.tsx` and `components/map/route-summary-carousel.tsx`.

The legacy `${color}15` / `${color}20` hex-alpha in `route-attachment-card.tsx` (compact
body) is MVP-acceptable per `10-design-system.md §1` and must not be refactored as part
of this task.

---

## 13. Integration Point in `index.tsx`

Replace the block at lines 1376-1412 with a `RouteSummaryCarousel` invocation:

```tsx
{/* Route summary carousel — single card above input (replaces per-variant stack) */}
{!chatMode &&
  toasts.length === 0 &&
  !mapPlanningVisible &&
  (flowState.phase === 'ROUTE_RESULTS' ||
    flowState.phase === 'ROUTE_DETAILS' ||
    flowState.phase === 'PLANNING') && (
    <RouteSummaryCarousel
      distinctRoutes={distinctRoutes}
      selectedRouteId={
        'selectedRouteId' in flowState ? (flowState.selectedRouteId ?? null) : null
      }
      onCardPress={handleCarouselCardPress}
      onRouteChange={selectRoute}
      hasActiveRoute={hasActiveRoute}
      bottomOffset={insets.bottom + 80}
    />
  )}
```

The `distinctRoutes` memoization and the `handleCarouselCardPress` callback
(which opens `RouteDetailsSheet`) are added to `index.tsx` by RUX-001.

---

## 14. Acceptance Criteria Verification

The following shell commands verify this spec's four ACs against the built file:

```bash
# AC-1 — file exists and non-empty, references semantic.space token
test -s .spec/design/sprint-01/route-carousel-card-spec.md && \
  grep -q 'semantic.space' .spec/design/sprint-01/route-carousel-card-spec.md && \
  echo PASS

# AC-2 — arrow state conditions referenced by exact identifier
grep -Eq 'distinctRoutes|hasActiveRoute' .spec/design/sprint-01/route-carousel-card-spec.md && \
  echo PASS

# AC-3 — surface.glass token and minTouchTarget present
grep -q 'surface.glass' .spec/design/sprint-01/route-carousel-card-spec.md && \
  grep -q 'minTouchTarget' .spec/design/sprint-01/route-carousel-card-spec.md && \
  echo PASS

# AC-4 — all three testIDs present
grep -q 'route-carousel-card' .spec/design/sprint-01/route-carousel-card-spec.md && \
  grep -q 'route-carousel-arrow-prev' .spec/design/sprint-01/route-carousel-card-spec.md && \
  grep -q 'route-carousel-arrow-next' .spec/design/sprint-01/route-carousel-card-spec.md && \
  echo PASS
```
