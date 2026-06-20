---
spec_id: DESIGN-S01-007
title: Route Details Sheet — Expandable Snap Points + Sticky Action Footer
status: APPROVED
blocks: RUX-005
last_validated: 2026-06-20
---

# Route Details Sheet: Expandable Snap Points + Sticky Action Footer

## 1. Purpose and Context

This spec resolves Sprint 1 testing feedback item 2: "route overview doesn't expand fully
and buttons are hidden." The root cause is that `components/sheets/route-details-sheet.tsx`
uses `BottomSheetWrapper preset="half"` (a single `60%` snap) with the Save action rendered
**inline** at the end of the container's `ScrollView`. On tall content the Save button
overflows the snapped sheet height and becomes unreachable.

The fix adopts the **already-proven pattern** from `components/sheets/route-directions-sheet.tsx`
(the RouteDirectionsSheet / "Route Overview" directions sheet), which uses:

- `snapPoints={['50%', '90%']}` — two snap stops; drags from half-screen to near-full
- `wrapChildren={false}` — bypasses the default padded wrapper so the footer slot activates
- `BottomSheetScrollView` for scrollable body content
- An absolute-bottom `footer` slot padded by `semantic.space.lg + insets.bottom`

RouteDirectionsSheet proved this pattern solves the cut-off problem. RouteDetailsSheet
has not adopted it. This spec directs RUX-005 to converge RouteDetailsSheet on the same
architecture without modifying RouteDirectionsSheet.

**Anti-pattern being removed:** `preset="half"` with a single `60%` snap and the `actions`
View inline at `route-details-sheet.tsx:216-236` — that layout is the root cause of the
cut-off bug.

**Anti-pattern never to introduce:** a full-screen `ScrollView` with the Mapbox map nested
inside it; doing so causes Android Mapbox scroll conflicts (see `10-design-system.md §6`).

---

## 2. Current-State Gaps to Fix

| Location | Gap | Resolution |
|---|---|---|
| `route-details-sheet.tsx:83` | `preset="half"` → single 60% snap | Replace with `snapPoints={['50%','90%']}` |
| `route-details-sheet.tsx:84` | `<View style={styles.container}> flex:1` wrapping everything | Remove outer container; use `wrapChildren={false}` + footer slot |
| `route-details-sheet.tsx:103` | `<ScrollView>` from `react-native-gesture-handler` | Replace with `<BottomSheetScrollView>` from `@gorhom/bottom-sheet` |
| `route-details-sheet.tsx:216-236` | `actions` View inline after `ScrollView`, no `paddingBottom` | Move to `footer` prop of `BottomSheetWrapper`; add `paddingBottom: semantic.space.lg + insets.bottom` |
| `route-details-sheet.tsx:25-31` | Local `addOpacity()` helper | Flag as legacy; footer styling MUST NOT use it |
| `route-details-sheet.tsx:283-290` | `borderRadius: 12` on `statsCard`/`conditionsCard` (magic number) | Flag as legacy; spec'd footer must use `semantic.radius.md` (10pt) |
| `route-details-sheet.tsx:224` | `testID={\`${testID}-save-button\`}` (dynamic, prop-dependent) | Replace with stable literal `testID="route-details-sheet-save-button"` |
| Missing | No "Ride It" button exists in current source | Add `Button` for "Ride It" with `testID="route-details-sheet-ride-button"` in footer |

---

## 3. Snap-Point Architecture

### 3.1 Snap points

```
snapPoints={['50%', '90%']}
```

- **Index 0 — 50% (initial):** Sheet opens at half-screen. At this height, with the sticky
  action footer pinned below, the route title and first section of scrollable content are
  visible. Save and Ride It remain **fully visible** in the sticky footer — they are never
  inside the scroll container and are therefore never cut off.
- **Index 1 — 90% (expanded):** User drags the handle up to expand. At 90% nearly all
  route detail content is in view without scrolling. The footer remains sticky at the
  absolute bottom throughout.

Rationale for `50%` as the initial stop (rather than `60%`): RouteDirectionsSheet uses
`50%`; keeping both sheets consistent avoids a jarring height difference when the user
switches between the details and directions sheets for the same route.

### 3.2 BottomSheetWrapper props

```tsx
<BottomSheetWrapper
  isVisible={isVisible}
  onClose={onClose}
  snapPoints={['50%', '90%']}
  wrapChildren={false}
  showHandle={true}
  testID={testID}
  footer={<RouteDetailsFooter ... />}
>
  {/* scrollable body — see §4 */}
</BottomSheetWrapper>
```

`wrapChildren={false}` is **required**. With `wrapChildren=true` (the default) the
`BottomSheetWrapper` renders a padded `<View style={styles.content}>` that absorbs all
children and ignores the `footer` prop. Setting `wrapChildren={false}` activates the
`unwrappedContainer` path (see `bottom-sheet-wrapper.tsx:78-82`) which renders:

```
View (flex:1, flexDirection:'column')
  SheetHandle        ← drag handle at top
  {children}         ← scrollable body
  footerWrapper      ← position:'absolute', bottom:0, left:0, right:0
    {footer}         ← sticky action footer
```

### 3.3 Max height observable

At the `90%` snap point the sheet's inner height fills ~90% of screen height. The
`BottomSheetScrollView` body fills the remaining space between the fixed header and the
sticky footer. The sticky footer's `paddingBottom` clears the home indicator so no content
is clipped by the device chrome.

**Observable (from AC-1 + test spec):** At the `50%` snap with the longest possible content
(multi-sentence rationale + full stats + full conditions section), Save and Ride It remain
**fully visible** in the sticky footer. They are never inside the scroll container.

---

## 4. Scroll Architecture — Body Content

### 4.1 BottomSheetScrollView

Replace the existing `<ScrollView>` (from `react-native-gesture-handler`) with
`<BottomSheetScrollView>` from `@gorhom/bottom-sheet`. This is required for the Gorhom
sheet to intercept scroll gestures correctly — the standard `ScrollView` does not integrate
with the sheet's gesture system.

```tsx
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'

// Inside the BottomSheetWrapper children:
<View style={styles.header}>
  {/* fixed header — NOT inside the scroll view */}
  ...
</View>

<BottomSheetScrollView
  testID={`${testID}-scroll-view`}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{
    paddingHorizontal: semantic.space.lg,
    paddingTop: semantic.space.md,
    paddingBottom: FOOTER_HEIGHT + semantic.space.md,
    // FOOTER_HEIGHT clears the sticky footer so the last content row
    // scrolls fully into view above the action buttons.
    // See §4.2 for FOOTER_HEIGHT derivation.
  }}
>
  {/* Rationale section */}
  {/* Stats section */}
  {/* Conditions section */}
</BottomSheetScrollView>
```

### 4.2 contentContainerStyle.paddingBottom — footer clearance

The `BottomSheetScrollView`'s `contentContainerStyle.paddingBottom` **must** be large
enough so the last content row scrolls fully above the sticky footer.

Derivation:

```
FOOTER_HEIGHT = Button height (44pt)    // semantic.control.minHeight = 44
              + gap between buttons      // semantic.space.sm = 8pt (if two buttons in a row)
              + paddingTop of footer     // semantic.space.md = 12pt
              + paddingBottom of footer  // semantic.space.lg + insets.bottom (16 + device value)
              + borderTopWidth           // semantic.borderWidth.thin = 1pt
```

Since `insets.bottom` is a runtime value, RUX-005 MUST capture it via `useSafeAreaInsets()`
and supply it both to the footer `paddingBottom` and to the `contentContainerStyle.paddingBottom`
calculation. A safe static estimate for the scroll padding is:

```
contentContainerStyle.paddingBottom = semantic.space.xl + semantic.control.minHeight
                                    + semantic.space.lg + insets.bottom
// = 24 + 44 + 16 + insets.bottom
// ≈ 84 + insets.bottom (34pt on iPhone 14 Pro = 118pt total)
```

Using token arithmetic (no bare numbers except the sum derived from tokens):

```tsx
const { semantic } = useSemanticTheme()
const insets = useSafeAreaInsets()

const scrollPaddingBottom =
  semantic.space.xl +           // gap above footer visually
  semantic.control.minHeight +  // Button lg height (44pt)
  semantic.space.lg +           // footer paddingTop
  insets.bottom                 // safe-area home indicator clearance
```

This guarantees the Conditions section (the last content block) scrolls fully into view
above the action footer at every snap point.

### 4.3 Fixed header (not inside BottomSheetScrollView)

The sheet title ("Route Details") and the route label badge are rendered in a **fixed
header** `View` that sits between the `SheetHandle` and the `BottomSheetScrollView`. This
header is not scrollable — it stays pinned at the top of the sheet regardless of scroll
position, mirroring the RouteDirectionsSheet header pattern
(`route-directions-sheet.tsx:205-231`).

```tsx
<View style={{
  paddingHorizontal: semantic.space.lg,
  paddingTop: semantic.space.md,
  paddingBottom: semantic.space.sm,
  borderBottomWidth: semantic.borderWidth.thin,
  borderBottomColor: `${semantic.color.border.default}33`,
}}>
  <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
    Route Details
  </Text>
  {/* route label badge — existing markup preserved */}
</View>
```

---

## 5. Sticky Action Footer

### 5.1 Placement — BottomSheetWrapper footer slot

The Save and Ride It buttons are passed as the `footer` prop to `BottomSheetWrapper`:

```tsx
footer={
  <View
    testID="route-details-sheet-footer"
    style={{
      paddingHorizontal: semantic.space.lg,
      paddingTop: semantic.space.md,
      paddingBottom: semantic.space.lg + insets.bottom,
      borderTopWidth: semantic.borderWidth.thin,
      borderTopColor: `${semantic.color.border.default}33`,
      backgroundColor: semantic.color.surface.default,
      flexDirection: 'row',
      gap: semantic.space.sm,
    }}
  >
    <Button
      variant="secondary"
      size="lg"
      onPress={onClose}
      style={{ flex: 1 }}
      testID="route-details-sheet-ride-button"
      icon={<IconSymbol name="navigation" size={20} color={semantic.color.primary.default} />}
    >
      Ride It
    </Button>

    <Button
      variant="default"
      size="lg"
      onPress={onSave}
      disabled={isSaving}
      style={{ flex: 1 }}
      testID="route-details-sheet-save-button"
      icon={<IconSymbol name="content-save" size={20} color={semantic.color.onPrimary.default} />}
    >
      {isSaving ? 'Saving...' : 'Save Route'}
    </Button>
  </View>
}
```

The `footerWrapper` in `bottom-sheet-wrapper.tsx:96-101` applies
`position: 'absolute', bottom: 0, left: 0, right: 0`, pinning this footer to the
absolute bottom of the sheet regardless of scroll position or snap point.

### 5.2 paddingBottom — home-indicator clearance

```
paddingBottom: semantic.space.lg + insets.bottom
```

- `semantic.space.lg` = 16pt — visual breathing room above the home indicator line
- `insets.bottom` — device safe-area inset from `useSafeAreaInsets()` (34pt on iPhone 14
  Pro, 0pt on devices without a home indicator)

This mirrors exactly `route-directions-sheet.tsx:172`:
```tsx
paddingBottom: semantic.space.lg + insets.bottom,
```

**Observable (from AC-2):** At the `50%` snap, on an iPhone 14 Pro (insets.bottom = 34pt),
the footer occupies `12 (paddingTop) + 44 (Button height) + 16 + 34 (paddingBottom) = 106pt`
from the bottom of the sheet. Both Save and Ride It buttons remain fully visible —
their bottom edge clears the home indicator by `insets.bottom` (34pt).

### 5.3 Footer background

```
backgroundColor: semantic.color.surface.default
```

The footer must carry an opaque background so scroll content does not bleed through the
buttons as the user scrolls. `semantic.color.surface.default` resolves to `#F8F7F6` (light)
/ `#221810` (dark) and is fully opaque — no alpha channel.

**NEVER use:** the local `addOpacity()` helper (`route-details-sheet.tsx:25-31`) in footer
styles. That helper produces `rgba()` strings from raw hex; the footer background must be
fully opaque. `addOpacity()` is a legacy local function that has no token backing and must
not appear in the new footer.

### 5.4 Footer border radius

**NEVER use:** `borderRadius: 12` (magic number, appears in `styles.statsCard` and
`styles.conditionsCard`). The footer has no border radius — it is flush to the bottom of
the sheet. If RUX-005 adds a border radius to any footer element it MUST use
`semantic.radius.md` (10pt) or another named token path, not a bare integer.

### 5.5 Button sizing — ≥44pt

Both buttons use `size="lg"` on the `Button` component from `components/ui/button.tsx`.
The Button component comment at line 6 documents: `Heights: 44px (lg)`. This satisfies the
`≥44pt` interactive-target floor required by `07-ui-infrastructure.md §6`.

Each button occupies `flex: 1` within the footer row, making both buttons equal width
and spanning the full available footer width (less horizontal padding and gap).

### 5.6 Ride It button behavior

`onPress` for the Ride It button: the `RouteDetailsSheet` must accept an `onRide?: () => void`
prop. When `onRide` is provided, "Ride It" calls `onRide()`. When omitted, the Ride It
button is not rendered (matching the existing pattern where `onSave` gates the Save button).
This is the minimum contract for RUX-005; the route activation flow wired by the caller is
out of scope for this spec.

The Ride It button uses `variant="secondary"` to distinguish it visually from the primary
Save action, matching the Close/Navigate pairing in RouteDirectionsSheet
(`route-directions-sheet.tsx:179-201`).

---

## 6. Component Architecture Summary

The restructured `RouteDetailsSheet` layout, with `wrapChildren={false}`:

```
BottomSheetWrapper (snapPoints=['50%','90%'], wrapChildren=false)
  └── unwrappedContainer (flex:1, flexDirection:'column')
        ├── SheetHandle                          ← drag indicator
        ├── Fixed header View                    ← title + label badge (not scrollable)
        ├── BottomSheetScrollView (flex:1)       ← scrollable body
        │     contentContainerStyle.paddingBottom = scrollPaddingBottom
        │     ├── Rationale section
        │     ├── Stats section
        │     └── Conditions section
        └── footerWrapper (position:'absolute', bottom:0, left:0, right:0)
              └── footer View                    ← sticky action row
                    ├── Button "Ride It"   (variant='secondary', size='lg')
                    └── Button "Save Route" (variant='default', size='lg')
```

The key structural constraint: **no content below the `BottomSheetScrollView` that is not
the footer**. The old pattern (`ScrollView` + `actions` View as siblings in a `flex:1`
container) silently expanded the container and then overflowed at the snapped height. The
new pattern eliminates that class of overflow entirely.

---

## 7. Props Interface Delta

RUX-005 adds one prop to `RouteDetailsSheetProps`:

```typescript
export type RouteDetailsSheetProps = {
  isVisible: boolean
  onClose: () => void
  route: PlannedRouteOptionView | null
  onSave?: () => void
  isSaving?: boolean
  onRide?: () => void   // NEW — when provided, renders Ride It button in footer
  testID?: string
}
```

No other props change. The `testID` prop continues to be passed through to
`BottomSheetWrapper` for sheet-level test targeting.

---

## 8. Imports Delta

Add or change the following imports in `route-details-sheet.tsx`:

```typescript
// ADD
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// REMOVE
import { ScrollView } from 'react-native-gesture-handler'
// (react-native-gesture-handler ScrollView is replaced by BottomSheetScrollView)
```

`useSafeAreaInsets` is already imported by `route-directions-sheet.tsx:19` — this confirms
the package is available. `BottomSheetScrollView` is already imported by
`route-directions-sheet.tsx:15`.

---

## 9. Legacy Code to Remove

The following items in `route-details-sheet.tsx` are legacy and MUST NOT appear in the
refactored component:

| Item | Location | Reason |
|---|---|---|
| `addOpacity()` local function | lines 25-31 | Produces raw rgba from hex with no token backing; flagged in `10-design-system.md §1`. Remove entirely — footer background is fully opaque (`semantic.color.surface.default`). The stats/conditions card backgrounds that currently call `addOpacity(semantic.color.surface.default, 0.8)` should move to `semantic.color.surface.default` with a token-based alpha suffix (`E6` = 90%) if transparency is desired, or simply `semantic.color.card.default` (= `#FDFBF8` / `#2D2218`). |
| `borderRadius: 12` (magic number) | `styles.statsCard:283`, `styles.conditionsCard:289` | Not a token. Replace with `semantic.radius.md` (10pt) in the `StyleSheet`. |
| Inline `actions` View | lines 216-236 | Replaced by footer slot. Delete entirely. |
| `preset="half"` | line 83 | Deleted when `snapPoints` replaces it. |
| `<ScrollView>` from gesture-handler | line 103 | Replaced by `BottomSheetScrollView`. |

---

## 10. Token Reference Table

All spacing, color, radius, and control values are consumed through `useSemanticTheme()`.
No hardcoded hex, no magic pixel numbers, no local alpha helpers.

| Usage | Token path | Resolved value (light / dark) |
|---|---|---|
| Footer background | `semantic.color.surface.default` | #F8F7F6 / #221810 (fully opaque) |
| Footer border top color | `semantic.color.border.default` + `33` alpha | #E5DED933 / rgba(242,238,232,0.12) at further 20% |
| Footer border top width | `semantic.borderWidth.thin` | 1pt |
| Footer horizontal padding | `semantic.space.lg` | 16pt |
| Footer top padding | `semantic.space.md` | 12pt |
| Footer bottom padding | `semantic.space.lg + insets.bottom` | 16pt + device safe-area (34pt on iPhone 14 Pro) |
| Gap between footer buttons | `semantic.space.sm` | 8pt |
| Save button height (via size='lg') | `semantic.control.minHeight` | 44pt |
| Ride It button height (via size='lg') | `semantic.control.minHeight` | 44pt |
| Save button icon color | `semantic.color.onPrimary.default` | #FFFFFF |
| Ride It button icon color | `semantic.color.primary.default` | #EE7C2B |
| Header border-bottom color | `semantic.color.border.default` | #E5DED9 / rgba(242,238,232,0.12) |
| Header horizontal padding | `semantic.space.lg` | 16pt |
| Header top padding | `semantic.space.md` | 12pt |
| Header bottom padding | `semantic.space.sm` | 8pt |
| Body horizontal padding | `semantic.space.lg` | 16pt |
| Body top padding | `semantic.space.md` | 12pt |
| Card border radius | `semantic.radius.md` | 10pt (replaces bare `12`) |
| Scroll padding bottom | `semantic.space.xl + semantic.control.minHeight + semantic.space.lg + insets.bottom` | 24 + 44 + 16 + insets.bottom |

---

## 11. testID Registry

All interactive and observable elements carry a **stable, literal** testID as required by
`07-ui-infrastructure.md §6`. testIDs do NOT embed the dynamic `testID` prop — they are
flat, hard-coded strings on the footer elements.

| testID | Element | Notes |
|---|---|---|
| `route-details-sheet-save-button` | Save Route `Button` in footer | Stable literal. Replaces the current dynamic `${testID}-save-button`. Required by AC-4 and TC-4. |
| `route-details-sheet-ride-button` | Ride It `Button` in footer | New button. Stable literal. Required by AC-4 and TC-4. Rendered only when `onRide` prop is provided. |
| `route-details-sheet-footer` | Footer `View` container | Enables existence assertions on the footer without relying on button presence. |
| `route-details-sheet-scroll-view` | `BottomSheetScrollView` | Enables scroll assertions. Uses dynamic form `${testID}-scroll-view` to allow multi-instance disambiguation when caller passes testID. |

The sheet-level `testID` prop continues to be forwarded to `BottomSheetWrapper` (which
forwards to `BottomActionSheet`) for sheet visibility assertions.

---

## 12. Accessibility

```
Save Route Button (route-details-sheet-save-button):
  accessibilityRole="button"
  accessibilityLabel="Save Route"
  accessibilityState={{ disabled: isSaving }}

Ride It Button (route-details-sheet-ride-button):
  accessibilityRole="button"
  accessibilityLabel="Ride this route"
  accessibilityHint="Opens navigation for the route"
```

Both buttons use `Button size='lg'` which internally sets `accessibilityRole="button"`.
RUX-005 should verify the `Button` component forwards `accessibilityLabel` — if not, add
the prop directly to the `Button` element.

---

## 13. Interaction Specification

| Gesture | Result |
|---|---|
| Sheet open | Sheet appears at `50%` snap, Save and Ride It visible in footer |
| Drag handle up | Sheet expands to `90%`, footer remains sticky at absolute bottom, scroll content expands |
| Drag handle down from `90%` | Returns to `50%`, footer still visible |
| Drag handle down from `50%` | Sheet dismisses (calls `onClose`) |
| Scroll body content | `BottomSheetScrollView` scrolls, header and footer remain fixed |
| Tap Save Route | Calls `onSave()` if provided; button shows "Saving..." with `disabled` state |
| Tap Ride It | Calls `onRide()` if provided; absent if `onRide` not passed |
| Tap scrim / drag to dismiss | Calls `onClose()` (existing behavior — no change) |

---

## 14. Regression Guard — RouteDirectionsSheet

RUX-005 MUST NOT modify `components/sheets/route-directions-sheet.tsx`. The directions
sheet is the pattern source and is already correct. Changes to that file are out of scope
and risk regressing the fixed directions-sheet behavior.

Verify: after RUX-005 implementation, `pnpm test` against the existing RouteDirectionsSheet
snapshot or integration test must still pass.

---

## 15. What Is NOT Changed

This spec is explicitly read-only against the following. RUX-005 must not modify:

- `components/sheets/route-directions-sheet.tsx` — pattern source, already correct; do not touch
- `components/sheets/bottom-sheet-wrapper.tsx` — used as-is; no new props required
- `tokens/**` — no token schema edits; consume only via `useSemanticTheme()`
- `components/ui/button.tsx` — reused as-is; `size='lg'` already produces 44pt height
- Any file outside `components/sheets/route-details-sheet.tsx` and its test file

---

## 16. Acceptance Criteria Verification

```bash
# AC-1 — expandable 90% snap stop present, preset='half' absent
grep -q "'90%'" .spec/design/sprint-01/route-details-sheet-expand-spec.md && \
  grep -q "snapPoints" .spec/design/sprint-01/route-details-sheet-expand-spec.md && \
  echo PASS

# AC-2 — sticky footer in footer slot, padded by insets.bottom
grep -q 'insets.bottom' .spec/design/sprint-01/route-details-sheet-expand-spec.md && \
  grep -Eqi 'footer' .spec/design/sprint-01/route-details-sheet-expand-spec.md && \
  echo PASS

# AC-3 — BottomSheetScrollView with contentContainerStyle paddingBottom
grep -q 'BottomSheetScrollView' .spec/design/sprint-01/route-details-sheet-expand-spec.md && \
  grep -Eqi 'contentContainerStyle|paddingBottom' .spec/design/sprint-01/route-details-sheet-expand-spec.md && \
  echo PASS

# AC-4 — stable testIDs, Button size='lg', semantic.space tokens
grep -q 'route-details-sheet-save-button' .spec/design/sprint-01/route-details-sheet-expand-spec.md && \
  grep -q 'route-details-sheet-ride-button' .spec/design/sprint-01/route-details-sheet-expand-spec.md && \
  grep -q "semantic.space" .spec/design/sprint-01/route-details-sheet-expand-spec.md && \
  echo PASS
```

---

## 17. Verification Gates (from task file)

| Gate | Command |
|---|---|
| gate_1_spec_exists | `test -s .spec/design/sprint-01/route-details-sheet-expand-spec.md && echo PASS` |
| gate_2_tokens_validate | `pnpm tokens:validate` |
| gate_3_component_snapshot | `pnpm test components/sheets/route-details-sheet.integration.test.tsx` (RUX-005 built sheet: snapPoints include `'90%'`, Save/Ride It in footer with both testIDs, footer outside the scroll container) |
| gate_4_lint | `pnpm exec biome check .spec/design/sprint-01/route-details-sheet-expand-spec.md` |
| gate_5_scope | `git diff --name-only` output is a subset of `{route-details-sheet-expand-spec.md}` |
