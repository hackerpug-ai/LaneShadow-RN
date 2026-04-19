# RouteDetailsSheet - STYLE PROPERTIES MATRIX

**Component:** RouteDetailsSheet
**RN Source:** `react-native/components/sheets/route-details-sheet.tsx`
**Framework Primitives:** `@gorhom/bottom-sheet`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/route-details-sheet.tsx` | Public API, sheet layout, route details |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Gorhom bottom sheet integration (see `matrices/ui/templates/BottomSheetWrapper.md`) |
| ScrollView | `react-native-gesture-handler` | Scrollable content area |
| StatRow | `react-native/components/ui/stat-row.tsx` | Route statistics display (see `matrices/ui/molecules/StatRow.md`) |
| WindBadge | `react-native/components/planning/wind-badge.tsx` | Wind conditions display (see `matrices/ui/molecules/WindBadge.md`) |
| Button | `react-native/components/ui/button.tsx` | Save action button (see `matrices/ui/atoms/Button.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Route type icon (see `matrices/ui/atoms/IconSymbol.md`) |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `BottomSheetWrapper` - Gorhom bottom sheet container
- `StatRow` - Distance, duration, elevation stats
- `WindBadge` - Wind conditions badge
- `Button` - Save route button
- `IconSymbol` - Route type icon

**Composition pattern:**
- Half-height bottom sheet with close button
- Header with "Route Details" title and route label badge
- Badge uses primary color with 12% alpha background
- Scrollable content area with route statistics
- Stat rows for distance, duration, elevation
- Wind badge for conditions
- Save button with loading state
- Custom alpha utility function for transparent colors

**Layout:** Vertical stack with 16dp padding, header row with title and badge

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|---|
| (none - controlled component) | - | - | - |

**Side effects:**
- (none - purely presentational)

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`
- `onSave?: () => void` → `() -> Unit` / `() -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Sheet Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| preset | BottomSheetWrapper | `'half'` | `BottomSheetState(...halfExpandedRatio = 0.5)` | `.presentationDetents([.medium()])` | n/a (preset name) |
| paddingHorizontal | constant | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |

### Visual — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | constant | `8` | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` | `spacing(8)` | `space.sm` |
| alignItems | constant | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | react-native-paper | `titleLarge` | `LaneShadowTheme.typography.titleLarge` | `theme.typography.titleLarge` | `type.title.lg` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Route Label Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | computed | `${primary}1F` (12% alpha) | `LaneShadowTheme.colors.primary.copy(alpha = 0.12f)` | `theme.colors.primary.opacity(0.12)` | `color.primary.default` + `opacity.container` |
| gap | constant | `4` | `Arrangement.spacedBy(4.dp)` | `spacing(4)` | `space.xs` |
| paddingHorizontal | constant | `8` | `Modifier.padding(horizontal = 8.dp)` | `.padding(.horizontal, 8)` | `space.sm` |
| paddingVertical | constant | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | `space.xs` |
| borderRadius | constant | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

### Icon — Route Badge Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | constant | `14` | `Modifier.size(14.dp)` | `.frame(width: 14, height: 14)` | ESCALATE — propose `iconSize.xs = 14` |
| color | semantic | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Badge Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | constant | `12` | `TextStyle(fontSize = 12.sp)` | `.font(.system(size: 12))` | `type.label.sm.fontSize` |
| fontWeight | constant | `'500'` | `TextStyle(fontWeight = FontWeight.Medium)` | `.fontWeight(.medium)` | `type.label.sm.fontWeight` |
| color | semantic | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Layout — Content Sections

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | constant | `16` | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(top = 16.dp)` between sections | `spacing(16)` | `space.lg` |
| marginTop | constant | `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |

---

## NOTES

- **Alpha utility:** Custom `addOpacity()` function adds alpha to hex colors (e.g., `#B873331F` for 12% alpha)
- **Badge background:** Primary color with 12% alpha for subtle badge background
- **Route label:** Displays route label from `route.label` property
- **Format utilities:** `formatDistance()` and `formatDuration()` for display formatting
- **Loading state:** Save button shows loading spinner when `isSaving={true}`
- **Scrollable:** Content wraps in ScrollView for overflow handling
- **Half modal:** Uses preset="half" for half-height bottom sheet
- **Child components:** Composed from StatRow, WindBadge, Button, IconSymbol
- **Theme integration:** All colors sourced from semantic theme tokens
- **No inline styles:** All styling via StyleSheet constants or semantic tokens
