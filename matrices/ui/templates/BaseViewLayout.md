# BaseViewLayout - STYLE PROPERTIES MATRIX

**Component:** BaseViewLayout
**RN Source:** `react-native/components/layouts/base-view-layout.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-safe-area-context/src/NativeSafeAreaProvider.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/layouts/base-view-layout.tsx` | Base layout with safe area handling |
| SafeAreaInsets (RN) | `node_modules/react-native-safe-area-context/src/NativeSafeAreaProvider.tsx` | Safe area insets |
| View (RN) | `node_modules/react-native/Libraries/Components/View/View.js` | Container |

---

## LAYOUT COMPOSITION

**Purpose:** Minimal base layout providing safe area handling and background color for all views

**Composition pattern:**
- Single View container with flex: 1
- Safe area insets applied to top and bottom padding
- Background color from semantic tokens
- Children rendered as direct descendants

**Layout:** Full-screen container with safe area padding only - no header, no navigation

---

## STYLE PROPERTIES MATRIX

### Layout — Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` / `Modifier.fillMaxWidth().fillMaxHeight()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| paddingTop | RN-wrapper | `insets.top` (dynamic) | `Modifier.padding(top = WindowInsets.safeDrawing.asPaddingValues().calculateTopPadding())` | `.padding(.top, safeAreaInsets.top)` | n/a (dynamic) |
| paddingBottom | RN-wrapper | `insets.bottom` (dynamic) | `Modifier.padding(bottom = WindowInsets.safeDrawing.asPaddingValues().calculateBottomPadding())` | `.padding(.bottom, safeAreaInsets.bottom)` | n/a (dynamic) |

---

## NOTES

- **Safe area handling:** Uses `useSafeAreaInsets()` hook for dynamic padding
- **Minimal base:** Only provides safe area and background - no navigation or headers
- **Flex container:** Takes full available space with `flex: 1`
- **Background color:** Uses `semantic.color.background.default` token
- **Top padding:** `insets.top` handles notch/status bar area
- **Bottom padding:** `insets.bottom` handles home indicator area
- **Child rendering:** Children are direct descendants without additional wrapping
