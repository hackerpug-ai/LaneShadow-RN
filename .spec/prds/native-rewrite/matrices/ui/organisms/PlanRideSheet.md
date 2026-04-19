# PlanRideSheet - STYLE PROPERTIES MATRIX

**Component:** PlanRideSheet
**RN Source:** `react-native/components/sheets/plan-ride-sheet.tsx`
**Framework Primitives:** `@gorhom/bottom-sheet`, `react-native-gesture-handler`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/plan-ride-sheet.tsx` | Public API, ride planning form |
| LocationInput | `react-native/components/location-input.tsx` | Location inputs (see `matrices/ui/molecules/LocationInput.md`) |
| RouteTimeline | `react-native/components/sheets/route-timeline.tsx` | Timeline visualization (see `matrices/ui/organisms/RouteTimeline.md`) |
| PreferencesRow | `react-native/components/sheets/preferences-row.tsx` | Planning preferences |
| Badge | `react-native/components/ui/badge.tsx` | Motorcycle badge (see `matrices/ui/atoms/Badge.md`) |
| Button | `react-native/components/ui/button.tsx` | Plan button (see `matrices/ui/atoms/Button.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Icons (see `matrices/ui/atoms/IconSymbol.md`) |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Sheet container |
| BottomSheetScrollView | `@gorhom/bottom-sheet` | Scrollable sheet content |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `LocationInput` - Current location and destination inputs
- `RouteTimeline` - Visual timeline connecting inputs
- `PreferencesRow` - Scenic bias, avoid highways/tolls, departure time, include favorites
- `Badge` - "Motorcycle" badge with 20% opacity
- `Button` - Plan ride button with motorbike icon
- `IconSymbol` - Swap, motorbike icons

**Composition pattern:**
- Half preset bottom sheet with hasTextInput for keyboard
- BottomSheetScrollView with 16px gap between sections
- Header with "Plan Ride" title + motorcycle badge
- Input row: RouteTimeline (24px) + input column + swap button (40px)
- PreferencesRow below inputs
- Large plan button at bottom
- Swap button exchanges start/end stops

**Layout:** Column layout with responsive inputs

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|
| focusedInput | 'current' | 'destination' | null | useState | `remember { mutableStateOf(null) }` / `@State var focusedInput: String?` |
| currentLocationText | string | useState | `remember { mutableStateOf("") }` / `@State var currentLocationText: String = ""` |
| destinationText | string | useState | `remember { mutableStateOf("") }` / `@State var destinationText: String = ""` |

**Side effects:**
- Sync currentLocationText with startStop.label: `useEffect([startStop?.label])`
- Sync destinationText with endStop.label: `useEffect([endStop?.label])`

**Callback signatures:**
- `onSetStartStop?: (stop: RouteStop) => void` → `(stop: RouteStop) -> Unit` / `(RouteStop) -> Void`
- `onSetEndStop?: (stop: RouteStop) => void` → `(stop: RouteStop) -> Unit` / `(RouteStop) -> Void`
- `onSetScenicBias: (next: ScenicBias) => void` → `(next: ScenicBias) -> Unit` / `(ScenicBias) -> Void`
- `onToggleAvoidHighways: () => void` → `() -> Unit` / `() -> Void`
- `onToggleAvoidTolls: () => void` → `() -> Unit` / `() -> Void`
- `onSetDepartureTime: (date: Date) => void` → `(date: Date) -> Unit` / `(Date) -> Void`
- `onToggleIncludeFavorites: () => void` → `() -> Unit` / `() -> Void`
- `onPlanRide: () => void` → `() -> Unit` / `() -> Void`
- `onClearSelection: () => void` → `() -> Unit` / `() -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Container (BottomSheetScrollView contentContainerStyle)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | RN-wrapper | `semantic.space.lg` (= 16) | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(bottom = 16.dp)` between items | `spacing(16)` | `space.lg` |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingTop | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| paddingBottom | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| paddingTop | RN-wrapper | `24` | `Modifier.padding(top = 24.dp)` | `.padding(.top, 24)` | `space.xl` |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `titleLarge` | `LaneShadowTheme.typography.titleLarge` | `theme.typography.titleLarge` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Motorcycle Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'default'` | Badge variant default | Badge variant default | n/a |
| opacity | RN-wrapper | `0.2` (20%) | `Modifier.alpha(0.2f)` | `.opacity(0.2)` | semantic.opacity.badgeSubtle |
| textStyle color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| textStyle textTransform | RN-wrapper | `'uppercase'` | Uppercase string | `.textCase(.uppercase)` | n/a |
| textStyle letterSpacing | RN-wrapper | `0.5` | `style { letterSpacing = 0.5.sp }` | `.tracking(0.5)` | ESCALATE — verify `type.label.letterSpacing = 0.5` |
| textStyle fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | ESCALATE — verify `type.label.fontWeight = 600` |

### Layout — Inputs Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | RN-wrapper | `semantic.space.md` (= 12) | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(bottom = 12.dp)` between items | `spacing(12)` | `space.md` |

### Layout — Input Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `16` | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(end = 16.dp)` between items | `spacing(16)` | `space.lg` |

### Layout — Input Column

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` (= 8) | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(bottom = 8.dp)` between items | `spacing(8)` | `space.sm` |

### Layout — Swap Button Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | Included above | Included above | n/a |
| marginLeft | RN-wrapper | `8` | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm` |

### Layout — Swap Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `40` | `Modifier.size(40.dp)` | `.frame(width: 40, height: 40)` | `size.iconButton = 40` |
| height | RN-wrapper | `40` | Included above | Included above | `size.iconButton = 40` |
| borderRadius | RN-wrapper | `20` | `RoundedCornerShape(20.dp)` / `CircleShape` | `Circle()` | `radius.full` |
| variant | RN-wrapper | `'ghost'` | Button variant ghost | `.buttonStyle(.borderless)` | n/a |

### Icon — Swap Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | `icon.sm = 20` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| name | RN-wrapper | `'swap-vertical'` | `Icons.Routed.SwapVert` / Custom | SF Symbols `arrow.up.arrow.down` | n/a |

### Layout — Plan Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'default'` | Button variant default | `.buttonStyle(.borderedProminent)` | n/a |
| size | RN-wrapper | `'lg'` | Button size large | `.controlSize(.large)` | n/a |
| disabled | RN-wrapper | `!startStop \|\| !endStop \|\| isPlanning` | `enabled = startStop != null && endStop != null && !isPlanning` | `disabled when !startStop || !endStop || isPlanning` | n/a |
| icon | RN-wrapper | `motorbike` (20px) | `Icons.Rounded.Motorbike` / size 20.dp | SF Symbols custom / size 20 | n/a |

### Typography — Plan Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| text (planning) | RN-wrapper | `'Planning...'` | Shown when `isPlanning === true` | Shown when `isPlanning === true` | n/a |
| text (default) | RN-wrapper | `'Plan Ride'` | Shown when `isPlanning === false` | Shown when `isPlanning === false` | n/a |

---

## NOTES

- **Bottom sheet:** Half preset, hasTextInput for keyboard handling
- **Badge:** "Motorcycle" with 20% opacity, uppercase text, 0.5 letter spacing
- **Input row:** 16px gap, timeline (24px) + inputs (flex: 1) + swap button
- **Swap button:** 40px circular ghost button with swap-vertical icon
- **Inputs:** Controlled state synced with stop labels via useEffect
- **Gap hierarchy:** 16px (lg) between major sections, 12px (md) in input column, 8px (sm) for tight gaps
- **Padding:** 16px horizontal, 12px top, 16px bottom on scroll content
- **Plan button:** Large size, disabled when inputs empty or planning, motorbike icon
- **PreferencesRow:** Handles scenic bias, avoid highways/tolls, departure time, include favorites
- **LocationInput components:** Handle place selection and text input with focus management
- **SheetHandle:** Rendered at top of BottomSheetScrollView
