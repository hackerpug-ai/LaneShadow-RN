# RouteComparisonView - STYLE PROPERTIES MATRIX

**Component:** RouteComparisonView
**RN Source:** `react-native/components/screens/route-comparison-view.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/ActivityIndicator/ActivityIndicator.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/screens/route-comparison-view.tsx` | Route comparison screen with multiple route options |
| SubpageLayout | `react-native/components/layouts/subpage-layout.tsx` | Subpage layout template (see matrices/ui/templates/SubpageLayout.md) |
| Button | `react-native/components/ui/button.tsx` | Button atom (see matrices/ui/atoms/Button.md) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Icon atom (see matrices/ui/atoms/IconSymbol.md) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | Navigation from planning | `navController.navigate("routeComparison")` | NavigationLink `/routeComparison` |
| **Params** | `routes: PlannedRouteOptionView[]` | `routes: List<PlannedRouteOptionView>` | `routes: [PlannedRouteOptionView]` |
| **Params** | `selectedRouteId: string \| null` | `selectedRouteId: String?` | `selectedRouteId: String?` |
| **Transitions** | Slide from right | `AnimatedContentTransitionScope.SlideDirection.Start` | `.navigationTransition(.slide)` |
| **Back navigation** | SubpageLayout back button | `navController.popBackStack()` | `.dismiss()` |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| routes | PlannedRouteOptionView[] | Parent (planning flow) | Route options to compare |
| selectedRouteId | string \| null | Parent state | Currently selected route |
| onRouteSelect | (routeId: string) => void | Parent callback | Route selection handler |
| onViewDetails | (routeId: string) => void | Parent callback | View route details |
| onSave | (routeId: string) => void | Parent callback | Save route |
| isLoading | boolean (optional) | Parent state | Loading state |

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (SubpageLayout)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | RN-wrapper | `'Compare Routes'` | Passed to SubpageLayout | Passed to SubpageLayout | n/a |
| backTo | RN-wrapper | `/(app)/(tabs)` (default) | Passed to SubpageLayout | Passed to SubpageLayout | n/a |
| rightAction | RN-wrapper | Save button | See Button below | See Button below | n/a |

### Layout — ScrollView Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| contentContainerStyle padding | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| gap | RN-wrapper | `semantic.space.md` (= 12) | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Layout — Route Card (Pressable)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| backgroundColor | RN-wrapper (selected) | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| backgroundColor | RN-wrapper (unselected) | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |
| borderRadius | RN-wrapper | `semantic.radius.lg` (= 12) | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(BorderStroke(1.dp, ...))` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| borderColor | RN-wrapper (selected) | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| borderColor | RN-wrapper (unselected) | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| padding | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| gap | RN-wrapper | `semantic.space.md` (= 12) | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Typography — Route Name (Text variant=titleMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `titleMedium` | `MaterialTheme.typography.titleMedium` | Verify against Paper | n/a |
| fontSize | Paper titleMedium | Verify in source | (verify) | (verify) | ESCALATE — verify token |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Loading State (ActivityIndicator)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| size | RN-wrapper | `'large'` | `Modifier.size(48.dp)` | `.controlSize(.large)` | n/a (platform) |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

---

## NOTES

- **SubpageLayout:** Provides back navigation, title, safe area handling
- **ScrollView:** Scrollable content area for route cards
- **Route cards:** Horizontal layout with radio indicator, route info, action buttons
- **Selection state:** Selected route gets primary border and surfaceVariant background
- **Route info:** Name, distance, duration, badges, stats
- **Action buttons:** View details, Save route
- **Loading state:** ActivityIndicator centered when `isLoading=true`
- **Empty state:** Message when no routes available
- **Formatters:** `formatDistance()` and `formatDuration()` helpers
- **TestID propagation:** Title and buttons get testID suffixes
- **Accessibility:** cards accessible, press feedback on selection
