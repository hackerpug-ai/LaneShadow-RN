# StatRow - STYLE PROPERTIES MATRIX

**Component:** StatRow
**RN Source:** `react-native/components/ui/stat-row.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/stat-row.tsx` | Public API, layout, visual styling |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Stat icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Text | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Value text display |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Stat icon (clock, wind, distance, etc.) (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Row container with icon and value text. Icon size configurable via `iconSize` prop.

**Layout:** Horizontal row (`flexDirection: 'row'`), center alignment, fixed icon-to-value gap.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `6` | `Modifier.padding` or `Arrangement.spacedBy(6.dp)` | `Spacer(minLength: 6)` | ESCALATE — between `space.xs` (4) and `space.sm` (8); use `6.dp` literal |

### Visual — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| name | RN-wrapper | prop value | `Icons.Outlined.{name}` or `Icons.Filled.{name}` | `SF Symbol: "{name}"` | n/a |
| size | RN-wrapper | `iconSize` prop (default 18) | `Modifier.size(iconSize.dp)` | `.frame(width: iconSize, height: iconSize)` | ESCALATE — propose `iconSize.md = 18` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Value

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.body.sm.fontSize` |
| fontWeight | RN-wrapper | default (400) | `FontWeight.Normal` | `.regular` | `type.body.sm.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

---

## NOTES

- **Icon flexibility:** Icon name passed as prop to support different stat types (duration, distance, wind, rain, temperature)
- **Icon size:** Default 18px, configurable via `iconSize` prop
- **Compact layout:** Small gap (6px) between icon and value for compact stat display
- **Use cases:** Duration (clock icon), distance (map/route icon), wind level (weather icon), rain intensity (weather icon)
- **Icon mapping:** Material Community Icons names map to Material Icons (Android) and SF Symbols (iOS) per platform conventions
