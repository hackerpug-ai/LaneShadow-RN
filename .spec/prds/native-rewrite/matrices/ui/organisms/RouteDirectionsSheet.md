# RouteDirectionsSheet - STYLE PROPERTIES MATRIX

**Component:** RouteDirectionsSheet
**RN Source:** `react-native/components/sheets/route-directions-sheet.tsx`
**Framework Primitives:** `@gorhom/bottom-sheet`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/route-directions-sheet.tsx` | Public API, turn-by-turn directions |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Gorhom bottom sheet integration |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Direction maneuver icons |
| ScrollView | `react-native-gesture-handler` | Scrollable directions list |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `IconSymbol` - Turn direction icons (left, right, straight, etc.)
- `Text` - Direction instructions

**Composition pattern:**
- Full-height bottom sheet with close button
- Header with "Directions" title
- Scrollable list of turn-by-turn directions
- Each direction row: icon + instruction text
- Icons show turn type (left, right, merge, etc.)
- Text shows distance and street name

**Layout:** Vertical list with 16dp padding, 12dp gap between direction rows

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|---|
| (none - controlled component) | - | - | - |

**Side effects:**
- (none - purely presentational)

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Sheet Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| preset | BottomSheetWrapper | `'full'` | `BottomSheetState(...expandedHeight = ...)` | `.presentationDetents([.large()])` | n/a (preset name) |
| paddingHorizontal | constant | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | constant | `16` | `Modifier.padding(vertical = 16.dp)` | `.padding(.vertical, 16)` | `space.lg` |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | react-native-paper | `titleLarge` | `LaneShadowTheme.typography.titleLarge` | `theme.typography.titleLarge` | `type.title.lg` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| marginBottom | constant | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Layout — Direction Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | StyleSheet | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | StyleSheet | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | constant | `12` | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` | `spacing(12)` | `space.md` |
| marginBottom | constant | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Icon — Direction Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | constant | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | `iconSize.md` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Direction Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | react-native-paper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | `type.body.md` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| flex | StyleSheet | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

---

## NOTES

- **Full modal:** Uses preset="full" for full-height bottom sheet
- **Scrollable:** Direction list wraps in ScrollView for overflow
- **Icon mapping:** Maps maneuver types to SF Symbols (turn-left, turn-right, etc.)
- **Text format:** "{distance} {street}" or "{instruction}" format
- **Gap spacing:** 12dp gap between icon and text
- **Row spacing:** 16dp bottom margin between direction rows
- **Theme integration:** All colors sourced from semantic theme tokens
- **Child components:** Composed from IconSymbol and Text components
- **No state:** Purely presentational component with controlled props
