# RouteOptionsSheet - STYLE PROPERTIES MATRIX

**Component:** RouteOptionsSheet
**RN Source:** `react-native/components/sheets/route-options-sheet.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/route-options-sheet.tsx` | Public API, bottom sheet layout |
| RouteOptionCard | `react-native/components/planning/route-option-card.tsx` | Route cards (see `matrices/ui/molecules/RouteOptionCard.md`) |
| Button | `react-native/components/ui/button.tsx` | Action buttons (see `matrices/ui/atoms/Button.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Icons (see `matrices/ui/atoms/IconSymbol.md`) |
| FavoriteExclusionAlert | `react-native/components/ui/favorite-exclusion-alert.tsx` | Exclusion alert |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Sheet container |
| ScrollView (RN) | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | Scrollable list |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `RouteOptionCard` - Individual route option cards (see `matrices/ui/molecules/RouteOptionCard.md`)
- `Button` - Back, save, view details buttons (see `matrices/ui/atoms/Button.md`)
- `IconSymbol` - Save icon
- `FavoriteExclusionAlert` - Excluded favorites alert (conditional)

**Composition pattern:**
- Full preset bottom sheet
- Header with centered "Route Options" title
- Conditional FavoriteExclusionAlert at top
- ScrollView with RouteOptionCard list
- Action row at bottom with 3 buttons (back, save, view details)
- 8px gap between action buttons
- Save button disabled when no route selected
- Save button shows loading state

**Layout:** Column layout with flex: 1 ScrollView

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| exclusionAlertDismissed | boolean | useState | `rememberSaveable { mutableStateOf(false) }` / `@State var exclusionAlertDismissed: Bool` |

**Side effects:**
- None

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`
- `onRouteSelect: (routeOptionId: string) => void` → `(routeOptionId: String) -> Unit` / `(String) -> Void`
- `onViewDetails: (routeOption: PlannedRouteOptionView) => void` → `(routeOption: PlannedRouteOptionView) -> Unit` / `(PlannedRouteOptionView) -> Void`
- `onBack: () => void` → `() -> Unit` / `() -> Void`
- `onSave?: () => void` → `() -> Unit` / `() -> Void`

**Computed values:**
- `selectedRoute`: Found from `planningResult.options` by `selectedRouteId`
- `isDetailsButtonEnabled`: `selectedRoute !== null`

---

## STYLE PROPERTIES MATRIX

### Layout — Container (implicit via BottomSheetWrapper)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| preset | RN-wrapper | `'full'` | Bottom sheet snap points [0.9, 1.0] | `presentationDetents([.large, .fraction(1.0)])` | n/a |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity).overlay(..., alignment: .center)` | n/a |
| paddingBottom | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `titleLarge` | `LaneShadowTheme.typography.titleLarge` | `theme.typography.titleLarge` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — ScrollView

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` / `Modifier.weight(1f)` | `.frame(maxHeight: .infinity)` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

### Layout — Actions Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingTop | RN-wrapper | `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Button — Back Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'outline'` | Button variant outline | `.buttonStyle(.bordered)` | n/a |
| size | RN-wrapper | `'default'` | Button size default | `.controlSize(.regular)` | n/a |

### Button — Save Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'default'` | Button variant default | `.buttonStyle(.borderedProminent)` | n/a |
| size | RN-wrapper | `'default'` | Button size default | `.controlSize(.regular)` | n/a |
| disabled | RN-wrapper | `!isDetailsButtonEnabled \|\| isSaving` | `enabled = isDetailsButtonEnabled && !isSaving` | `!isDetailsButtonEnabled || isSaving ? .disabled = true : nil` | n/a |
| icon | RN-wrapper | `content-save` (18px) | `Icons.Rounded.Save` / size 18.dp | SF Symbols `square.and.arrow.down` / size 18 | n/a |

### Typography — Save Button Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| text (saving) | RN-wrapper | `'Saving...'` | Shown when `isSaving === true` | Shown when `isSaving === true` | n/a |
| text (default) | RN-wrapper | `'Save Route'` | Shown when `isSaving === false` | Shown when `isSaving === false` | n/a |

### Button — View Details Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'default'` | Button variant default | `.buttonStyle(.borderedProminent)` | n/a |
| size | RN-wrapper | `'default'` | Button size default | `.controlSize(.regular)` | n/a |
| disabled | RN-wrapper | `!isDetailsButtonEnabled` | `enabled = isDetailsButtonEnabled` | `!isDetailsButtonEnabled ? .disabled = true : nil` | n/a |

---

## NOTES

- **Bottom sheet:** Full preset, uses BottomSheetWrapper
- **Header:** Centered title with 8px bottom padding
- **FavoriteExclusionAlert:** Conditional rendering, dismissible
- **ScrollView:** Fills available space, no scroll indicator
- **RouteOptionCard list:** Maps over `planningResult.options`
- **Actions row:** 3 buttons with space-between, 12px gap
- **Save button:** Shows loading state ("Saving..."), disabled when no selection or saving
- **View Details:** Disabled when no route selected
- **Back button:** Outline variant
- **Icon:** Save icon is 18px primary color
