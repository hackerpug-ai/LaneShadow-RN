# SavedRoutesScreen — STYLE PROPERTIES MATRIX

**Component:** SavedRoutesScreen
**Level:** Screen
**Source:** `react-native/components/screens/saved-routes-screen.tsx`
**Platform Mapping:** Android `Column` + `LazyColumn`, iOS `ScrollView` + `VStack`

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/screens/saved-routes-screen.tsx` | `react-native/Libraries/Components/ScrollView/ScrollView.js` | Android: `app/src/main/java/com/laneshadow/ui/screens/SavedRoutesScreen.kt`<br>iOS: `app/ui/screens/SavedRoutesScreen.swift` | 2 states: loaded, empty |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Screen Container

**Source files read:**
- LaneShadow: `react-native/components/screens/saved-routes-screen.tsx`
- Framework: `react-native/Libraries/Components/ScrollView/ScrollView.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Route List

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | RN-wrapper | `12` | `Spacer(Modifier.height(12.dp))` | `Spacer(minLength: 12)` | semantic.space.md|

### Layout — Saved Route Cards

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | semantic.space.lg|
| Visual | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual | borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |

### Layout — Empty State

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.Center)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | gap | RN-wrapper | `12` | `Spacer(Modifier.height(12.dp))` | `Spacer(minLength: 12)` | semantic.space.md|

---

## DESIGN NOTES

- Lists saved routes
- Swipe to delete
- Tap to view details
- Empty state when no routes
- Uses SubpageLayout for header/nav

---

## VERIFICATION GATES

- Route cards tappable
- Delete works
- Empty state shows
- List scrolls smoothly

---

## DEPENDENCIES

- UI-001 (core theme contract)
- SubpageLayout template
- SavedRouteCard molecule
- IconSymbol component

---

## COMPOSITION

- SavedRoutesScreen = SubpageLayout + ScrollView + [SavedRouteCard] or EmptyState
