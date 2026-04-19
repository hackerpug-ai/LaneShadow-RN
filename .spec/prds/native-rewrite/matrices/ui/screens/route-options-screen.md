# RouteOptionsScreen — STYLE PROPERTIES MATRIX

**Component:** RouteOptionsScreen
**Level:** Screen
**Source:** `react-native/components/screens/route-options-screen.tsx`
**Platform Mapping:** Android `Column` + `LazyColumn`, iOS `ScrollView` + `VStack`

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/screens/route-options-screen.tsx` | `react-native/Libraries/Components/ScrollView/ScrollView.js` | Android: `app/src/main/java/com/laneshadow/ui/screens/RouteOptionsScreen.kt`<br>iOS: `app/ui/screens/RouteOptionsScreen.swift` | 1 fixed screen with route list |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Screen Container

**Source files read:**
- LaneShadow: `react-native/components/screens/route-options-screen.tsx`
- Framework: `react-native/Libraries/Components/ScrollView/ScrollView.js`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Route List

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | RN-wrapper | `12` | `Spacer(Modifier.height(12.dp))` | `Spacer(minLength: 12)` | ESCALATE — `space.md` |

### Layout — Route Option Cards

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | ESCALATE — `space.lg` |
| Layout | margin | RN-wrapper | `0` | none | none | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Visual | borderRadius | RN-wrapper | `16` | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |

---

## DESIGN NOTES

- Simple list of route options
- Each card is tappable
- Selected route visually distinct
- Uses SubpageLayout for header/nav

---

## VERIFICATION GATES

- Route cards tappable
- List scrolls smoothly
- Selected state visible

---

## DEPENDENCIES

- UI-001 (core theme contract)
- SubpageLayout template
- RouteOptionCard molecule

---

## COMPOSITION

- RouteOptionsScreen = SubpageLayout + ScrollView + [RouteOptionCard]
