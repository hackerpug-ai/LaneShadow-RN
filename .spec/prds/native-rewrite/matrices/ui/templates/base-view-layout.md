# BaseViewLayout — STYLE PROPERTIES MATRIX

**Component:** BaseViewLayout
**Level:** Template
**Source:** `react-native/components/layouts/base-view-layout.tsx`
**Platform Mapping:** Android `Box` + `Modifier.padding(SafeAreaPadding)`, iOS `VStack` + `.safeAreaPadding()`

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/layouts/base-view-layout.tsx` | `react-native/Libraries/Components/View/View.js`, `react-native-safe-area-context` | Android: `app/src/main/java/com/laneshadow/ui/templates/BaseViewLayout.kt`<br>iOS: `app/ui/templates/BaseViewLayout.swift` | 1 fixed layout |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources. Columns: Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping. `ESCALATE` = no token covers the value — add a proposed token to DECISIONS.md before implementing.

### Layout

**Source files read:**
- LaneShadow: `react-native/components/layouts/base-view-layout.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`, `react-native-safe-area-context`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | paddingTop | RN-wrapper | `paddingTop: insets.top` | `Modifier.padding(top = SafeAreaPadding.top)` | `.safeAreaPadding(.top)` | n/a (safe area) |
| Layout | paddingBottom | RN-wrapper | `paddingBottom: insets.bottom` | `Modifier.padding(bottom = SafeAreaPadding.bottom)` | `.safeAreaPadding(.bottom)` | n/a (safe area) |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

---

## DESIGN NOTES

- Minimal layout template providing only safe area handling and background color
- No header, no navigation — pure container for child content
- Used as base for other layouts that add their own chrome
- Critical for preventing content under status bar/notch on iOS and gesture navigation bar on Android

---

## VERIFICATION GATES

- Component renders without content clipping
- Safe areas respected on notched iOS devices
- Android gesture navigation area does not overlap content
- Background color applies correctly in both light and dark themes

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Safe area system (Android `WindowInsets`, iOS `safeAreaPadding`)
