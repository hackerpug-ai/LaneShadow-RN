# RouteDetailsSheet - STYLE PROPERTIES MATRIX

**Component:** RouteDetailsSheet
**RN Source:** `react-native/components/sheets/route-details-sheet.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/route-details-sheet.tsx` | Public API, bottom sheet layout |
| StatRow | `react-native/components/ui/stat-row.tsx` | Stats display (see `matrices/ui/molecules/StatRow.md`) |
| WindBadge | `react-native/components/planning/wind-badge.tsx` | Wind level (see `matrices/ui/molecules/WindBadge.md`) |
| Button | `react-native/components/ui/button.tsx` | Save button (see `matrices/ui/atoms/Button.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Icons (see `matrices/ui/atoms/IconSymbol.md`) |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Sheet container |
| ScrollView (RN) | `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` | Scrollable content |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `StatRow` - Route statistics (distance, duration, legs) (see `matrices/ui/molecules/StatRow.md`)
- `WindBadge` - Wind level badge (see `matrices/ui/molecules/WindBadge.md`)
- `Button` - Save button (see `matrices/ui/atoms/Button.md`)
- `IconSymbol` - Status icons

**Composition pattern:**
- Bottom sheet with half preset
- Header with title and badge
- ScrollView with sections (Rationale, Stats, Conditions)
- Rationale section shows route explanation
- Stats card shows distance, duration, legs count
- Conditions card shows wind and status
- Save button at bottom (conditional)
- Glassmorphic cards with 80% opacity surface background

**Layout:** Column layout with 16px gap, sections have 20px bottom margin

---

## STATE & BEHAVIOR

No local state. Pure presentational component.

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`
- `onSave?: () => void` → `() -> Unit` / `() -> Void`

**Helpers:**
- `formatDistance(meters): string` → Converts meters to "Xm" or "X.Xkm"
- `formatDuration(seconds): string` → Converts seconds to "Xh Xm" or "Xm"
- `addOpacity(hexColor, opacity): string` → Adds alpha to hex color

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` / `Modifier.weight(1f)` | `.frame(maxHeight: .infinity)` | n/a |
| gap | RN-wrapper | `16` | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(bottom = 16.dp)` between items | `spacing(16)` | `space.lg` |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingBottom | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `titleLarge` | `LaneShadowTheme.typography.titleLarge` | `theme.typography.titleLarge` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `4` | `Arrangement.spacedBy(4.dp)` / `Modifier.padding(end = 4.dp)` between items | `spacing(4)` | semantic.space.micro|
| paddingVertical | RN-wrapper | `4` | `Modifier.padding(vertical = 4.dp)` | `.padding(.vertical, 4)` | semantic.space.micro|
| paddingHorizontal | RN-wrapper | `10` | `Modifier.padding(horizontal = 10.dp)` | `.padding(.horizontal, 10)` | semantic.space.badge|
| borderRadius | RN-wrapper | `6` | `RoundedCornerShape(6.dp)` | `RoundedRectangle(cornerRadius: 6)` | semantic.radius.sm|
| backgroundColor | RN-wrapper | `primary.default with 12% alpha` | `LaneShadowTheme.colors.primary.copy(alpha = 0.12f)` | `theme.colors.primary.opacity(0.12)` | `color.primary.default + opacity 0.12` |

### Typography — Badge Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `12` | `12.sp` | `.font(.system(size: 12))` | ESCALATE — verify `type.label.xs.fontSize = 12` |
| fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | ESCALATE — verify `type.label.xs.fontWeight = 600` |
| textTransform | RN-wrapper | `'uppercase'` | Uppercase string | `.textCase(.uppercase)` | n/a |
| letterSpacing | RN-wrapper | `0.5` | `style { letterSpacing = 0.5.sp }` | `.tracking(0.5)` | ESCALATE — verify `type.label.xs.letterSpacing = 0.5` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Icon — Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `14` | `Modifier.size(14.dp)` | `.frame(width: 14, height: 14)` | semantic.icon.xs|
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Layout — ScrollView

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` / `Modifier.weight(1f)` | `.frame(maxHeight: .infinity)` | n/a |

### Layout — Section

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginBottom | RN-wrapper | `20` | `Modifier.padding(bottom = 20.dp)` | `.padding(.bottom, 20)` | `space.xl` |

### Typography — Section Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `labelMedium` | `LaneShadowTheme.typography.labelMedium` | `theme.typography.labelMedium` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| marginBottom | RN-wrapper | `8` | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |
| textTransform | RN-wrapper | `'uppercase'` | Uppercase string | `.textCase(.uppercase)` | n/a |
| letterSpacing | RN-wrapper | `0.5` | `style { letterSpacing = 0.5.sp }` | `.tracking(0.5)` | ESCALATE — verify `type.label.letterSpacing = 0.5` |

### Typography — Rationale Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| lineHeight | RN-wrapper | `22` | `LaneShadowTheme.typography.bodyMedium.lineHeight` | `theme.typography.bodyMedium.lineSpacing` + baseline | ESCALATE — verify `type.body.md.lineHeight = 22` |

### Visual — Stats Card / Conditions Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `surface.default with 80% opacity` | `LaneShadowTheme.colors.surface.copy(alpha = 0.8f)` | `theme.colors.surface.opacity(0.8)` | `color.surface.default + opacity 0.8` |
| borderRadius | RN-wrapper | `12` | `RoundedCornerShape(12.dp)` | `RoundedRectangle(cornerRadius: 12)` | `radius.lg` |
| padding | RN-wrapper | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(bottom = 12.dp)` between items | `spacing(12)` | `space.md` |

### Layout — Condition Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Typography — Condition Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodyMedium` | `LaneShadowTheme.typography.bodyMedium` | `theme.typography.bodyMedium` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Status Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Arrangement.spacedBy(6.dp)` / `Modifier.padding(end = 6.dp)` between items | `spacing(6)` | semantic.space.tight|

### Icon — Status

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | semantic.icon.xs|
| color (ok) | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| color (error) | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |

### Typography — Status Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodySmall` | `LaneShadowTheme.typography.bodySmall` | `theme.typography.bodySmall` | n/a |
| color (ok) | RN-wrapper | `semantic.color.success.default` | `LaneShadowTheme.colors.success` | `theme.colors.success` | `color.success.default` |
| color (error) | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |

### Layout — Actions

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingTop | RN-wrapper | `8` | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |

---

## NOTES

- **Bottom sheet:** Half preset, uses BottomSheetWrapper
- **Container gap:** 16px between header, scroll content, and actions
- **Section margin:** 20px bottom margin on each section
- **Glassmorphic cards:** 80% opacity surface background, 12px radius, 16px padding
- **Badge:** Primary color with 12% alpha, 6px radius, uppercase text with 0.5 letter spacing
- **Stats card:** Shows distance, duration, legs count using StatRow
- **Conditions card:** Shows wind badge and status row
- **Status icons:** check-circle (success) or alert-circle (warning)
- **Save button:** Large primary button with icon, shows "Saving..." when disabled
- **Formatting helpers:** Distance in meters/km, duration in minutes/hours
