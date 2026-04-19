# RouteDiscoveryScreen - STYLE PROPERTIES MATRIX

**Component:** RouteDiscoveryScreen
**RN Source:** `react-native/components/discovery/route-discovery-screen.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/discovery/route-discovery-screen.tsx` | Route discovery screen with map and filters |
| MenuLayout | `react-native/components/layouts/menu-layout.tsx` | Drawer menu layout (see matrices/ui/templates/MenuLayout.md) |
| MapViewWrapper | `react-native/components/map/map-view.tsx` | Map organism (see matrices/ui/organisms/MapViewWrapper.md) |
| DiscoveryFilterBar | `react-native/components/discovery/discovery-filter-bar.tsx` | Filter bar molecule (see matrices/ui/molecules/DiscoveryFilterBar.md) |
| DiscoverySortToggle | `react-native/components/discovery/discovery-sort-toggle.tsx` | Sort toggle molecule (see matrices/ui/molecules/DiscoverySortToggle.md) |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | `(app)/(tabs)/index.tsx` | NavHost route `"routeDiscovery"` | NavigationLink value: `/routeDiscovery` |
| **Params** | None | None | None |
| **Transitions** | None (root tab) | None | None |
| **Deep linking** | `/` (root) | `navDeepLink(...)` | `.onOpenURL(...)` |
| **Back navigation** | Drawer menu | Drawer menu | Drawer menu |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| (state) | Local state | `useState` for filter/sort | Filter archetype and sort mode |
| (mock data) | MOCK_ROUTES | Local constant | Design-time route data |
| onRouteSelect | (future) | Convex query | Route selection handler |

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (MenuLayout)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| Composition | RN-wrapper | `MenuLayout with children` | `MenuLayout(...) { ... }` | `MenuLayout { ... }` | n/a |

### Layout — Map Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |

### Layout — Filter/Sort Overlay (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(...)` | n/a |
| top | RN-wrapper | `insets.top` + space.lg | `WindowInsets.safeDrawing.asPaddingValues().calculateTopPadding() + 16.dp` | `safeAreaInsets.top + 16` | `space.lg` |
| left | RN-wrapper | `0` | `Modifier.align(Alignment.Start)` | alignment `.leading` | n/a |
| right | RN-wrapper | `0` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` (= 8) | `Arrangement.spacedBy(8.dp)` | `spacing(8)` | `space.sm` |

---

## NOTES

- **Full-bleed map:** MapViewWrapper fills entire screen
- **Glassmorphic overlays:** Filter and sort controls with semi-transparent background
- **Filter bar:** Archetype chips (Scenic, Technical, Adventure, Sport)
- **Sort toggle:** Distance/Score toggle with badge counts
- **Route pins:** Displayed on map with archetype-based styling
- **Empty state:** DiscoveryEmptyOverlay when no routes match
- **Loading state:** DiscoveryLoadingOverlay during data fetch
- **Menu integration:** MenuLayout provides drawer navigation
- **Mock data:** Currently uses MOCK_ROUTES constant
- **Future:** Will integrate with Convex queries for real data
