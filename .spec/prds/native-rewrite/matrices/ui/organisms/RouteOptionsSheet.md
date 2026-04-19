# RouteOptionsSheet - STYLE PROPERTIES MATRIX

**Component:** RouteOptionsSheet
**RN Source:** `react-native/components/sheets/route-options-sheet.tsx`
**Framework Primitives:** `@gorhom/bottom-sheet`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/route-options-sheet.tsx` | Public API, route options list |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Gorhom bottom sheet integration |
| RouteOptionCard | `react-native/components/ui/route-option-card.tsx` | Individual route option (see `matrices/ui/molecules/RouteOptionCard.md`) |
| ScrollView | `react-native-gesture-handler` | Scrollable route list |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `RouteOptionCard` - Individual route option cards (repeated for each route)

**Composition pattern:**
- Half-height bottom sheet with close button
- Header with "Route Options" title
- Scrollable list of route option cards
- Each card shows route name, stats, badges, weather summary
- Selected route card has visual highlight (border)
- Press handler for selecting routes
- Empty state when no routes available

**Layout:** Vertical list with 16dp padding, 12dp gap between cards

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|---|
| (none - controlled component) | - | - | - |

**Side effects:**
- (none - purely presentational)

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`
- `onSelect: (routeId: string) => void` → `(routeId: String) -> Unit` / `(String) -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Sheet Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| preset | BottomSheetWrapper | `'half'` | `BottomSheetState(...halfExpandedRatio = 0.5)` | `.presentationDetents([.medium()])` | n/a (preset name) |
| paddingHorizontal | constant | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | constant | `16` | `Modifier.padding(vertical = 16.dp)` | `.padding(.vertical, 16)` | `space.lg` |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | react-native-paper | `titleLarge` | `LaneShadowTheme.typography.titleLarge` | `theme.typography.titleLarge` | `type.title.lg` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| marginBottom | constant | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Layout — Route Cards List

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | constant | `12` | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(bottom = 12.dp)` between cards | `spacing(12)` | `space.md` |

---

## NOTES

- **Half modal:** Uses preset="half" for half-height bottom sheet
- **Scrollable:** Route list wraps in ScrollView for overflow
- **Child cards:** Each route rendered as RouteOptionCard component
- **Selection:** Passes `selectedRouteId` to cards for visual highlight
- **Press handler:** Each card has `onPress` to select route
- **Empty state:** Shows message when `routes` array is empty
- **Gap spacing:** 12dp gap between route cards
- **Theme integration:** All colors sourced from semantic theme tokens
- **Child components:** Composed from RouteOptionCard (see molecule matrix)
- **No state:** Purely presentational component with controlled props
- **Delegation:** All styling delegated to child RouteOptionCard components
