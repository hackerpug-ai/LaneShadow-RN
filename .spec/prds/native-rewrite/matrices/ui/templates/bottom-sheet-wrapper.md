# BottomSheetWrapper — STYLE PROPERTIES MATRIX

**Component:** BottomSheetWrapper
**Level:** Template
**Source:** `react-native/components/sheets/bottom-sheet-wrapper.tsx`
**Platform Mapping:** Android `BottomSheetScaffold` from Material3, iOS `.presentationDetents()` from SwiftUI

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | `@gorhom/bottom-sheet` | Android: `app/src/main/java/com/laneshadow/ui/templates/BottomSheetWrapper.kt`<br>iOS: `app/ui/templates/BottomSheetWrapper.swift` | 1 fixed layout with preset variants |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Bottom Sheet Container

**Source files read:**
- LaneShadow: `react-native/components/sheets/bottom-sheet-wrapper.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | cornerRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual | shadow | RN-wrapper | `elevation[3]` | `Modifier.shadow(elevation = 3.dp)` | `.shadow(color:.black.opacity(0.08), radius:8, y:4)` | `elevation.light.3` |
| Layout | handleHeight | RN-wrapper | `space.lg + space.xs` = 20 | `Modifier.height(20.dp)` | `.frame(height: 20)` | composed |
| Layout | handleWidth | RN-wrapper | hardcoded `32` | `Modifier.width(32.dp)` | `.frame(width: 32)` | ESCALATE — propose `size.bottomSheetHandleWidth = 32` |
| Layout | handleRadius | RN-wrapper | `radius.full` = 9999 | `RoundedCornerShape(percent = 50)` | `Capsule()` | `radius.full` |
| Visual | handleColor | RN-wrapper | `semantic.color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |

### Layout — Detents (Snap Points)

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | detent (compact) | RN-wrapper | `25%` of screen height | `BottomSheetScaffold(sheetPeekHeight = 0.25 * screenHeight)` | `.presentationDetents([.fraction(0.25)])` | n/a |
| Layout | detent (half) | RN-wrapper | `50%` of screen height | `0.5 * screenHeight` | `.presentationDetents([.fraction(0.5)])` | n/a |
| Layout | detent (full) | RN-wrapper | `90%` of screen height | `0.9 * screenHeight` | `.presentationDetents([.fraction(0.9)])` | n/a |
| Layout | detent (auto) | RN-wrapper | calculated based on content | `BottomSheetDefaults.contentHeight` | `.presentationDetents([.large])` | n/a |

### Visual — Scrim

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Visual | scrimColor | RN-wrapper | `semantic.color.scrim.default` | `Color.Black.copy(alpha = 0.55f)` | `.black.opacity(0.55)` | `color.scrim.default` |
| Visual | scrimVisibility | RN-wrapper | visible when sheet > 0% | `scrimVisibility = BottomSheetDefaults.ScrimVisibility` | `.presentationBackgroundInteraction(.enabled)` | n/a |

---

## DESIGN NOTES

- **Critical keyboard handling**: When `hasTextInput={true}`, enable `keyboardBehavior="interactive"` (Android) or `.presentationDetents([.large])` (iOS)
- On Android: Use `WindowCompat.setDecorFitsSystemWindows(window, false)` + `ViewCompat.setWindowInsetsAnimationCallback(...)`
- Handle provides affordance for dragging
- Corner radius only applies to top corners
- Shadow provides depth perception
- Scrim dims content behind sheet

---

## VERIFICATION GATES

- Sheet snaps to detents smoothly
- Handle is centered and visible
- Keyboard does not hide input fields
- Scrim appears and dismisses sheet on tap
- Corner radius only on top corners
- Safe area respected on all edges
- Sheet content is scrollable when needed

---

## DEPENDENCIES

- UI-001 (core theme contract)
- SheetHandle atom component
- Safe area system
- Bottom sheet system (Android `BottomSheetScaffold`, iOS `.sheet`)

---

## KEYBOARD HANDLING (CRITICAL)

**When `hasTextInput={true}`:**

| Platform | Setting | Value |
|---|---|---|
| Android | `windowSoftInputMode` | `adjustResize` |
| Android | `keyboardBehavior` | `interactive` |
| Android | `imePadding()` | Apply to sheet content |
| iOS | `presentationDetents` | Include keyboard height |
| iOS | `scrollDismissesKeyboard` | `.interactively` |

**Use BottomSheetInput for all text inputs in bottom sheets** — see `react-native/components/CLAUDE.md` for details.
