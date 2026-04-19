# RouteOptionsScreen - STYLE PROPERTIES MATRIX

**Component:** RouteOptionsScreen
**RN Source:** `react-native/components/screens/route-options-screen.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/screens/route-options-screen.tsx` | Route options display screen |
| SubpageLayout | `react-native/components/layouts/subpage-layout.tsx` | Subpage layout template (see matrices/ui/templates/SubpageLayout.md) |
| RouteOptionCard | `react-native/components/ui/route-option-card.tsx` | Route option card (see matrices/ui/molecules/RouteOptionCard.md) |
| PrimaryButton | `react-native/components/ui/primary-button.tsx` | Primary button (see matrices/ui/atoms/PrimaryButton.md) |

---

## NAVIGATION & ROUTING

| Aspect | RN | Android (Compose) | iOS (SwiftUI) |
|---|---|---|---|
| **Entry point** | Navigation from planning | `navController.navigate("routeOptions")` | NavigationLink `/routeOptions` |
| **Params** | `routes: RouteOptionData[]` | `routes: List<RouteOptionData>` | `routes: [RouteOptionData]` |
| **Params** | `selectedRouteId?: string` | `selectedRouteId: String?` | `selectedRouteId: String?` |
| **Transitions** | Slide from right | `AnimatedContentTransitionScope.SlideDirection.Start` | `.navigationTransition(.slide)` |
| **Back navigation** | SubpageLayout back button | `navController.popBackStack()` | `.dismiss()` |

---

## DATA FLOW

| Prop | Type | Source | Purpose |
|---|---|---|---|
| routes | RouteOptionData[] | Parent (planning flow) | Route options to display |
| selectedRouteId | string (optional) | Parent state | Currently selected route |
| onSelectRoute | (routeId: string) => void | Parent callback | Route selection handler |
| onStartNavigation | () => void | Parent callback | Start navigation |
| onBack | () => void | Parent callback | Back navigation |
| loading | boolean (optional) | Parent state | Loading state |
| error | string (optional) | Parent state | Error message |

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (SubpageLayout)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | RN-wrapper | `'Route Options'` | Passed to SubpageLayout | Passed to SubpageLayout | n/a |

### Layout — ScrollView Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| contentContainerStyle padding | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| gap | RN-wrapper | `semantic.space.md` (= 12) | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Layout — Start Navigation Button (PrimaryButton)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| title | RN-wrapper | `'Start Navigation'` | Passed to PrimaryButton | Passed to PrimaryButton | n/a |
| onPress | RN-wrapper | `onStartNavigation` | Passed to PrimaryButton | Passed to PrimaryButton | n/a |

---

## NOTES

- **SubpageLayout:** Provides back navigation, title, safe area handling
- **ScrollView:** Scrollable content area for route cards
- **Route cards:** RouteOptionCard with variant (selected/compact), badges, stats, weather summary
- **Selection:** Visual indication of selected route
- **Start button:** PrimaryButton at bottom to begin navigation
- **Loading/error states:** Handled by parent or displayed inline
- **Weather overlay:** WeatherPill and StatRow for conditions
- **TestID propagation:** Title and buttons get testID suffixes
