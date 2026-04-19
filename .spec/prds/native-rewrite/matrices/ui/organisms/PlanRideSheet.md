# PlanRideSheet - STYLE PROPERTIES MATRIX

**Component:** PlanRideSheet
**RN Source:** `react-native/components/sheets/plan-ride-sheet.tsx`
**Framework Primitives:** `@gorhom/bottom-sheet`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/plan-ride-sheet.tsx` | Public API, ride planning form |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Gorhom bottom sheet integration |
| Input | `react-native/components/ui/input.tsx` | Location inputs (see `matrices/ui/atoms/Input.md`) |
| Button | `react-native/components/ui/button.tsx` | Plan action button (see `matrices/ui/atoms/Button.md`) |
| DepartureTimeSelector | `react-native/components/ui/departure-time-selector.tsx` | Time picker (see `matrices/ui/molecules/DepartureTimeSelector.md`) |
| PreferencesRow | `react-native/components/sheets/preferences-row.tsx` | Preference toggles (see `matrices/ui/molecules/PreferencesRow.md`) |
| TogglesContainer | `react-native/components/sheets/toggles-container.tsx` | Toggle group container |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `Input` - Start location input
- `Input` - End location input
- `DepartureTimeSelector` - Departure time picker
- `PreferencesRow` - Scenic bias, weather avoid toggles
- `Button` - Plan ride action button

**Composition pattern:**
- Half-height bottom sheet with close button
- Header with "Plan Ride" title
- Start location input with icon
- End location input with icon
- Departure time selector
- Preferences row with toggles
- Plan button at bottom (sticky)
- Form validation (enable/disable button based on inputs)

**Layout:** Vertical form with 16dp padding, 12dp gap between elements

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|---|
| (none - controlled component) | - | - | - |

**Side effects:**
- (none - purely presentational)

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`
- `onPlan: (preferences: RidePreferences) => void` → `(preferences: RidePreferences) -> Unit` / `(RidePreferences) -> Void`

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

### Layout — Form Elements

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | constant | `12` | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(bottom = 12.dp)` between elements | `spacing(12)` | `space.md` |

### Layout — Plan Button (sticky bottom)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginTop | constant | `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |
| width | StyleSheet | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

---

## NOTES

- **Half modal:** Uses preset="half" for half-height bottom sheet
- **Form layout:** Vertical stack with 12dp gap between elements
- **Input fields:** Start and end location inputs with icons
- **Time selector:** DepartureTimeSelector for choosing departure time
- **Preferences:** PreferencesRow for scenic bias and weather avoid toggles
- **Plan button:** Sticky button at bottom of sheet
- **Form validation:** Plan button disabled until inputs are valid
- **Gap spacing:** 12dp gap between form elements
- **Theme integration:** All colors sourced from semantic theme tokens
- **Child components:** Composed from Input, Button, DepartureTimeSelector, PreferencesRow
- **No state:** Purely presentational component with controlled props
- **Delegation:** All styling delegated to child components
