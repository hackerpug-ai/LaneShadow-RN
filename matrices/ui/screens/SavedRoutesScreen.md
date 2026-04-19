# SavedRoutesScreen - STYLE PROPERTIES MATRIX

**Component:** SavedRoutesScreen
**RN Source:** `react-native/components/screens/saved-routes-screen.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/screens/saved-routes-screen.tsx` | Saved routes display screen |
| SubpageLayout | `react-native/components/layouts/subpage-layout.tsx` | Subpage layout template (see matrices/ui/templates/SubpageLayout.md) |
| SavedRouteCard | `react-native/components/ui/saved-route-card.tsx` | Saved route card (see matrices/ui/molecules/SavedRouteCard.md) |
| SearchBar | `react-native/components/ui/search-bar.tsx` | Search bar (see matrices/ui/molecules/SearchBar.md) |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | Tab navigation | `navController.navigate("savedRoutes")` | NavigationLink `/savedRoutes` |
| **Params** | None (optional query) | None | None |
| **Transitions** | None (tab) | None | None |
| **Back navigation** | Drawer menu | Drawer menu | Drawer menu |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| routes | SavedRouteData[] | Store/Convex query | Saved routes to display |
| searchQuery | string (optional) | Parent state | Search filter |
| onSelect | (routeId: string) => void | Parent callback | Route selection |
| onDelete | (routeId: string) => void | Parent callback | Delete route |

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (SubpageLayout)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | RN-wrapper | `'Saved Routes'` | Passed to SubpageLayout | Passed to SubpageLayout | n/a |

### Layout — ScrollView Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| contentContainerStyle padding | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| gap | RN-wrapper | `semantic.space.md` (= 12) | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Layout — Search Bar (SearchBar)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| placeholder | RN-wrapper | `'Search saved routes...'` | Passed to SearchBar | Passed to SearchBar | n/a |
| value | RN-wrapper | `searchQuery` | Passed to SearchBar | Passed to SearchBar | n/a |
| onChangeText | RN-wrapper | `onSearchChange` | Passed to SearchBar | Passed to SearchBar | n/a |

---

## NOTES

- **SubpageLayout:** Provides title, safe area handling
- **Search bar:** Filter routes by name/path
- **Route cards:** SavedRouteCard with thumbnail, name, duration, distance
- **Thumbnail rotation:** Visual indication of route orientation
- **Empty state:** Message when no saved routes
- **TestID propagation:** Title and search bar get testID suffixes
