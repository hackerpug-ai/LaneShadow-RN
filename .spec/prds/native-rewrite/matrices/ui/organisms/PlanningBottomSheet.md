# PlanningBottomSheet - STYLE PROPERTIES MATRIX

**Component:** PlanningBottomSheet
**RN Source:** `react-native/components/sheets/planning-bottom-sheet.tsx`
**Framework Primitives:** `@gorhom/bottom-sheet`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/planning-bottom-sheet.tsx` | Public API, planning state display |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Gorhom bottom sheet integration |
| Progress | `react-native/components/ui/progress.tsx` | Planning progress indicator (see `matrices/ui/atoms/Progress.md`) |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `Progress` - Planning progress bar

**Composition pattern:**
- Snap point bottom sheet (various heights based on state)
- Shows planning progress with progress bar
- Displays planning status messages
- Snap points: 10% (collapsed), 50% (half), 90% (expanded)
- Auto-expands to 50% when planning starts
- Collapses to 10% when planning completes

**Layout:** Bottom sheet with dynamic snap points, centered content

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
| snapPoints | BottomSheetWrapper | `['10%', '50%', '90%']` | `BottomSheetState(...snapPoints = [...])` | `.presentationDetents([.fraction(0.1), .medium(), .fraction(0.9)])` | n/a (snap point percentages) |
| initialSnapIndex | constant | `0` (10%) | `BottomSheetState(...initialSnapIndex = 0)` | `.presentationDetents([...]).presentationBackgroundInteractionEnabled(...)` | n/a |

### Layout — Content Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingHorizontal | constant | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | constant | `16` | `Modifier.padding(vertical = 16.dp)` | `.padding(.vertical, 16)` | `space.lg` |
| gap | constant | `12` | `Arrangement.spacedBy(12.dp)` | `spacing(12)` | `space.md` |

### Typography — Status Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | react-native-paper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | `type.body.md` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| textAlign | StyleSheet | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |

### Visual — Progress Bar

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| value | prop | `0.0 - 1.0` | `Progress(...progress = value)` | `ProgressView(value: value)` | n/a (dynamic prop) |
| color | semantic | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

---

## NOTES

- **Dynamic snap points:** Three snap points at 10%, 50%, 90% heights
- **Auto-expand:** Sheet auto-expands to 50% when planning starts
- **Auto-collapse:** Sheet collapses to 10% when planning completes
- **Progress indicator:** Shows planning progress from 0.0 to 1.0
- **Status messages:** Displays current planning phase/status
- **Centered text:** Status text centered horizontally
- **Gap spacing:** 12dp gap between progress bar and status text
- **Theme integration:** All colors sourced from semantic theme tokens
- **Child components:** Composed from Progress component
- **No state:** Purely presentational component with controlled props
- **Delegation:** Most styling delegated to child Progress component
